"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { Address } from "viem";

import { graphql, getFragmentData } from "@/gql/index";
import { OrderDirection } from "@/gql/graphql";

export const UserInfoFragmentDocument = graphql(`
  fragment UserInfo on User {
    id
    address
    since
    total_bets
    total_bet_amount
    bull_bet_amount
    bear_bet_amount
    win_bets
    claimed_amount
  }
`);

export const getUsersDocument = graphql(`
  query getUsers($where: UserFilterInput, $orderBy: OrderByInput) {
    users(where: $where, orderBy: $orderBy) {
      ...UserInfo
    }
  }
`);

export function useGetUsers({
  where,
  orderBy,
}: {
  where?: {
    id?: string;
    address?: string;
    since?: number;
    since_gt?: number;
    since_gte?: number;
    since_lt?: number;
    since_lte?: number;
  };
  orderBy?: {
    field: string;
    direction: OrderDirection;
  };
}) {
  const query = useQuery(getUsersDocument, {
    variables: {
      where,
      orderBy,
    },
  });

  return query;
}

export function useGetAllUsers() {
  const { data } = useGetUsers({
    orderBy: {
      field: "claimed_amount",
      direction: OrderDirection.Desc,
    },
  });

  const users = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.users.map((user, index) => ({
      ...getFragmentData(UserInfoFragmentDocument, user),
      rank: index + 1,
    }));
  }, [data]);

  return users;
}

export function useGetPredictionUser(address?: Address) {
  const users = useGetAllUsers();

  return useMemo(() => {
    if (!address) {
      return null;
    }

    const user = users.find((item) => item.address === address);

    if (!user) {
      return null;
    }

    return user;
  }, [address, users]);
}
