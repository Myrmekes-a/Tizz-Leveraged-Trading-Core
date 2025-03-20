import { getPastPrices } from '@tizz/database';
import { getCurrentPricesRedis } from '../../sockets/redis/contexts';
import { logger } from '../../utils/logger';

export * from './chart';

export async function fetchCurrentPairPrices() {
  logger.info(`  fetching current prices data`);
  const data = await getCurrentPricesRedis();

  if (data) {
    return data;
  } else logger.error('[ERROR][getCurrentPairPrices] failed to parse extracted file data');

  return undefined;
}
export async function fetchPastPairPrices() {
  logger.info(`  fetching prices 24h ago data`);
  const data = await getPastPrices();

  if (data) {
    // adding 0 value for missing pair's price
    let result: number[] = [];
    for (let i = 0, idx = 0; i <= data[data.length - 1].pairIndex; i++) {
      if (data[idx].pairIndex == i) {
        result.push(parseFloat(data[idx].price) / 10 ** data[idx].decimal);
        idx++;
      } else result.push(0);
    }

    return { type: 'success', pricesBefore: result };
  } else logger.error('[ERROR][fetchPastPairPrices] failed to parse extracted file data');

  return { type: 'error', msg: 'Internal server error' };
}
