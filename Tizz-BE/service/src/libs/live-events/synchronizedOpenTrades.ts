import fs from 'fs';

import { logger } from '../../utils/logger';
import { buildTradeIdentifier } from '../../utils/multiCollateral';
import { TRADE_TYPE } from '../../constants';
import { getPairName, toJSON } from '../../utils/util';
import { buildTradingVariablesFromJSON } from '../../utils/trading-variables';
import { publishTradingVariables, setTradingVariables } from '../../redis';
import { appConfig } from '../../config';
import { useGlobalContext } from '../../contexts/global';
import { addClosedTrades } from '../closedTrades';
import { addOpenedTrades } from '../openedTrades';
import { TRADE_EVENT } from '../../@types/trade';
import { getDateOfBlock } from '../../utils/block';
import { StorageLimitOrder } from '@tizz/sdk';
import { publishTradingEvent } from '../../redis/publishers';

const { ENABLE_CONSOLE_LOGGING } = appConfig();
const {
  OPEN_LIMIT_PLACED,
  OPEN_LIMIT_UPDATED,
  OPEN_LIMIT_CANCELED,
  TP_UPDATED,
  SL_UPDATED,
  MARKET_EXECUTED,
  LIMIT_EXECUTED,
  MARKET_CLOSE_CANCELED,
  SL_CANCELED,
} = TRADE_EVENT;

