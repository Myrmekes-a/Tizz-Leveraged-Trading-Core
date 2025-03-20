import { Redis } from '..';

export const setChainlinkLastRoundId = async (roundId: { [pair: string]: number }) => {
  if (Redis === null) return;
  await Redis.set('last-round-ids', JSON.stringify(roundId));
};

export const getChainlinkLastRoundId = async (): Promise<{ [pair: string]: number }> => {
  if (Redis === null) return {};
  const lastRoundIds = await Redis.get('last-round-ids');
  return lastRoundIds === null ? {} : JSON.parse(lastRoundIds);
};
