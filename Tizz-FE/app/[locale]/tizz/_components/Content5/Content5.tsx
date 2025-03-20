import Image from "next/image";
import { useTranslations } from "next-intl";

import gameficationSrc from "@/assets/images/layers/gamefication.svg";

export function Content5() {
  const t = useTranslations("Tizz-Content");

  return (
    <div className="flex flex-col items-center gap-6 xl:mt-[200px] xl:gap-10">
      <div className="flex flex-col gap-3 px-[26px] text-center md:w-[600px] lg:w-[700px] xl:w-[623px] xl:gap-5">
        <p className="text-2xl font-black leading-loose text-stone-50 xl:text-5xl xl:leading-[38px]">
          {t("compete-and-conquer")}
        </p>
        <p className="text-base font-semibold leading-normal text-white xl:font-bold">
          {t("compete-and-conquer-description")}
        </p>
      </div>

      <Image
        src={gameficationSrc}
        alt="gamefication"
        className="-mt-[75px] h-[246px] w-full md:h-[400px] lg:h-[600px] xl:-mt-[219px] xl:h-[855px] xl:w-[1371px]"
      />
    </div>
  );
}
