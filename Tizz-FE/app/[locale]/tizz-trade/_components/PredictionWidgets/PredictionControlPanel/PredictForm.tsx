"use client";

import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useAccount, useChains } from "wagmi";

import PredictionButton from "@/components/buttons/PredictionButton/PredictionButton";

import { ClaimPanel } from "./ClaimPanel";
import { InputPanel } from "./InputPanel";
import { BetPanel } from "./BetPanel";
import { YouBetted } from "./YouBetted";
import { RoundLocked } from "./RoundLocked";
import { useGetUserRoundBetInfo } from "@/tizz-trade-hooks/prediction/useGetPredictionUserRoundBetInfo";
import { RoundInfoFragment } from "@/gql/graphql";

export type PredictFormProps = {
  bufferSeconds: number;
  minBetAmount: bigint;
  currentTimestamp: number;
  round?: RoundInfoFragment | null;
  balance: number;
  claimableBalance: number;
  precision: number;
};

export function PredictForm({
  bufferSeconds,
  minBetAmount,
  currentTimestamp,
  round,
  balance,
  claimableBalance,
  precision,
}: PredictFormProps) {
  const chains = useChains();
  const account = useAccount();

  const [show, setShow] = useState(false);

  const betInfo = useGetUserRoundBetInfo(account.address, round?.epoch);

  const [betAmount, setBetAmount] = useState("");
  const [isUseClaimableBalance, setIsUseClaimableBalance] = useState(false);

  const handleToggleIsUseClaimableBalance = () => {
    setIsUseClaimableBalance((prev) => !prev);
  };

  useEffect(() => {
    setBetAmount(`${Math.min(Number(minBetAmount) / precision, balance)}`);
  }, [balance, minBetAmount, precision]);

  let disabledBy = "";

  if (Number.isNaN(+betAmount)) {
    disabledBy = "Invalid format";
  } else {
    if (+betAmount < Number(minBetAmount) / precision) {
      disabledBy = "Too small bet";
    }

    if (+betAmount > balance) {
      disabledBy = "Not enough balance";
    }
  }

  if (
    !round ||
    currentTimestamp / 1000 < round.started_at ||
    currentTimestamp / 1000 > round.locked_at
  ) {
    disabledBy = "Not available timestamp";
  }

  const isBetted = betInfo && betInfo.amount > 0;
  const isLocked =
    round && currentTimestamp / 1000 >= round.locked_at - bufferSeconds;

  const isDisconnected = account.status === "disconnected";
  const isWrongNetwork = !chains.find((item) => item.id === account.chainId);

  return (
    <>
      <div
        className={twMerge(
          "hidden flex-col gap-6 md:flex",
          show || isBetted || isLocked ? "flex" : "",
        )}
      >
        {!isBetted && (
          <>
            <InputPanel
              amount={betAmount}
              onChange={setBetAmount}
              balance={balance}
              isDisabled={isDisconnected || isWrongNetwork || !!isLocked}
            />

            <ClaimPanel
              claimableBalance={claimableBalance}
              isClaim={isUseClaimableBalance}
              onChange={handleToggleIsUseClaimableBalance}
              isDisabled={isDisconnected || isWrongNetwork || !!isLocked}
            />
          </>
        )}

        <div className="flex flex-col gap-3.5">
          {!isBetted && !isLocked && (
            <BetPanel
              isUseClaimableBalance={isUseClaimableBalance}
              amount={
                Number.isNaN(betAmount)
                  ? 0n
                  : BigInt(Math.floor(+betAmount * precision))
              }
              minBetAmount={Number(minBetAmount) / precision}
              disabledBy={disabledBy}
              onChangeAmount={setBetAmount}
              isDisconnected={isDisconnected}
              isWrongNetwork={isWrongNetwork}
            />
          )}

          {isBetted ? (
            <YouBetted
              betAmount={Number(betInfo.amount)}
              betType={betInfo.position === 0 ? "up" : "down"}
            />
          ) : (
            isLocked && <RoundLocked />
          )}

          <span className="text-center text-xs font-medium leading-[18px] text-[#aaaaaa] lg:text-lg">
            Once entered, your position cannot be changed or removed.
          </span>
        </div>
      </div>

      <PredictionButton
        color="green"
        className={twMerge(
          "md:hidden",
          show || isBetted || isLocked ? "hidden" : "",
        )}
        onClick={() => setShow(true)}
      >
        Participate in this round
      </PredictionButton>
    </>
  );
}
