import { BigNumber, utils } from 'ethers';

import { findPrices } from '@tizz/database';
import { logger } from '../../utils/logger';

type CandlePrice = {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
};

export async function fetchPriceChartData(pairIndex: number, start: number, end: number, range: number) {
  logger.info(`fetching chart data for pairIndex: ${pairIndex}, start: ${start}, end: ${end}, range: ${range}`);

  // load price histories from DB
  const priceFeeds = await findPrices({
    pairIndex,
    start,
    end,
  });

  const priceHistory = priceFeeds
    .map((feed) => {
      let price = utils.formatUnits(BigNumber.from(feed.price), feed.decimal);

      return {
        price: parseFloat(price),
        ts: feed.timestamp.getTime() / 1000,
      };
    })
    .sort((price1, price2) => price1.ts - price2.ts);

  if (!priceHistory.length) return [];

  let candlePeriod = 60; // 1 min  default
  switch (range) {
    case 1:
      // default candle period
      break;
    case 5:
      candlePeriod = 300; // 5 mins
      break;
    case 15:
      candlePeriod = 1_800; // 30 mins
      break;
    case 60:
      candlePeriod = 3_600; // 1 hr
      break;
    case 120:
      candlePeriod = 7_200; // 2 hrs
      break;
  }

  // convert price feed to candle price data
  let cdStart = Math.floor(priceHistory[0].ts / candlePeriod) * candlePeriod;
  let cdEnd = Math.floor(priceHistory[priceHistory.length - 1].ts / candlePeriod) * candlePeriod;

  let cdFeeds: CandlePrice[] = [];
  let pIndex = 0;
  for (let curCdStart = cdStart; curCdStart <= cdEnd; curCdStart += candlePeriod) {
    let st = priceHistory[pIndex].price;
    let hi = priceHistory[pIndex].price;
    let lo = priceHistory[pIndex].price;
    let en = priceHistory[pIndex].price;
    let prevIndex = pIndex;
    for (; pIndex < priceHistory.length; ) {
      if (hi < priceHistory[pIndex].price) hi = priceHistory[pIndex].price;
      if (lo > priceHistory[pIndex].price) lo = priceHistory[pIndex].price;
      en = priceHistory[pIndex].price;

      // break new candle data starts
      if (priceHistory[pIndex].ts >= curCdStart + candlePeriod) break;
      pIndex++;
    }
    if (prevIndex !== pIndex)
      cdFeeds.push({
        open: st,
        high: hi,
        low: lo,
        close: en,
        time: curCdStart,
      });
  }

  return cdFeeds;
}

export async function fetchLatestPriceData() {
  logger.info(`  fetching latest price data`);

  logger.info('start: ', Date.now());
  let candlePeriod = 60; // 1 min  default

  const now = Math.floor(Date.now() / 1000);

  // convert price feed to candle price data
  let cdStart = Math.floor(now / candlePeriod) * candlePeriod;

  // load price histories from DB
  const priceFeeds = await findPrices({
    start: cdStart * 1000,
  });

  logger.info('After mongodb : ', Date.now());
  logger.info('priceFeeds: ', priceFeeds.length)

  const priceHistory = priceFeeds
    .map((feed) => {
      let price = utils.formatUnits(BigNumber.from(feed.price), feed.decimal);

      return {
        pairIndex: feed.pairIndex,
        price: parseFloat(price),
        ts: feed.timestamp.getTime() / 1000,
      };
    })
    .sort((price1, price2) =>
      price1.pairIndex === price2.pairIndex ? price1.ts - price2.ts : price1.pairIndex - price2.pairIndex,
    );

  if (!priceHistory.length) return [];

  let ops: number[] = [];
  let his: number[] = [];
  let los: number[] = [];
  let cls: number[] = [];

  for (let pairIdx = 0, idx = 0; idx < priceHistory.length; ) {
    const len = ops.length;
    if (priceHistory[idx].pairIndex !== pairIdx) {
      // adding empty candle for missing pairs
      if (len === pairIdx) {
        ops.push(0);
        his.push(0);
        los.push(0);
        cls.push(0);
      }

      pairIdx++;
    } else {
      if (len === pairIdx) {
        ops.push(priceHistory[idx].price);
        his.push(priceHistory[idx].price);
        los.push(priceHistory[idx].price);
        cls.push(priceHistory[idx].price);
      } else {
        if (his[len - 1] < priceHistory[idx].price) his[len - 1] = priceHistory[idx].price;
        if (los[len - 1] > priceHistory[idx].price) los[len - 1] = priceHistory[idx].price;
        cls[len - 1] = priceHistory[idx].price;
      }
      idx++;
    }
  }
  return {
    time: cdStart,
    opens: ops,
    highs: his,
    lows: los,
    closes: cls,
  };
}
