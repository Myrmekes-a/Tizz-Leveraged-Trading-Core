import { twMerge } from "tailwind-merge";

import ChartIcon from "@/components/icons/ChartIcon";
import { AnimatedNumber } from "@/components/animations/AnimatedNumber";

const classNameByType = {
  bull: "border-[#24e4a4] bg-[#24e4a4]/20 text-[#24e4a4]",
  bear: "border-[#EA3A3D] bg-[#EA3A3D]/20 text-[#EA3A3D]",
};

export type ChangeRateBadgeProps = {
  rate: number;
  className?: string;
};

export function ChangeRateBadge({ rate, className }: ChangeRateBadgeProps) {
  return (
    <div
      className={twMerge(
        "flex min-w-[100px] items-center justify-center gap-1.5 rounded-full border px-2 text-base font-bold leading-[24px] md:text-sm lg:text-[22px]",
        rate >= 0 ? classNameByType.bull : classNameByType.bear,
        className,
      )}
    >
      <ChartIcon
        size={12}
        width={20}
        height={14}
        style={
          rate >= 0
            ? {
                color: "#24e4a4",
              }
            : {
                transform: "rotateX(180deg)",
                color: "#EA3A3D",
              }
        }
      />
      <AnimatedNumber value={rate} duration={500} fixed={3} />%
    </div>
  );
}
