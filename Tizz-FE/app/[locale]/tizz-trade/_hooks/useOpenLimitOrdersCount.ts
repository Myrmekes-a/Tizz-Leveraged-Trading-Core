"use client";

import { useCallback } from "react";
import { PairIndex } from "@tizz-hive/sdk";
import { Address } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { CollateralTypes } from "@tizz-hive/sdk";

import { useQueryClient } from "@tanstack/react-query";

import { tizzContractAddresses } from "@/utils/tizz";
import { TizzTradingStorageAbi } from "@/abis/Tizz/TizzTradingStorage";

export function useOpenLimitOrdersCount(
  pairIndex: PairIndex,
  collateralType: CollateralTypes,
) {
  const account = useAccount();

  const queryClient = useQueryClient();

  const { data, queryKey } = useReadContract({
    address: tizzContractAddresses[collateralType]
      .tizzTradingStorage as Address,
    abi: TizzTradingStorageAbi,
    functionName: "openLimitOrdersCount",
    args: account.address ? [account.address, BigInt(pairIndex)] : undefined,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { count: data !== undefined ? Number(data) : 0, invalidate };
}
