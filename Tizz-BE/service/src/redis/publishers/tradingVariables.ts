import { Redis } from '..';

export const publishTradingVariables = async (dataStr: string) => {
  if (Redis === null) return;
  await Redis.publish('trading-variables', dataStr);
};
