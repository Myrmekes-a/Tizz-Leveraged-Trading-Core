import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';

import { logger } from '../utils/logger';
export * from './publishers';
export * from './contexts';

export let Redis: RedisClientType | null = null;

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
