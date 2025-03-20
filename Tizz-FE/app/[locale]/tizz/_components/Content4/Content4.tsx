import { useTranslations } from "next-intl";

import GreenCard from "@/components/cards/GreenCard/GreenCard";

import Volumn24hIcon from "@/components/icons/arrow/Volumn24hIcon";
import PercentageSqure from "@/components/icons/content/PercentageSqure";
import CoinStack from "@/components/icons/money/CoinStack";

export function Content4() {
  const t = useTranslations("Tizz-Content");

  const economicItems = [
    {
      id: "volume24",
      first: "$64,983,725,315",
      second: (
        <>
          <Volumn24hIcon size={24} className="scale-75 xl:scale-100" />
          {t("satistics.volumn-transferred-24h")}
        </>
      ),
    },
    {
      id: "fees",
      first: "1,432,884",
      second: (
        <>
          <CoinStack size={24} className="scale-75 xl:scale-100" />
          {t("satistics.fees-generated")}
        </>
      ),
    },
    {
      id: "openInterest",
      first: "22,731",
      second: (
        <>
          <PercentageSqure size={24} className="scale-75 xl:scale-100" />
          {t("satistics.open-perps-intrest")}
        </>
      ),
    },
  ];
  return (
    <GreenCard
      classNames={{
        base: "gap-8 p-6 relative lg:w-[900px] lg:mx-auto xl:w-full xl:p-10 xl:gap-[141px] xl:flex-row xl:mt-[200px]",
      }}
    >
      <div className="flex flex-col gap-3 text-center xl:w-[504px] xl:gap-[42px] xl:text-left">
        <p className="px-6 text-2xl font-bold text-stone-50 xl:p-0 xl:text-4xl xl:leading-[44px]">
          {t("satistics.title")}
        </p>
        <p className="px-1 text-base font-semibold text-neutral-400 xl:font-medium">
          {t("satistics.description")}
        </p>
      </div>
      <div className="flex flex-wrap justify-between gap-x-10 gap-y-4 xl:gap-x-[58px] xl:gap-y-10">
        {economicItems.map((item) => (
          <div key={item.id} className="flex flex-col gap-1.5 xl:gap-[14px]">
            <p className="text-sm font-bold leading-tight text-white xl:text-4xl xl:font-black xl:leading-[44px]">
              {item.first}
            </p>
            <div className="flex items-center gap-1 text-xs font-bold leading-[18px] text-yellow-400 xl:gap-2 xl:text-2xl  xl:leading-loose">
              {item.second}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute right-[40%] top-1/3 h-[365.31px] w-[549.90px] rounded-full bg-yellow-400 opacity-20 blur-[155.74px] xl:right-[80%]" />
    </GreenCard>
  );
}
