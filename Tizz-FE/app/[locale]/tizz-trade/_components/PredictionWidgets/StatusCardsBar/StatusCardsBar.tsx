"use client";

import { useGetPredictionBalance } from "@/tizz-trade-hooks/prediction/useGetPredictionBalance";

import { OverallBalanceCard } from "./OverallBalanceCard";
import { RankCard } from "./RankCard";
import { RewardCard } from "./RewardCard";
import { WinrateCard } from "./WinrateCard";
import { useGetPredictionUser } from "@/tizz-trade-hooks/prediction/useGetPredictionUser";
import { useAccount } from "wagmi";
import { StatusCardsBarSkeleton } from "./StatusCardsBarSkeleton";

export function StatusCardsBar({ currentPrice }: { currentPrice: number }) {
  const { address } = useAccount();

  const { balance, claimableBalance, refetchClaimableBalance } =
    useGetPredictionBalance();

  const user = useGetPredictionUser(address);

  if (!user) {
    return <StatusCardsBarSkeleton />;
  }

  return (
    <div className="flex w-full items-center gap-6 overflow-x-auto">
      <RewardCard
        rewards={claimableBalance}
        refetchClaimableBalance={refetchClaimableBalance}
      />
      <RankCard rank={user.rank} />
      <OverallBalanceCard overallBalance={currentPrice * balance} />
      <WinrateCard
        winRate={((user.win_bets || 0) * 100) / (user.total_bets || 1)}
      />
    </div>
  );
}
