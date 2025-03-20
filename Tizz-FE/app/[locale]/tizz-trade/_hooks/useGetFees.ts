import { Fee } from "@tizz-hive/sdk";
import { Address } from "viem";
import { useReadContracts } from "wagmi";
import { CollateralTypes } from "@tizz-hive/sdk";

import { tizzContractAddresses } from "@/utils/tizz";
import { TizzFundingFeesAbi } from "@/abis/Tizz/TizzFundingFees";
import { TizzMultiCollatDiamondAbi } from "@/abis/Tizz/TizzMultiCollatDiamond";
import { TizzFrontendInfoAggregatorAbi } from "@/abis/Tizz/TizzFrontendInfoAggregator";
import { useDelayedUpdate } from "./useDelayedUpdate";

export type UseGetFeesProps = {
  input?: {
    trader: Address;
    pairIndex: number;
    index: number;
    long: boolean;
    leverage: number;
    positionBaseAsset: number;
    fee: Fee;
  };
  collateralType: CollateralTypes;
};

export function useGetFees({ input, collateralType }: UseGetFeesProps) {
  const { data, status } = useReadContracts({
    contracts: [
      {
        address: tizzContractAddresses[collateralType]
          .tizzFundingRate as Address,
        abi: TizzFundingFeesAbi,
        functionName: "getTradeFundingFee",
        args: input
          ? [
              {
                trader: input.trader,
                pairIndex: BigInt(input.pairIndex),
                index: BigInt(input.index),
                long: input.long,
                collateral: BigInt(Math.floor(input.positionBaseAsset)),
                leverage: BigInt(input.leverage),
              },
            ]
          : undefined,
      },
      {
        address: tizzContractAddresses.global.tizzMultiCollatDiamond as Address,
        abi: TizzMultiCollatDiamondAbi,
        functionName: "calculateFeeAmount",
        args: input
          ? [
              input.trader,
              BigInt(
                Math.floor(
                  input.positionBaseAsset * input.leverage * input.fee.openFeeP,
                ),
              ),
            ]
          : undefined,
      },
      {
        address: tizzContractAddresses.global.tizzMultiCollatDiamond as Address,
        abi: TizzMultiCollatDiamondAbi,
        functionName: "calculateFeeAmount",
        args: input
          ? [
              input.trader,
              BigInt(
                Math.floor(
                  input.positionBaseAsset *
                    input.leverage *
                    input.fee.closeFeeP,
                ),
              ),
            ]
          : undefined,
      },
      {
        address: tizzContractAddresses.global.tizzMultiCollatDiamond as Address,
        abi: TizzMultiCollatDiamondAbi,
        functionName: "calculateFeeAmount",
        args: input
          ? [
              input.trader,
              BigInt(
                Math.floor(
                  input.positionBaseAsset *
                    input.leverage *
                    input.fee.nftLimitOrderFeeP,
                ),
              ),
            ]
          : undefined,
      },
      {
        address: tizzContractAddresses[collateralType]
          .tizzFrontendInfoAggregator as Address,
        abi: TizzFrontendInfoAggregatorAbi,
        functionName: "predictFees",
        args: input
          ? [
              input.trader,
              BigInt(input.positionBaseAsset),
              BigInt(input.leverage),
              BigInt(input.pairIndex),
            ]
          : undefined,
      },
    ],
  });

  const cachedData = useDelayedUpdate(data, status);

  const [
    tradeFundingFeeData,
    openFeeData,
    closeFeeData,
    limitOrderFeeData,
    predictFeesData,
  ] = cachedData
    ? cachedData
    : [undefined, undefined, undefined, undefined, undefined];

  return {
    tradeFundingFee:
      tradeFundingFeeData?.status === "success"
        ? Number(tradeFundingFeeData.result)
        : undefined,
    openFee:
      openFeeData?.status === "success"
        ? Number(openFeeData.result)
        : undefined,
    closeFee:
      closeFeeData?.status === "success"
        ? Number(closeFeeData.result)
        : undefined,
    limitOrderFee:
      limitOrderFeeData?.status === "success"
        ? Number(limitOrderFeeData.result)
        : undefined,
    predictFee:
      predictFeesData?.status === "success"
        ? Number(predictFeesData.result[0])
        : undefined,
    fundingRate:
      predictFeesData?.status === "success"
        ? Number(predictFeesData.result[1])
        : undefined,
  };
}
