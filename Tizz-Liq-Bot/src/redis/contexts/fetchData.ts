import { Redis } from '..';

export const getCurrentPricesRedis = async () => {
  if (Redis === null) return undefined;
  const currentPrices = await Redis.get('current-prices');
  return currentPrices ? JSON.parse(currentPrices) : null;
};

export const getCurrentOpenedTrades = async () => {
  if (Redis === null) return undefined;
  const currentOpenedTrades = await Redis.get('opened-trades');
  return currentOpenedTrades ? JSON.parse(currentOpenedTrades) : null;
};
