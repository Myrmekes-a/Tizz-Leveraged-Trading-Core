import Image from "next/image";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

import paradigm from "@/assets/icons/brands/paradigm.svg";
import defianceCapital from "@/assets/icons/brands/definance-capital.svg";
import kronos from "@/assets/icons/brands/kronos.svg";
import andreessenHorowitz from "@/assets/icons/brands/andreessen-horowitz.svg";
import coinbase from "@/assets/icons/brands/coinbase.svg";
import a16zcrypto from "@/assets/icons/brands/a16zcrypto.svg";
import nascent from "@/assets/icons/brands/nascent.svg";
import dragonflyCapital from "@/assets/icons/brands/dragonfly-capital.svg";

const brands = [
  {
    id: "paradigm",
    src: paradigm,
    link: "https://www.paradigm.xyz/",
  },
  {
    id: "defianceCapital",
    src: defianceCapital,
    link: "https://defiance.capital/",
  },
  {
    id: "kronos",
    src: kronos,
    link: "https://kronosresearch.com/",
  },
  {
    id: "andreessenHorowitz",
    src: andreessenHorowitz,
    link: "https://a16z.com/",
  },
  {
    id: "coinbase",
    src: coinbase,
    link: "https://www.coinbase.com/",
  },
  {
    id: "a16zcrypto",
    src: a16zcrypto,
    link: "https://a16zcrypto.com/",
  },
  {
    id: "nascent",
    src: nascent,
    link: "#",
  },
  {
    id: "dragonflyCapital",
    src: dragonflyCapital,
    link: "https://www.dragonflycapital.com/",
  },
];

export function Content1() {
  const t = useTranslations("Tizz-Content");

  return (
    <div className="flex flex-col items-center gap-4 xl:mt-[14px] xl:gap-[54px]">
      <p className="text-2xl font-black leading-loose text-stone-50 xl:text-3xl xl:leading-[38px]">
        {t("backed-by")}
      </p>
      <div className="j flex flex-wrap gap-x-2 gap-y-4 md:gap-x-8 xl:justify-center xl:gap-x-[45px] xl:gap-y-[40px]">
        {brands.map((item) => (
          <Link
            key={item.id}
            href={item.link}
            className="flex h-[66px] items-center px-4 transition-all hover:scale-105 md:px-6 xl:h-[125px] xl:w-[300px]"
          >
            <Image
              src={item.src}
              width={100}
              alt="brands"
              className="md:hidden"
            />
            <Image
              src={item.src}
              width={110}
              alt="brands"
              className="hidden md:block xl:hidden"
            />
            <Image
              src={item.src}
              width={220}
              alt="brands"
              className="hidden xl:block"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
