"use client";

import { Address } from "viem";
import { useAccount, useReadContract, useBalance } from "wagmi";

import { tizzContractAddresses } from "@/utils/tizz";
import { TizzPredictionAbi } from "@/abis/Tizz/TizzPrediction";

export function useGetPredictionBalance() {
  const { address } = useAccount();

  const { data: balanceData } = useBalance({
    address,
    query: {
      refetchInterval: 5000,
    },
  });

  const { data: claimableData, refetch: refetchClaimableBalance } =
    useReadContract({
      address: tizzContractAddresses.tizzPrediction as Address,
      abi: TizzPredictionAbi,
      functionName: "claimableAmount",
      args: address ? [address] : undefined,
      query: {
        refetchInterval: 5000,
      },
    });

  const precision =
    balanceData !== undefined ? Math.pow(10, balanceData.decimals) : 1e8;
  const balance =
    balanceData !== undefined ? Number(balanceData.value) / precision : 0;
  const claimableBalance =
    claimableData !== undefined ? Number(claimableData) / precision : 0;

  return {
    precision,
    balance,
    claimableBalance,
    refetchClaimableBalance,
  };
}
