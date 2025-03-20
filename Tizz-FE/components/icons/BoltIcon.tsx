import { SVGProps } from "./types";

export default function BoltIcon({
  fill = "currentColor",
  filled,
  size = 32,
  height,
  width,
  ...props
}: SVGProps) {
  return (
    <svg
      width={width || size}
      height={height || size}
      viewBox={`0 0 ${size} ${size}`}
      fill={filled ? fill : "none"}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" />
      <path d="M13 3v7h6l-8 11v-7H5l8-11" />
    </svg>
  );
}
