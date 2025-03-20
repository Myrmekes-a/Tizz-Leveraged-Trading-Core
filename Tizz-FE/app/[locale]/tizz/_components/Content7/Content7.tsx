"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import tizzMascot2 from "@/assets/images/zentoshi/tizzMascot2.svg";
import tizzMascotWithComputer from "@/assets/images/zentoshi/tizzMascotWithComputer.svg";
import teamTrader from "@/assets/images/zentoshi/teamTrader.svg";
import GreenCard from "@/components/cards/GreenCard/GreenCard";

export function Content7() {
  const t = useTranslations("Tizz-Content");

  const zentoshis = [
    {
      id: "socialities",
      title: t("how-you-earn.card1.title"),
      description: t("how-you-earn.card1.description"),
      zentoshiSrc: tizzMascot2,
    },
    {
      id: "individual",
      title: t("how-you-earn.card2.title"),
      description: t("how-you-earn.card2.description"),
      zentoshiSrc: tizzMascotWithComputer,
    },
    {
      id: "hives",
      title: t("how-you-earn.card3.title"),
      description: t("how-you-earn.card3.description"),
      zentoshiSrc: teamTrader,
    },
  ];

  return (
    <div className="flex flex-col items-center gap-6 xl:mt-[100px] xl:gap-[48px]">
      <div className="flex flex-col gap-3 px-[26px] text-center xl:gap-5">
        <p className="text-2xl font-black leading-loose text-stone-50 xl:text-5xl xl:leading-[38px]">
          {t("how-you-earn.title")}
        </p>
        <p className="text-base font-semibold leading-normal text-neutral-400 md:w-[600px] lg:w-[900px]">
          {t("how-you-earn.description")}
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {zentoshis.map((item) => (
          <GreenCard
            key={item.id}
            classNames={{
              base: "items-center px-4 gap-4 xl:w-[392px] xl:h-[500px] xl:p-6",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
                delay: Math.random(),
              }}
              viewport={{ once: true }}
            >
              <Image
                src={item.zentoshiSrc}
                alt="gamefication"
                className="h-[171px] w-full xl:h-[255px]"
              />
              <div className="xl:flex-start flex flex-col gap-2 py-3 text-center xl:gap-3 xl:text-start">
                <p className="text-lg font-bold leading-7 text-stone-50 xl:text-xl xl:leading-[30px]">
                  {item.title}
                </p>
                <p className="text-sm font-bold leading-tight text-neutral-400 xl:text-base xl:leading-normal">
                  {item.description}
                </p>
              </div>
            </motion.div>
          </GreenCard>
        ))}
      </div>
    </div>
  );
}
