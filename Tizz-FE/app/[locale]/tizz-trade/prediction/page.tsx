"use client";

import { useEffect, useState } from "react";

import { UnixTime } from "@/utils/getUnixTime";
import { getCurrentEpoch } from "@/utils/tizz";

import { MonitoringRound } from "@/tizz-trade-components/PredictionWidgets/MonitoringRound/MonitoringRound";
import { LockedRound } from "@/tizz-trade-components/PredictionWidgets/LockedRound/LockedRound";
import { PredictionControlPanel } from "@/tizz-trade-components/PredictionWidgets/PredictionControlPanel/PredictionControlPanel";
import { PredictionTabs } from "@/tizz-trade-components/PredictionWidgets/PredictionTabs/PredictionTabs";
import { StatusCardsBar } from "@/tizz-trade-components/PredictionWidgets/StatusCardsBar/StatusCardsBar";

import { usePricingCharts } from "@/tizz-trade-hooks/price/usePricingCharts";
import { usePredictionSubscriptions } from "@/tizz-trade-hooks/prediction/usePredictionSubscriptions";
import { usePredictionVariables } from "@/tizz-trade-hooks/prediction/usePredictionVariables";

export default function Page() {
  usePredictionSubscriptions();
  const pv = usePredictionVariables();

  const pricingCharts = usePricingCharts();

  const [currentTimestamp, setCurrentTimestamp] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(UnixTime.getUnixTime());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const currentPrice =
    pricingCharts && pricingCharts.closes?.[0] !== undefined
      ? pricingCharts.closes?.[0]
      : 0;

  const currentEpoch = pv
    ? getCurrentEpoch(pv.startedTimestamp, pv.intervalSeconds)
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <LockedRound
          currentTimestamp={currentTimestamp}
          currentPrice={currentPrice}
          epoch={currentEpoch ? Math.max(currentEpoch - 1, 1) : 1}
          bufferSeconds={pv?.bufferSeconds || 0}
        />
        <PredictionControlPanel
          currentTimestamp={currentTimestamp}
          currentPrice={currentPrice}
          epoch={currentEpoch || 1}
          minBetAmount={pv?.minBetAmount || 0n}
          bufferSeconds={pv?.bufferSeconds || 0}
        />
        <MonitoringRound
          monitorEpoch={currentEpoch ? Math.max(currentEpoch - 2, 1) : 1}
        />
      </div>
      <StatusCardsBar currentPrice={currentPrice} />
      <PredictionTabs currentEpoch={currentEpoch || 1} />
    </div>
  );
}
