import { Button, ButtonProps } from "@nextui-org/react";
import { twMerge } from "tailwind-merge";

export default function BaseButton(props: ButtonProps) {
  return (
    <Button
      aria-label="BaseButton"
      disableRipple
      {...props}
      className={twMerge(
        "flex h-auto items-center gap-1 rounded-md bg-neutral-800 text-xs font-semibold text-gray-400",
        props.className,
      )}
    />
  );
}
