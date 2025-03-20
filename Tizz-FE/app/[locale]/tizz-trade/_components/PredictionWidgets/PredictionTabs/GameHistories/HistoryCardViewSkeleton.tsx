import { Skeleton } from "@nextui-org/react";

import BaseCard from "@/components/cards/BaseCard/BaseCard";

export function HistoryCardViewSkeleton() {
  return (
    <BaseCard
      classNames={{
        base: "px-[18px] shrink-0 py-6 rounded-[14px] w-[325px] h-[490px] gap-8 md:w-[450px] bg-[#14141A] justify-between",
      }}
    >
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between text-[#aaaaaa]">
          <Skeleton className="h-7 w-[60px] rounded-md !bg-[#2a2a38]" />
          <Skeleton className="h-7 w-[80px] rounded-md !bg-[#2a2a38]" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3.5">
            <Skeleton className="h-7 w-[130px] rounded-md !bg-[#2a2a38]" />

            <div className="flex items-center gap-3.5">
              <Skeleton className="h-10 w-[200px] rounded-md !bg-[#2a2a38]" />
              <Skeleton className="h-10 w-[100px] rounded-full !bg-[#2a2a38]" />
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex w-1/2 flex-col gap-1">
                <Skeleton className="h-5 w-[80px] rounded-md !bg-[#2a2a38]" />
                <Skeleton className="h-7 w-[100px] rounded-md !bg-[#2a2a38]" />
              </div>
              <div className="flex w-1/2 flex-col gap-1">
                <Skeleton className="h-5 w-[80px] rounded-md !bg-[#2a2a38]" />
                <Skeleton className="h-7 w-[100px] rounded-md !bg-[#2a2a38]" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex w-1/2 flex-col gap-1">
                <Skeleton className="h-5 w-[80px] rounded-md !bg-[#2a2a38]" />
                <Skeleton className="h-7 w-[100px] rounded-md !bg-[#2a2a38]" />
              </div>
              <div className="flex w-1/2 flex-col gap-1">
                <Skeleton className="h-5 w-[80px] rounded-md !bg-[#2a2a38]" />
                <Skeleton className="h-7 w-[100px] rounded-md !bg-[#2a2a38]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-full rounded-md !bg-[#2a2a38]" />
          <Skeleton className="h-10 w-full rounded-md !bg-[#2a2a38]" />
        </div>
      </div>

      <Skeleton className="h-10 w-full rounded-md !bg-[#2a2a38]" />
    </BaseCard>
  );
}
