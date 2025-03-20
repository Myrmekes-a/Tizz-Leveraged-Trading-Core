"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalBody, Spinner } from "@nextui-org/react";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "next-intl";
import { isAddress } from "viem";

import BgButton from "@/components/buttons/BgButton/BgButton";
import BorderedInput from "@/components/inputs/BorderedInput/BorderedInput";
import TextButton from "@/components/buttons/TextButton/TextButton";

import { useGetUserByAddress } from "@/tizz-trade-hooks/guild/useGetUserByAddress";

export type TeamInvitationCreationModalProps = {
  isOpen: boolean;
  isPending: boolean;
  onClose(): void;
  onOpenChange(): void;
  onSave(userAddress: string): void;
  errors?: string[];
};

export default function TeamInvitationCreationModal({
  isOpen,
  isPending,
  onClose,
  onOpenChange,
  onSave,
  errors,
}: TeamInvitationCreationModalProps) {
  const t = useTranslations("Trade-TeamInvitationCreationModal");

  const [userAddress, setUserAddress] = useState<string>("");
  const userQuery = useGetUserByAddress(userAddress);

  const handleClickSave = () => {
    if (userAddress.trim() !== "" && isAddress(userAddress)) {
      onSave(userAddress);
    }
  };

  const isReadyToSubmit = isAddress(userAddress);
  const userErrors = (() => {
    const tmpErrors: string[] = [];

    if (userQuery.data && userQuery.isSuccess) {
      if (userQuery.data.is_suspended) {
        tmpErrors.push("Suspended user");
      }

      if (userQuery.data.ownedGuilds.length > 0) {
        tmpErrors.push("User has a guild");
      }

      if (userQuery.data.guildMembers.length > 0) {
        tmpErrors.push("User already joined another guild");
      }
    } else if (
      userQuery.error &&
      userQuery.isError &&
      userQuery.error.message
    ) {
      tmpErrors.push(...userQuery.error.message);
    }

    return tmpErrors;
  })();

  return (
    <Modal
      backdrop="opaque"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className={twMerge(
        "max-w-[471px] rounded-md border border-stroke bg-neutral-950",
      )}
    >
      <ModalContent>
        <ModalBody className="gap-8 p-6">
          <h6 className="text-2xl text-amber-300 md:text-4xl">
            {t("invite-team")}
          </h6>
          <BorderedInput
            label="User Wallet Address"
            placeholder="Add a user wallet address"
            labelPlacement="outside"
            required
            value={userAddress}
            onValueChange={setUserAddress}
            fullWidth
          />

          {userQuery.data?.wallet_address && (
            <div className="flex flex-col gap-1">
              <p className="text-sm leading-7 text-stone-200">
                {t("wallet-address")}
              </p>

              <p className="text-lg leading-7 text-gray-400">
                {userQuery.data?.wallet_address}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {errors && errors.length > 0
              ? errors.map((error) => (
                  <p key={error} className="text-sm leading-7 text-red-400">
                    {error}
                  </p>
                ))
              : null}

            {userErrors && userErrors.length > 0
              ? userErrors.map((error) => (
                  <p key={error} className="text-sm leading-7 text-red-400">
                    {error}
                  </p>
                ))
              : null}
          </div>

          <div className="flex flex-col gap-2.5">
            <BgButton
              onPress={handleClickSave}
              isDisabled={
                !isReadyToSubmit ||
                isPending ||
                userQuery.isFetching ||
                userErrors.length > 0
              }
              className="py:2 h-14 w-full items-center justify-center rounded-lg bg-amber-300 px-5 text-sm font-semibold text-black md:py-3.5 md:text-lg"
            >
              {t("invite-team")}
              {(isPending || userQuery.isFetching) && (
                <Spinner color="default" />
              )}
            </BgButton>
            <TextButton
              onPress={onClose}
              isDisabled={isPending}
              className="py h-14 w-full items-center justify-center rounded-lg bg-transparent px-5 text-sm font-semibold text-white md:py-3.5 md:text-lg"
            >
              {t("cancel")}
            </TextButton>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
