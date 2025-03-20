"use client";

import { ChangeEventHandler, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useSnackbar } from "notistack";
import { Address } from "viem";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import {
  waitForTransactionReceipt,
  WaitForTransactionReceiptErrorType,
} from "@wagmi/core";
import ReactLoading from "react-loading";
import { Button } from "@nextui-org/react";
import { twMerge } from "tailwind-merge";
import { CollateralTypes } from "@tizz-hive/sdk";

import { TTokenAbi } from "@/abis/Tizz/TToken";

import BaseCard from "@/components/cards/BaseCard/BaseCard";
import BaseButton from "@/components/buttons/BaseButton/BaseButton";
import TokenIcon from "@/components/icons/TokenIcon";
import { tizzContractAddresses } from "@/utils/tizz";
import FlatInput from "@/components/inputs/FlatInput/FlatInput";
import {
  useVaultsVariables,
  PRECISION,
} from "@/tizz-trade-hooks/useVaultVariables";
import { useTokenBalance } from "@/tizz-trade-hooks/useTokenBalance";

type RedeemContentProps = {
  collateralType: CollateralTypes;
};

export default function RedeemContent({ collateralType }: RedeemContentProps) {
  const t = useTranslations("Trade-VaultDepositCard");
  const format = useFormatter();
  const { enqueueSnackbar } = useSnackbar();

  const [amount, setAmount] = useState<string>("0");
  const [waitingForTransactionReceipt, setWaitingForTransactionReceipt] =
    useState(false);
  const [isOpenedWalletProvider, setIsOpenedWalletProvider] = useState(false);

  const account = useAccount();
  const config = useConfig();

  const { writeContract } = useWriteContract();

  const { shareToAssetsPrice, maxRedeem } = useVaultsVariables(collateralType);
  const { precision: sharePrecision } = useTokenBalance({
    contractAddress: tizzContractAddresses[collateralType].tizzToken as Address,
    ownerAddress: account.address,
  });

  const maxShare =
    maxRedeem !== undefined ? Number(maxRedeem) / sharePrecision : 0;
  // const maxAssetsPreview =
  //   shareToAssetsPrice && maxRedeem !== undefined
  //     ? (Number(maxRedeem) / sharePrecision) *
  //       (Number(shareToAssetsPrice) / sharePrecision)
  //     : 0;
  const assetsPreview = shareToAssetsPrice
    ? Number(amount) * (Number(shareToAssetsPrice) / sharePrecision)
    : 0;

  const handleSetMaxRequest = () => {
    setAmount(`${maxShare}`);
  };

  const handleChangeAmount: ChangeEventHandler<HTMLInputElement> = (e) => {
    const newValue = e.currentTarget.value;

    if (maxShare < +newValue) {
      setAmount(`${maxShare}`);
    } else {
      setAmount(e.currentTarget.value);
    }
  };

  const handleRedeem = () => {
    if (+amount === 0 || !account.address) {
      return;
    }

    setIsOpenedWalletProvider(true);

    writeContract(
      {
        abi: TTokenAbi,
        address: tizzContractAddresses[collateralType].tizzToken as Address,
        functionName: "redeem",
        args: [
          BigInt(Math.floor(+amount * sharePrecision)),
          account.address,
          account.address,
        ],
      },
      {
        onError: (err) => {
          console.log("Failed at Redeem: ", Object.entries(err));

          enqueueSnackbar("Failed at Redeem", {
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
          setAmount("0");
        },
        onSettled() {
          setIsOpenedWalletProvider(false);
        },
      },
    );
  };

  const tokenInfo = `1 tz${collateralType} = ${shareToAssetsPrice ? `${Number(shareToAssetsPrice) / PRECISION} ${collateralType}` : "---"}`;

  return (
    <div className="flex w-full flex-col gap-3.5">
      <div className="flex flex-col gap-2">
        <BaseCard
          classNames={{
            base: "py-2.5 px-3.5 gap-1 bg-neutral-800 border border-gray-800",
          }}
        >
          <p className="text-sm leading-tight text-gray-400">{t("redeem")}</p>
          <div className="flex justify-between">
            <FlatInput
              inputMode="decimal"
              type="number"
              pattern="^([0-9]+(?:[.,][0-9]*)?)$"
              autoComplete="off"
              value={amount}
              onChange={handleChangeAmount}
            />
            <BaseCard
              classNames={{
                base: "py-1 px-3.5 gap-1 bg-neutral-800 border border-gray-800 flex-row min-w-[100px] items-center",
              }}
            >
              <TokenIcon
                token={
                  collateralType === CollateralTypes.WBTC
                    ? "btc"
                    : collateralType.toLowerCase()
                }
                width={16}
                height={16}
              />
              tz{collateralType}
            </BaseCard>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-400">{format.number(maxShare)}</p>
            <BaseButton
              radius="md"
              className="font-xs min-w-0 rounded-md border border-zinc-700 bg-gray-800 px-1 py-1 text-xs"
              onClick={handleSetMaxRequest}
            >
              {t("max")}
            </BaseButton>
          </div>
        </BaseCard>

        <BaseCard
          classNames={{
            base: "py-2.5 px-3.5 gap-1 bg-neutral-800 border border-gray-800",
          }}
        >
          <div className="text-sm font-normal leading-tight text-gray-400">
            {t("you-receive")}
          </div>
          <div className="flex justify-between">
            <div className="text-3xl font-semibold text-white">
              {format.number(assetsPreview)}
            </div>
            <BaseCard
              classNames={{
                base: "py-1 px-3.5 gap-1 bg-neutral-800 border border-gray-800 flex-row min-w-[100px] items-center",
              }}
            >
              <TokenIcon
                token={
                  collateralType === CollateralTypes.WBTC
                    ? "btc"
                    : collateralType.toLowerCase()
                }
                width={16}
                height={16}
              />
              {collateralType}
            </BaseCard>
          </div>
        </BaseCard>
      </div>

      <p className="w-full rounded-lg border border-gray-800 px-2 py-2 text-xs leading-[18px] text-gray-400">
        {tokenInfo}
      </p>

      {waitingForTransactionReceipt || isOpenedWalletProvider ? (
        <Button
          disabled
          radius="md"
          className="h-9 bg-neutral-800 px-4 py-2.5 text-base text-black"
          fullWidth
        >
          <ReactLoading type={"bubbles"} color={"#d1d1d1"} />
        </Button>
      ) : (
        <Button
          onClick={handleRedeem}
          isDisabled={+amount === 0}
          radius="md"
          className={twMerge(
            "h-9 px-4 py-2.5 text-base text-black",
            +amount === 0 ? "bg-neutral-800" : "bg-amber-300",
          )}
          fullWidth
        >
          {t("redeem")}
        </Button>
      )}
    </div>
  );
}
