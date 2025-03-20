"use client";

import { useEffect, useRef } from "react";
import { useAnimationFrame } from "framer-motion";
import { getPriceStr } from "@/utils/price";

type Point = {
  x: number;
  y: number;
};

function cubicBezier(t: number, p1: Point, p2: Point) {
  const c = 3 * (p1.y - p1.x);
  const b = 3 * (p2.y - p1.y) - c;
  const a = p2.x - p1.x - c - b;
  return ((a * t + b) * t + c) * t + p1.x;
}

export type AnimatedNumberProps = {
  className?: string;
  duration: number; // this is ms
  value: number;
  fixed?: number;
};

export function AnimatedNumber({
  value,
  duration,
  className,
  fixed,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const valueRef = useRef({
    prev: 0,
    cur: 0,
    changedTime: 0,
  });
  const animationTimeRef = useRef(0);

  useEffect(() => {
    valueRef.current = {
      prev: valueRef.current.cur,
      cur: value,
      changedTime: animationTimeRef.current,
    };
  }, [value]);

  useAnimationFrame((time) => {
    animationTimeRef.current = time;

    const elapsed = time - valueRef.current.changedTime;

    // ended animation for this change
    if (elapsed > duration) {
      return;
    }

    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = cubicBezier(progress, { x: 0, y: 1 }, { x: 1, y: 1 });

    const renderValue =
      valueRef.current.prev +
      (valueRef.current.cur - valueRef.current.prev) * easeProgress;

    if (ref.current) {
      ref.current.innerHTML = `${getPriceStr(renderValue, fixed)}`;
    }
  });

  return <span ref={ref} className={className} />;
}
