"use client";

import { useChainId } from "wagmi";
import { useQuery } from "@tanstack/react-query";

import { getPredictionVariables } from "@/utils/tizz";

export function usePredictionVariables() {
  const chainId = useChainId();

  const { data } = useQuery({
    queryKey: ["prediction-variables", { chainId }],
    queryFn: async () => {
      const pv = await getPredictionVariables();

      if (pv === undefined) {
        return null;
      }

      return pv;
    },
  });

  return data;
}
