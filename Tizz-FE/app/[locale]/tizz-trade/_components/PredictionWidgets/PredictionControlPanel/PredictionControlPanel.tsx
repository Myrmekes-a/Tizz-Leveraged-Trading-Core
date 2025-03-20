"use client";

import { useGetPredictionRound } from "@/tizz-trade-hooks/prediction/useGetPredictionRound";
import { useGetPredictionBalance } from "@/tizz-trade-hooks/prediction/useGetPredictionBalance";

import { NextRoundPrediction } from "./NextRoundPrediction";
import { PredictForm } from "./PredictForm";
import { PredictionControlPanelSkeleton } from "./PredictionControlPanelSkeleton";

export type PredictionControlPanelProps = {
  currentTimestamp: number;
  currentPrice: number;
  epoch: number;
  minBetAmount: bigint;
  bufferSeconds: number;
};

export function PredictionControlPanel({
  currentTimestamp,
  currentPrice,
  epoch,
  minBetAmount,
  bufferSeconds,
}: PredictionControlPanelProps) {
  const { precision, balance, claimableBalance } = useGetPredictionBalance();

  const currentRound = useGetPredictionRound(epoch);

  if (!currentRound) {
    return <PredictionControlPanelSkeleton />;
  }

  return (
    <div className="z-0 flex w-full flex-col gap-3.5 rounded-[14px] border border-[#282834] bg-[#14141a] px-3 py-4 md:max-w-[450px] lg:px-[18px] lg:py-6 2xl:max-w-[624px]">
      <NextRoundPrediction
        epoch={currentRound.epoch || 0}
        currentPrice={currentPrice}
        prizePool={Number(currentRound.total_bet_amount) || 0}
        upPayoud={
          Number(currentRound.bull_bet_amount)
            ? Number(currentRound.total_bet_amount) /
              Number(currentRound.bull_bet_amount)
            : 0
        }
        downPayout={
          Number(currentRound.bear_bet_amount)
            ? Number(currentRound.total_bet_amount) /
              Number(currentRound.bear_bet_amount)
            : 0
        }
        remainMillSec={Math.max(
          0,
          Math.floor(currentRound.locked_at - currentTimestamp / 1000),
        )}
      />

      <PredictForm
        currentTimestamp={currentTimestamp}
        minBetAmount={minBetAmount}
        bufferSeconds={bufferSeconds}
        round={currentRound}
        balance={balance}
        claimableBalance={claimableBalance}
        precision={precision}
      />
    </div>
  );
}
