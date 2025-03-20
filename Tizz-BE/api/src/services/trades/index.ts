import { logger } from '../../utils/logger';
import { findTradesByFilter } from '@tizz/database';

export * from './winner';

export async function getLatestTradingHistory() {
  logger.info(`  fetching trading history 24h ago`);

  const data = await findTradesByFilter({ start: Date.now() - 86400 * 1000 });

  if (data) {
    return data.map((datum) => ({
      date: datum.timestamp,
      pair: datum.pair,
      address: datum.trader,
      action: datum.action,
      openPrice: datum.openPrice,
      closePrice: datum.closePrice,
      collateralPriceUsd: datum.collateralPriceUsd,
      long: datum.buy,
      size: datum.size,
      leverage: datum.leverage,
      pnl_net: datum.pnl,
      tx: datum.tx,
      collateral: datum.collateral,
    }));
  } else logger.error('[ERROR][getTradingHistories] failed to get from DB');

  return undefined;
}

export async function getUserTradingHistory(user: string | undefined) {
  logger.info(`  fetching user: ${user} trading history`);

  let addresses: string[] = [];
  if (user) addresses.push(user);
  const data = await findTradesByFilter({ addresses });

  if (data) {
    return data.map((datum) => ({
      date: datum.timestamp,
      pair: datum.pair,
      address: datum.trader,
      action: datum.action,
      openPrice: datum.openPrice,
      closePrice: datum.closePrice,
      collateralPriceUsd: datum.collateralPriceUsd,
      long: datum.buy,
      size: datum.size,
      leverage: datum.leverage,
      pnl_net: datum.pnl,
      tx: datum.tx,
      collateral: datum.collateral,
    }));
  } else logger.error('[ERROR][getUserTradingHistories] failed to get from DB');

  return undefined;
}
