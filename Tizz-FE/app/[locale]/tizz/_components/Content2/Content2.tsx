"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useMedia } from "react-use";
import { useTranslations } from "next-intl";

import landingBg from "@/assets/images/layers/landing-bg.png";

import beehiveRide from "@/assets/images/zentoshi/beehive-ride.gif";
import tizzAssetCoin from "@/assets/images/zentoshi/tizz-asset-coin.svg";
import zentoshiBotanix from "@/assets/images/zentoshi/zentoshi-botanix.svg";

export function Content2() {
  const isMobile = useMedia("(max-width: 1280px)");

  const t = useTranslations("Tizz-Content");

  const slides = [
    {
      id: 1,
      title: t("built-on-bitcoin.subTitle1"),
      description: t("built-on-bitcoin.description1"),
      src: beehiveRide,
    },
    {
      id: 2,
      title: t("built-on-bitcoin.subTitle2"),
      description: t("built-on-bitcoin.description2"),
      src: tizzAssetCoin,
    },
    {
      id: 3,
      title: t("built-on-bitcoin.subTitle3"),
      description: t("built-on-bitcoin.description3"),
      src: zentoshiBotanix,
    },
  ];

  return (
    <div className="relative h-[1000px] md:h-[700px] xl:top-[100px] xl:h-[844px]">
      <Image
        src={landingBg}
        className="absolute -top-[130px] left-1/2 z-0 h-full w-screen -translate-x-1/2 object-cover opacity-60 backdrop-opacity-50 backdrop-filter xl:top-0"
        alt="landing bg"
      />
      <div className="absolute left-1/2 top-[240px] z-10 h-[688px] w-[752px] -translate-x-[100%] rounded-full bg-neutral-950 blur-[500px]" />

      <div className="absolute left-[calc(50%+158px)] top-[235px] z-10 h-[305px] w-[396px] rounded-full bg-green-400 opacity-20 blur-[400px]" />

      <div className="relative z-10 flex flex-col items-center gap-3 xl:gap-[134px]">
        <p className="text-2xl font-black leading-loose text-stone-50 xl:py-2.5 xl:text-5xl">
          {t("built-on-bitcoin.title")}
        </p>

        <div className="flex flex-col-reverse items-center gap-[120px] xl:flex-row xl:gap-[130px]">
          <div className="relative h-[500px] w-full md:h-[200px] xl:w-[676px]">
            {slides.map((slide, index) => (
              <motion.div
                key={slide.id}
                animate={
                  !isMobile
                    ? {
                        y: [400, 0, 0, -400],
                        opacity: [0, 1, 1, 0],
                      }
                    : {
                        opacity: [0, 1, 1, 0],
                      }
                }
                transition={{
                  repeat: Infinity,
                  duration: 6,
                  delay: index * 6,
                  repeatDelay: 12,
                  times: [0, 0.1, 0.9, 1],
                  ease: "linear",
                }}
              >
                <div className="absolute left-1/2 top-0 w-full -translate-x-1/2 flex-col gap-3 text-center md:w-[600px] lg:w-[900px] xl:mt-[147px] xl:flex xl:w-[600px] xl:gap-[42px] xl:text-left">
                  <p className="text-2xl font-bold leading-loose text-stone-50 xl:text-3xl xl:font-black xl:leading-[38px]">
                    {slide.title}
                  </p>
                  <p className="px-3 text-base font-bold text-neutral-400 md:px-0">
                    {slide.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="relative h-[310px] w-[310px] xl:h-[514px] xl:w-[514px]">
            {slides.map((slide, index) => (
              <motion.div
                key={slide.id}
                animate={{
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 6,
                  delay: index * 6,
                  repeatDelay: 12,
                  times: [0, 0.2, 0.9, 1],
                  ease: "linear",
                }}
              >
                <Image
                  src={slide.src}
                  alt="beehive ride"
                  className="absolute w-full xl:h-[514px] xl:w-[514px]"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
