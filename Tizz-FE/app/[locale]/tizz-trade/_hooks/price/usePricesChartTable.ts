"use client";

import { useQuery } from "@tanstack/react-query";

import { getChartTable } from "@/tizz-trade-actions/client/getChartTable";

export function usePricesChartTable({
  pairIndex,
  from,
  to,
  range,
}: {
  pairIndex: number;
  from: number;
  to: number;
  range: number;
}) {
  const { data } = useQuery({
    queryKey: ["prices-chart-table", { pairIndex, from, to, range }],
    queryFn: async () => {
      return getChartTable({ pairIndex, from, to, range });
    },
  });

  return data;
}
