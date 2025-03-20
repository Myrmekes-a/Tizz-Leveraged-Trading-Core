import { Header } from "./Header";
import { PayoutBadge } from "../components/PayoutBadge";

import { AnimatedNumber } from "@/components/animations/AnimatedNumber";

export type NextRoundPredictionProps = {
  epoch: number;
  currentPrice: number;
  prizePool: number;
  upPayoud: number;
  downPayout: number;
  remainMillSec: number;
};

export function NextRoundPrediction({
  epoch,
  currentPrice,
  prizePool,
  upPayoud,
  downPayout,
  remainMillSec,
}: NextRoundPredictionProps) {
  const prizeItems = [
    {
      label: "Prize Value",
      value: (
        <>
          $
          <AnimatedNumber
            value={currentPrice * prizePool}
            duration={500}
            fixed={2}
          />
        </>
      ),
    },
    {
      label: "Prize Pool",
      value: (
        <>
          <AnimatedNumber value={prizePool} duration={500} /> BTC
        </>
      ),
    },
  ];

  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#282834]">
      <Header epoch={epoch} remainMillSec={remainMillSec} />

      <div className="flex w-full flex-col items-center gap-6 bg-gradient-to-r from-[#16161d] to-[#2b2b37] px-3 py-6 lg:px-6">
        <div className="flex items-center gap-7">
          {prizeItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-3.5"
            >
              <span className="text-nowrap text-lg font-bold leading-7 text-white">
                {item.label}
              </span>
              <span className="text-nowrap text-3xl font-black leading-[38px] text-[#ffcc00] lg:text-4xl">
                {item.value}
              </span>
            </div>
          ))}
        </div>
        <div className="flex w-full items-center gap-2.5">
          <PayoutBadge
            variant="outlined"
            payout={upPayoud}
            className="w-full"
            badgetType="up"
          />
          <PayoutBadge
            variant="outlined"
            payout={downPayout}
            className="w-full"
            badgetType="down"
          />
        </div>
      </div>
    </div>
  );
}
