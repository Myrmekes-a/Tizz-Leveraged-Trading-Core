"use client";

import { memo, useEffect, useState } from "react";

function makeDots(dots: number) {
  let str = "";

  for (let i = 0; i < dots % 4; i++) {
    str += ".";
  }

  return str;
}

export const RoundLocked = memo(function RoundLocked() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const dotStr = makeDots(dots);

  return (
    <div className="flex w-full items-center justify-center rounded-lg border border-[#282834] bg-gradient-to-b from-[#6C6C8D] to-[#1E1E27] px-6 py-2 text-xl font-bold text-white">
      Preparing round<div className="w-[20px]">{dotStr}</div>
    </div>
  );
});
