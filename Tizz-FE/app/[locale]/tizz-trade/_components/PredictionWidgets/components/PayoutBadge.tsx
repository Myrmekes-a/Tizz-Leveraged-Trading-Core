import { twMerge } from "tailwind-merge";

import CircleArrowUpIcon from "@/components/icons/arrow/CircleArrowUpIcon";
import { AnimatedNumber } from "@/components/animations/AnimatedNumber";

export type BadgeType = "up" | "down";
type VariantType = "outlined" | "contained";

export const containedClasses =
  "relative z-10 overflow-hidden border-none before:absolute before:w-[200%] before:h-[5px] before:-z-10 before:animate-[rotate_3s_linear_infinite] before:content-[''] after:absolute after:inset-[1px] after:rounded-full after:-z-10 after:content-['']";

export const borderClass: Record<
  VariantType,
  Record<BadgeType, { default: string; disabled: string }>
> = {
  contained: {
    up: {
      default:
        "before:bg-[#35f9bb] bg-[#35f9bba9] after:bg-gradient-to-b after:from-[#4caf50] after:to-[#246a54]",
      disabled: "border-none bg-[#032C1B] after:hidden",
    },
    down: {
      default:
        "before:bg-[#f93636] bg-[#f93636a9] after:bg-gradient-to-b after:from-[#ff6767] after:to-[#993d3d]",
      disabled: "border-none bg-[#420F0B] after:hidden",
    },
  },
  outlined: {
    up: {
      default: "border-[#4caf50]",
      disabled: "border-[#003921]",
    },
    down: {
      default: "border-[#f93636]",
      disabled: "border-[#4C0C07]",
    },
  },
};

const colorClass: Record<
  VariantType,
  Record<BadgeType, { default: string; disabled: string }>
> = {
  contained: {
    up: {
      default: "text-white",
      disabled: "text-[#AAAAAA]",
    },
    down: {
      default: "text-white",
      disabled: "text-[#AAAAAA]",
    },
  },
  outlined: {
    up: {
      default: "text-[#4caf50]",
      disabled: "text-[#003921]",
    },
    down: {
      default: "text-[#f93636]",
      disabled: "text-[#4C0C07]",
    },
  },
};

export type PayoutBadgeProps = {
  variant: VariantType;
  isDisabled?: boolean;
  badgetType: BadgeType;
  payout: number;
  className?: string;
};

export function PayoutBadge({
  variant,
  isDisabled,
  payout,
  badgetType,
  className,
}: PayoutBadgeProps) {
  return (
    <div
      className={twMerge(
        "flex h-[26px] min-w-[110px] items-center justify-center gap-[6px] rounded-full border text-xs font-medium leading-[18px] text-white shadow lg:min-w-[183px] xl:h-[38px] xl:text-base",
        variant === "contained" && !isDisabled && containedClasses,
        isDisabled
          ? borderClass[variant][badgetType].disabled
          : borderClass[variant][badgetType].default,
        isDisabled
          ? colorClass[variant][badgetType].disabled
          : colorClass[variant][badgetType].default,
        badgetType === "down" && "flex-row-reverse",
        className,
      )}
    >
      <span className="xl:hidden">
        <CircleArrowUpIcon
          size={14}
          width={14}
          height={14}
          className={twMerge(
            isDisabled
              ? colorClass[variant][badgetType].default
              : colorClass[variant][badgetType].default,
            badgetType === "up" ? "" : "rotate-180",
          )}
        />
      </span>
      <span className="hidden xl:inline-block">
        <CircleArrowUpIcon
          width={18}
          height={18}
          size={14}
          className={twMerge(
            isDisabled
              ? colorClass[variant][badgetType].disabled
              : colorClass[variant][badgetType].default,
            badgetType === "up" ? "" : "rotate-180",
          )}
        />
      </span>

      <span>
        <AnimatedNumber value={payout} duration={500} fixed={2} />x Payout
      </span>
    </div>
  );
}
