import { Redis } from '..';

export const getCurrentPricesRedis = async () => {
  if (Redis === null) return undefined;
  const currentPrices = await Redis.get('current-prices');
  return currentPrices ? JSON.parse(currentPrices) : null;
};
