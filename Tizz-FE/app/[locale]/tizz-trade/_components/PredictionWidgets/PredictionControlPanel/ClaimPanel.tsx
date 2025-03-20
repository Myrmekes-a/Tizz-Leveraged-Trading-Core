import BaseSwitch from "@/components/switchs/BaseSwitch/BaseSwitch";
import ClaimIcon from "@/components/icons/ClaimIcon";
import { twMerge } from "tailwind-merge";

export type ClaimPanelProps = {
  claimableBalance: number;
  isClaim: boolean;
  isDisabled?: boolean;
  onChange(isClaim: boolean): void;
};

export function ClaimPanel({
  claimableBalance,
  isClaim,
  isDisabled,
  onChange,
}: ClaimPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full items-center justify-between gap-10">
        <span
          className={twMerge(
            "text-lg font-bold leading-7 text-[#ffcc00] lg:text-xl",
            (claimableBalance === 0 || isDisabled) && "text-gray-400",
          )}
        >
          User Claimable
        </span>
        <BaseSwitch
          label="Use Claim"
          isSelected={isClaim && claimableBalance > 0}
          isDisabled={claimableBalance === 0 || isDisabled}
          setIsSelected={onChange}
        />
      </div>
      <div className="flex items-center gap-[5px] text-[#9494a8]">
        <ClaimIcon size={18} width={18} height={18} />
        <span className="text-sm font-medium leading-tight lg:text-base">
          Claimable Balance:{" "}
          <span className="text-nowrap">{claimableBalance} BTC</span>
        </span>
      </div>
    </div>
  );
}
