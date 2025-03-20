"use client";

import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { useAccount } from "wagmi";

import { getPriceStr } from "@/utils/price";

import hexabg1 from "@/assets/images/hexabg1.svg";

import { PredictionTimer } from "./PredictionTimer";
import { PredictionStatus } from "./PredictionStatus";
import { PredictionNumber } from "./PredictionNumber";
import { PrizeList } from "./PrizeList";
import { LockedRoundSkeleton } from "./LockedRoundSkeleton";
import { BettedBadge } from "./BettedBadge";

import { useGetPredictionRound } from "@/tizz-trade-hooks/prediction/useGetPredictionRound";
import { useGetUserRoundBetInfo } from "@/tizz-trade-hooks/prediction/useGetPredictionUserRoundBetInfo";

import { useState } from "react";

const bgColor = {
  bull: "bg-[#03ff0d]",
  bear: "bg-[#FF0303]",
};

export type LockedRoundProps = {
  currentTimestamp: number;
  currentPrice: number;
  epoch: number;
  bufferSeconds: number;
};

export function LockedRound({
  currentTimestamp,
  currentPrice,
  epoch,
  bufferSeconds,
}: LockedRoundProps) {
  const { address } = useAccount();

  const lockedRound = useGetPredictionRound(epoch);
  const betInfo = useGetUserRoundBetInfo(address, lockedRound?.epoch);

  const [loadedBG, setLoadedBg] = useState(false);

  if (!lockedRound) {
    return <LockedRoundSkeleton />;
  }

  const lockedPrice = lockedRound.lock_price
    ? lockedRound.lock_price / 1e8
    : currentPrice;

  const changeRate = ((currentPrice - lockedPrice) / lockedPrice) * 100;

  const prizeItems = [
    {
      label: "Locked Price",
      value: `$${getPriceStr(lockedPrice, 2)}`,
    },
    {
      label: "Prize Pool",
      value: `${getPriceStr(Number(lockedRound.total_bet_amount))} BTC`,
    },
  ];

  const isCalculatingRound =
    lockedRound.lock_price === null &&
    currentTimestamp < (lockedRound.locked_at + bufferSeconds) * 1000;

  const isSkipped = lockedRound.lock_price === null && !isCalculatingRound;

  return (
    <div
      className={twMerge(
        "relative flex min-h-[400px] w-full flex-col items-center justify-center gap-[40px] overflow-hidden rounded-[14px]  bg-gradient-to-bl via-[#282834] to-[#282834] py-[80px] md:py-6",
        isSkipped
          ? "from-[#282834]  "
          : changeRate >= 0
            ? "from-[#0AAE11]"
            : "from-[#FF0303]",
      )}
    >
      <div className="absolute left-[1px] top-[1px] h-[calc(100%-2px)] w-[calc(100%-2px)] rounded-[14px] bg-[#1E1E27]" />

      <div
        className={twMerge(
          "absolute bottom-0 left-0 h-[150px] w-[150px] animate-pulse rounded-full blur-[40px] 2xl:h-[300px] 2xl:w-[300px] 2xl:blur-[80px]",
          (isSkipped || isCalculatingRound || !loadedBG) && "hidden",
          changeRate >= 0 ? bgColor.bull : bgColor.bear,
        )}
      />

      <div
        className={twMerge(
          "absolute right-0 top-0 h-[200px] w-[200px] animate-pulse rounded-full blur-[40px] 2xl:h-[300px] 2xl:w-[300px] 2xl:blur-[80px]",
          (isSkipped || isCalculatingRound || !loadedBG) && "hidden",
          changeRate >= 0 ? bgColor.bull : bgColor.bear,
        )}
      />

      <Image
        src={hexabg1}
        className={twMerge(
          "absolute left-[1px] top-[1px] h-[calc(100%-2px)] w-[calc(100%-2px)] rounded-[14px] object-cover",
        )}
        onLoad={() => setLoadedBg(true)}
        alt="bg"
      />

      <BettedBadge betInfo={betInfo} />

      <div className="z-10 flex items-center gap-3 lg:gap-[40px] 2xl:gap-[66px]">
        <PredictionTimer
          isSkipped={isSkipped}
          remainSec={Math.floor(lockedRound.ended_at - currentTimestamp / 1000)}
        />
        <PredictionStatus status={isSkipped ? "skipped" : "live"} />
        <PredictionNumber epoch={lockedRound.epoch} isSkipped={isSkipped} />
      </div>

      <PrizeList
        price={currentPrice}
        upPayout={
          Number(lockedRound.bull_bet_amount)
            ? Number(lockedRound.total_bet_amount) /
              Number(lockedRound.bull_bet_amount)
            : 0
        }
        downPayout={
          Number(lockedRound.bear_bet_amount)
            ? Number(lockedRound.total_bet_amount) /
              Number(lockedRound.bear_bet_amount)
            : 0
        }
        changeRate={changeRate}
        isCalculatingRound={isCalculatingRound}
        isSkipped={isSkipped}
      />

      {isSkipped ? (
        <p className="z-10 px-6 text-center text-base text-[#aaa] lg:max-w-[600px] xl:max-w-[700px] xl:text-xl 2xl:max-w-full">
          This round is locked and was not executed due to insufficient bets.
          Bets can be made on the next round.
        </p>
      ) : (
        <div className="z-10 flex items-center gap-6 lg:gap-10">
          {prizeItems.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <span className="text-center text-base font-medium leading-snug text-[#aaaaaa] lg:text-lg">
                {item.label}
              </span>
              <span className="text-2xl font-bold leading-loose text-[#ffcc00] lg:text-[33px]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
