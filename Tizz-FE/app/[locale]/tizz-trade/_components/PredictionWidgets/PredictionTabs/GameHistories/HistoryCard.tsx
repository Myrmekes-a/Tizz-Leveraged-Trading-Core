import { BetInfoFragment, RoundInfoFragment } from "@/gql/graphql";
import { getFragmentData } from "@/gql/fragment-masking";

import { HistoryCardView } from "./HistoryCardView";
import { HistoryCardWithEpoch } from "./HistoryCardWithEpoch";

import { RoundInfoFragmentDocument } from "@/tizz-trade-hooks/prediction/useGetPredictionRound";

export type HistoryCardProps = {
  epoch: number;
  round?: RoundInfoFragment;
  bet?: BetInfoFragment;
};

export function HistoryCard({ epoch, round, bet }: HistoryCardProps) {
  if (round) {
    return (
      <HistoryCardView
        history={{
          ...round,
          bet: bet,
        }}
      />
    );
  }

  if (bet) {
    return (
      <HistoryCardView
        history={{
          ...getFragmentData(RoundInfoFragmentDocument, bet.round),
          bet: bet,
        }}
      />
    );
  }

  return <HistoryCardWithEpoch epoch={epoch} bet={bet} />;
}
