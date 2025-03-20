import Image from "next/image";
import { twMerge } from "tailwind-merge";

import BaseCard from "@/components/cards/BaseCard/BaseCard";
import { AnimatedNumber } from "@/components/animations/AnimatedNumber";

import {
  BadgeType,
  borderClass,
  containedClasses,
} from "../components/PayoutBadge";

import crownSrc from "@/assets/icons/crown.svg";

export type YouBettedProps = {
  betAmount: number;
  betType: "up" | "down";
};

export function YouBetted({ betAmount, betType }: YouBettedProps) {
  return (
    <BaseCard
      classNames={{
        base: "border-2 rounded-[14px] bg-transparent border-[#ffb700] py-11 md:py-8 justify-center items-center h-[270px] relative overflow-visible mt-[30px] gap-6",
      }}
    >
      <Image
        src={crownSrc}
        alt="crown"
        className="absolute -top-2 left-1/2 z-20 h-[52px] w-[64px] -translate-x-1/2 -translate-y-1/2"
      />
      <div className="absolute left-1/2 top-0 z-10 h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFCC00] blur-[30px]" />

      <div className="text-center text-xl font-bold leading-[30px] text-white">
        Your Bet
      </div>
      <div className="flex items-center justify-center gap-3.5 text-5xl font-black text-[#ffb700] md:text-[64px]">
        <AnimatedNumber value={betAmount} duration={500} /> BTC
      </div>
      <div
        className={twMerge(
          "2xl:text-baserounded-full flex h-[26px] min-w-[137px] items-center justify-center gap-[6px] rounded-full border px-10 py-1 text-center text-base font-bold capitalize leading-[18px] text-white shadow 2xl:h-[38px]",
          containedClasses,
          borderClass.contained[betType as BadgeType].default,
        )}
      >
        {`${betType} Entered`}
      </div>
    </BaseCard>
  );
}
