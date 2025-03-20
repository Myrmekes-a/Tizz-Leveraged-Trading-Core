import { Redis } from '..';
import { TradingEvent } from '../../@types/trading-notification';
import { toJSON } from '../../utils/util';

export const publishTradingEvent = async (data: TradingEvent) => {
  if (Redis === null) return;
  const dataStr = toJSON(data);

  await Redis.publish('trading-events', dataStr);
};
