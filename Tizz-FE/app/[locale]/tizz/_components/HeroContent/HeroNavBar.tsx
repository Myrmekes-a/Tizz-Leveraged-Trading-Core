import { Chip } from "@nextui-org/react";
import { useTranslations } from "next-intl";

import Button from "@/components/buttons/Button/Button";
import ArrowRightIcon from "@/components/icons/arrow/ArrowRightIcon";
import { twMerge } from "tailwind-merge";

export function HeroNavbar() {
  const t = useTranslations("Tizz-HeroNavbar");

  return (
    <nav
      className={twMerge(
        "flex w-fit cursor-pointer items-center justify-between gap-5 rounded-[75px] bg-white p-[3px] pr-[9px]",
        "transition-all hover:scale-105 xl:gap-3 xl:p-1 xl:pr-3",
      )}
    >
      <Chip className="rounded-[75px] bg-yellow-400 px-2.5 py-0.5 text-sm font-bold leading-snug text-black xl:px-3 xl:text-lg xl:leading-7">
        {t("new")}
      </Chip>
      <div className="flex items-center gap-1.5 xl:gap-2">
        <p className="text-sm font-medium leading-snug text-black xl:text-lg xl:leading-7">
          {t("join-our-testnet-faucet")}
        </p>
        <Button
          isIconOnly
          className="w-fit !min-w-0 !border-none bg-transparent !p-0"
        >
          <ArrowRightIcon
            size={14}
            className="scale-110 text-black xl:scale-150"
          />
        </Button>
      </div>
    </nav>
  );
}
