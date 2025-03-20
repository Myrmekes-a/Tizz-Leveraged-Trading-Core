import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';
import { Server } from 'socket.io';

import { logger } from '../../utils/logger';
import { buildResDataFromJson } from '../../services/pairs';
import { TIZZ_REDIS_URL } from '../../config';
import { CollateralTypes } from '@tizz/sdk';
import { TradingEvent } from '../../@types';

export let Redis: RedisClientType | null = null;
export let hookRedis: RedisClientType | null = null;

export const connectRedis = async (io: Server) => {
  if (hookRedis === null) {
    if (!TIZZ_REDIS_URL) {
      logger.error('Redis url is not configured!');
      return;
    }
    // TODO: need to update connection for cloud instead of local server
    hookRedis = createClient({ url: TIZZ_REDIS_URL });
    hookRedis.on('error', (err) => logger.error('  RedisError:' + JSON.stringify(err)));

    hookRedis.subscribe('trading-variables', (data: string) => {
      if (data) {
        console.log('===> new trading variables arrived');
        const json = JSON.parse(data);

        // TODO: should refactor tradingVariables from redis msg
        for (let [collat, collatType] of Object.entries(CollateralTypes))
          io.emit(`tradingVariables${collat}`, buildResDataFromJson(json, collatType));

        // TODO: should consider if newTrade for tradingHistory
        if (json.knownOpenTrades && Object.values(json.knownOpenTrades).length > 0)
          io.emit('tradingHistory', Object.values(json.knownOpenTrades));
      }
    });

    hookRedis.subscribe('current-prices', (data: string) => {
      if (data) {
        console.log('===> new prices arrived');
        const newPrices: { [pair: string]: { price: string; decimal: number; timestamp: number; pairIndex: number } } =
          JSON.parse(data);

        io.emit(
          'currentPrices',
          Object.values(newPrices)
            .map((price) => {
              return [price.pairIndex, parseFloat(price.price) / 10 ** price.decimal];
            })
            .flat(),
        );
      }
    });

    hookRedis.subscribe('new-trades', async (data: string | undefined) => {
      if (data) {
        const newTrade = JSON.parse(data);
        console.log(`===> ${newTrade.length} new trade event arrived`);

        io.emit('newTradeHistory', newTrade);
      }
    });

    hookRedis.subscribe('trading-events', async (data: string | undefined) => {
      if (data) {
        const event: TradingEvent = JSON.parse(data);
        console.log('TradingEvent Captured: ', event.event);

        io.emit('trading-event', event);
      }
    });
  }

  if (Redis === null) {
    if (!TIZZ_REDIS_URL) {
      logger.error('Redis url is not configured!');
      return;
    }
    Redis = createClient({ url: TIZZ_REDIS_URL });
  }

  await hookRedis.connect();
  await Redis.connect();

  logger.info('  Redis subscriber connected');
};
