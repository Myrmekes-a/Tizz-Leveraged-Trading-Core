"use client";

import { useState, useMemo, useRef, memo } from "react";
import { BetInfoFragment } from "@/gql/graphql";
import { useAccount, useChains } from "wagmi";

import { useGetPredictionRounds } from "@/tizz-trade-hooks/prediction/useGetPredictionRound";

import { ButtonTabs } from "./ButtonTabs";

import PredictionTabControlbar from "./PredictionTabControlbar";

import { ChartViewTab } from "./ChartViewTab";
import {
  GameHistoriesTab,
  GameHistoriesTabHandle,
} from "./GameHistories/GameHistoriesTab";
import { ArrowButtonGroup } from "./ArrowButtonGroup";
import LeaderboardTab from "./LeaderboardTab";
import { useGetUserBetInfos } from "@/tizz-trade-hooks/prediction/useGetPredictionUserRoundBetInfo";

import { HistoryCardProps } from "./GameHistories/HistoryCard";

export type PredictionTabsProps = {
  currentEpoch: number;
};

export const PredictionTabs = memo(function PredictionTabs({
  currentEpoch,
}: PredictionTabsProps) {
  const chains = useChains();
  const account = useAccount();

  const isDisconnected = account.status === "disconnected";
  const isWrongNetwork = !chains.find((item) => item.id === account.chainId);

  const tabItems = [
    {
      id: "chartView",
      label: "Chart View",
      isDisabled: false,
    },
    {
      id: "gameHistory",
      label: "Game History",
      isDisabled: isDisconnected || isWrongNetwork,
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      isDisabled: false,
    },
  ];

  const [activeTab, setActiveTab] = useState(tabItems[0].id);
  const [isShowOnlyMyRound, setIsShowOnlyMyRound] = useState(false);

  const tabRef = useRef<GameHistoriesTabHandle>(null);

  const { data, status, fetchPrev } = useGetPredictionRounds();
  const { bets } = useGetUserBetInfos(account.address);

  const handleChangeActiveTab = (tab: string) => {
    setActiveTab(tab);
  };

  const handleChangeShowOnlyMyRound = (value: boolean) => {
    setIsShowOnlyMyRound(value);
  };

  const handleMoveToLeft = () => {
    if (!tabRef.current) {
      return;
    }

    tabRef.current.moveToLeft();
  };

  const handleMoveToRight = () => {
    if (!tabRef.current) {
      return;
    }

    tabRef.current.moveToRight();
  };

  const allHistories = useMemo(() => {
    if (!data || status !== "success") {
      return {
        histories: [],
        initialIndex: 0,
      };
    }

    const betByEpoch = new Map<number, BetInfoFragment>();

    bets.forEach((bet) => betByEpoch.set(bet.round.epoch, bet));

    const latestEpochForHistory = Math.max(currentEpoch - 2, 1);

    const previousHistories = data.rounds.map((round) => ({
      epoch: round.epoch,
      round,
      bet: betByEpoch.get(round.epoch),
    }));

    const afterHistories: HistoryCardProps[] = [];

    for (let i = data.toEpoch + 1; i <= latestEpochForHistory; i++) {
      afterHistories.push({
        epoch: i,
        bet: betByEpoch.get(i),
      });
    }

    return {
      histories: [...previousHistories, ...afterHistories],
      initialIndex: previousHistories.length,
    };
  }, [data, status, bets, currentEpoch]);

  const myHistories = useMemo(() => {
    const latestEpochForHistory = Math.max(currentEpoch - 2, 1);

    const histories = bets
      .sort((bet1, bet2) => bet1.round.epoch - bet2.round.epoch)
      .map((bet) => ({
        epoch: bet.round.epoch,
        bet,
      }))
      .filter((bet) => bet.epoch <= latestEpochForHistory);

    return {
      histories,
      initialIndex: histories.length,
    };
  }, [bets, currentEpoch]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-5 md:flex-row md:justify-between">
        <ButtonTabs
          items={tabItems}
          activeTab={activeTab}
          onChangeTab={handleChangeActiveTab}
        />

        {activeTab === "gameHistory" && (
          <PredictionTabControlbar
            showOnlyMyRound={isShowOnlyMyRound}
            onChangeShowOnlyMyRound={handleChangeShowOnlyMyRound}
            onClickNext={handleMoveToRight}
            onClickPrev={handleMoveToLeft}
          />
        )}
      </div>

      {activeTab === "chartView" && <ChartViewTab />}
      {activeTab === "gameHistory" &&
        (isShowOnlyMyRound ? (
          <GameHistoriesTab
            key="my histories"
            ref={tabRef}
            histories={myHistories.histories}
            initialTopMostItemIndex={myHistories.initialIndex}
            fetchPrev={() => {}}
          />
        ) : (
          <GameHistoriesTab
            key="all histories"
            ref={tabRef}
            histories={allHistories.histories}
            initialTopMostItemIndex={allHistories.initialIndex}
            fetchPrev={fetchPrev}
          />
        ))}
      {activeTab === "leaderboard" && <LeaderboardTab />}

      {activeTab === "gameHistory" && (
        <div className="hidden justify-center md:flex">
          <ArrowButtonGroup
            onClickNext={handleMoveToRight}
            onClickPrev={handleMoveToLeft}
          />
        </div>
      )}
    </div>
  );
});
