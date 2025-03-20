import { Lato } from "next/font/google";

import { Button, ButtonProps } from "@nextui-org/react";
import { twMerge } from "tailwind-merge";

import BubbleLoader from "@/components/loaders/BubbleLoader";

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

type PredictionColor = "green" | "red";

const bgClassesByColor: Record<
  PredictionColor,
  { disabled: string; default: string }
> = {
  green: {
    default: "bg-gradient-to-b from-[#4caf50] to-[#246a54]",
    disabled: "bg-[#032b1a]",
  },
  red: {
    default: "bg-gradient-to-b from-[#ff6767] to-[#993d3d]",
    disabled: "bg-[#420e0b]",
  },
};

export type PredictionButtonProps = Omit<ButtonProps, "color"> & {
  color: PredictionColor;
};

export default function PredictionButton({
  color,
  children,
  isLoading,
  ...props
}: PredictionButtonProps) {
  return (
    <Button
      aria-label="prediction-button"
      disableRipple
      {...props}
      className={twMerge(
        "flex h-10 items-center gap-2 rounded-lg text-base font-medium text-[#f8fff6]",
        props.isDisabled
          ? bgClassesByColor[color].disabled
          : bgClassesByColor[color].default,
        lato.className,
        props.className,
      )}
    >
      {isLoading ? <BubbleLoader /> : children}
    </Button>
  );
}
