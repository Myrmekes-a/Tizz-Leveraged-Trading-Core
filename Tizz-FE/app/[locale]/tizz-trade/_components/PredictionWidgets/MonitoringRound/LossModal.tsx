import Image from "next/image";

import { Modal, ModalContent, ModalBody, Button } from "@nextui-org/react";

import { getPriceStr } from "@/utils/price";

import yogaZentoshiSrc from "@/assets/images/zentoshi/yoga-zentoshi.svg";

export type LossModalProps = {
  amount: number;
  onClose(): void;
};

export function LossModal({ onClose, amount }: LossModalProps) {
  return (
    <Modal
      backdrop="opaque"
      isOpen
      hideCloseButton
      className="relative w-full max-w-[500px] overflow-visible border border-[#ff5b00]"
      placement="center"
    >
      <ModalContent>
        <ModalBody className="gap-6 rounded-[14px] bg-[#1E1E27] p-6 pt-[80px] md:gap-[38px] md:pt-[120px]">
          <Image
            src={yogaZentoshiSrc}
            className="absolute -top-4 left-1/2 z-10 h-[90px] w-[120px] -translate-x-1/2 -translate-y-1/2 md:h-[160px] md:w-[200px]"
            alt="yoga-zentoshi"
          />

          <div className="absolute left-1/2 top-1/2 -z-10 h-[338px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff5b00] blur-[100px]" />

          <div className="flex flex-col items-center gap-6">
            <p className="text-center text-xl font-bold leading-loose text-white md:text-2xl">
              Better luck next time! You didn&apos;t win this round.
            </p>
            <span className="text-5xl font-black leading-[72px] text-[#ff5b00] md:text-7xl md:leading-[90px]">
              -{getPriceStr(amount)} BTC
            </span>
          </div>

          <Button
            onPress={onClose}
            className="items-center justify-center rounded-lg bg-[#444] px-3 py-2 text-lg font-semibold text-white md:px-5 md:py-3.5"
          >
            Closing...
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