export async function synchronizeOpenTrades(collat, event) {
  let { globalAppInfo, update } = useGlobalContext();
  const stack = globalAppInfo.stacks[collat];
  const ethersProvider = globalAppInfo.web3SocketProvider;

  try {
    const { contracts, collateral } = stack;
    const currentKnownOpenTrades = globalAppInfo.knownOpenTrades;

    const eventName = event.event;
    const eventReturnValues = event.returnValues;
    const txId = event?.transactionHash;

    logger.info(`Synchronizing open trades based on event ${eventName} from block ${event.blockNumber}...`);

    if (currentKnownOpenTrades === null) {
      logger.warn(
        `Known open trades not yet initialized, cannot synchronize ${eventName} from block ${event.blockNumber} at this time!`,
      );

      return;
    }

    console.log('event subscriptions: ', eventName)
    // publish trading events
    await publishTradingEvent({
      event: eventName,
      payload: event.returnValues
    });

    if (eventName === OPEN_LIMIT_CANCELED) {
      const { trader, pairIndex, index } = eventReturnValues;

      const tradeKey = buildTradeIdentifier(collateral, trader, pairIndex.toString(), index.toString(), true);
      const existingKnownOpenTrade = currentKnownOpenTrades[tradeKey];

      if (existingKnownOpenTrade !== undefined) {
        delete currentKnownOpenTrades[tradeKey];
        globalAppInfo.knownOpenTrades = currentKnownOpenTrades;

        // publish tradingVariables to Redis
        const json = buildTradingVariablesFromJSON(globalAppInfo);
        await setTradingVariables(json);
        await publishTradingVariables(json);
        update(globalAppInfo);

        logger.info(`Synchronize open trades from event ${eventName}: Removed limit for ${tradeKey}`);
      } else {
        logger.info(`Synchronize open trades from event ${eventName}: Limit not found for ${tradeKey}`);
      }
    } else if (eventName === OPEN_LIMIT_PLACED || eventName === OPEN_LIMIT_UPDATED) {
      let { trader, pairIndex, index } = eventReturnValues;

      const [hasOpenLimitOrder, openLimitOrderId] = await Promise.all([
        contracts.storage.methods.hasOpenLimitOrder(trader, pairIndex, index).call(),
        contracts.storage.methods.openLimitOrderIds(trader, pairIndex, index).call(),
      ]);

      if (hasOpenLimitOrder === false) {
        logger.warn(
          `Open limit order not found for ${collateral}/${trader}/${pairIndex.toString()}/${index.toString()}; ignoring!`,
        );
      } else {
        const [limitOrder, type, lastUpdated, tradeData] = await Promise.all([
          contracts.storage.methods.openLimitOrders(openLimitOrderId).call(),
          contracts.storage.methods.openLimitOrderTypes(trader, pairIndex, index).call(),
          fetchTradeLastUpdated(contracts.callbacks, trader, pairIndex, index, TRADE_TYPE.LIMIT),
          contracts.callbacks.methods.tradeData(trader, pairIndex, index, 1).call(),
        ]);

        const tradeKey = buildTradeIdentifier(collateral, trader, pairIndex.toString(), index.toString(), true);

        if (currentKnownOpenTrades[tradeKey]) {
          logger.info(`Synchronize open trades from event ${eventName}: Updating open limit order for ${tradeKey}`);
        } else {
          logger.info(`Synchronize open trades from event ${eventName}: Storing new open limit order for ${tradeKey}`);
        }

        const date = await getDateOfBlock(ethersProvider, Number(limitOrder.orderTradeInfo.block));

        globalAppInfo.tradesLastUpdated[tradeKey] = lastUpdated;
        currentKnownOpenTrades[tradeKey] = {
          date,
          pnl_net: ['0', '0'],
          block: limitOrder.orderTradeInfo.block.toString(),
          buy: limitOrder.buy,
          index: limitOrder.index.toString(),
          leverage: limitOrder.orderTradeInfo.leverage.toString(),
          maxPrice: limitOrder.orderTradeInfo.maxPrice.toString(),
          minPrice: limitOrder.orderTradeInfo.minPrice.toString(),
          pairIndex: limitOrder.pairIndex.toString(),
          positionSize: limitOrder.positionSize.toString(),
          sl: limitOrder.orderTradeInfo.sl.toString(),
          spreadReductionP: limitOrder.spreadReductionP.toString(),
          tp: limitOrder.orderTradeInfo.tp.toString(),
          trader: limitOrder.trader,
          type,
          maxSlippageP: tradeData.maxSlippageP.toString(),
          collateral,
        };
        globalAppInfo.knownOpenTrades = currentKnownOpenTrades;

        // publish tradingVariables to Redis
        const json = buildTradingVariablesFromJSON(globalAppInfo);
        await setTradingVariables(json);
        await publishTradingVariables(json);
        update(globalAppInfo);
      }
    } else if (eventName === TP_UPDATED || eventName === SL_UPDATED || eventName === SL_CANCELED) {
      const { trader, pairIndex, index } = eventReturnValues;

      // Fetch all fresh trade information to update known open trades
      let [trade, tradeInfo, tradeData, tradeInitialAccFees, lastUpdated] = await Promise.all([
        contracts.storage.methods.openTrades(trader, pairIndex, index).call(),
        contracts.storage.methods.openTradesInfo(trader, pairIndex, index).call(),
        contracts.callbacks.methods.tradeData(trader, pairIndex, index, 0).call(),
        contracts.borrowingFees.methods.initialAccFees(trader, pairIndex, index).call(),
        fetchTradeLastUpdated(contracts.callbacks, trader, pairIndex, index, TRADE_TYPE.MARKET),
      ]);

      let liquidationPrice = await contracts.borrowingFees.methods.getTradeLiquidationPrice({
        trader: trade.trader,
        pairIndex: trade.pairIndex,
        index: trade.index,
        openPrice: trade.openPrice,
        long: trade.buy,
        collateral: trade.positionSizeBaseAsset,
        leverage: trade.leverage,
      });

      const tradeKey = buildTradeIdentifier(collateral, trader, pairIndex.toString(), index.toString(), false);
      globalAppInfo.tradesLastUpdated[tradeKey] = lastUpdated;

      let newTrade = currentKnownOpenTrades[tradeKey] || {};
      newTrade.trade = {
        trader: trade.trader,
        pairIndex: trade.pairIndex.toString(),
        index: trade.index.toString(),
        initialPosToken: trade.initialPosToken.toString(),
        positionSizeBaseAsset: trade.positionSizeBaseAsset.toString(),
        openPrice: trade.openPrice.toString(),
        buy: trade.buy,
        leverage: trade.leverage.toString(),
        tp: trade.tp.toString(),
        sl: trade.sl.toString(),
        pnl_net: ['0', '0'],
      };
      newTrade.tradeInfo = {
        tokenId: tradeInfo.tokenId.toString(),
        tokenPriceBaseAsset: tradeInfo.tokenPriceBaseAsset.toString(),
        openInterestBaseAsset: tradeInfo.openInterestBaseAsset.toString(),
        tpLastUpdated: tradeInfo.tpLastUpdated.toString(),
        slLastUpdated: tradeInfo.slLastUpdated.toString(),
        beingMarketClosed: tradeInfo.beingMarketClosed,
      };
      newTrade.tradeData = {
        maxSlippageP: tradeData.maxSlippageP.toString(),
        lastOiUpdateTs: tradeData.lastOiUpdateTs.toString(),
        collateralPriceUsd: tradeData.collateralPriceUsd.toString(),
      };
      newTrade.tradeInitialAccFees = {
        borrowing: {
          accPairFee: tradeInitialAccFees.accPairFee.toString(),
          accGroupFee: tradeInitialAccFees.accGroupFee.toString(),
          block: tradeInitialAccFees.block.toString(),
        },
        liquidationPrice: liquidationPrice.toString(),
      };
      const date = await getDateOfBlock(ethersProvider, Number(tradeInitialAccFees.block));

      newTrade.collateral = collateral;
      newTrade.date = date;
      currentKnownOpenTrades[tradeKey] = newTrade;

      const json = buildTradingVariablesFromJSON(globalAppInfo);
      await setTradingVariables(json);
      await publishTradingVariables(json);
      update(globalAppInfo);
      logger.info(`Synchronize open trades from event ${eventName}: Updated trade ${tradeKey}`);
    } else if (eventName === MARKET_CLOSE_CANCELED) {
      const { trader, pairIndex, index } = eventReturnValues;
      console.log('===>', eventName, trader, pairIndex, index);
      const tradeKey = buildTradeIdentifier(collateral, trader, pairIndex.toString(), index.toString(), false);

      let trade = await contracts.storage.methods.openTrades(trader, pairIndex, index).call();

      // Make sure the trade is still actually active
      if (parseInt(trade.leverage, 10) > 0) {
        // Fetch all fresh trade information to update known open trades
        const [tradeInfo, tradeData, tradeInitialAccFees, lastUpdated, liquidationPrice] = await Promise.all([
          contracts.storage.methods.openTradesInfo(trader, pairIndex, index).call(),
          contracts.callbacks.methods.tradeData(trader, pairIndex, index, 0).call(),
          contracts.borrowingFees.methods.initialAccFees(trader, pairIndex, index).call(),
          fetchTradeLastUpdated(contracts.callbacks, trader, pairIndex, index, TRADE_TYPE.MARKET),
          contracts.borrowingFees.methods
            .getTradeLiquidationPrice({
              trader: trade.trader,
              pairIndex: trade.pairIndex,
              index: trade.index,
              openPrice: trade.openPrice,
              long: trade.buy,
              collateral: trade.positionSizeBaseAsset,
              leverage: trade.leverage,
            })
            .call(),
        ]);

        globalAppInfo.tradesLastUpdated[tradeKey] = lastUpdated;

        let newTrade = currentKnownOpenTrades[tradeKey] || {};
        newTrade.trade = {
          trader: trade.trader,
          pairIndex: trade.pairIndex.toString(),
          index: trade.index.toString(),
          initialPosToken: trade.initialPosToken.toString(),
          positionSizeBaseAsset: trade.positionSizeBaseAsset.toString(),
          openPrice: trade.openPrice.toString(),
          buy: trade.buy,
          leverage: trade.leverage.toString(),
          tp: trade.tp.toString(),
          sl: trade.sl.toString(),
          pnl_net: ['0', '0'],
        };
        newTrade.tradeInfo = {
          tokenId: tradeInfo.tokenId.toString(),
          tokenPriceBaseAsset: tradeInfo.tokenPriceBaseAsset.toString(),
          openInterestBaseAsset: tradeInfo.openInterestBaseAsset.toString(),
          tpLastUpdated: tradeInfo.tpLastUpdated.toString(),
          slLastUpdated: tradeInfo.slLastUpdated.toString(),
          beingMarketClosed: tradeInfo.beingMarketClosed,
        };
        newTrade.tradeData = {
          maxSlippageP: tradeData.maxSlippageP.toString(),
          lastOiUpdateTs: tradeData.lastOiUpdateTs.toString(),
          collateralPriceUsd: tradeData.collateralPriceUsd.toString(),
        };
        newTrade.tradeInitialAccFees = {
          borrowing: {
            accPairFee: tradeInitialAccFees.accPairFee.toString(),
            accGroupFee: tradeInitialAccFees.accGroupFee.toString(),
            block: tradeInitialAccFees.block.toString(),
          },
          liquidationPrice: liquidationPrice.toString(),
        };
        const date = await getDateOfBlock(ethersProvider, Number(tradeInitialAccFees.block));

        newTrade.collateral = collateral;
        newTrade.date = date;
        currentKnownOpenTrades[tradeKey] = trade;
      } else {
        delete globalAppInfo.tradesLastUpdated[tradeKey];
        delete currentKnownOpenTrades[tradeKey];
      }
      globalAppInfo.knownOpenTrades = currentKnownOpenTrades;
      const json = buildTradingVariablesFromJSON(globalAppInfo);
      await setTradingVariables(json);
      await publishTradingVariables(json);
      update(globalAppInfo);
    } else if (
      (eventName === MARKET_EXECUTED && eventReturnValues.open === true) ||
      (eventName === LIMIT_EXECUTED && eventReturnValues.orderType === StorageLimitOrder.OPEN)
    ) {
      let { t: trade, limitIndex } = eventReturnValues;
      const { trader, pairIndex, index } = trade;
      console.log('===>', eventName, trader, getPairName(Number(pairIndex)), index, txId, eventReturnValues.orderId);

      if (eventName === LIMIT_EXECUTED) {
        const openTradeKey = buildTradeIdentifier(collateral, trader, pairIndex.toString(), limitIndex.toString(), true);
        if (currentKnownOpenTrades[openTradeKey]) {
          logger.info(`Synchronize open trades from event ${eventName}: Removed open limit trade ${openTradeKey}.`);
          delete globalAppInfo.tradesLastUpdated[openTradeKey];
          delete currentKnownOpenTrades[openTradeKey];
          globalAppInfo.knownOpenTrades = currentKnownOpenTrades;

          const json = buildTradingVariablesFromJSON(globalAppInfo);
          await setTradingVariables(json);
          await publishTradingVariables(json);
          update(globalAppInfo);
        } else {
          logger.warn(
            `Synchronize open trades from event ${eventName}: Open limit trade ${openTradeKey} was not found? Unable to remove.`,
          );
        }
      } else {
        const [tradeInfo, tradeData, tradeInitialAccFees, lastUpdated, liquidationPrice] = await Promise.all([
          contracts.storage.methods.openTradesInfo(trader, pairIndex, index).call(),
          contracts.callbacks.methods.tradeData(trader, pairIndex, index, 0).call(),
          contracts.borrowingFees.methods.initialAccFees(trader, pairIndex, index).call(),
          fetchTradeLastUpdated(contracts.callbacks, trader, pairIndex, index, TRADE_TYPE.MARKET),
          contracts.borrowingFees.methods.getTradeLiquidationPrice({
            trader: trade.trader,
            pairIndex: trade.pairIndex,
            index: trade.index,
            openPrice: trade.openPrice,
            long: trade.buy,
            collateral: trade.positionSizeBaseAsset,
            leverage: trade.leverage,
          }),
        ]);

        const tradeKey = buildTradeIdentifier(collateral, trader, pairIndex.toString(), index.toString(), false);

        globalAppInfo.tradesLastUpdated[tradeKey] = lastUpdated;
        if (currentKnownOpenTrades[tradeKey] !== undefined) {
          logger.info(
            `Synchronize open trades from event ${eventName}: Trade ${tradeKey} was found in known open trades; just ignoring.`,
          );
          return;
        }

        let newTrade = currentKnownOpenTrades[tradeKey] || {};
        newTrade.trade = {
          trader: trade.trader,
          pairIndex: trade.pairIndex.toString(),
          index: trade.index.toString(),
          initialPosToken: trade.initialPosToken.toString(),
          positionSizeBaseAsset: trade.positionSizeBaseAsset.toString(),
          openPrice: trade.openPrice.toString(),
          buy: trade.buy,
          leverage: trade.leverage.toString(),
          tp: trade.tp.toString(),
          sl: trade.sl.toString(),
          pnl_net: ['0', '0'],
        };
        newTrade.tradeInfo = {
          tokenId: tradeInfo.tokenId.toString(),
          tokenPriceBaseAsset: tradeInfo.tokenPriceBaseAsset.toString(),
          openInterestBaseAsset: tradeInfo.openInterestBaseAsset.toString(),
          tpLastUpdated: tradeInfo.tpLastUpdated.toString(),
          slLastUpdated: tradeInfo.slLastUpdated.toString(),
          beingMarketClosed: tradeInfo.beingMarketClosed,
        };
        newTrade.tradeData = {
          maxSlippageP: tradeData.maxSlippageP.toString(),
          lastOiUpdateTs: tradeData.lastOiUpdateTs.toString(),
          collateralPriceUsd: tradeData.collateralPriceUsd.toString(),
        };
        newTrade.tradeInitialAccFees = {
          borrowing: {
            accPairFee: tradeInitialAccFees.accPairFee.toString(),
            accGroupFee: tradeInitialAccFees.accGroupFee.toString(),
            block: tradeInitialAccFees.block.toString(),
          },
          liquidationPrice: liquidationPrice.toString(),
        };
        const date = await getDateOfBlock(ethersProvider, Number(tradeInitialAccFees.block));

        newTrade.collateral = collateral;
        newTrade.date = date;

        // Update current opened trades on Redis and insert trade records to db
        await addOpenedTrades([tradeKey, newTrade], txId);

        currentKnownOpenTrades[tradeKey] = newTrade;

        if (appConfig().ENABLE_FS_LOGGING)
          fs.writeFileSync('../logs/open-trades.test.json', toJSON(Array.from(currentKnownOpenTrades)));

        globalAppInfo.knownOpenTrades = currentKnownOpenTrades;

        const json = buildTradingVariablesFromJSON(globalAppInfo);
        await setTradingVariables(json);
        await publishTradingVariables(json);
        update(globalAppInfo);

        logger.info(`Synchronize open trades from event ${eventName}: Stored active trade ${tradeKey}`);
      }
    } else if (
      (eventName === MARKET_EXECUTED && eventReturnValues.open === false) ||
      (eventName === LIMIT_EXECUTED && eventReturnValues.orderType !== StorageLimitOrder.OPEN)
    ) {
      const { trader, pairIndex, index } = eventReturnValues.t;
      const tradeKey = buildTradeIdentifier(collateral, trader, pairIndex, index, false);
      console.log('===>', eventName, trader, getPairName(Number(pairIndex)), index, txId, eventReturnValues.orderId);

      const existingKnownOpenTrade = currentKnownOpenTrades[tradeKey];

      // If this was a known open trade then we need to remove it now
      if (existingKnownOpenTrade !== undefined) {
        delete currentKnownOpenTrades[tradeKey];
        delete globalAppInfo.tradesLastUpdated[tradeKey];
        globalAppInfo.knownOpenTrades = currentKnownOpenTrades;

        const pnl =
          (BigInt(existingKnownOpenTrade.trade.positionSizeBaseAsset) * // 1e18 | 1e8
            BigInt(eventReturnValues.percentProfit)) / // 1e10
          BigInt(1e12); // 2 + 10 = 1e12

        console.log('--->:', eventReturnValues.percentProfit, existingKnownOpenTrade.trade.positionSizeBaseAsset, pnl);

        existingKnownOpenTrade.trade.pnl_net = [pnl.toString(), eventReturnValues.percentProfit.toString()];
        existingKnownOpenTrade.trade.closePrice = eventReturnValues.price.toString();
        // Update current opened trades on Redis and insert trade records to db
        await addClosedTrades([tradeKey, existingKnownOpenTrade], txId);

        const json = buildTradingVariablesFromJSON(globalAppInfo);
        await setTradingVariables(json);
        await publishTradingVariables(json);
        update(globalAppInfo);

        if (appConfig().ENABLE_FS_LOGGING)
          fs.writeFileSync('../logs/open-trades.test.json', toJSON(Array.from(currentKnownOpenTrades)));

        logger.info(`Synchronize open trades from event ${eventName}: Removed ${tradeKey} from known open trades.`);
      } else {
        logger.info(
          `Synchronize open trades from event ${eventName}: Trade ${tradeKey} was not found in known open trades; just ignoring.`,
        );
      }

      // const triggeredOrderDetails = globalAppInfo.triggeredOrders[triggeredOrderTrackingInfoIdentifier];

      // // If we were tracking this triggered order, stop tracking it now and clear the timeout so it doesn't
      // // interrupt the event loop for no reason later
      // if (triggeredOrderDetails !== undefined) {
      //   logger.debug(
      //     `Synchronize open trades from event ${eventName}: We triggered order ${triggeredOrderTrackingInfoIdentifier}; clearing tracking timer.`,
      //   );

      //   // If we actually managed to send the transaction off without error then we can report success and clean
      //   // up tracking state now
      //   if (triggeredOrderDetails.transactionSent === true) {
      //     if (eventReturnValues.nftHolder === process.env.PUBLIC_KEY) {
      //       logger.info(`💰💰💰 SUCCESSFULLY TRIGGERED ORDER ${triggeredOrderTrackingInfoIdentifier} FIRST!!!`);
      //     } else {
      //       logger.info(`💰 SUCCESSFULLY TRIGGERED ORDER ${triggeredOrderTrackingInfoIdentifier} AS SAME BLOCK!!!`);
      //     }

      //     clearTimeout(triggeredOrderDetails.cleanupTimerId);
      //     globalAppInfo.triggeredOrders.delete(triggeredOrderTrackingInfoIdentifier);
      //   }
      // } else {
      //   logger.debug(
      //     `Synchronize open trades from event ${eventName}: Order ${triggeredOrderTrackingInfoIdentifier} was not being tracked as triggered by us.`,
      //   );
      // }

      // update(globalAppInfo);
    }
  } catch (error) {
    if (ENABLE_CONSOLE_LOGGING) console.log(error);
    logger.error('Error occurred when refreshing trades.', error);
  }
}

async function fetchTradeLastUpdated(callbacks, trader, pairIndex, index, tradeType) {
  const lastUpdated = await callbacks.methods.tradeLastUpdated(trader, pairIndex, index, tradeType).call();
  return {
    tp: lastUpdated.tp.toString(),
    sl: lastUpdated.sl.toString(),
    limit: lastUpdated.limit.toString(),
  };
}
