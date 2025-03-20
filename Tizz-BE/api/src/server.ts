/* eslint-disable no-console */
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';

// Load base .env file first
dotenv.config();

// Import API Server App
import { logger } from './utils/logger';
import { TIZZ_DB_URL } from './config';
import { connectDb } from '@tizz/database';
import socketio from './sockets';
import app from './app';

// Socket communication
const server = createServer(app);
socketio(server);

/**
 * Start Express server.
 */
server.listen(app.get('port'), async () => {
  logger.info('  App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
  //   logger.info('  Swagger : http://localhost:%d/api-docs ', app.get('port'));
  logger.info('  Data source is %s', path.join(__dirname, '../../logs'));

  if (!TIZZ_DB_URL) {
    logger.warn('Database url is not configured!');
  } else await connectDb(TIZZ_DB_URL);
});

export default server;
