import { Skeleton } from "@nextui-org/react";

import BaseCard from "@/components/cards/BaseCard/BaseCard";

export function StatusCardsBarSkeleton() {
  return (
    <div className="flex w-full items-center gap-6 overflow-x-auto">
      <BaseCard
        classNames={{
          base: "py-6 shrink-0 px-3.5 h-[118px] min-w-[300px] xl:flex-1 rounded-lg gap-6 items-center flex-row border-[#282834] bg-[#14141A]",
        }}
      >
        <Skeleton className="h-[70px] w-[70px] rounded-xl !bg-[#2a2a38]" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-[60px] rounded-md !bg-[#2a2a38]" />
          <div className="flex w-fit min-w-[217px] items-center justify-between gap-3.5">
            <Skeleton className="h-10 w-[100px] rounded-md !bg-[#2a2a38]" />
            <Skeleton className="h-10 w-[84px] rounded-md !bg-[#2a2a38]" />
          </div>
        </div>
      </BaseCard>

      <BaseCard
        classNames={{
          base: "py-6 shrink-0 px-3.5 h-[118px] min-w-[300px] xl:flex-1 rounded-lg gap-6 items-center flex-row border-[#282834] bg-[#14141A]",
        }}
      >
        <Skeleton className="h-[70px] w-[70px] rounded-xl !bg-[#2a2a38]" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-[36px] rounded-md !bg-[#2a2a38]" />
          <Skeleton className="h-10 w-[70px] rounded-md !bg-[#2a2a38]" />
        </div>
      </BaseCard>

      <BaseCard
        classNames={{
          base: "py-6 shrink-0 px-3.5 h-[118px] min-w-[300px] xl:flex-1 rounded-lg gap-6 items-center flex-row border-[#282834] bg-[#14141A]",
        }}
      >
        <Skeleton className="h-[70px] w-[70px] rounded-xl !bg-[#2a2a38]" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-[112px] rounded-md !bg-[#2a2a38]" />
          <Skeleton className="w-[95px ] h-10 rounded-md !bg-[#2a2a38]" />
        </div>
      </BaseCard>

      <BaseCard
        classNames={{
          base: "py-6 shrink-0 px-3.5 h-[118px] min-w-[300px] xl:flex-1 rounded-lg gap-6 items-center flex-row border-[#282834] bg-[#14141A]",
        }}
      >
        <Skeleton className="h-[70px] w-[70px] rounded-xl !bg-[#2a2a38]" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-[59px] rounded-md !bg-[#2a2a38]" />
          <Skeleton className="h-10 w-[20px] rounded-md !bg-[#2a2a38]" />
        </div>
      </BaseCard>
    </div>
  );
}
