import { ethers } from 'ethers';

import { COLLATERAL_CONFIG } from '../constants';
import { ABIS } from '@tizz/sdk';

export const initStack = async (w3, stackConfig) => {
  try {
    const storage = new w3.eth.Contract(ABIS.STORAGE, stackConfig.storage);
    const trading = new w3.eth.Contract(ABIS.TRADING, stackConfig.trading);
    const [aggregatorAddress, callbacksAddress] = await Promise.all([
      storage.methods.priceAggregator().call(),
      storage.methods.callbacks().call(),
    ]);
    const callbacks = new w3.eth.Contract(ABIS.CALLBACKS, callbacksAddress);

    const [borrowingFeesAddress] = await Promise.all([callbacks.methods.borrowingFees().call()]);
    const aggregator = new w3.eth.Contract(ABIS.AGGREGATOR, aggregatorAddress);
    const borrowingFees = new w3.eth.Contract(ABIS.BORROWING_FEES, borrowingFeesAddress);

    const priceUsd = (await aggregator.methods.getCollateralPriceUsd().call()) + '';
    const price = (priceUsd as unknown as number) / 1e8; // 1e8 USD from feed

    return {
      collateral: stackConfig.collateral,
      collateralConfig: COLLATERAL_CONFIG[stackConfig.collateral],
      price,
      contracts: {
        storage,
        callbacks,
        trading,
        aggregator,
        borrowingFees,
      },
      eventSubs: {},
      borrowingFeesContext: { groups: [], pairs: [] },
      allowedLink: { storage: false, rewards: false },
    };
  } catch (error) {
    throw new Error('init contracts failed!');
  }
};

export const getEthersContract = (web3Contract, provider) => {
  return new ethers.Contract(web3Contract.options.address, web3Contract.options.jsonInterface, provider);
};

export const transformRawTrades = async (rawTrades, collat, ethersProvider: ethers.providers.Provider) => {
  const { collateral, decimals, price, borrowingFeesContext } = collat;

  return Promise.all(
    rawTrades?.map(async (rawTrade) => {
      const { trade, tradeInfo, initialAccFees, tradeData } = rawTrade;
      let pnl_net = ['0', '0'];
      // TODO: need to consider how to calculate PNL
      // if (tradeInfo.beingMarketClosed)
      //   pnl_net = getPnl(price, trade, tradeInfo, initialAccFees, false, {
      //     currentBlock: initialAccFees.borrowing.block,
      //     ...borrowingFeesContext,
      //   }) ?? [0, 0];
      const ts = (await ethersProvider.getBlock(Number(initialAccFees.borrowing.block))).timestamp;
      const date = new Date(ts * 1000).toISOString();

      return {
        collateral,
        date,
        trade: {
          ...trade,
          pnl_net,
          // size: (BigInt(tradeInfo.openInterestBaseAsset) / BigInt(trade.leverage)).toString(),
        },
        tradeInfo,
        tradeData,
        tradeInitialAccFees: initialAccFees,
      };
    }),
  );
};

export const buildTradeIdentifier = (collateral, trader, pairIndex, index, isPendingOpenLimitOrder, log = true) => {
  if (isPendingOpenLimitOrder === undefined) {
    throw new Error('isPendingOpenLimitOrder was passed as undefined!');
  }

  return `trade://${collateral}/${trader}/${pairIndex}/${index}?isOpenLimit=${isPendingOpenLimitOrder}`;
};

export const transformLastUpdated = (ol, olLastUpdated, t, tLastUpdated) => {
  if (!olLastUpdated?.length || !tLastUpdated?.length) return [[], []];

  return [
    ...olLastUpdated.map((l, i) => [
      buildTradeIdentifier(ol[i].collateral, ol[i].trader, ol[i].pairIndex, ol[i].index, true),
      { sl: l.sl, tp: l.tp, limit: l.limit },
    ]),
    ...tLastUpdated.map((l, i) => [
      buildTradeIdentifier(t[i].collateral, t[i].trader, t[i].pairIndex, t[i].index, false),
      { sl: l.sl, tp: l.tp, limit: l.limit },
    ]),
  ];
};

export const convertTrade = (trade) => ({
  trader: trade.trader,
  buy: trade.buy,
  index: parseInt(trade.index),
  initialPosToken: parseFloat(trade.initialPosToken) / 1e18, // 1e18 GNS
  leverage: parseInt(trade.leverage),
  openPrice: parseFloat(trade.openPrice) / 1e10,
  pairIndex: parseInt(trade.pairIndex),
  sl: parseFloat(trade.sl) / 1e10,
  tp: parseFloat(trade.tp) / 1e10,
});

export const convertTradeInfo = (tradeInfo, collateralPrecision = 1e18) => ({
  beingMarketClosed: tradeInfo?.beingMarketClosed,
  openInterestBaseAsset: parseFloat(tradeInfo.openInterestBaseAsset) / collateralPrecision, // collateral precision
  slLastUpdated: parseInt(tradeInfo.slLastUpdated),
  tokenPriceBaseAsset: parseFloat(tradeInfo.tokenPriceBaseAsset) / 1e10,
  tpLastUpdated: parseInt(tradeInfo.tpLastUpdated),
});

export const convertTradeData = (tradeData) => ({
  maxSlippageP: parseFloat(tradeData.maxSlippageP.toString()) / 1e10,
  lastOiUpdateTs: parseFloat(tradeData.lastOiUpdateTs),
  collateralPriceUsd: parseFloat(tradeData.collateralPriceUsd.toString()) / 1e8,
});

export const convertTradeInitialAccFees = (initialAccFees) => ({
  borrowing: {
    accPairFee: parseFloat(initialAccFees.borrowing?.accPairFee || '0') / 1e10,
    accGroupFee: parseFloat(initialAccFees.borrowing?.accGroupFee || '0') / 1e10,
    block: parseInt(initialAccFees.borrowing?.block || '0'),
  },
  liquidationPrice: parseFloat(initialAccFees.liquidationPrice.toString()) / 1e8,
});

export function buildTriggerIdentifier(collateral, trader, pairIndex, index, limitType) {
  return `trigger://${collateral}/${trader}/${pairIndex}/${index}[lt=${limitType}]`;
}

// function getTradeLiquidationPrice(stack, trade) {
//   const { tradeInfo, tradeInitialAccFees, pairIndex } = trade;
//   const { precision } = stack.collateralConfig;

//   return getLiquidationPrice(convertTrade(trade), convertTradeInfo(tradeInfo, precision), tradeInitialAccFees, {
//     currentBlock: app.blocks.latestL2Block,
//     openInterest: convertOpenInterest(stack.openInterests[pairIndex], precision),
//     pairs: stack.borrowingFeesContext.pairs,
//     groups: stack.borrowingFeesContext.groups,
//   });
// }
