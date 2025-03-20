"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import tradingHiveSrc from "@/assets/images/layers/tradinghive.svg";
import tradingHiveDesktopSrc from "@/assets/images/layers/tradinghive-desktop.svg";
import privacySrc from "@/assets/images/layers/privacy.svg";
import teamsSrc from "@/assets/images/layers/teams.svg";
import hexGrid from "@/assets/images/layers/hex.svg";
import maximizeRewardsSrc from "@/assets/images/layers/maximizeRewards.svg";

import GreenCard from "@/components/cards/GreenCard/GreenCard";
import Button from "@/components/buttons/Button/Button";
import { Link } from "@/navigation";

export function Content6() {
  const t = useTranslations("Tizz-Content");

  return (
    <div className="flex flex-col items-center gap-6 xl:mt-[300px] xl:gap-[48px]">
      <p className="px-8 text-center text-2xl font-black text-stone-50 md:px-[76px] xl:text-5xl xl:leading-[38px]">
        {t("features.title")}
      </p>

      <div className="flex w-full flex-col items-center gap-6 md:hidden xl:flex xl:w-fit xl:flex-row">
        <div>
          <GreenCard
            classNames={{
              base: "p-0 w-full h-auto xl:w-[461px] xl:h-[865px] xl:rounded-[20px]",
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
                src={tradingHiveSrc}
                className="w-full xl:hidden"
                alt="tizz trading hive"
              />
              <Image
                src={tradingHiveDesktopSrc}
                className="hidden w-full xl:block xl:h-[524px]"
                alt="tizz trading hive"
              />
              <div className="flex flex-col gap-3 px-2 py-3 xl:flex-1 xl:justify-center xl:gap-6 xl:p-6">
                <div className="flex flex-col gap-2 text-center xl:gap-3 xl:text-left">
                  <p className="text-lg font-bold leading-7 text-stone-50 xl:text-xl xl:leading-[30px]">
                    {t("features.card1.title")}
                  </p>
                  <p className="text-xs font-bold leading-[18px] text-neutral-400 xl:text-sm xl:leading-tight">
                    {t("features.card1.description")}
                  </p>
                </div>

                <Link href="/tizz-trade" className="w-full">
                  <Button className="w-full rounded-md border-none bg-yellow-400 px-3 py-2 text-[10px] leading-3 text-black xl:w-fit xl:px-8 xl:text-base xl:leading-normal">
                    {t("launch-app")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </GreenCard>
        </div>

        <div className="flex w-full flex-col items-center gap-6 xl:h-[865px] xl:w-[785px] xl:flex-col">
          <div className="flex w-full flex-1 flex-col items-center gap-6 xl:flex-row">
            <GreenCard
              classNames={{
                base: "p-0 pt-4 w-full h-auto gap-[50px] xl:w-[381px] xl:h-[429px] xl:rounded-[20px]",
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
                <div className="relative w-full">
                  <div className="absolute left-1/2 top-1/2 z-0 h-[80px] w-[100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400 opacity-50 blur-[60px]" />
                  <Image
                    src={privacySrc}
                    alt="tizz trading hive"
                    className="relative z-10 h-[150px] w-full xl:w-[350px]"
                  />
                </div>
                <div className="flex flex-col gap-3 px-2 py-3 xl:items-center xl:gap-6 xl:p-6">
                  <div className="flex flex-col gap-2 text-center xl:gap-3 xl:text-left">
                    <p className="text-lg font-bold leading-7 text-stone-50 xl:text-xl xl:leading-[30px]">
                      {t("features.card2.title")}
                    </p>
                    <p className="text-xs font-bold leading-[18px] text-neutral-400 xl:text-sm xl:leading-tight">
                      {t("features.card2.description")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </GreenCard>
            <GreenCard
              classNames={{
                base: "p-0 pt-4 w-full h-auto gap-[50px] xl:w-[381px] xl:h-[429px] xl:rounded-[20px] xl:gap-0",
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
                <div className="relative flex items-center justify-center">
                  <div className="absolute left-0 top-1/2 z-0 h-[80px] w-[100px] -translate-x-[100%] -translate-y-1/2 rounded-full bg-yellow-400 opacity-50 blur-[60px]" />
                  <div className="absolute right-0 top-1/2 z-0 h-[80px] w-[100px] -translate-y-1/2 translate-x-[100%] rounded-full bg-yellow-400 opacity-50 blur-[60px]" />
                  <Image
                    src={hexGrid}
                    width={400}
                    alt="tizz trading grid"
                    className="absolute -left-[112px] z-10 py-6"
                  />
                  <Image
                    src={teamsSrc}
                    alt="tizz trading hive"
                    className="relative z-10 h-[150px] py-6 xl:h-[230px] xl:p-0"
                  />
                </div>
                <div className="flex flex-col gap-3 px-2 py-3 xl:items-center xl:gap-6 xl:px-6 xl:py-0">
                  <div className="flex flex-col gap-2 text-center xl:gap-3 xl:text-left">
                    <p className="text-lg font-bold leading-7 text-stone-50 xl:text-xl xl:leading-[30px]">
                      {t("features.card3.title")}
                    </p>
                    <p className="text-xs font-bold leading-[18px] text-neutral-400 xl:text-sm xl:leading-tight">
                      {t("features.card3.description")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </GreenCard>
          </div>
          <GreenCard
            classNames={{
              base: "p-0 w-full h-auto xl:w-full xl:rounded-[20px]",
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
              <div className="relative h-[170px] w-full overflow-hidden xl:h-[261px] xl:w-full">
                <Image
                  src={maximizeRewardsSrc}
                  className="absolute left-1/2 h-full w-full -translate-x-1/2 xl:h-[400px] "
                  alt="tizz trading hive"
                />
              </div>
              <div className="flex flex-col gap-3 px-2 py-3 xl:items-center xl:gap-6 xl:p-6">
                <div className="flex flex-col gap-2 text-center xl:gap-3 xl:text-left">
                  <p className="text-lg font-bold leading-7 text-stone-50 xl:text-xl xl:leading-[30px]">
                    {t("features.card4.title")}
                  </p>
                  <p className="text-xs font-bold leading-[18px] text-neutral-400 xl:text-sm xl:leading-tight">
                    {t("features.card4.description")}
                  </p>
                </div>
              </div>
            </motion.div>
          </GreenCard>
        </div>
      </div>

      <div className="hidden w-full flex-col items-center gap-6 md:flex lg:hidden">
        <div className="flex w-full flex-row items-stretch gap-6">
          <GreenCard
            classNames={{
              base: "p-0 w-full h-auto",
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
                src={tradingHiveSrc}
                className="w-full xl:hidden"
                alt="tizz trading hive"
              />
              <Image
                src={tradingHiveDesktopSrc}
                className="hidden w-full xl:block xl:h-[524px]"
                alt="tizz trading hive"
              />
              <div className="flex flex-col gap-3 px-2 py-3 xl:flex-1 xl:justify-center xl:gap-6 xl:p-6">
                <div className="flex flex-col gap-2 text-center xl:gap-3 xl:text-left">
                  <p className="text-lg font-bold leading-7 text-stone-50 xl:text-xl xl:leading-[30px]">
                    {t("features.card1.title")}
                  </p>
                  <p className="text-xs font-bold leading-[18px] text-neutral-400 xl:text-sm xl:leading-tight">
                    {t("features.card1.description")}
                  </p>
                </div>

                <Link href="/tizz-trade" className="w-full">
                  <Button className="w-full rounded-md border-none bg-yellow-400 px-3 py-2 text-[10px] leading-3 text-black xl:w-fit xl:px-8 xl:text-base xl:leading-normal">
                    {t("launch-app")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </GreenCard>
          <GreenCard
            classNames={{
              base: "p-0 w-full h-auto",
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
              <div className="relative h-[170px] w-full overflow-hidden xl:h-[261px] xl:w-full">
                <Image
                  src={maximizeRewardsSrc}
                  className="absolute left-1/2 h-full w-full -translate-x-1/2 xl:h-[400px] "
                  alt="tizz trading hive"
                />
              </div>
              <div className="flex flex-col gap-3 px-2 py-3 xl:items-center xl:gap-6 xl:p-6">
                <div className="flex flex-col gap-2 text-center xl:gap-3 xl:text-left">
                  <p className="text-lg font-bold leading-7 text-stone-50 xl:text-xl xl:leading-[30px]">
                    {t("features.card4.title")}
                  </p>
                  <p className="text-xs font-bold leading-[18px] text-neutral-400 xl:text-sm xl:leading-tight">
                    {t("features.card4.description")}
                  </p>
                </div>
              </div>
            </motion.div>
          </GreenCard>
        </div>

        <div className="flex w-full flex-row items-center gap-6">
          <GreenCard
            classNames={{
              base: "p-0 pt-4 w-full h-auto gap-[50px] xl:w-[381px] xl:h-[429px] xl:rounded-[20px]",
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
              <div className="relative w-full">
                <div className="absolute left-1/2 top-1/2 z-0 h-[80px] w-[100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400 opacity-50 blur-[60px]" />
                <Image
                  src={privacySrc}
                  alt="tizz trading hive"
                  className="relative z-10 h-[150px] w-full xl:w-[350px]"
                />
              </div>
              <div className="flex flex-col gap-3 px-2 py-3 xl:items-center xl:gap-6 xl:p-6">
                <div className="flex flex-col gap-2 text-center xl:gap-3 xl:text-left">
                  <p className="text-lg font-bold leading-7 text-stone-50 xl:text-xl xl:leading-[30px]">
                    {t("features.card2.title")}
                  </p>
                  <p className="text-xs font-bold leading-[18px] text-neutral-400 xl:text-sm xl:leading-tight">
                    {t("features.card2.description")}
                  </p>
                </div>
              </div>
            </motion.div>
          </GreenCard>
          <GreenCard
            classNames={{
              base: "p-0 pt-4 w-full h-auto gap-[50px] xl:w-[381px] xl:h-[429px] xl:rounded-[20px] xl:gap-0",
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
              <div className="relative flex items-center justify-center">
                <div className="absolute left-0 top-1/2 z-0 h-[80px] w-[100px] -translate-x-[100%] -translate-y-1/2 rounded-full bg-yellow-400 opacity-50 blur-[60px]" />
                <div className="absolute right-0 top-1/2 z-0 h-[80px] w-[100px] -translate-y-1/2 translate-x-[100%] rounded-full bg-yellow-400 opacity-50 blur-[60px]" />
                <Image
                  src={hexGrid}
                  width={400}
                  alt="tizz trading grid"
                  className="absolute -left-[112px] z-10 py-6"
                />
                <Image
                  src={teamsSrc}
                  alt="tizz trading hive"
                  className="relative z-10 h-[150px] py-6 xl:h-[230px] xl:p-0"
                />
              </div>
              <div className="flex flex-col gap-3 px-2 py-3 xl:items-center xl:gap-6 xl:px-6 xl:py-0">
                <div className="flex flex-col gap-2 text-center xl:gap-3 xl:text-left">
                  <p className="text-lg font-bold leading-7 text-stone-50 xl:text-xl xl:leading-[30px]">
                    {t("features.card3.title")}
                  </p>
                  <p className="text-xs font-bold leading-[18px] text-neutral-400 xl:text-sm xl:leading-tight">
                    {t("features.card3.description")}
                  </p>
                </div>
              </div>
            </motion.div>
          </GreenCard>
        </div>
      </div>

      <div className="hidden w-full flex-col items-center gap-6 lg:flex xl:hidden">
        <div className="flex w-full flex-row items-stretch gap-6">
          <GreenCard
            classNames={{
              base: "p-0 w-full h-auto",
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
                src={tradingHiveSrc}
                className="w-full xl:hidden"
                alt="tizz trading hive"
              />
              <Image
                src={tradingHiveDesktopSrc}
                className="hidden w-full xl:block xl:h-[524px]"
                alt="tizz trading hive"
              />
              <div className="flex flex-col gap-3 px-2 py-3 xl:flex-1 2xl:justify-center 2xl:gap-6 2xl:p-6">
                <div className="flex flex-col gap-2 text-center 2xl:gap-3 2xl:text-left">
                  <p className="text-lg font-bold leading-7 text-stone-50 2xl:text-xl 2xl:leading-[30px]">
                    {t("features.card1.title")}
                  </p>
                  <p className="text-xs font-bold leading-[18px] text-neutral-400 2xl:text-sm 2xl:leading-tight">
                    {t("features.card1.description")}
                  </p>
                </div>

                <Link href="/tizz-trade" className="w-full">
                  <Button className="w-full rounded-md border-none bg-yellow-400 px-3 py-2 text-[10px] leading-3 text-black 2xl:w-fit 2xl:px-8 2xl:text-base 2xl:leading-normal">
                    {t("launch-app")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </GreenCard>

          <div className="flex w-full flex-col items-center gap-6">
            <GreenCard
              classNames={{
                base: "p-0 w-full h-auto",
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
                <div className="relative h-[170px] w-full overflow-hidden 2xl:h-[261px] 2xl:w-full">
                  <Image
                    src={maximizeRewardsSrc}
                    className="absolute left-1/2 h-full w-full -translate-x-1/2 2xl:h-[400px] "
                    alt="tizz trading hive"
                  />
                </div>
                <div className="flex flex-col gap-3 px-2 py-3 2xl:items-center 2xl:gap-6 2xl:p-6">
                  <div className="flex flex-col gap-2 text-center 2xl:gap-3 2xl:text-left">
                    <p className="text-lg font-bold leading-7 text-stone-50 2xl:text-xl 2xl:leading-[30px]">
                      {t("features.card4.title")}
                    </p>
                    <p className="text-xs font-bold leading-[18px] text-neutral-400 2xl:text-sm 2xl:leading-tight">
                      {t("features.card4.description")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </GreenCard>
            <GreenCard
              classNames={{
                base: "p-0 pt-4 w-full h-auto gap-[50px] 2xl:w-[381px] 2xl:h-[429px] 2xl:rounded-[20px]",
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
                <div className="relative w-full">
                  <div className="absolute left-1/2 top-1/2 z-0 h-[80px] w-[100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400 opacity-50 blur-[60px]" />
                  <Image
                    src={privacySrc}
                    alt="tizz trading hive"
                    className="relative z-10 h-[150px] w-full 2xl:w-[350px]"
                  />
                </div>
                <div className="flex flex-col gap-3 px-2 py-3 2xl:items-center 2xl:gap-6 2xl:p-6">
                  <div className="flex flex-col gap-2 text-center 2xl:gap-3 2xl:text-left">
                    <p className="text-lg font-bold leading-7 text-stone-50 2xl:text-xl 2xl:leading-[30px]">
                      {t("features.card2.title")}
                    </p>
                    <p className="text-xs font-bold leading-[18px] text-neutral-400 2xl:text-sm 2xl:leading-tight">
                      {t("features.card2.description")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </GreenCard>
            <GreenCard
              classNames={{
                base: "p-0 pt-4 w-full h-auto gap-[50px] 2xl:w-[381px] 2xl:h-[429px] 2xl:rounded-[20px] 2xl:gap-0",
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
                <div className="relative flex items-center justify-center">
                  <div className="absolute left-0 top-1/2 z-0 h-[80px] w-[100px] -translate-x-[100%] -translate-y-1/2 rounded-full bg-yellow-400 opacity-50 blur-[60px]" />
                  <div className="absolute right-0 top-1/2 z-0 h-[80px] w-[100px] -translate-y-1/2 translate-x-[100%] rounded-full bg-yellow-400 opacity-50 blur-[60px]" />
                  <Image
                    src={hexGrid}
                    width={400}
                    alt="tizz trading grid"
                    className="absolute -left-[112px] z-10 py-6"
                  />
                  <Image
                    src={teamsSrc}
                    alt="tizz trading hive"
                    className="relative z-10 h-[150px] py-6 2xl:h-[230px] 2xl:p-0"
                  />
                </div>
                <div className="flex flex-col gap-3 px-2 py-3 xl:py-0 2xl:items-center 2xl:gap-6 2xl:px-6">
                  <div className="flex flex-col gap-2 text-center xl:gap-3 xl:text-left">
                    <p className="text-lg font-bold leading-7 text-stone-50 xl:text-xl xl:leading-[30px]">
                      {t("features.card3.title")}
                    </p>
                    <p className="text-xs font-bold leading-[18px] text-neutral-400 xl:text-sm xl:leading-tight">
                      {t("features.card3.description")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </GreenCard>
          </div>
        </div>
      </div>
    </div>
  );
}
