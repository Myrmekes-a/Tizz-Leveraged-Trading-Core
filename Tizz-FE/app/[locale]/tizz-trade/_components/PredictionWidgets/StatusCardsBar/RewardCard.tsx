"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, useDisclosure } from "@nextui-org/react";
import { useSnackbar } from "notistack";
import { useConfig, useWriteContract } from "wagmi";
import { Address } from "viem";
import {
  waitForTransactionReceipt,
  WaitForTransactionReceiptErrorType,
} from "@wagmi/core";

import { tizzContractAddresses } from "@/utils/tizz";
import { TizzPredictionAbi } from "@/abis/Tizz/TizzPrediction";

import BaseCard from "@/components/cards/BaseCard/BaseCard";
import BubbleLoader from "@/components/loaders/BubbleLoader";

import rewardSrc from "@/assets/icons/reward-icon.svg";
import { ClaimingWinningsModal } from "./ClaimingWinningsModal";
import { getPriceStr } from "@/utils/price";

export function RewardCard({
  rewards,
  refetchClaimableBalance,
}: {
  rewards: number;
  refetchClaimableBalance(): void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const config = useConfig();
  const { writeContract } = useWriteContract();

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const [waitingForClaimTx, setWaitingForClaimTx] = useState(false);

  const handleClaim = () => {
    setWaitingForClaimTx(true);
    onOpen();

    writeContract(
      {
        abi: TizzPredictionAbi,
        address: tizzContractAddresses.tizzPrediction as Address,
        functionName: "claimRewards",
      },
      {
        onError: (err) => {
          setWaitingForClaimTx(false);

          console.log("Failed at claim rewards: ", Object.entries(err));

          enqueueSnackbar("Failed at claim rewards", {
            autoHideDuration: 5000,
            variant: "error",
          });

          onClose();
        },
        onSuccess: async (hash) => {
          try {
            await waitForTransactionReceipt(config, {
              hash,
            });
          } catch (err) {
            console.log(
              "Reverted at claim rewards: ",
              Object.entries(err as WaitForTransactionReceiptErrorType),
            );
          }

          setWaitingForClaimTx(false);
          refetchClaimableBalance();

          onClose();
        },
      },
    );
  };

  return (
    <BaseCard
      classNames={{
        base: "py-6 shrink-0 px-3.5 h-[118px] min-w-[300px] w-fit rounded-lg gap-6 items-center flex-row border-[#282834] border-b-2 border-b-[#ffb700] bg-gradient-to-b from-[#14141a] to-[#4f401a]",
      }}
    >
      <div className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-xl border border-[#282834] bg-[#1e1e2730]">
        <Image
          src={rewardSrc}
          className="w-[70px] object-cover"
          alt="zentoshi"
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-base font-bold text-white">Rewards</span>
        <div className="flex w-fit min-w-[217px] items-center justify-between gap-3.5">
          <span className="text-nowrap text-3xl font-bold leading-[38px] text-[#ffcc00]">
            {getPriceStr(rewards)} BTC
          </span>

          <Button
            onClick={handleClaim}
            className="flex h-9 rounded-md border border-[#ffcc00] bg-gradient-to-r from-[#ffb700] via-[#ffb700] to-[#ff7b00] px-6 py-2 text-sm font-bold leading-tight text-black"
            isDisabled={rewards === 0}
          >
            {waitingForClaimTx ? (
              <BubbleLoader color="rgb(55 41 14)" />
            ) : (
              "Claim"
            )}
          </Button>
        </div>
      </div>

      <ClaimingWinningsModal
        onClose={onClose}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        claimableBalance={rewards}
      />
    </BaseCard>
  );
}
