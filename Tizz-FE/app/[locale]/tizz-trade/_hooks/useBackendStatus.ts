"use client";

import { BackendStatus } from "@/types/index";
import { useQuery } from "@tanstack/react-query";

export const BACKEND_STATUS_KEY = "bakend-status-key";

export function useBackendStatus() {
  const query = useQuery<BackendStatus>({
    queryKey: [BACKEND_STATUS_KEY],
    queryFn: async () => {
      return Promise.resolve({
        supra: true,
        "websocket-provider": true,
      });
    },
  });

  return query;
}
