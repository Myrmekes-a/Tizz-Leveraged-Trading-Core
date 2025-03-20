// icon:star | System UIcons https://systemuicons.com/ | Corey Ginnivan
import { SVGProps } from "./types";

function EmptyStarIcon({
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
        fill="none"
        stroke={fill ? fill : "currentColor"}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 14.5l-5 3 2-5.131-4-3.869h5l2-5 2 5h5l-4 4 2 5z"
      />
    </svg>
  );
}

export default EmptyStarIcon;
