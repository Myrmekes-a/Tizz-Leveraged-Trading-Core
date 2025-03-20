import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';

import { logger } from '../utils/logger';
import { getCurrentOpenedTrades, getCurrentPricesRedis, triggerOrder } from './contexts';
import { TriggerOrder } from '../constants/types';
import { StorageLimitOrder } from '@tizz/sdk';
import { fetchPricesSupraPairs } from '../supra';

export * from './contexts';

export let Redis: RedisClientType | null = null;
export let HookRedis: RedisClientType | null = null;

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
      const priceData = await getCurrentPricesRedis();
      if (!priceData) {
        logger.info('   no prices data. ignoring');
        return;
      }
      const newPrices: { [pair: string]: { price: string; decimal: number; timestamp: number; pairIndex: number, pairId: number } } = priceData;
      let pairPrices: any = {};
      let pairIds: any = {};

      Object.values(newPrices).map((price) => {
        pairPrices[price.pairIndex] = parseFloat(price.price) / 10 ** price.decimal;
        pairIds[price.pairIndex] = Number(price.pairId);
      });

      const tradeData = await getCurrentOpenedTrades();
      if (!tradeData) {
        logger.info('   no trades data. ignoring');
        return;
      }

      let triggerOrders: TriggerOrder[] = [];
      let orderCnt = 0;
      Object.values(tradeData).map(async (openTrade: any) => {
        orderCnt++;
        if (openTrade.trade === undefined) {
          // limit orders.
          const currentPrice = pairPrices[openTrade.pairIndex];
          const currentPairId = pairIds[openTrade.pairIndex];

          console.log('price: ', currentPrice, currentPairId);

          const triggerPrice = parseFloat(openTrade.maxPrice) / 10 ** 10; // price precision is 10. 10^10
          const orderType = openTrade.type; // 1: Limit Order, 2: Stop Limit Order
          const buy: boolean = openTrade.buy;
          const slippage = currentPrice / 10000; // 0.01%
          let triggerable: boolean = false;

          if (orderType === '1') {
            // Limit Order. opened order with lower/higher than current price(long/short).
            // long: triggerPrice < executionPrice, short: triggerPrice > executionPrice
            triggerable =
              (buy === true && currentPrice <= triggerPrice && currentPrice >= triggerPrice - slippage) ||
              (buy === false && currentPrice >= triggerPrice && currentPrice <= triggerPrice + slippage);
          } else if (orderType === '2') {
            // Stop Limit Order. opened order with higher/lower than current price(long/short).
            // long: triggerPrice < executionPrice, short: triggerPrice > executionPrice
            triggerable =
              (buy === true && currentPrice >= triggerPrice && currentPrice <= triggerPrice + slippage) ||
              (buy === false && currentPrice <= triggerPrice && currentPrice >= triggerPrice - slippage);
          }

          if (triggerable === true) {
            const supra_res = await fetchPricesSupraPairs([currentPairId]);
            const { hex } = supra_res;
            console.log('currentPrice: ', currentPrice);
            triggerOrders.push({
              trader: openTrade.trader,
              index: openTrade.index,
              pairIndex: openTrade.pairIndex,
              type: StorageLimitOrder.OPEN,
              collateral: openTrade.collateral,
              proof: hex,
            });
          }
        } else {
          // market trade positions
          const currentPrice = pairPrices[openTrade.trade.pairIndex];
          const currentPairId = pairIds[openTrade.trade.pairIndex];

          console.log('price: ', currentPrice, currentPairId);

          const tp = parseFloat(openTrade.trade.tp) / 10 ** 10;
          const sl = parseFloat(openTrade.trade.sl) / 10 ** 10;
          const buy: boolean = openTrade.trade.buy;
          const slippage = currentPrice / 10000; // 0.01%
          let triggerable_tp: boolean = false;
          let triggerable_sl: boolean = false;

          // In long/short mode, tp should be greater/lower than open price.
          triggerable_tp =
            (buy === true && currentPrice >= tp && currentPrice <= tp + slippage) ||
            (buy === false && currentPrice <= tp && currentPrice >= tp - slippage);

          // to trigger order that reaches to sl(stop loss), sl should be greater than 0.
          // zero sl means sl percent is -100%. but if sl is -90%, it will be liquidated.
          triggerable_sl =
            sl > 0 &&
            ((buy === true && currentPrice <= sl && currentPrice >= sl - slippage) ||
              (buy === false && currentPrice >= sl && currentPrice <= sl + slippage));

          if (triggerable_tp === true || triggerable_sl == true) {
            const supra_res = await fetchPricesSupraPairs([currentPairId]);
            const { hex } = supra_res;
            console.log('currentPrice: ', currentPrice);
            triggerOrders.push({
              trader: openTrade.trade.trader,
              index: openTrade.trade.index,
              pairIndex: openTrade.trade.pairIndex,
              type: triggerable_tp === true ? StorageLimitOrder.TP : StorageLimitOrder.SL,
              collateral: openTrade.collateral,
              proof: hex,
            });
          }
        }
      });

      console.log(`found ${triggerOrders.length}/${orderCnt} triggerable orders`);
      if (triggerOrders.length > 0) {
        await triggerOrder(triggerOrders);
      }
    });

    await HookRedis.connect();
    logger.info('  Redis subscriber connected');
  } catch (err) {
    logger.error(`Error handling reconnection for redis hook ${url}:`, err);
  }
};
