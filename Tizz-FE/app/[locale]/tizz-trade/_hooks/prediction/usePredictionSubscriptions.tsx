"use client";

import { useSubscription } from "@apollo/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import { getFragmentData, graphql } from "@/gql/index";

import {
  BetInfoFragmentDocument,
  useGetUserBetInfos,
  UseGetUserRoundBetInfoKey,
} from "./useGetPredictionUserRoundBetInfo";
import {
  RoundInfoFragmentDocument,
  UseGetPredictionRoundKey,
} from "./useGetPredictionRound";

export const newUserSubscriptionDocument = graphql(`
  subscription OnNewUser {
    newUser {
      id
      address
      since
      total_bets
      total_bet_amount
      bull_bet_amount
      bear_bet_amount
      claimed_amount
    }
  }
`);

export const newBetSubscriptionDocument = graphql(`
  subscription OnNewBet {
    newBet {
      ...BetInfo
    }
  }
`);

export const newRoundSubscriptionDocument = graphql(`
  subscription OnNewRound {
    newRound {
      ...RoundInfo
    }
  }
`);

export function usePredictionSubscriptions() {
  const queryClient = useQueryClient();

  const { address } = useAccount();

  const { upsert: upsertBets } = useGetUserBetInfos(address);

  useSubscription(newUserSubscriptionDocument, {
    onData({ data }) {
      console.log("new user data ==>", data);
    },
  });
  useSubscription(newBetSubscriptionDocument, {
    onData({ data }) {
      console.log("new bet data ===>", data);

      if (data.data?.newBet) {
        const newBet = getFragmentData(
          BetInfoFragmentDocument,
          data.data.newBet,
        );

        const updatedRound = getFragmentData(
          RoundInfoFragmentDocument,
          newBet.round,
        );

        queryClient.refetchQueries({
          queryKey: [
            UseGetPredictionRoundKey,
            {
              epoch: updatedRound.epoch,
            },
          ],
        });

        queryClient.refetchQueries({
          queryKey: [
            UseGetUserRoundBetInfoKey,
            { address, epoch: updatedRound.epoch },
          ],
        });

        upsertBets([updatedRound.epoch]);
      }
    },
  });
  useSubscription(newRoundSubscriptionDocument, {
    async onData({ data }) {
      console.log("new round data ==>", data);

      if (data.data?.newRound) {
        const newRound = getFragmentData(
          RoundInfoFragmentDocument,
          data.data.newRound,
        );

        // refetch ended round locked round and current round
        queryClient.refetchQueries({
          queryKey: [UseGetPredictionRoundKey, { epoch: newRound.epoch }],
        });
        queryClient.refetchQueries({
          queryKey: [
            UseGetPredictionRoundKey,
            { epoch: Math.max(newRound.epoch - 1, 1) },
          ],
        });
        queryClient.refetchQueries({
          queryKey: [
            UseGetPredictionRoundKey,
            { epoch: Math.max(newRound.epoch - 2, 1) },
          ],
        });
        queryClient.refetchQueries({
          queryKey: [
            UseGetPredictionRoundKey,
            { epoch: Math.max(newRound.epoch - 3, 1) },
          ],
        });

        // refetch user bet info from ended round locked round and current round
        queryClient.refetchQueries({
          queryKey: [
            UseGetUserRoundBetInfoKey,
            { address, epoch: newRound.epoch },
          ],
        });
        queryClient.refetchQueries({
          queryKey: [
            UseGetUserRoundBetInfoKey,
            { address, epoch: Math.max(newRound.epoch - 1, 1) },
          ],
        });
        queryClient.refetchQueries({
          queryKey: [
            UseGetUserRoundBetInfoKey,
            { address, epoch: Math.max(newRound.epoch - 2, 1) },
          ],
        });
        queryClient.refetchQueries({
          queryKey: [
            UseGetUserRoundBetInfoKey,
            { address, epoch: Math.max(newRound.epoch - 3, 1) },
          ],
        });

        // update user bet infos
        upsertBets([
          newRound.epoch - 3,
          newRound.epoch - 2,
          newRound.epoch - 1,
          newRound.epoch,
        ]);
      }
    },
  });
}
