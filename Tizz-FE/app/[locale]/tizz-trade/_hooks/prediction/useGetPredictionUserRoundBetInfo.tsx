"use client";

import { useQuery as useTanQuery, useQueryClient } from "@tanstack/react-query";

import { getFragmentData, graphql } from "@/gql/index";

import { apolloClient } from "../../../providers";
import { useCallback } from "react";
import { RoundInfoFragmentDocument } from "./useGetPredictionRound";
import { BetInfoFragment } from "@/gql/graphql";

export const BetInfoFragmentDocument = graphql(`
  fragment BetInfo on Bet {
    id
    market
    user {
      address
    }
    round {
      ...RoundInfo
    }
    amount
    position
    claimed
    claimedAmount
    hash
  }
`);

export const getBetsDocument = graphql(`
  query getBet($where: BetFilterInput) {
    bets(where: $where) {
      ...BetInfo
    }
  }
`);

export const UseGetUserRoundBetInfoKey = "get-user-round-bet-info";

async function fetchBetInfoByAddressAndEpoch(address: string, epoch: number) {
  try {
    const result = await apolloClient.query({
      query: getBetsDocument,
      variables: {
        where: {
          user: address,
          round: epoch,
        },
      },
      fetchPolicy: "no-cache",
    });

    if (result.error || result.data.bets.length === 0) {
      return null;
    }

    return getFragmentData(BetInfoFragmentDocument, result.data.bets[0]);
  } catch (err) {
    console.log(err);
  }

  return null;
}

export function useGetUserRoundBetInfo(address?: string, epoch?: number) {
  const query = useTanQuery({
    queryKey: [UseGetUserRoundBetInfoKey, { address, epoch }],
    queryFn: async () => {
      if (address === undefined || epoch === undefined) {
        return Promise.resolve(null);
      }

      return fetchBetInfoByAddressAndEpoch(address, epoch);
    },
  });

  return query.data;
}

export const UseGetUserBetInfosKey = "get-user-bet-infos";

export function useGetUserBetInfos(address?: string) {
  const queryClient = useQueryClient();

  const { data } = useTanQuery({
    queryKey: [UseGetUserBetInfosKey, { address }],
    queryFn: async () => {
      if (address === undefined) {
        return Promise.resolve([]);
      }

      try {
        const result = await apolloClient.query({
          query: getBetsDocument,
          variables: {
            where: {
              user: address,
            },
          },
          fetchPolicy: "no-cache",
        });

        if (result.error) {
          return [];
        }

        return result.data.bets
          .map((bet) => getFragmentData(BetInfoFragmentDocument, bet))
          .map((bet) => ({
            ...bet,
            round: getFragmentData(RoundInfoFragmentDocument, bet.round),
          }));
      } catch (err) {
        console.log(err);
      }

      return [];
    },
  });

  const upsert = useCallback(
    async (epochs: number[]) => {
      if (!address) {
        return;
      }

      for (let i = 0; i < epochs.length; i++) {
        const epoch = epochs[i];

        if (epoch <= 1) {
          continue;
        }

        const betData = await fetchBetInfoByAddressAndEpoch(address, epoch);

        if (betData) {
          queryClient.setQueryData(
            [UseGetUserBetInfosKey, { address }],
            (oldData: BetInfoFragment[]) => {
              const exist = oldData.find((bet) => bet.id === betData.id);

              if (exist) {
                return oldData.map((bet) =>
                  bet.id === betData.id ? betData : bet,
                );
              }

              return [...oldData, betData];
            },
          );
        }
      }
    },
    [address, queryClient],
  );

  return {
    bets: data || [],
    upsert,
  };
}
