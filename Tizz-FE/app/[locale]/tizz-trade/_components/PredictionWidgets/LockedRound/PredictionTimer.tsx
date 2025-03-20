import Image from "next/image";
import { twMerge } from "tailwind-merge";

import { convertMinAndSec } from "@/utils/price";

import clockSrc from "@/assets/icons/clock.svg";

export function PredictionTimer({
  remainSec,
  isSkipped,
}: {
  remainSec: number;
  isSkipped?: boolean;
}) {
  return (
    <div
      className={twMerge(
        "relative flex h-6 items-center justify-center rounded-full border border-[#6f3428] bg-[#26100d] pl-7 pr-3 text-base font-bold lg:h-[30px] lg:w-[130px] lg:px-5 lg:text-[20px] 2xl:h-[36px] 2xl:w-[170px] 2xl:px-10 2xl:text-[26px]",
        isSkipped ? "text-[#ed3c01]" : "text-prediction-yellow",
      )}
    >
      <Image
        src={clockSrc}
        className="absolute -bottom-[1px] -left-[1px] h-[34px] w-[25px] xl:h-[40px] xl:w-[30px] 2xl:h-[46px] 2xl:w-[35px]"
        alt="clock"
      />
      {convertMinAndSec(remainSec)}
    </div>
  );
}
