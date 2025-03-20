import { twMerge } from "tailwind-merge";
import { Skeleton } from "@nextui-org/react";

export function LockedRoundSkeleton() {
  return (
    <div
      className={twMerge(
        "relative flex min-h-[400px] w-full flex-col items-center justify-center gap-[40px] overflow-hidden rounded-[14px] bg-[#282834] py-6",
      )}
    >
      <div className="absolute left-[1px] top-[1px] h-[calc(100%-2px)] w-[calc(100%-2px)] rounded-[14px] bg-[#14141a]" />

      <div className="z-10 flex items-center gap-5 2xl:gap-[66px]">
        <Skeleton className="h-6 w-[80px] rounded-full !bg-[#2a2a38] 2xl:h-[36px] 2xl:w-[170px]" />
        <Skeleton className="h-6 w-[120px] rounded-full !bg-[#2a2a38] 2xl:h-[36px] 2xl:w-[200px]" />
        <Skeleton className="h-6 w-[80px] rounded-full !bg-[#2a2a38] 2xl:h-[36px] 2xl:w-[170px]" />
      </div>

      <div className="relative z-20 flex flex-col items-center gap-6 2xl:gap-[50px]">
        <div className="flex flex-col items-center gap-3.5 2xl:gap-10">
          <Skeleton className="h-7 w-[180px] rounded-md !bg-[#2a2a38] 2xl:h-10" />
          <div className="flex items-center justify-start gap-2.5">
            <Skeleton className="h-[60px] w-[200px] rounded-md !bg-[#2a2a38] 2xl:h-[80px] 2xl:w-[350px]" />

            <Skeleton className="h-7 w-[80px] rounded-full !bg-[#2a2a38] 2xl:h-10" />
          </div>
        </div>

        <div className="flex items-center gap-[50px] 2xl:gap-[100px]">
          <Skeleton className="h-8 w-[130px] rounded-full !bg-[#2a2a38] 2xl:h-10 2xl:w-[180px]" />
          <Skeleton className="h-8 w-[130px] rounded-full !bg-[#2a2a38] 2xl:h-10 2xl:w-[180px]" />
        </div>
      </div>

      <div className="z-10 flex items-center gap-6 2xl:gap-[100px]">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-[100px] rounded-md !bg-[#2a2a38]" />
          <Skeleton className="h-10 w-[150px] rounded-md !bg-[#2a2a38]" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-[100px] rounded-md !bg-[#2a2a38]" />
          <Skeleton className="h-10 w-[150px] rounded-md !bg-[#2a2a38]" />
        </div>
      </div>
    </div>
  );
}
