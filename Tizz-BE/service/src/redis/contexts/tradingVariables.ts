import { Redis } from '..';

export const setTradingVariables = async (dataStr: string) => {
  if (Redis === null) return;
  await Redis.set('trading-variables', dataStr);
};
