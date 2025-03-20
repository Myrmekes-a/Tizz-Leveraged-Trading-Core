"use client";

import { useEffect, useRef } from "react";
import { QueryStatus } from "@tanstack/react-query";

export function useDelayedUpdate<T>(newValue: T, status: QueryStatus) {
  const cacheRef = useRef<T>();

  useEffect(() => {
    if (status === "success") {
      cacheRef.current = newValue;
    }
  }, [newValue, status]);

  return cacheRef.current;
}
