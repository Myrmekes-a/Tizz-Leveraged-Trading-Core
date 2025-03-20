import Image from "next/image";
import { useTranslations } from "next-intl";

import logo from "@/assets/icons/TizzLogo.svg";
import { Divider } from "@nextui-org/react";
import { Link } from "@/navigation";

export function Footer() {
  const t = useTranslations("Tizz-Footer");

  return (
    <footer className="-mx-4 flex w-screen flex-col items-center gap-8 pb-[80px] 2xl:mt-[20px] 2xl:p-[80px]">
      <Image src={logo} alt="tizz logo" height={41} />
      <Divider className="bg-green-950" />
      <div className="flex w-full flex-col items-center justify-between gap-6 2xl:flex-row">
        <p className="text-xs leading-[18px] 2xl:text-xl 2xl:leading-[30px]">
          {t("rights")}
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="#"
            className="text-xs leading-[18px] 2xl:text-xl 2xl:leading-[30px]"
          >
            {t("privacy-policy")}
          </Link>
          <Link
            href="#"
            className="text-xs leading-[18px] 2xl:text-xl 2xl:leading-[30px]"
          >
            {t("terms-of-service")}
          </Link>
          <Link
            href="#"
            className="text-xs leading-[18px] 2xl:text-xl 2xl:leading-[30px]"
          >
            {t("cookies-settings")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
