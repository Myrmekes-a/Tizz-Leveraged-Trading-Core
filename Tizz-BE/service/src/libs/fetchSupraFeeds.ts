import fs from 'fs';

import { insertPrices } from '@tizz/database';
import { appConfig } from '../config';
import { fetchPricesSupraPairs } from '../supra';
import { getIndexByPairName, pairsSupraIndex } from '../supra/pairIndexs';
import { logger } from '../utils/logger';
import { divPriceInfo, mulPriceInfo } from '../utils/util';
import { publishCurrentPrices, publishPricesProof, setCurrentPrices } from '../redis';

let fetchPairPricesTimerId: NodeJS.Timeout | null = null;

export const handleCurrentPriceFeeds = async () => {
  logger.info('Fetching pair prices...');

  let pairMap = pairsSupraIndex;
  const pairIds = Object.values(pairMap).reduce((ids: number[], curPairIds: number[]) => {
    curPairIds.map((pairId) => {
      let id = pairId > 0 ? pairId : pairId * -1;
      if (ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }, []);

  try {
    const { result, hex } = await fetchPricesSupraPairs(pairIds);

    let prices: { [key: string]: { pairIndex: number; price: string; decimal: number; timestamp: number, pairId: number } } = {};

    for (let pairKey of Object.keys(pairMap)) {
      let ids = pairMap[pairKey];
      let index;
      if (ids.length === 1) {
        let index = ids[0];
        if (result[index])
          prices[pairKey] = {
            ...result[index],
            pairIndex: getIndexByPairName(pairKey),
            pairId: index,
          };
      } else if (ids.length > 1) {
        index = Math.abs(ids[0]);
        let price1 = result[index];
        index = Math.abs(ids[1]);
        let price2 = result[index];
        if (!price1 || !price2) continue;
        if (ids[0] > 0 && ids[1] > 0)
          prices[pairKey] = {
            pairIndex: getIndexByPairName(pairKey),
            ...mulPriceInfo(price1, price2),
            pairId: index,
          };
        else if (ids[0] > 0 && ids[1] < 0)
          prices[pairKey] = {
            pairIndex: getIndexByPairName(pairKey),
            ...divPriceInfo(price1, price2),
            pairId: ids[0],
          };
        else if (ids[0] < 0 && ids[1] > 0)
          prices[pairKey] = {
            pairIndex: getIndexByPairName(pairKey),
            ...divPriceInfo(price2, price1),
            pairId: ids[1]
          };
      }
    }

    // Write extract info in log file for testing purpose
    if (appConfig().ENABLE_FS_LOGGING) fs.writeFileSync('../logs/pair-prices.test.json', JSON.stringify(prices));

    // Insert price feed to db
    await Promise.all([
      insertPrices(Object.values(prices)),
      setCurrentPrices(JSON.stringify(prices)),
      publishCurrentPrices(JSON.stringify(prices)),
      publishPricesProof(hex), // prevent auto close liq yet
    ]);

    logger.info(`Done fetching pair prices; updated at ${new Date().toISOString()}`);
  } catch (error) {
    logger.error('Error while fetching supra prices!', { error });
    if (appConfig().ENABLE_CONSOLE_LOGGING) console.dir(error, { depth: null });
  }
};

export const fetchCurrentPriceFeeds = () => {
  if (fetchPairPricesTimerId !== null) {
    logger.debug(`Exist fetchPairPrices interval. Ignoring new interval.`);
    return;
  }

  fetchPairPricesTimerId = setInterval(() => {
    fetchPairPricesTimerId = null;
    handleCurrentPriceFeeds();
  }, appConfig().FETCH_PRICE_FEED_REFRESH_INTERVAL_MS);
};
