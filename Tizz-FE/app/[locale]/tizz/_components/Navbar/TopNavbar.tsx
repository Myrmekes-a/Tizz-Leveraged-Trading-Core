"use client";

import Image from "next/image";
import { Link } from "@/navigation";
import { Inter } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "next-intl";

import logo from "@/assets/icons/TizzLogo.svg";

import Button from "@/components/buttons/Button/Button";
import TelegramIcon from "@/components/icons/social/TelegramIcon";

import XIcon from "@/components/icons/social/XIcon";
import LocaleSwitcherSelect from "@/components/LocaleSwitcher/LocaleSwitcherSelect";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

export type TopNavbarProps = {
  mode: "sticky" | "attached";
};

export function TopNavbar({ mode }: TopNavbarProps) {
  const t = useTranslations("Tizz-TopNavbar");

  return (
    <nav
      className={twMerge(
        "fixed left-1/2 z-20 flex w-[calc(100vw-30px)] -translate-x-1/2 items-center justify-between rounded-[4px] px-6 py-3",
        "transition-left 2xl:max-w-[1000px]",
        mode === "sticky"
          ? "top-[24px] border-[0.53px] border-[#3D3D3DA6] backdrop-blur-md"
          : "top-0",
      )}
      style={{
        background:
          mode === "sticky"
            ? "linear-gradient(91deg, rgba(255, 255, 255, 0.21) 0%, rgba(153, 152, 148, 0.21) 96.23%)"
            : "transparent",
        transition: "top 0.5s ease-in-out",
      }}
    >
      <Image
        src={logo}
        alt="tizz logo"
        className="h-[22px] w-[66px] 2xl:h-[41px] 2xl:w-[123px]"
      />
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            className="z-30 w-fit !min-w-0 !border-none bg-transparent !p-0 text-white hover:scale-105"
          >
            <TelegramIcon size={24} className="scale-75" />
          </Button>
          <Button
            isIconOnly
            className="w-fit !min-w-0 !border-none bg-transparent !p-0 text-white hover:scale-105"
          >
            <XIcon size={24} className="scale-75" />
          </Button>
          <LocaleSwitcherSelect />
        </div>
        <Link href="/tizz-trade">
          <Button
            className={twMerge(
              "w-fit rounded !border-none bg-yellow-400 px-4 py-1.5 text-[7.41px] leading-[8.46px] text-black hover:scale-105 2xl:px-8 2xl:py-2 2xl:text-sm",
              inter.className,
            )}
          >
            {t("launch-app")}
          </Button>
        </Link>
      </div>
    </nav>
  );
}
