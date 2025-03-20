import { BetInfoFragment } from "@/gql/graphql";
import { twMerge } from "tailwind-merge";

export function BettedBadge({ betInfo }: { betInfo?: BetInfoFragment | null }) {
  const label = betInfo
    ? `You bet ${betInfo.amount} BTC on ${betInfo.position === 0 ? "Up" : "Down"}`
    : "No bet entered";

  const borderRadiusClasses =
    betInfo?.position === 1 ? "rounded-t-full" : "rounded-b-full";
  const bgClasses = betInfo
    ? betInfo.position === 0
      ? "bg-[#027A48]"
      : "bg-[#b42318]"
    : "bg-[#1E1E27]";
  const positionClasses = betInfo?.position === 1 ? "bottom-0" : "top-0";

  return (
    <div
      className={twMerge(
        "absolute left-1/2 z-40 w-full max-w-[300px] -translate-x-1/2 text-nowrap py-0.5 text-center text-base font-semibold text-white xl:w-full xl:max-w-[500px]",
        borderRadiusClasses,
        bgClasses,
        positionClasses,
      )}
    >
      {label}
    </div>
  );
}
