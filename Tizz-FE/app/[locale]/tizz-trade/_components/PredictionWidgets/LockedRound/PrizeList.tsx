"use client";

import Image from "next/image";

import { AnimatedNumber } from "@/components/animations/AnimatedNumber";

import { PayoutBadge } from "../components/PayoutBadge";
import { ChangeRateBadge } from "../components/ChangeRateBadge";

import beehiveRideSrc from "@/assets/images/zentoshi/beehive-ride.gif";
import beehiveBearSrc from "@/assets/images/zentoshi/Bull_Ride.gif";

import tizzNewPose1Src from "@/assets/images/zentoshi/tizz-new-pose-1.svg";
import polygonSrc from "@/assets/images/shape/polygon.svg";

export type PrizeListProps = {
  price: number;
  upPayout: number;
  downPayout: number;
  changeRate: number;
  isCalculatingRound: boolean;
  isSkipped?: boolean;
};

export function PrizeList({
  price,
  upPayout,
  downPayout,
  changeRate,
  isCalculatingRound,
  isSkipped,
}: PrizeListProps) {
  if (isSkipped) {
    return (
      <div className="z-20 flex flex-col items-center gap-[15px] 2xl:gap-[30px]">
        <div className="relative h-[156px] w-[156px]">
          <Image
            src={polygonSrc}
            className="absolute left-1/2 top-1/2 w-[156px] -translate-x-1/2 -translate-y-1/2"
            alt="hexagon"
          />
          <Image
            src={tizzNewPose1Src}
            className="absolute left-1/2 top-1/2 w-[114px] -translate-x-1/2 -translate-y-1/2"
            alt="zentoshi"
          />
        </div>
        <AnimatedNumber
          className="text-center text-5xl font-bold leading-[60px] text-[#ffcc00] md:text-4xl lg:text-[60px] 2xl:text-[88px]"
          value={price}
          duration={500}
          fixed={3}
        />

        <div className="h-[70px]" />
      </div>
    );
  }

  return (
    <div className="relative z-20 flex flex-col items-center gap-6 2xl:gap-[50px]">
      <div className="flex flex-col items-center gap-3.5 2xl:gap-10">
        <h6 className="text-center text-2xl font-black leading-loose text-white 2xl:text-3xl 2xl:leading-[38px]">
          Round Info
        </h6>
        <div className="flex items-center justify-start gap-2.5">
          <AnimatedNumber
            className="text-center text-5xl font-bold leading-[60px] text-[#ffcc00] md:text-4xl lg:text-[60px]  2xl:text-[88px]"
            value={price}
            duration={500}
            fixed={3}
          />

          <ChangeRateBadge rate={changeRate} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <PayoutBadge
          variant="contained"
          isDisabled={changeRate < 0}
          payout={upPayout}
          badgetType="up"
        />
        <PayoutBadge
          variant="contained"
          isDisabled={changeRate > 0}
          payout={downPayout}
          badgetType="down"
        />
      </div>

      {isCalculatingRound && (
        <div className="absolute z-30 flex max-h-[340px] max-w-[500px] flex-col items-center gap-10 rounded-[14px] border border-[#444] bg-[#1e1e27] px-[50px] py-[25px] md:px-[100px] md:py-[50px]">
          <p className="text-center text-xl font-bold">Calculating Round...</p>
          {changeRate >= 0 ? (
            <Image
              src={beehiveRideSrc}
              className="w-[120px] md:w-[182px]"
              alt="bull zentoshi"
            />
          ) : (
            <Image
              src={beehiveBearSrc}
              className="w-[120px] md:w-[182px]"
              alt="bear zentoshi"
            />
          )}
        </div>
      )}
    </div>
  );
}
