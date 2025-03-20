import { Skeleton } from "@nextui-org/react";

export function PredictionControlPanelSkeleton() {
  return (
    <div className="z-0 flex w-full flex-col gap-3.5 rounded-[14px] border border-[#282834] bg-[#14141a] px-3 py-4 md:max-w-[450px] lg:px-[18px] lg:py-6 2xl:max-w-[624px]">
      <Skeleton className="h-[220px] w-full rounded-md !bg-[#2a2a38]" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-[110px] rounded-md !bg-[#2a2a38]" />
          <Skeleton className="h-[100px] w-full rounded-md !bg-[#2a2a38]" />
        </div>

        <div className="flex w-full items-center justify-between gap-10">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-[130px] rounded-md !bg-[#2a2a38]" />
            <Skeleton className="h-6 w-[210px] rounded-md !bg-[#2a2a38]" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-6 w-[50px] rounded-md !bg-[#2a2a38]" />
            <Skeleton className="h-7 w-[30px] rounded-md !bg-[#2a2a38]" />
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex w-full flex-col gap-2.5 md:flex-row">
            <Skeleton className="h-11 w-full rounded-md !bg-[#2a2a38]" />
            <Skeleton className="h-11 w-full rounded-md !bg-[#2a2a38]" />
          </div>

          <Skeleton className="h-7 w-[calc(100%-100px)] rounded-md !bg-[#2a2a38]" />
        </div>
      </div>
    </div>
  );
}
