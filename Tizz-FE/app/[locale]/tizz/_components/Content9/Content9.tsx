import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

import Button from "@/components/buttons/Button/Button";
import TelegramIcon from "@/components/icons/social/TelegramIcon";
import XIcon from "@/components/icons/social/XIcon";
import DiscordIcon from "@/components/icons/social/DiscordIcon";
import GitbookIcon from "@/components/icons/social/GitbookIcon";
import GreenCard from "@/components/cards/GreenCard/GreenCard";

export function Content9() {
  const t = useTranslations("Tizz-Content");

  const communities = [
    {
      id: "colony",
      title: t("join-the-tizz-community.card1.title"),
      description: t("join-the-tizz-community.card1.description"),
      actionComs: (
        <div className="flex items-center gap-3">
          <Link href="#">
            <Button
              isIconOnly
              className="w-fit !min-w-0 !border-none bg-transparent !p-0 text-yellow-400 transition-all hover:scale-105"
            >
              <TelegramIcon size={24} className="scale-75 xl:scale-100" />
            </Button>
          </Link>
          <Link href="#">
            <Button
              isIconOnly
              className="w-fit !min-w-0 !border-none bg-transparent !p-0 text-yellow-400 transition-all hover:scale-105"
            >
              <XIcon size={24} className="scale-75 xl:scale-100" />
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: "forums",
      title: t("join-the-tizz-community.card2.title"),
      description: t("join-the-tizz-community.card2.description"),
      actionComs: (
        <Link href="#">
          <Button
            className="items-center rounded-lg border-none bg-yellow-400 px-5 py-2 text-base leading-none text-black transition-all hover:scale-105"
            endContent={
              <DiscordIcon size={24} className="scale-75 xl:scale-100" />
            }
          >
            Discord
          </Button>
        </Link>
      ),
    },
    {
      id: "documents",
      title: t("join-the-tizz-community.card3.title"),
      description: t("join-the-tizz-community.card3.description"),
      actionComs: (
        <Link href="#">
          <Button
            className="items-center rounded-lg border-none bg-yellow-400 px-5 py-2 text-base leading-none text-black transition-all hover:scale-105"
            endContent={
              <GitbookIcon size={24} className="scale-75 xl:scale-100" />
            }
          >
            Gitbook
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-6 text-center xl:mt-[200px] xl:gap-[60px]">
      <p className="text-2xl font-bold text-stone-50 xl:text-5xl xl:leading-[38px]">
        {t("join-the-tizz-community.title")}
      </p>
      <div className="flex flex-col gap-6 md:flex-row">
        {communities.map((item) => (
          <GreenCard
            key={item.id}
            classNames={{
              base: "justify-between gap-4 p-4 rounded-3xl text-left xl:px-[34px] xl:py-[24px]",
            }}
          >
            <div className="flex flex-col gap-2 xl:gap-4">
              <p className="text-xl font-bold leading-[30px] text-white">
                {item.title}
              </p>
              <p className="text-sm font-semibold leading-tight text-neutral-400">
                {item.description}
              </p>
            </div>
            {item.actionComs}
          </GreenCard>
        ))}
      </div>
    </div>
  );
}
