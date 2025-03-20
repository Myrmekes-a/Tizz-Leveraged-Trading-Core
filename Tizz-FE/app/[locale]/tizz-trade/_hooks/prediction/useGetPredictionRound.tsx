"use client";

import { useCallback } from "react";
import { useQuery as useTanQuery, useQueryClient } from "@tanstack/react-query";

import { graphql, getFragmentData } from "@/gql/index";
import { RoundInfoFragment } from "@/gql/graphql";
import { getCurrentEpoch } from "@/utils/tizz";
import { apolloClient } from "../../../providers";
import { usePredictionVariables } from "./usePredictionVariables";

export const RoundInfoFragmentDocument = graphql(`
  fragment RoundInfo on Round {
    id
    market
    epoch
    started_at
    locked_at
    ended_at
    lock_price
    end_price
    total_bet_amount
    bull_bet_amount
    bear_bet_amount
    total_users
    bull_users
    bear_users
  }
`);

export const getRoundsDocument = graphql(`
  query getRounds($where: RoundFilterInput) {
    rounds(where: $where) {
      ...RoundInfo
    }
  }
`);

function getEmptyRound(
  epoch: number | undefined,
  startedTimestamp: number,
  intervalSeconds: number,
): RoundInfoFragment {
  const currentEpoch = getCurrentEpoch(startedTimestamp, intervalSeconds);

  const startedAt =
    epoch !== undefined
      ? startedTimestamp / 1000 + intervalSeconds * (epoch - 1)
      : startedTimestamp / 1000 + intervalSeconds * (currentEpoch - 1);

  return {
    id: `${epoch}`,
    market: "",
    epoch: epoch || currentEpoch,
    started_at: startedAt,
    locked_at: startedAt + intervalSeconds,
    ended_at: startedAt + 2 * intervalSeconds,
    lock_price: null,
    end_price: null,
    total_bet_amount: 0,
    bull_bet_amount: 0,
    bear_bet_amount: 0,
    total_users: 0,
    bull_users: 0,
    bear_users: 0,
  };
}

export const UseGetPredictionRoundKey = "get-prediction-round";

async function fetchRoundByEpoch(
  epoch: number,
  startedTimestamp: number,
  intervalSeconds: number,
) {
  try {
    const result = await apolloClient.query({
      query: getRoundsDocument,
      variables: {
        where: {
          epoch,
        },
      },
      fetchPolicy: "no-cache",
    });

    if (result.error || result.data.rounds.length === 0) {
      return getEmptyRound(epoch, startedTimestamp, intervalSeconds);
    }

    return getFragmentData(RoundInfoFragmentDocument, result.data.rounds[0]);
  } catch (err) {
    console.log(err);
  }

  return getEmptyRound(epoch, startedTimestamp, intervalSeconds);
}

export function useGetPredictionRoundOrigin(
  epoch: number,
  startedTimestamp?: number,
  intervalSeconds?: number,
) {
  const { data } = useTanQuery({
    queryKey: [
      UseGetPredictionRoundKey,
      { startedTimestamp, intervalSeconds, epoch },
    ],
    queryFn: async () => {
      if (startedTimestamp === undefined || intervalSeconds === undefined) {
        return Promise.resolve(null);
      }

      return fetchRoundByEpoch(epoch, startedTimestamp, intervalSeconds);
    },
  });

  return data;
}

export function useGetPredictionRound(epoch: number) {
  const pv = usePredictionVariables();
  return useGetPredictionRoundOrigin(
    epoch,
    pv?.startedTimestamp,
    pv?.intervalSeconds,
  );
}

export async function getSortedRoundInfos(
  fromEpoch: number,
  toEpoch: number,
  startedTimestamp: number,
  intervalSeconds: number,
): Promise<RoundInfoFragment[]> {
  const { data } = await apolloClient.query({
    query: getRoundsDocument,
    variables: {
      where: {
        epoch_gte: fromEpoch,
        epoch_lte: toEpoch,
      },
    },
    fetchPolicy: "no-cache",
  });

  const roundsByEpoch = new Map<number, RoundInfoFragment>();

  data?.rounds.map((item) => {
    const roundInfo = getFragmentData(RoundInfoFragmentDocument, item);

    roundsByEpoch.set(roundInfo.epoch, roundInfo);
  });

  const sortedRoundInfo: RoundInfoFragment[] = [];

  for (let i = fromEpoch; i <= toEpoch; i++) {
    const data = roundsByEpoch.get(i);

    if (data) {
      sortedRoundInfo.push(data);
    } else {
      sortedRoundInfo.push(getEmptyRound(i, startedTimestamp, intervalSeconds));
    }
  }

  return sortedRoundInfo;
}

const PAGE_SIZE = 20;

export type PredictionRoundsQueryResult = {
  fromEpoch: number;
  toEpoch: number;
  rounds: RoundInfoFragment[];
} | null;

export const UseGetPredictionRoundsKey = "prediction-rounds";

export function useGetPredictionRoundsOrigin({
  startedTimestamp,
  intervalSeconds,
}: {
  startedTimestamp?: number;
  intervalSeconds?: number;
}) {
  const queryClient = useQueryClient();

  const { data, status } = useTanQuery({
    queryKey: [
      UseGetPredictionRoundsKey,
      { startedTimestamp, intervalSeconds },
    ],
    queryFn: async () => {
      if (startedTimestamp === undefined || intervalSeconds === undefined) {
        return null;
      }

      const currentEpoch = getCurrentEpoch(startedTimestamp, intervalSeconds);

      const toEpoch = Math.max(currentEpoch - 2, 1);
      const fromEpoch = Math.max(toEpoch - PAGE_SIZE + 1, 1);

      return {
        fromEpoch,
        toEpoch: Math.max(currentEpoch - 2, 1),
        rounds: await getSortedRoundInfos(
          fromEpoch,
          toEpoch,
          startedTimestamp,
          intervalSeconds,
        ),
      } as PredictionRoundsQueryResult;
    },
  });

  const hasPrevRounds = useCallback(() => {
    if (!data || status !== "success") {
      return false;
    }

    return data.fromEpoch > 1;
  }, [data, status]);

  const fetchPrev = useCallback(async () => {
    if (
      !data ||
      status !== "success" ||
      startedTimestamp === undefined ||
      intervalSeconds === undefined ||
      !hasPrevRounds()
    ) {
      return;
    }

    const toEpoch = Math.max(data.fromEpoch - 1, 1);
    const fromEpoch = Math.max(toEpoch - PAGE_SIZE + 1, 1);

    const sortedRoundInfos = await getSortedRoundInfos(
      fromEpoch,
      toEpoch,
      startedTimestamp,
      intervalSeconds,
    );

    queryClient.setQueryData(
      [UseGetPredictionRoundsKey, { startedTimestamp, intervalSeconds }],
      {
        fromEpoch,
        toEpoch: data.toEpoch,
        rounds: [...sortedRoundInfos, ...data.rounds],
      },
    );
  }, [
    data,
    status,
    startedTimestamp,
    intervalSeconds,
    hasPrevRounds,
    queryClient,
  ]);

  return {
    data,
    status,
    hasPrevRounds,
    fetchPrev,
  };
}

export function useGetPredictionRounds() {
  const pv = usePredictionVariables();

  return useGetPredictionRoundsOrigin({
    startedTimestamp: pv?.startedTimestamp,
    intervalSeconds: pv?.intervalSeconds,
  });
}
