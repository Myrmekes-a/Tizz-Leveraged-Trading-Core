import { SVGProps } from "./types";

export default function ChartIcon({
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
      <path
        d="M13.125 1.875L7.875 7.125L5.875 4.125L1.875 8.125"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.625 1.875H13.125V4.375"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
