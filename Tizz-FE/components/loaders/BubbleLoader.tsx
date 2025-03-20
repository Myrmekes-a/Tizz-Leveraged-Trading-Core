import { memo } from "react";

import ReactLoading from "react-loading";

export default memo(function BubbleLoader({ color }: { color?: string }) {
  return <ReactLoading type={"bubbles"} color={color || "#d1d1d1"} />;
});
