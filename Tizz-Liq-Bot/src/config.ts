import path from 'path';

import { CHAIN_IDS, NETWORKS } from './constants';

export const PROTO_PATH = path.join(__dirname, '/../client.proto');

export const appConfig = () => {
  const conf = {
    EVENT_CONFIRMATIONS_MS: parseFloat(process.env.EVENT_CONFIRMATIONS_SEC ?? '') * 1000,
    OPEN_TRADES_REFRESH_MS: parseFloat(process.env.OPEN_TRADES_REFRESH_SEC || '120') * 1000,
    USE_MULTICALL: (process.env.USE_MULTICALL && process.env.USE_MULTICALL === 'true') || false,
    MAX_RETRIES: process.env.MAX_RETRIES && !isNaN(+process.env.MAX_RETRIES) ? parseInt(process.env.MAX_RETRIES) : -1,
    WEB3_PROVIDER_URLS: (process.env.WSS_URLS ?? '').split(','),
    CHAIN_ID: process.env.CHAIN_ID !== undefined ? parseInt(process.env.CHAIN_ID, 10) : CHAIN_IDS.BOTANIX,
    CHAIN: process.env.CHAIN ?? 'mainnet',
    FETCH_TRADING_VARIABLES_REFRESH_INTERVAL_MS:
      parseFloat(process.env.FETCH_TRADING_VARIABLES_REFRESH_INTERVAL_SEC || '61') * 1000,
    FETCH_PRICE_FEED_REFRESH_INTERVAL_MS: parseFloat(process.env.FETCH_PRICE_FEED_REFRESH_INTERVAL_MS || '3') * 1000,
    WEB3_HTTP_PROVIDER_URL: process.env.HTTPS_URL || '',
    ENABLE_FS_LOGGING: process.env.ENABLE_FS_LOGGING || false,
    ENABLE_CONSOLE_LOGGING: process.env.ENABLE_CONSOLE_LOGGIN || true,
  };

  const NETWORK = NETWORKS[conf.CHAIN_ID];

  let MAX_PROVIDER_BLOCK_DRIFT =
    (process.env.MAX_PROVIDER_BLOCK_DRIFT ?? '').length > 0 ? parseInt(process.env.MAX_PROVIDER_BLOCK_DRIFT ?? '', 10) : 2;

  if (MAX_PROVIDER_BLOCK_DRIFT < 1) {
    // MAX_PROVIDER_BLOCK_DRIFT is set to minimum of 1.
    // force config to 1
    MAX_PROVIDER_BLOCK_DRIFT = 1;
  }

  return {
    ...conf,
    NETWORK,
    MAX_PROVIDER_BLOCK_DRIFT,
  };
};
