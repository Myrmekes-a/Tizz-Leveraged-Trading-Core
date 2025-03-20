import Image from "next/image";

import tizzNewPose1Src from "@/assets/images/zentoshi/tizz-new-pose-1.svg";
import hexabgSrc from "@/assets/images/hexabg.svg";
import tizzIconSrc from "@/assets/icons/Tizz.svg";

export default function Page() {
  return (
    <div className="relative h-screen w-screen bg-tizz-background">
      <Image
        src={hexabgSrc}
        className="absolute left-1/2 top-1/2 z-10 h-full -translate-x-1/2 -translate-y-1/2 2xl:w-full"
        alt="tizz zentoshi"
      />

      <div className="absolute left-1/2 top-1/2 z-20 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[50px] px-6 md:min-w-[560px] md:gap-[80px]">
        <Image
          src={tizzNewPose1Src}
          className="h-[142px] w-[184px] md:h-[285px] md:w-[368px]"
          alt="tizz zentoshi"
        />

        <div className="flex flex-col items-center gap-6">
          <Image
            src={tizzIconSrc}
            width={200}
            height={77}
            className="h-[38px] w-[100px] md:h-[77px] md:w-[200px]"
            alt="tizz icon"
          />

          <div className="flex flex-col items-center gap-2 text-white">
            <span className="text-center text-xl font-black leading-[30px] md:text-4xl md:leading-[44px] ">
              Tizz is unavailable in your country.
            </span>
            <span className="text-center text-sm leading-[24px] md:text-xl md:leading-[30px]">
              For any questions, please contact{" "}
              <a href="mailto:support@tizz.finance" className="underline">
                support@tizz.finance
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
