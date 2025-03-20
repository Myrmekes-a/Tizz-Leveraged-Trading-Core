"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { ListRange, Virtuoso, VirtuosoHandle } from "react-virtuoso";

import { HistoryCard, HistoryCardProps } from "./HistoryCard";

export type GameHistoriesTabHandle = {
  moveToRight(): void;
  moveToLeft(): void;
};

export type GameHistoriesTabProps = {
  histories: HistoryCardProps[];
  initialTopMostItemIndex: number;
  fetchPrev(): void;
};
export const GameHistoriesTab = forwardRef<
  GameHistoriesTabHandle,
  GameHistoriesTabProps
>(function GameHistoriesTabOrigin(
  { histories, fetchPrev, initialTopMostItemIndex },
  ref,
) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const scrollerRef = useRef<HTMLElement | Window | null>();
  const scrollIndexRef = useRef<number>(0);

  useImperativeHandle(
    ref,
    () => {
      return {
        moveToRight() {
          scrollerRef.current?.scrollBy({
            left: window.innerWidth > 700 ? 450 : 350,
            top: 0,
            behavior: "smooth",
          });
        },
        moveToLeft() {
          scrollerRef.current?.scrollBy({
            left: window.innerWidth > 700 ? -450 : -350,
            top: 0,
            behavior: "smooth",
          });
        },
      };
    },
    [],
  );

  useEffect(() => {
    const length = histories.length;
    const currentIndex = length - scrollIndexRef.current;

    virtuosoRef.current?.scrollToIndex({
      index: currentIndex,
      align: "start",
    });
  }, [histories]);

  const handleChangeRange = useCallback(
    (range: ListRange) => {
      scrollIndexRef.current = histories.length - range.endIndex;

      if (range.startIndex === 0) {
        fetchPrev();
      }
    },
    [fetchPrev, histories.length],
  );

  const handleScrollerRef = useCallback(
    (element?: HTMLElement | null | Window) => {
      if (element) {
        scrollerRef.current = element;
      }
    },
    [],
  );

  return (
    <Virtuoso
      ref={virtuosoRef}
      scrollerRef={handleScrollerRef}
      initialTopMostItemIndex={initialTopMostItemIndex}
      style={{ height: 500, overflow: "hidden" }}
      data={histories}
      rangeChanged={handleChangeRange}
      horizontalDirection
      itemContent={(_, history) => <HistoryCard {...history} />}
    />
  );
});
