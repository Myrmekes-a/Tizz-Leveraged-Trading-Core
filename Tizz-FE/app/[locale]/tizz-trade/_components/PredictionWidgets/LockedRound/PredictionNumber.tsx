import Image from "next/image";

import guildGroupSrc from "@/assets/icons/guildgroup.svg";
import { twMerge } from "tailwind-merge";

export function PredictionNumber({
  epoch,
  isSkipped,
}: {
  epoch: number;
  isSkipped?: boolean;
}) {
  return (
    <div
      className={twMerge(
        "relative flex h-6 items-center justify-center rounded-full border border-[#6f3428] bg-[#26100d] pl-[30px] pr-[10px] text-base font-bold lg:h-[30px] lg:w-[130px] lg:pr-[30px] lg:text-[20px] 2xl:h-[36px] 2xl:w-[170px] 2xl:pr-[30px] 2xl:text-[26px]",
        isSkipped ? "text-[#ed3c01]" : "text-[#ffcc00]",
      )}
    >
      <Image
        src={guildGroupSrc}
        className="absolute -bottom-[3px] -left-1 h-[30px] w-[27px] xl:-bottom-2 xl:-left-3 xl:h-[40px] xl:w-[40px] 2xl:-left-6 2xl:h-[56px] 2xl:w-[50px]"
        alt="beehive"
      />
      #{epoch}
    </div>
  );
}
