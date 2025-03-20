import { ethers } from 'ethers';
import fs from 'fs';

import { GetPnlContext, fetchOpenPairTradesRaw, ABIS } from '@tizz/sdk';
import {
  TizzTradingStorage,
  TizzBorrowingFees,
  TizzMultiCollatDiamond,
  TizzTradingCallbacks,
} from '@tizz/sdk/src/contracts/types/generated';
import { Contracts } from '@tizz/sdk/src/contracts/types';
import { TradeRecordType, insertTradeRecords } from '@tizz/database';

import { logger } from '../utils/logger';
import { buildTradeIdentifier, getEthersContract, transformRawTrades } from '../utils/multiCollateral';
import { getPairName, toJSON } from '../utils/util';
import { buildTradingVariablesFromJSON } from '../utils/trading-variables';
import { publishNewTrades, publishTradingVariables, setTradingVariables } from '../redis';
import { appConfig } from '../config';
import { useGlobalContext } from '../contexts/global';
import { addNewClosedTrade, addNewOpenedTrade, updateCurrentOpenedTrades } from '../redis/contexts/openTrades';
import { getDateOfBlock } from '../utils/block';

const { OPEN_TRADES_REFRESH_MS, USE_MULTICALL, NETWORK, ENABLE_CONSOLE_LOGGING } = appConfig();

let fetchOpenTradesRetryTimerId: NodeJS.Timeout | null = null;

