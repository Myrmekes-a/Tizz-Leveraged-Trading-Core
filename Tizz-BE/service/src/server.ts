/* eslint-disable no-console */
import dotenv from 'dotenv';
import path from 'path';

// Load base .env file first
dotenv.config();

import { connectDb } from '@tizz/database';
import { connectRedis } from './redis';

// Load global app context
import { initGlobalContext } from './libs/global';
import { logger } from './utils/logger';

const main = async () => {
  logger.info('  Extract service is running');
  logger.info('  Extracted data path is %s', path.join(__dirname, '../../logs'));

  if (!process.env.TIZZ_DB_URL || !process.env.TIZZ_REDIS_URL) {
    logger.error(!process.env.TIZZ_DB_URL ? 'Database url is not configured!' : 'Redis url is not configured!');
    return;
  }
  await connectDb(process.env.TIZZ_DB_URL);
  await connectRedis(process.env.TIZZ_REDIS_URL);
  await initGlobalContext();
};

main();
