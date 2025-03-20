"use client";

import { useState, useEffect } from "react";
import ReactLoading from "react-loading";
import { Address } from "viem";
import { useConfig, useWriteContract } from "wagmi";
import {
  waitForTransactionReceipt,
  WaitForTransactionReceiptErrorType,
} from "@wagmi/core";
import { useFormatter, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { CollateralTypes } from "@tizz-hive/sdk";

import { TTokenOpenPnlFeedAbi } from "@/abis/Tizz/TTokenOpenPnlFeed";

import BaseBadge from "@/components/badges/baseBadge/BaseBadge";
import BaseCard from "@/components/cards/BaseCard/BaseCard";
import BaseButton from "@/components/buttons/BaseButton/BaseButton";
import ClockIcon from "@/components/icons/ClockIcon";
import TokenIcon from "@/components/icons/TokenIcon";

import EarnInfo, {
  EarnInfoItem,
} from "@/tizz-trade-components/VaultWidgets/EarnInfo";
import { tizzContractAddresses } from "@/utils/tizz";
import {
  useVaultsVariables,
  PRECISION,
  EPOCH_PERIOD,
} from "@/tizz-trade-hooks/useVaultVariables";
import { twMerge } from "tailwind-merge";
import { getAPY } from "@/utils/calculateApy";
import { getPercentageStr } from "@/utils/price";

type VaultMainCardProps = {
  collateralType: CollateralTypes;
};

export default function VaultMainCard({ collateralType }: VaultMainCardProps) {
  const t = useTranslations("Trade-VaultMainCard");
  const format = useFormatter();
  const { enqueueSnackbar } = useSnackbar();

  const [waitingForTransactionReceipt, setWaitingForTransactionReceipt] =
    useState(false);
  const [isOpenedWalletProvider, setIsOpenedWalletProvider] = useState(false);
  const [apy, setApy] = useState<number | null>(null);

  const { writeContract } = useWriteContract();
  const config = useConfig();

  const {
    tvl,
    shareToAssetsPrice,
    totalSupply,
    collateralizationP,
    currentEpoch,
    currentEpochStart,
  } = useVaultsVariables(collateralType);

  useEffect(() => {
    (async () => {
      setApy(await getAPY(collateralType));
    })();
  }, [collateralType]);

  const handleForceNewEpoch = () => {
    setIsOpenedWalletProvider(true);

    writeContract(
      {
        address: tizzContractAddresses[collateralType]
          .tizzTokenOpenPnlFeed as Address,
        abi: TTokenOpenPnlFeedAbi,
        functionName: "forceNewEpoch",
      },
      {
        onError: (err) => {
          console.log("Failed at forceNewEpoch: ", Object.entries(err));

          enqueueSnackbar("Failed at Force New Epoch", {
            autoHideDuration: 5000,
            variant: "error",
          });
        },
        onSuccess: async (hash) => {
          setWaitingForTransactionReceipt(true);

          try {
            await waitForTransactionReceipt(config, {
              hash,
            });
          } catch (err) {
            console.log(
              "Reverted at deposit: ",
              Object.entries(err as WaitForTransactionReceiptErrorType),
            );
          }

          setWaitingForTransactionReceipt(false);
        },
        onSettled() {
          setIsOpenedWalletProvider(false);
        },
      },
    );
  };

  const items: EarnInfoItem[] = [
    {
      label: "TVL",
      value: tvl !== undefined ? format.number(Number(tvl) / PRECISION) : "-",
      icon: (
        <TokenIcon
          token={
            collateralType === CollateralTypes.WBTC
              ? "btc"
              : collateralType.toLowerCase()
          }
          width={18}
          height={18}
        />
      ),
    },
    {
      label: t("collat-ratio"),
      value:
        collateralizationP !== undefined
          ? format.number(Number(collateralizationP) / PRECISION / 100, {
              style: "percent",
              maximumFractionDigits: 2,
            })
          : "-",
    },
    {
      label: `tz${collateralType} ${t("price")}`,
      value:
        shareToAssetsPrice !== undefined
          ? format.number(Number(shareToAssetsPrice) / PRECISION)
          : "-",
      icon: (
        <TokenIcon
          token={
            collateralType === CollateralTypes.WBTC
              ? "btc"
              : collateralType.toLowerCase()
          }
          width={18}
          height={18}
        />
      ),
    },
    {
      label: `tz${collateralType} ${t("supply")}`,
      value:
        totalSupply !== undefined
          ? format.number(Number(totalSupply) / PRECISION)
          : "-",
      icon: (
        <TokenIcon
          token={
            collateralType === CollateralTypes.WBTC
              ? "btc"
              : collateralType.toLowerCase()
          }
          width={18}
          height={18}
        />
      ),
    },
  ];

  const gap =
    EPOCH_PERIOD -
    (new Date().getTime() -
      new Date(
        (currentEpochStart ? Number(currentEpochStart) : 0) * 1000,
      ).getTime());

  const d = gap > 0 ? Math.floor(gap / (24 * 3600 * 1000)) : 0;
  const h =
    gap > 0 ? Math.floor((gap - d * (24 * 3600 * 1000)) / (3600 * 1000)) : 0;
  const m =
    gap > 0
      ? Math.floor(
          (gap - d * (24 * 3600 * 1000) - h * (3600 * 1000)) / (60 * 1000),
        )
      : 0;

  const remaining = gap > 0 ? `${d}d ${h}h ${m}m` : undefined;

  return (
    <BaseCard
      classNames={{
        base: "p-6 bg-neutral-900 gap-3.5 md:gap-8 w-full",
      }}
    >
      <div className="flex flex-col items-start justify-start gap-8 self-stretch">
        <div className="inline-flex items-center justify-start gap-3.5 self-stretch pb-4">
          <div className="text-3xl font-semibold leading-[60px] text-white md:text-5xl">
            tz{collateralType} {t("vault")}
          </div>
          <BaseBadge
            value={
              apy !== null ? `${getPercentageStr(apy * 100)}%` : "..."
            }
          />
        </div>
      </div>
      <div className="h-[1px] w-full bg-gray-800" />
      <div className="flex flex-col gap-2">
        <div className="inline-flex h-8 items-center justify-between gap-2">
          <div className="text-xl font-semibold leading-loose text-white md:text-2xl">
            {t("epoch", {
              value:
                currentEpoch !== undefined
                  ? format.number(Number(currentEpoch))
                  : "-",
            })}
          </div>

          <div className="flex items-center gap-1 text-sm font-normal leading-tight text-emerald-400">
            {remaining ? (
              <>
                <ClockIcon size={24} width={16} height={16} />
                <div>
                  {t("remaining")}: {remaining}
                </div>
              </>
            ) : (
              currentEpochStart !== undefined && (
                <BaseButton
                  onClick={handleForceNewEpoch}
                  isDisabled={
                    isOpenedWalletProvider || waitingForTransactionReceipt
                  }
                  radius="md"
                  className={twMerge(
                    "h-9 px-4 py-2.5 text-base text-black",
                    isOpenedWalletProvider || waitingForTransactionReceipt
                      ? "bg-neutral-800"
                      : "bg-amber-300",
                  )}
                >
                  {isOpenedWalletProvider || waitingForTransactionReceipt ? (
                    <ReactLoading type={"bubbles"} color={"#d1d1d1"} />
                  ) : (
                    "Force New Epoch"
                  )}
                </BaseButton>
              )
            )}
          </div>
        </div>
        <div className="flex w-full justify-between text-sm font-normal text-amber-300">
          <div className="grow basis-0">
            {t("start", {
              date:
                currentEpochStart !== undefined
                  ? format.dateTime(new Date(Number(currentEpochStart) * 1000))
                  : "-",
            })}
          </div>
          <div className="h-full w-[1px] text-gray-800">|</div>
          <div className="grow basis-0 text-end">
            {t("end", {
              date:
                currentEpochStart !== undefined
                  ? format.dateTime(
                      new Date(Number(currentEpochStart) * 1000 + EPOCH_PERIOD),
                    )
                  : "-",
            })}
          </div>
        </div>
      </div>
      <div className="h-[1px] w-full bg-gray-800"></div>
      <div className="grid w-full grid-cols-2 gap-6">
        {items.map((item, index) => (
          <EarnInfo key={index} item={item} />
        ))}
      </div>
      <div className="mt-2.5 inline-flex h-[84px] w-full items-start justify-start gap-2.5 rounded-lg border border-orange-300 bg-gradient-to-r from-orange-400 to-amber-300 p-3.5 md:mt-0">
        <div className="shrink grow basis-0 text-lg font-bold leading-7 text-black">
          {t("description")}
        </div>
      </div>
    </BaseCard>
  );
}