export async function fetchOpenTrades() {
  let { globalAppInfo, update } = useGlobalContext();
  logger.info('Fetching open trades...');
  try {
    if (globalAppInfo.spreadsP.length === 0) {
      logger.warn('Spreads are not yet loaded; will retry shortly!');

      scheduleRetryFetchOpenTrades();

      return;
    }

    const start = performance.now();

    const [openLimitOrders, pairTrades] = await Promise.all([fetchOpenLimitOrders(), fetchOpenPairTrades()]);

    let newOpenTrades = [...openLimitOrders, ...pairTrades];
    newOpenTrades = newOpenTrades.map((trade) => [
      buildTradeIdentifier(
        trade.collateral,
        trade.trade?.trader || trade.trader,
        trade.trade?.pairIndex || trade.pairIndex,
        trade.trade?.index || trade.index,
        trade.tradeInfo === undefined,
      ),
      trade,
    ]);

    if (appConfig().ENABLE_FS_LOGGING) fs.writeFileSync('../logs/open-trades.test.json', toJSON(newOpenTrades));

    globalAppInfo.knownOpenTrades = Object.fromEntries(newOpenTrades);

    update(globalAppInfo);

    const json = buildTradingVariablesFromJSON(globalAppInfo);
    // Write extract info in log file for testing purpose
    if (appConfig().ENABLE_FS_LOGGING) fs.writeFileSync('../logs/trading-variables.test.json', json);

    // publish tradingVariables to Redis
    await setTradingVariables(json);
    await publishTradingVariables(json);

    // Update current opened trades on Redis and insert trade records to db
    await syncOpenedTrades(newOpenTrades as [string, any][]);

    logger.info(`Fetched ${pairTrades.length} total open trade(s) in ${performance.now() - start}ms.`);

    // Check if we're supposed to auto-refresh open trades and if so, schedule the next refresh
    if (OPEN_TRADES_REFRESH_MS !== 0) {
      logger.debug(`Scheduling auto-refresh of open trades in for ${OPEN_TRADES_REFRESH_MS}ms from now.`);

      setTimeout(() => fetchOpenTrades(), OPEN_TRADES_REFRESH_MS);
    } else {
      logger.info(
        `Auto-refresh of open trades is disabled (OPEN_TRADES_REFRESH=0); will only synchronize based on blockchain events from here out!`,
      );
    }
  } catch (error) {
    logger.error('Error fetching open trades!', error);

    scheduleRetryFetchOpenTrades();
  }

  function scheduleRetryFetchOpenTrades() {
    if (fetchOpenTradesRetryTimerId !== null) {
      logger.debug('Already scheduled retry fetching open trades; will retry shortly!');

      return;
    }

    fetchOpenTradesRetryTimerId = setTimeout(() => {
      fetchOpenTradesRetryTimerId = null;
      fetchOpenTrades();
    }, 2 * 1000);
  }

  async function fetchOpenLimitOrders() {
    let { globalAppInfo } = useGlobalContext();
    logger.info('Fetching open limit orders...');

    const ethersProvider = new ethers.providers.WebSocketProvider(
      globalAppInfo.currentlySelectedWeb3Client.currentProvider._socketConnection._url,
    );

    try {
      const limitOrders = (
        await Promise.all(
          globalAppInfo.collaterals.map(async (collat) => {
            const contracts = globalAppInfo.stacks[collat].contracts;
            const openLimitOrders = await contracts.storage.methods.getOpenLimitOrders().call();

            const openLimitOrdersWithTypes = await Promise.all(
              openLimitOrders.map(async (olo) => {
                const [type, tradeData] = await Promise.all([
                  contracts.storage.methods.openLimitOrderTypes(olo.trader, olo.pairIndex, olo.index).call(),
                  contracts.callbacks.methods.tradeData(olo.trader, olo.pairIndex, olo.index, 1).call(),
                ]);

                const date = await getDateOfBlock(ethersProvider, Number(olo.orderTradeInfo.block));

                return {
                  date,
                  block: olo.orderTradeInfo.block,
                  buy: olo.buy,
                  index: olo.index,
                  leverage: olo.orderTradeInfo.leverage,
                  maxPrice: olo.orderTradeInfo.maxPrice,
                  minPrice: olo.orderTradeInfo.minPrice,
                  pairIndex: olo.pairIndex,
                  positionSize: olo.positionSize,
                  sl: olo.orderTradeInfo.sl,
                  spreadReductionP: olo.spreadReductionP,
                  tp: olo.orderTradeInfo.tp,
                  trader: olo.trader,
                  type,
                  maxSlippageP: tradeData.maxSlippageP,
                  collateral: collat,
                };
              }),
            );

            logger.info(`[${collat}] Fetched ${openLimitOrdersWithTypes.length} open limit order(s).`);

            return openLimitOrdersWithTypes;
          }),
        )
      ).reduce((acc, curr, i) => [...acc, ...curr], []);

      logger.info(`Fetched ${limitOrders.length} open limit order(s).`);

      return limitOrders;
    } catch (e) {
      if (ENABLE_CONSOLE_LOGGING) console.error(e);
      return [];
    }
  }

  async function fetchOpenPairTrades() {
    let { globalAppInfo } = useGlobalContext();
    logger.info('Fetching open pair trades...');

    const ethersProvider = new ethers.providers.WebSocketProvider(
      globalAppInfo.currentlySelectedWeb3Client.currentProvider._socketConnection._url,
    );

    const ethersMultiCollat = getEthersContract(globalAppInfo.multiCollatContract, ethersProvider);
    try {
      // loop and merge all trades
      const allTrades = (
        await Promise.all(
          globalAppInfo.collaterals.map(async (collat) => {
            const contracts = globalAppInfo.stacks[collat].contracts;
            const collateralConfig = globalAppInfo.stacks[collat].collateralConfig;
            const collateralPrice = globalAppInfo.stacks[collat].price;
            const currentBlock = globalAppInfo.stacks[collat].currentBlock;
            const borrowingFeesContext: GetPnlContext = {
              ...globalAppInfo.stacks[collat].borrowingFeesContext,
              openInterest: globalAppInfo.stacks[collat].openInterests,
            };

            const ethersStorage = getEthersContract(contracts.storage, ethersProvider);
            const ethersCallbacks = getEthersContract(contracts.callbacks, ethersProvider);

            const ethersBorrowingFees = getEthersContract(
              { options: { address: contracts.borrowingFees.options.address, jsonInterface: ABIS.BORROWING_FEES } },
              ethersProvider,
            );

            const openTradesRaw = await fetchOpenPairTradesRaw(
              {
                tizzMultiCollatDiamond: ethersMultiCollat as TizzMultiCollatDiamond,
                tizzTradingStorage: ethersStorage as TizzTradingStorage,
                tizzBorrowingFees: ethersBorrowingFees as TizzBorrowingFees,
                tizzTradingCallbacks: ethersCallbacks as TizzTradingCallbacks,
              } as Contracts,
              NETWORK.customMulticallAddress,
              {
                useMulticall: USE_MULTICALL,
                pairBatchSize: 10, // This is a conservative batch size to accommodate high trade volumes and default RPC payload limits. Consider adjusting.
              },
            );

            let openTrades = openTradesRaw.map((trade) => ({
              trade: {
                trader: trade.trade.trader,
                pairIndex: trade.trade.pairIndex.toString(),
                index: trade.trade.index.toString(),
                initialPosToken: trade.trade.initialPosToken.toString(),
                positionSizeBaseAsset: trade.trade.positionSizeBaseAsset.toString(),
                openPrice: trade.trade.openPrice.toString(),
                buy: trade.trade.buy,
                leverage: trade.trade.leverage.toString(),
                tp: trade.trade.tp.toString(),
                sl: trade.trade.sl.toString(),
              },
              tradeInfo: {
                tokenId: trade.tradeInfo.tokenId.toString(),
                tokenPriceBaseAsset: trade.tradeInfo.tokenPriceBaseAsset.toString(),
                openInterestBaseAsset: trade.tradeInfo.openInterestBaseAsset.toString(),
                tpLastUpdated: trade.tradeInfo.tpLastUpdated.toString(),
                slLastUpdated: trade.tradeInfo.slLastUpdated.toString(),
                beingMarketClosed: trade.tradeInfo.beingMarketClosed,
              },
              tradeData: {
                maxSlippageP: trade.tradeData.maxSlippageP.toString(),
                lastOiUpdateTs: trade.tradeData.lastOiUpdateTs.toString(),
                collateralPriceUsd: trade.tradeData.collateralPriceUsd.toString(),
              },
              initialAccFees: {
                borrowing: {
                  accPairFee: trade.initialAccFees.borrowing.accPairFee.toString(),
                  accGroupFee: trade.initialAccFees.borrowing.accGroupFee.toString(),
                  block: trade.initialAccFees.borrowing.block.toString(),
                },
                liquidationPrice: trade.initialAccFees.liquidationPrice.toString(),
              },
              collateral: collat,
            }));
            openTrades = await transformRawTrades(
              openTrades,
              {
                collateral: collat,
                ...collateralConfig,
                price: collateralPrice,
                borrowingFeesContext,
              },
              ethersProvider,
            );
            logger.info(`[${collat}] Fetched ${openTrades.length} new open pair trade(s).`);

            return openTrades;
          }),
        )
      ).reduce((acc, curr, i) => [...acc, ...curr], []);
      logger.info(`Fetched ${allTrades.length} new open pair trade(s).`);

      return allTrades;
    } catch (e) {
      if (ENABLE_CONSOLE_LOGGING) console.error(e);
      return [];
    }
  }
}

