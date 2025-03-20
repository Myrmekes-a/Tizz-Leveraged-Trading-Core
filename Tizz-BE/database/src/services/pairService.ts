import Pair from "../models/PairModel";
import { PairIndexType } from "../types/pair";

export const findPairByIndex = async (index: number) => {
  const pair = await Pair.findOne({ index });

  return pair;
};

export const resetEntirePairs = async (pairIndexs: PairIndexType[]) => {
  const updatePromises = pairIndexs.map(pairIndex =>
    Pair.updateOne({ index: pairIndex.index }, pairIndex, { upsert: true })
  );

  await Promise.all(updatePromises);
};
