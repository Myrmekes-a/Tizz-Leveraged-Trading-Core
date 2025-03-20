import { logger } from '../../utils/logger';
import { aggregate24hPairVolumes, aggregate24hVolume, aggregateAllVolume } from '@tizz/database';

export async function get24hPairVolumes(collat: string) {
  logger.info(`  fetching 24h pair volumes of trade history for ${collat} collateral`);

  const data = await aggregate24hPairVolumes(collat);

  if (data) {
    return data.map((datum) => ({
      pair: datum._id,
      volume: BigInt(datum.volume).toString(),
    }));
  } else {
    logger.error('[ERROR][aggregate24hPairVolumes] failed to get from DB');

    return undefined;
  }
}

export async function getCumulativeVolumes(collat: string) {
  logger.info(`  fetching cumulative volumes of trade history for ${collat} collateral`);

  const daily = await aggregate24hVolume(collat);
  const all = await aggregateAllVolume(collat);

  if (daily && all) {
    return {
      daily,
      all,
    };
  } else {
    logger.error('[ERROR][aggregateCumulativeVolumes] failed to get from DB');

    return undefined;
  }
}
