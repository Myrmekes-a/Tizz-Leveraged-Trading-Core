import { Redis } from '..';

export const setCurrentPrices = async (dataStr: string) => {
  if (Redis === null) return;
  await Redis.set('current-prices', dataStr);
};

export const getCurrentPricesRedis = async () => {
  if (Redis === null) return undefined;
  const currentPrices = await Redis.get('current-prices');
  return currentPrices ? JSON.parse(currentPrices) : null;
};
