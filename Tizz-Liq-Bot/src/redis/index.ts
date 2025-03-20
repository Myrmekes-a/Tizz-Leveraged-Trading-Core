import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';

import { logger } from '../utils/logger';
import { getCurrentPricesRedis, getCurrentOpenedTrades, triggerOrder } from './contexts';
import { getProofBytes } from '../utils/util';
import { TriggerOrder } from '../constants/types';
import { StorageLimitOrder } from '@tizz-hive/sdk';
import { fetchPricesSupraPairs } from '../supra';
export * from './contexts';

export let Redis: RedisClientType | null = null;
export let HookRedis: RedisClientType | null = null;
const PAIR_IDS = [0, 48];

export const connectRedis = async (url: string) => {
  if (Redis === null) {
    Redis = createClient({ url });
    Redis.on('error', (err) => {
      logger.error('  RedisError:' + JSON.stringify(err));
    });
  }

  try {
    await Redis.connect();
    logger.info('  Redis publisher connected');
  } catch (error) {
    logger.error(`Error handling reconnection for redis ${url}:`, error);
  }
};

export const connectHookRedis = async (url: string) => {
  if (HookRedis === null) {
    HookRedis = createClient({ url });
    HookRedis.on('error', (err) => logger.error('  RedisError:' + JSON.stringify(err)));
  }

  try {
    HookRedis.subscribe('price-proof', async (proof: string) => {
      const [currentOpenTrades, priceData] = await Promise.all([getCurrentOpenedTrades(), getCurrentPricesRedis()]);

      if (!priceData) {
        logger.info('   no prices data. ignoring');
        return;
      }

      const newPrices: {
        [pair: string]: { price: string; decimal: number; timestamp: number; pairIndex: number; pairId: number };
      } = priceData;
      let pairPrices: any = {};
      let pairIds: any = {};
      let pairIndices: any = {};
      Object.values(newPrices).map((price) => {
        pairPrices[price.pairIndex] = parseFloat(price.price) / 10 ** price.decimal;
        pairIds[price.pairIndex] = Number(price.pairId);
        pairIndices[price.pairIndex] = Number(price.pairIndex);
      });

      const liqOrders: TriggerOrder[] = [];
      let orderCnt = 0;
      await Promise.all(Object.values(currentOpenTrades)
        .filter((openTrade: any) => openTrade.trade !== undefined)
        .map(async (openTrade: any) => {
          orderCnt++;
          const price = pairPrices[openTrade.trade.pairIndex];
          const currentPairId = pairIds[openTrade.trade.pairIndex];

          if (price === undefined) {
            logger.warn(
              `Price data for ${openTrade.trade.pairIndex} or ${openTrade.collateral} collateral precision is missed. skipping..`,
            );
            return;
          }

          const curPrice = price;
          const liquidPrice = parseFloat(openTrade.tradeInitialAccFees.liquidationPrice) / 10 ** 10;

          if ((openTrade.trade.buy && curPrice <= liquidPrice) || (!openTrade.trade.buy && curPrice >= liquidPrice)) {
            console.log('pairId: ', currentPairId, openTrade.trade.index, openTrade.trade.pairIndex)
            liqOrders.push({
              trader: openTrade.trade.trader,
              index: openTrade.trade.index,
              pairIndex: openTrade.trade.pairIndex,
              type: StorageLimitOrder.LIQ,
              collateral: openTrade.collateral,
              proof: "",
            });
          }
        }));

      logger.info(`  Found ${liqOrders.length} / ${orderCnt} liquidation trades`);
      if (liqOrders.length > 0) {
        const supra_res = await fetchPricesSupraPairs(PAIR_IDS);
        const { hex } = supra_res;
        await triggerOrder(liqOrders.map(item => ({
          ...item,
          proof: hex,
        })));
      }
    });

    await HookRedis.connect();
    logger.info('  Redis subscriber connected');
  } catch (err) {
    logger.error(`Error handling reconnection for redis hook ${url}:`, err);
  }
};
