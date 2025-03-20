"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserByAddress } from "@/tizz-trade-actions/client/guild/user/getUserByAddress";
import { GuildApiError, IGuildUserWithDetails } from "@/types/index";
import { isAddress } from "viem";

export function useGetUserByAddress(address: string) {
  const query = useQuery<
    IGuildUserWithDetails | null,
    GuildApiError,
    IGuildUserWithDetails | null
  >({
    queryKey: ["getUserByAddress", address],
    queryFn: async () => {
      if (!address || !isAddress(address)) {
        return Promise.resolve(null);
      }

      return getUserByAddress(address);
    },
  });

  return query;
}
