"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { useGetPredictionRound } from "@/tizz-trade-hooks/prediction/useGetPredictionRound";
import { useGetUserRoundBetInfo } from "@/tizz-trade-hooks/prediction/useGetPredictionUserRoundBetInfo";
import { WinModal } from "./WinModal";
import { LossModal } from "./LossModal";

export type MonitoringRoundProps = {
  monitorEpoch: number;
};

export function MonitoringRound({ monitorEpoch }: MonitoringRoundProps) {
  const { address } = useAccount();

  const monitorRound = useGetPredictionRound(monitorEpoch);
  const betInfo = useGetUserRoundBetInfo(address, monitorEpoch);

  const [status, setStatus] = useState<
    "loading" | "skipped" | "locked" | "just expired" | "expired"
  >("loading");

  useEffect(() => {
    if (monitorEpoch) {
      setStatus("loading");
    }
  }, [monitorEpoch]);

  useEffect(() => {
    if (!monitorRound?.epoch || monitorRound?.epoch !== monitorEpoch) {
      return;
    }

    if (
      monitorRound?.lock_price === null ||
      monitorRound?.lock_price === undefined
    ) {
      setStatus("skipped");
      return;
    }

    if (
      monitorRound?.end_price === null ||
      monitorRound?.end_price === undefined
    ) {
      setStatus("locked");
      return;
    }

    if (status === "locked") {
      setStatus("just expired");
      return;
    }

    if (status === "loading") {
      setStatus("expired");
    }
  }, [
    monitorEpoch,
    monitorRound?.end_price,
    monitorRound?.lock_price,
    monitorRound?.epoch,
    status,
  ]);

  useEffect(() => {
    if (status === "just expired") {
      setTimeout(() => {
        setStatus((prev) => (prev === "just expired" ? "expired" : prev));
      }, 10000);
    }
  }, [status]);

  const handleCloseModal = () => {
    setStatus("expired");
  };

  if (!betInfo || status !== "just expired" || !monitorRound) {
    return null;
  }

  const roundPosition =
    !monitorRound.end_price || !monitorRound.lock_price
      ? 2
      : monitorRound.end_price > monitorRound.lock_price
        ? 0
        : monitorRound.end_price < monitorRound.lock_price
          ? 1
          : 2;

  const upPayout = Number(monitorRound.bull_bet_amount)
    ? Number(monitorRound.total_bet_amount) /
      Number(monitorRound.bull_bet_amount)
    : 0;
  const downPayout = Number(monitorRound.bear_bet_amount)
    ? Number(monitorRound.total_bet_amount) /
      Number(monitorRound.bear_bet_amount)
    : 0;

  const winnerPayout = roundPosition === 0 ? upPayout : downPayout;

  const claimableAmount =
    roundPosition === 2
      ? betInfo.amount || 0
      : (betInfo.amount || 0) * winnerPayout;

  if (betInfo.position === roundPosition || roundPosition === 2) {
    return (
      <WinModal onClose={handleCloseModal} claimableAmount={claimableAmount} />
    );
  }

  return <LossModal onClose={handleCloseModal} amount={betInfo.amount || 0} />;
}
