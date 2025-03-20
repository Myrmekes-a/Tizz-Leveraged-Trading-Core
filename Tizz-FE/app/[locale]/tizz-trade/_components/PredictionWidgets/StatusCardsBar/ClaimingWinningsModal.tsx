import Image from "next/image";

import { Modal, ModalContent, ModalBody, Button } from "@nextui-org/react";
import { twMerge } from "tailwind-merge";

import { getPriceStr } from "@/utils/price";

import beehiveSrc from "@/assets/icons/beehive.svg";

export type ClaimingWinningsModalProps = {
  claimableBalance: number;
  onClose(): void;
  isOpen: boolean;
  onOpenChange(): void;
};

export function ClaimingWinningsModal({
  isOpen,
  onClose,
  onOpenChange,
  claimableBalance,
}: ClaimingWinningsModalProps) {
  return (
    <Modal
      backdrop="opaque"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className={twMerge(
        "relative w-full max-w-[500px] overflow-visible border border-[#FFB700]",
      )}
      placement="center"
    >
      <ModalContent>
        <ModalBody className="gap-6 rounded-[14px] bg-[#1E1E27] p-6 pt-[80px] md:gap-[38px] md:pt-[120px]">
          <Image
            src={beehiveSrc}
            className="absolute left-1/2 top-0 z-10 h-[128px] w-[120px] -translate-x-1/2 -translate-y-1/2 md:h-[213px] md:w-[200px]"
            alt="forest"
          />

          <div className="absolute left-1/2 top-1/2 -z-10 h-[338px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFCC00] blur-[100px]" />

          <div className="flex flex-col items-center gap-6">
            <p className="text-xl leading-loose text-white md:text-2xl">
              Claiming winnings...
            </p>
            <span className="text-5xl font-black leading-[72px] text-[#ffcc00] md:text-7xl md:leading-[90px]">
              {getPriceStr(claimableBalance)} BTC
            </span>
          </div>

          <Button
            onPress={onClose}
            className="items-center justify-center rounded-lg bg-transparent bg-gradient-to-r from-[#FFD260] to-[#FF8744] px-3 py-2 text-lg font-semibold text-black md:px-5 md:py-3.5"
          >
            Close
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
