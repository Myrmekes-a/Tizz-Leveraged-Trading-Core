"use client";

import Image from "next/image";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { HeroNavbar } from "./HeroNavBar";

import landingBg from "@/assets/images/layers/landing-bg.png";
import Button from "@/components/buttons/Button/Button";
import { twMerge } from "tailwind-merge";

export function HeroContent() {
  const t = useTranslations("Tizz-HeroContent");

  const highlights = [
    t("rewards"),
    t("security"),
    t("freedom"),
    t("community"),
  ];

  return (
    <div
      className={twMerge(
        "relative mt-[100px] px-0 py-4 md:mt-[130px]",
        "xl:mt-0 xl:flex xl:h-[844px] xl:w-full xl:items-center xl:justify-center",
      )}
    >
      <Image
        src={landingBg}
        className="absolute -top-[218px] left-1/2 h-full w-screen -translate-x-1/2 object-cover opacity-60 backdrop-opacity-50 backdrop-filter xl:top-0"
        alt="landing bg"
      />
      <div className="z-1 relative flex flex-col items-center gap-10 xl:w-[700px] xl:gap-6">
        <Link href="https://botanix.5thweb.io/">
          <HeroNavbar />
        </Link>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
            <h2 className="text-center text-[30px] font-black leading-[44px] text-stone-50 md:text-[50px] xl:text-7xl xl:leading-[90px]">
              {t("winners-deserve")}
            </h2>
            <div className="flex items-center">
              <h2 className="ml-[30px] text-[30px] font-black leading-[44px] text-stone-50 md:text-[50px] xl:ml-[100px] xl:text-7xl xl:leading-[90px]">
                {t("better")}
              </h2>

              <div className="relative h-[44px] w-[220px] overflow-hidden px-4 md:w-[300px] md:text-[40px] xl:h-[90px] xl:w-[450px]">
                {highlights.map((item, index) => (
                  <motion.div
                    key={item}
                    animate={{
                      x:
                        index === 0
                          ? [-700, 0, 0, 700]
                          : [null, 700, 700, 1400],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      delay: index * 3,
                      repeatDelay: 9,
                      ease: "easeInOut",
                    }}
                  >
                    <h2
                      className={twMerge(
                        "absolute text-[30px] font-black leading-[44px] text-yellow-400 md:text-[50px] xl:text-7xl xl:leading-[90px]",
                        index === 0 ? "" : "-left-[700px]",
                      )}
                    >
                      &ldquo;{item}&rdquo;
                    </h2>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <p className="px-7 py-2.5 text-center text-base font-semibold leading-normal text-stone-50 md:w-[700px] xl:px-0 xl:py-[10px] xl:text-lg xl:font-bold xl:leading-7">
            {t("heroAd")}
          </p>
        </div>

        <div className="flex w-full items-center justify-center gap-6 px-6">
          <Link href="/tizz-trade">
            <Button className="rounded-lg bg-yellow-400 px-4 py-3 text-sm leading-4 text-black xl:px-10 xl:py-[14px] xl:text-[22px] xl:leading-[30px]">
              {t("launch-app")}
            </Button>
          </Link>
          <Button className="rounded-lg border-green-900 bg-green-950 px-4 py-3 text-sm leading-4 text-stone-50 xl:px-10 xl:py-[14px] xl:text-[22px] xl:leading-[30px]">
            {t("learn-more")}
          </Button>
        </div>
      </div>
    </div>
  );
}