export async function syncOpenedTrades(newOpenTrades: [string, any][]) {
  const { openedTrades, closedTrades } = await updateCurrentOpenedTrades(newOpenTrades);

  const openTrades = openedTrades
    .filter((newTrade) => newTrade.trade !== undefined)
    .map((openTrade) => {
      const pairIndex = Number(openTrade.trade.pairIndex);
      return {
        timestamp: openTrade.date,
        pairIndex,
        pair: getPairName(pairIndex),
        trader: openTrade.trade.trader,
        action: openTrade.tradeInfo.beingMarketClosed ? 'TradeClosedMarket' : 'TradeOpenedMarket',
        openPrice: openTrade.trade.openPrice,
        closePrice: openTrade.trade.closePrice,
        collateralPriceUsd: openTrade.tradeData.collateralPriceUsd,
        buy: openTrade.trade.buy ? 1 : 0,
        size: openTrade.trade.positionSizeBaseAsset,
        leverage: openTrade.trade.leverage,
        pnl: openTrade.trade.pnl_net[0],
        block: openTrade.tradeInitialAccFees.borrowing.block,
        tx: '', // TODO: need to use web3 to fetch tx from trade & block
        uri: openTrade.uri,
        collateral: openTrade.collateral,
      } as TradeRecordType;
    });

  const closeTrades = closedTrades
    .filter((newTrade) => newTrade.trade !== undefined)
    .map((closeTrade) => {
      const pairIndex = Number(closeTrade.trade.pairIndex);
      return {
        timestamp: closeTrade.date,
        pairIndex,
        pair: getPairName(pairIndex),
        trader: closeTrade.trade.trader,
        action: 'TradeClosedMarket',
        openPrice: closeTrade.trade.openPrice,
        closePrice: closeTrade.trade.closePrice,
        collateralPriceUsd: closeTrade.tradeData.collateralPriceUsd,
        buy: closeTrade.trade.buy ? 1 : 0,
        size: closeTrade.trade.positionSizeBaseAsset,
        leverage: closeTrade.trade.leverage,
        pnl: closeTrade.trade.pnl_net[0], // TODO: should calc PNL
        block: closeTrade.tradeInitialAccFees.borrowing.block,
        tx: '', // TODO: need to use web3 to fetch tx from trade & block
        uri: closeTrade.uri,
        collateral: closeTrade.collateral,
      } as TradeRecordType;
    });

  const newRecords = [...openTrades, ...closeTrades];
  await insertTradeRecords(newRecords);

  // publish new trade history
  if (newRecords.length > 0) await publishNewTrades(toJSON(newRecords));
}

export async function addOpenedTrades(newOpenTrade: [string, any], txId: string) {
  const openedTrade = await addNewOpenedTrade(newOpenTrade);

  if (openedTrade) {
    logger.info(`Adding new opened trade record to DB..`);
    const pairIndex = Number(openedTrade.trade.pairIndex);

    const newRecord = {
      timestamp: openedTrade.date,
      pairIndex,
      pair: getPairName(pairIndex),
      trader: openedTrade.trade.trader,
      action: 'TradeOpenedMarket',
      openPrice: openedTrade.trade.openPrice,
      collateralPriceUsd: openedTrade.tradeData.collateralPriceUsd,
      buy: openedTrade.trade.buy ? 1 : 0,
      size: openedTrade.trade.positionSizeBaseAsset,
      leverage: openedTrade.trade.leverage,
      pnl: openedTrade.trade.pnl_net[0],
      block: openedTrade.tradeInitialAccFees.borrowing.block,
      tx: txId,
      uri: openedTrade.uri,
      collateral: openedTrade.collateral,
    } as TradeRecordType;

    await insertTradeRecords([newRecord]);
    await publishNewTrades(toJSON([newRecord]));
  } else {
    logger.info(`Already added new opened trade record. Ignoring..`);
  }
}
