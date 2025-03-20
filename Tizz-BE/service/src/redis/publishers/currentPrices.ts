import { Redis } from '..';

export const publishCurrentPrices = async (dataStr: string) => {
  if (Redis === null) return;
  await Redis.publish('current-prices', dataStr);
};

export const publishPricesProof = async (dataStr: string) => {
  if (Redis === null) return;
  await Redis.publish('price-proof', dataStr);
};
