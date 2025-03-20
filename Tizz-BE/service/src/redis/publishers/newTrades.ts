import { Redis } from '..';

export const publishNewTrades = async (dataStr: string) => {
  if (Redis === null) return;
  await Redis.publish('new-trades', dataStr);
};
