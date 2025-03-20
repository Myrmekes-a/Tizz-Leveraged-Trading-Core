"use client";

import { BetInfoFragment } from "@/gql/graphql";

import { HistoryCardView } from "./HistoryCardView";
import { useGetPredictionRound } from "@/tizz-trade-hooks/prediction/useGetPredictionRound";

export type HistoryCardWithEpochProps = {
  epoch: number;
  bet?: BetInfoFragment;
};

export function HistoryCardWithEpoch({
  epoch,
  bet,
}: HistoryCardWithEpochProps) {
  const round = useGetPredictionRound(epoch);

  if (!round) {
    return <div>{epoch} there is no round data</div>;
  }

  return (
    <HistoryCardView
      history={{
        ...round,
        bet,
      }}
    />
  );
}
