import Image from "next/image";
import { useTranslations } from "next-intl";

import BorderedInput from "@/components/inputs/BorderedInput/BorderedInput";
import Button from "@/components/buttons/Button/Button";
import CheckIcon from "@/components/icons/CheckIcon";

import rasiginWithHandSrc from "@/assets/images/layers/rasiginWithHand.svg";

export function Content8() {
  const t = useTranslations("Tizz-Content");

  return (
    <div className="relative -mx-4 flex h-[500px] flex-col items-center justify-center gap-8 bg-stone-50 p-6 2xl:mt-[200px] 2xl:h-[539px] 2xl:w-screen 2xl:overflow-hidden">
      <div className="absolute left-1/2 z-10 w-full -translate-x-1/2 2xl:w-[1400px]">
        <div className="2xl:flex-start flex flex-col gap-8 p-6 2xl:w-[757px] 2xl:gap-[60px] 2xl:p-0">
          <div className="flex flex-col gap-4 text-center 2xl:gap-[35px] 2xl:text-start">
            <p className="text-2xl font-bold leading-[30px] text-black 2xl:text-3xl 2xl:leading-[38px]">
              {t("be-the-first-to-know.title")}
            </p>
            <p className="text-sm font-semibold leading-tight text-black 2xl:text-base 2xl:font-bold 2xl:leading-normal">
              {t("be-the-first-to-know.description")}
            </p>
          </div>

          <div className="flex flex-col gap-[14px]">
            <p className="text-center text-2xl font-bold leading-[30px] text-black">
              Sign me up!
            </p>
            <div className="flex flex-col gap-[35px] pb-4 2xl:gap-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center">
                  <CheckIcon size={32} className="text-black" />
                </div>
                <p className="text-sm font-semibold leading-tight text-black 2xl:text-base 2xl:font-bold 2xl:leading-normal">
                  {t("be-the-first-to-know.exclusive-access")}
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center">
                  <CheckIcon size={32} className="block text-black" />
                </div>
                <p className="text-sm font-semibold leading-tight text-black 2xl:text-base 2xl:font-bold 2xl:leading-normal">
                  {t("be-the-first-to-know.priority-support")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <BorderedInput
                type="email"
                placeholder={t("be-the-first-to-know.placeholder")}
                labelPlacement="outside"
                required
                fullWidth
                classNames={{
                  base: "bg-white border-black rounded-lg",
                  input: "!text-black",
                }}
              />
              <Button className="rounded-lg border-none bg-yellow-400 px-5 py-2.5 text-sm leading-normal text-neutral-950">
                {t("be-the-first-to-know.sign-up")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Image
        src={rasiginWithHandSrc}
        alt="mascot with rasing hand"
        className="absolute left-1/2 top-1/2 z-0 hidden w-[1000px] -translate-y-1/2 translate-x-[100px] 2xl:block"
      />
    </div>
  );
}
