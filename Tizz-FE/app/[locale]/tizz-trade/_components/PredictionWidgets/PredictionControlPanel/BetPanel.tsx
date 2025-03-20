"use client";

import { useState } from "react";
import { useSnackbar } from "notistack";
import { Tooltip } from "@nextui-org/react";
import { useConfig, useWriteContract } from "wagmi";
import { Address } from "viem";
import {
  waitForTransactionReceipt,
  WaitForTransactionReceiptErrorType,
} from "@wagmi/core";

import { tizzContractAddresses } from "@/utils/tizz";
import { TizzPredictionAbi } from "@/abis/Tizz/TizzPrediction";

import ArrowDownIcon from "@/components/icons/arrow/ArrowDownIcon";

import PredictionButton from "@/components/buttons/PredictionButton/PredictionButton";
import { useGetPredictionBalance } from "@/tizz-trade-hooks/prediction/useGetPredictionBalance";
import HexWarningIcon from "@/components/icons/content/HexWarningIcon";

export type BetPanelProps = {
  isUseClaimableBalance: boolean;
  amount: bigint;
  minBetAmount: number;
  disabledBy: string;
  onChangeAmount(value: string): void;
  isWrongNetwork?: boolean;
  isDisconnected?: boolean;
};

export function BetPanel({
  isUseClaimableBalance,
  amount,
  minBetAmount,
  disabledBy,
  onChangeAmount,
  isWrongNetwork,
  isDisconnected,
}: BetPanelProps) {
  const { enqueueSnackbar } = useSnackbar();

  const { refetchClaimableBalance } = useGetPredictionBalance();

  const { writeContract } = useWriteContract();

  const [waitingForBetBearTx, setWaitingForBetBearTx] = useState(false);
  const [waitingForBetBullTx, setWaitingForBetBullTx] = useState(false);

  const config = useConfig();

  const handleBetBear = () => {
    setWaitingForBetBearTx(true);

    writeContract(
      {
        abi: TizzPredictionAbi,
        address: tizzContractAddresses.tizzPrediction as Address,
        functionName: "betBear",
        args: [isUseClaimableBalance],
        value: amount,
      },
      {
        onError: (err) => {
          setWaitingForBetBearTx(false);

          console.log("Failed at Bet Bear: ", Object.entries(err));

          enqueueSnackbar("Failed at Bet Bear", {
            autoHideDuration: 5000,
            variant: "error",
          });
        },
        onSuccess: async (hash) => {
          try {
            await waitForTransactionReceipt(config, {
              hash,
            });
          } catch (err) {
            console.log(
              "Reverted at Bet Bear: ",
              Object.entries(err as WaitForTransactionReceiptErrorType),
            );
          }

          setWaitingForBetBearTx(false);
          onChangeAmount(`${minBetAmount}`);
          refetchClaimableBalance();
        },
      },
    );
  };

  const handleBetBull = () => {
    setWaitingForBetBullTx(true);

    writeContract(
      {
        abi: TizzPredictionAbi,
        address: tizzContractAddresses.tizzPrediction as Address,
        functionName: "betBull",
        args: [isUseClaimableBalance],
        value: amount,
      },
      {
        onError: (err) => {
          setWaitingForBetBullTx(false);
          console.log("Failed at Bet Bull: ", Object.entries(err));

          enqueueSnackbar("Failed at Bet Bull", {
            autoHideDuration: 5000,
            variant: "error",
          });
        },
        onSuccess: async (hash) => {
          try {
            await waitForTransactionReceipt(config, {
              hash,
            });
          } catch (err) {
            console.log(
              "Reverted at Bet Bull: ",
              Object.entries(err as WaitForTransactionReceiptErrorType),
            );
          }

          setWaitingForBetBullTx(false);
          onChangeAmount(`${minBetAmount}`);
          refetchClaimableBalance();
        },
      },
    );
  };

  if (isDisconnected) {
    return (
      <div className="flex w-full items-center justify-center rounded-md border border-[#FF6767] px-3 py-2 text-lg font-bold leading-7 text-[#FF6767]">
        Wallet Not Connected
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-md border border-red-600 px-3 py-2 text-lg font-bold leading-7 text-red-600">
        <HexWarningIcon size={20} className="text-red-600" />
        <span>Wrong Network</span>
      </div>
    );
  }

  return (
    <Tooltip
      placement="top"
      radius="sm"
      content={disabledBy}
      delay={1000}
      offset={10}
      color="danger"
      classNames={{
        base: "max-w-[300px]",
      }}
      isDisabled={disabledBy.trim() === ""}
    >
      <div className="flex w-full flex-col gap-2.5 md:flex-row">
        <PredictionButton
          className="w-full"
          color="green"
          isDisabled={disabledBy.trim() !== "" || waitingForBetBearTx}
          isLoading={waitingForBetBullTx}
          onClick={handleBetBull}
        >
          <ArrowDownIcon
            size={20}
            width={24}
            height={24}
            className="rotate-180"
          />
          Enter Up
        </PredictionButton>
        <PredictionButton
          className="w-full"
          color="red"
          isDisabled={disabledBy.trim() !== "" || waitingForBetBullTx}
          isLoading={waitingForBetBearTx}
          onClick={handleBetBear}
        >
          Enter Down <ArrowDownIcon size={20} width={24} height={24} />
        </PredictionButton>
      </div>
    </Tooltip>
  );
}
