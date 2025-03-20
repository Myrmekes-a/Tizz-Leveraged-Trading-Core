"use client";

import { Button } from "@nextui-org/react";
import ReactLoading from "react-loading";
import { useAccount } from "wagmi";
import { twMerge } from "tailwind-merge";
import { useSnackbar } from "notistack";
import { CollateralTypes } from "@tizz-hive/sdk";

import { tizzContractAddresses } from "@/utils/tizz";
import { Address, maxInt256 } from "viem";
import { useTranslations } from "next-intl";

import { useApprove } from "@/tizz-trade-hooks/useApprove";
import { useCallback } from "react";

type DepositButtonProps = {
  depositAmount: number;
  PRECISION: number;
  onClick(): void;
  disabled?: boolean;
  isLoading?: boolean;
  collateralType: CollateralTypes;
};

export function DepositButton({
  depositAmount,
  PRECISION,
  onClick,
  disabled,
  isLoading,
  collateralType,
}: DepositButtonProps) {
  const t = useTranslations("Trade-VaultDepositCard");
  const { enqueueSnackbar } = useSnackbar();

  const account = useAccount();

  const {
    isLoading: isApproveLoading,
    isOpenedWalletProvider,
    allowance,
    approve,
    waitingForTransactionReceipt,
  } = useApprove({
    owner: account.address,
    spender: tizzContractAddresses[collateralType].tizzToken as Address,
    erc20Address: tizzContractAddresses[collateralType]
      .tizzBaseToken as Address,
    onError() {
      enqueueSnackbar("Failed at Approve", {
        autoHideDuration: 5000,
        variant: "error",
      });
    },
  });

  const handleApprove = useCallback(() => {
    approve(maxInt256);
  }, [approve]);

  const approved =
    allowance && allowance > BigInt(Math.floor(depositAmount * PRECISION));
  const isDisabled = disabled || allowance === undefined;

  if (
    isOpenedWalletProvider ||
    isLoading ||
    isApproveLoading ||
    waitingForTransactionReceipt
  ) {
    return (
      <Button
        disabled
        radius="md"
        className="h-9 bg-neutral-800 px-4 py-2.5 text-base text-black"
        fullWidth
      >
        <ReactLoading type={"bubbles"} color={"#d1d1d1"} />
      </Button>
    );
  }

  if (approved) {
    return (
      <Button
        onClick={onClick}
        isDisabled={isDisabled}
        radius="md"
        className={twMerge(
          "h-9 px-4 py-2.5 text-base text-black",
          isDisabled ? "bg-neutral-800" : "bg-amber-300",
        )}
        fullWidth
      >
        {t("deposit")}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleApprove}
      radius="md"
      className={twMerge("h-9 bg-amber-300 px-4 py-2.5 text-base text-black")}
      fullWidth
    >
      {t("approve")}
    </Button>
  );
}
