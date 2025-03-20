import Image from "next/image";
import { twMerge } from "tailwind-merge";

import hexatizzSrc from "@/assets/icons/hexatizz.svg";
import hexatizzDarkSrc from "@/assets/icons/hexatizz-dark.svg";

export function PredictionStatus({
  status,
}: {
  status: "skipped" | "live" | "pending";
}) {
  return (
    <div
      className={twMerge(
        "relative flex h-5 min-w-[120px] items-center justify-center rounded-full border border-[#572721] text-base font-bold uppercase text-[#fffcfa] lg:h-[30px] lg:min-w-[150px] lg:border-2 lg:px-[40px] lg:py-[2px] 2xl:h-[36px] 2xl:min-w-[200px] 2xl:px-[50px] 2xl:py-[4px]",
        status === "skipped"
          ? "bg-gradient-to-b from-[#FF3D00] to-[#993700]"
          : "bg-gradient-to-b from-[#ffcc00] to-[#993700]",
      )}
      style={{
        textShadow:
          "2px 0 #572721, -2px 0 #572721, 0 2px #572721, 0 -2px #572721, 2px 2px #572721, -2px -2px #572721, 2px -2px #572721, -2px 2px #572721",
      }}
    >
      <Image
        src={status === "skipped" ? hexatizzDarkSrc : hexatizzSrc}
        className="absolute -bottom-1 -left-1 h-[27px] w-[24px] lg:-bottom-2  lg:h-[40px] lg:w-[35px] 2xl:h-[48px] 2xl:w-[42px]"
        alt="hexatizz"
      />
      <Image
        src={status === "skipped" ? hexatizzDarkSrc : hexatizzSrc}
        className="absolute -bottom-1 -right-1 h-[27px] w-[24px] lg:-bottom-2  lg:h-[40px] lg:w-[35px] 2xl:h-[48px] 2xl:w-[42px]"
        alt="hexatizz"
      />
      {status}
    </div>
  );
}
