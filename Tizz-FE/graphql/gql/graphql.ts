/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Bet = {
  __typename?: 'Bet';
  amount: Scalars['Float']['output'];
  claimed?: Maybe<Scalars['Boolean']['output']>;
  claimedAmount?: Maybe<Scalars['Float']['output']>;
  hash: Scalars['String']['output'];
  id: Scalars['String']['output'];
  market: Scalars['String']['output'];
  position: Scalars['Float']['output'];
  round: Round;
  user: User;
};

export type BetFilterInput = {
  claimed?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
  round?: InputMaybe<Scalars['Int']['input']>;
  user?: InputMaybe<Scalars['String']['input']>;
};

export type OrderByInput = {
  direction: OrderDirection;
  field: Scalars['String']['input'];
};

/** Sorting order direction */
export enum OrderDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Query = {
  __typename?: 'Query';
  bet: Bet;
  bets: Array<Bet>;
  round: Round;
  rounds: Array<Round>;
  user?: Maybe<User>;
  users: Array<User>;
};


export type QueryBetArgs = {
  id: Scalars['String']['input'];
};


export type QueryBetsArgs = {
  where?: InputMaybe<BetFilterInput>;
};


export type QueryRoundArgs = {
  id: Scalars['String']['input'];
};


export type QueryRoundsArgs = {
  where?: InputMaybe<RoundFilterInput>;
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
};


export type QueryUsersArgs = {
  orderBy?: InputMaybe<OrderByInput>;
  where?: InputMaybe<UserFilterInput>;
};

export type Round = {
  __typename?: 'Round';
  bear_bet_amount?: Maybe<Scalars['Float']['output']>;
  bear_users?: Maybe<Scalars['Float']['output']>;
  bets?: Maybe<Array<Bet>>;
  bull_bet_amount?: Maybe<Scalars['Float']['output']>;
  bull_users?: Maybe<Scalars['Float']['output']>;
  end_price?: Maybe<Scalars['Float']['output']>;
  ended_at: Scalars['Float']['output'];
  epoch: Scalars['Float']['output'];
  id: Scalars['String']['output'];
  lock_price?: Maybe<Scalars['Float']['output']>;
  locked_at: Scalars['Float']['output'];
  market: Scalars['String']['output'];
  started_at: Scalars['Float']['output'];
  total_bet_amount?: Maybe<Scalars['Float']['output']>;
  total_users?: Maybe<Scalars['Float']['output']>;
};

export type RoundFilterInput = {
  epoch?: InputMaybe<Scalars['Int']['input']>;
  epoch_gt?: InputMaybe<Scalars['Float']['input']>;
  epoch_gte?: InputMaybe<Scalars['Float']['input']>;
  epoch_lt?: InputMaybe<Scalars['Float']['input']>;
  epoch_lte?: InputMaybe<Scalars['Float']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  newBet: Bet;
  newRound: Round;
  newUser: User;
};

export type User = {
  __typename?: 'User';
  address: Scalars['String']['output'];
  bear_bet_amount?: Maybe<Scalars['Float']['output']>;
  bets?: Maybe<Array<Bet>>;
  bull_bet_amount?: Maybe<Scalars['Float']['output']>;
  claimed_amount?: Maybe<Scalars['Float']['output']>;
  id: Scalars['String']['output'];
  since: Scalars['Float']['output'];
  total_bet_amount?: Maybe<Scalars['Float']['output']>;
  total_bets?: Maybe<Scalars['Float']['output']>;
  win_bets?: Maybe<Scalars['Float']['output']>;
};

export type UserFilterInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  since?: InputMaybe<Scalars['Float']['input']>;
  since_gt?: InputMaybe<Scalars['Float']['input']>;
  since_gte?: InputMaybe<Scalars['Float']['input']>;
  since_lt?: InputMaybe<Scalars['Float']['input']>;
  since_lte?: InputMaybe<Scalars['Float']['input']>;
};

export type RoundInfoFragment = { __typename?: 'Round', id: string, market: string, epoch: number, started_at: number, locked_at: number, ended_at: number, lock_price?: number | null, end_price?: number | null, total_bet_amount?: number | null, bull_bet_amount?: number | null, bear_bet_amount?: number | null, total_users?: number | null, bull_users?: number | null, bear_users?: number | null } & { ' $fragmentName'?: 'RoundInfoFragment' };

export type GetRoundsQueryVariables = Exact<{
  where?: InputMaybe<RoundFilterInput>;
}>;


export type GetRoundsQuery = { __typename?: 'Query', rounds: Array<(
    { __typename?: 'Round' }
    & { ' $fragmentRefs'?: { 'RoundInfoFragment': RoundInfoFragment } }
  )> };

export type UserInfoFragment = { __typename?: 'User', id: string, address: string, since: number, total_bets?: number | null, total_bet_amount?: number | null, bull_bet_amount?: number | null, bear_bet_amount?: number | null, win_bets?: number | null, claimed_amount?: number | null } & { ' $fragmentName'?: 'UserInfoFragment' };

export type GetUsersQueryVariables = Exact<{
  where?: InputMaybe<UserFilterInput>;
  orderBy?: InputMaybe<OrderByInput>;
}>;


export type GetUsersQuery = { __typename?: 'Query', users: Array<(
    { __typename?: 'User' }
    & { ' $fragmentRefs'?: { 'UserInfoFragment': UserInfoFragment } }
  )> };

export type BetInfoFragment = { __typename?: 'Bet', id: string, market: string, amount: number, position: number, claimed?: boolean | null, claimedAmount?: number | null, hash: string, user: { __typename?: 'User', address: string }, round: (
    { __typename?: 'Round' }
    & { ' $fragmentRefs'?: { 'RoundInfoFragment': RoundInfoFragment } }
  ) } & { ' $fragmentName'?: 'BetInfoFragment' };

export type GetBetQueryVariables = Exact<{
  where?: InputMaybe<BetFilterInput>;
}>;


export type GetBetQuery = { __typename?: 'Query', bets: Array<(
    { __typename?: 'Bet' }
    & { ' $fragmentRefs'?: { 'BetInfoFragment': BetInfoFragment } }
  )> };

export type OnNewUserSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnNewUserSubscription = { __typename?: 'Subscription', newUser: { __typename?: 'User', id: string, address: string, since: number, total_bets?: number | null, total_bet_amount?: number | null, bull_bet_amount?: number | null, bear_bet_amount?: number | null, claimed_amount?: number | null } };

export type OnNewBetSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnNewBetSubscription = { __typename?: 'Subscription', newBet: (
    { __typename?: 'Bet' }
    & { ' $fragmentRefs'?: { 'BetInfoFragment': BetInfoFragment } }
  ) };

export type OnNewRoundSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnNewRoundSubscription = { __typename?: 'Subscription', newRound: (
    { __typename?: 'Round' }
    & { ' $fragmentRefs'?: { 'RoundInfoFragment': RoundInfoFragment } }
  ) };

export const UserInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"since"}},{"kind":"Field","name":{"kind":"Name","value":"total_bets"}},{"kind":"Field","name":{"kind":"Name","value":"total_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bull_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bear_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"win_bets"}},{"kind":"Field","name":{"kind":"Name","value":"claimed_amount"}}]}}]} as unknown as DocumentNode<UserInfoFragment, unknown>;
export const RoundInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoundInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Round"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"market"}},{"kind":"Field","name":{"kind":"Name","value":"epoch"}},{"kind":"Field","name":{"kind":"Name","value":"started_at"}},{"kind":"Field","name":{"kind":"Name","value":"locked_at"}},{"kind":"Field","name":{"kind":"Name","value":"ended_at"}},{"kind":"Field","name":{"kind":"Name","value":"lock_price"}},{"kind":"Field","name":{"kind":"Name","value":"end_price"}},{"kind":"Field","name":{"kind":"Name","value":"total_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bull_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bear_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"total_users"}},{"kind":"Field","name":{"kind":"Name","value":"bull_users"}},{"kind":"Field","name":{"kind":"Name","value":"bear_users"}}]}}]} as unknown as DocumentNode<RoundInfoFragment, unknown>;
export const BetInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BetInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Bet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"market"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"address"}}]}},{"kind":"Field","name":{"kind":"Name","value":"round"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoundInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"claimed"}},{"kind":"Field","name":{"kind":"Name","value":"claimedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"hash"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoundInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Round"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"market"}},{"kind":"Field","name":{"kind":"Name","value":"epoch"}},{"kind":"Field","name":{"kind":"Name","value":"started_at"}},{"kind":"Field","name":{"kind":"Name","value":"locked_at"}},{"kind":"Field","name":{"kind":"Name","value":"ended_at"}},{"kind":"Field","name":{"kind":"Name","value":"lock_price"}},{"kind":"Field","name":{"kind":"Name","value":"end_price"}},{"kind":"Field","name":{"kind":"Name","value":"total_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bull_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bear_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"total_users"}},{"kind":"Field","name":{"kind":"Name","value":"bull_users"}},{"kind":"Field","name":{"kind":"Name","value":"bear_users"}}]}}]} as unknown as DocumentNode<BetInfoFragment, unknown>;
export const GetRoundsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getRounds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RoundFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rounds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoundInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoundInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Round"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"market"}},{"kind":"Field","name":{"kind":"Name","value":"epoch"}},{"kind":"Field","name":{"kind":"Name","value":"started_at"}},{"kind":"Field","name":{"kind":"Name","value":"locked_at"}},{"kind":"Field","name":{"kind":"Name","value":"ended_at"}},{"kind":"Field","name":{"kind":"Name","value":"lock_price"}},{"kind":"Field","name":{"kind":"Name","value":"end_price"}},{"kind":"Field","name":{"kind":"Name","value":"total_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bull_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bear_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"total_users"}},{"kind":"Field","name":{"kind":"Name","value":"bull_users"}},{"kind":"Field","name":{"kind":"Name","value":"bear_users"}}]}}]} as unknown as DocumentNode<GetRoundsQuery, GetRoundsQueryVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderByInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"since"}},{"kind":"Field","name":{"kind":"Name","value":"total_bets"}},{"kind":"Field","name":{"kind":"Name","value":"total_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bull_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bear_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"win_bets"}},{"kind":"Field","name":{"kind":"Name","value":"claimed_amount"}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const GetBetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getBet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BetFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BetInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoundInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Round"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"market"}},{"kind":"Field","name":{"kind":"Name","value":"epoch"}},{"kind":"Field","name":{"kind":"Name","value":"started_at"}},{"kind":"Field","name":{"kind":"Name","value":"locked_at"}},{"kind":"Field","name":{"kind":"Name","value":"ended_at"}},{"kind":"Field","name":{"kind":"Name","value":"lock_price"}},{"kind":"Field","name":{"kind":"Name","value":"end_price"}},{"kind":"Field","name":{"kind":"Name","value":"total_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bull_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bear_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"total_users"}},{"kind":"Field","name":{"kind":"Name","value":"bull_users"}},{"kind":"Field","name":{"kind":"Name","value":"bear_users"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BetInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Bet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"market"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"address"}}]}},{"kind":"Field","name":{"kind":"Name","value":"round"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoundInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"claimed"}},{"kind":"Field","name":{"kind":"Name","value":"claimedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"hash"}}]}}]} as unknown as DocumentNode<GetBetQuery, GetBetQueryVariables>;
export const OnNewUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnNewUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"newUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"since"}},{"kind":"Field","name":{"kind":"Name","value":"total_bets"}},{"kind":"Field","name":{"kind":"Name","value":"total_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bull_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bear_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"claimed_amount"}}]}}]}}]} as unknown as DocumentNode<OnNewUserSubscription, OnNewUserSubscriptionVariables>;
export const OnNewBetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnNewBet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"newBet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BetInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoundInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Round"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"market"}},{"kind":"Field","name":{"kind":"Name","value":"epoch"}},{"kind":"Field","name":{"kind":"Name","value":"started_at"}},{"kind":"Field","name":{"kind":"Name","value":"locked_at"}},{"kind":"Field","name":{"kind":"Name","value":"ended_at"}},{"kind":"Field","name":{"kind":"Name","value":"lock_price"}},{"kind":"Field","name":{"kind":"Name","value":"end_price"}},{"kind":"Field","name":{"kind":"Name","value":"total_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bull_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bear_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"total_users"}},{"kind":"Field","name":{"kind":"Name","value":"bull_users"}},{"kind":"Field","name":{"kind":"Name","value":"bear_users"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BetInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Bet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"market"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"address"}}]}},{"kind":"Field","name":{"kind":"Name","value":"round"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoundInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"claimed"}},{"kind":"Field","name":{"kind":"Name","value":"claimedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"hash"}}]}}]} as unknown as DocumentNode<OnNewBetSubscription, OnNewBetSubscriptionVariables>;
export const OnNewRoundDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnNewRound"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"newRound"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoundInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoundInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Round"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"market"}},{"kind":"Field","name":{"kind":"Name","value":"epoch"}},{"kind":"Field","name":{"kind":"Name","value":"started_at"}},{"kind":"Field","name":{"kind":"Name","value":"locked_at"}},{"kind":"Field","name":{"kind":"Name","value":"ended_at"}},{"kind":"Field","name":{"kind":"Name","value":"lock_price"}},{"kind":"Field","name":{"kind":"Name","value":"end_price"}},{"kind":"Field","name":{"kind":"Name","value":"total_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bull_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"bear_bet_amount"}},{"kind":"Field","name":{"kind":"Name","value":"total_users"}},{"kind":"Field","name":{"kind":"Name","value":"bull_users"}},{"kind":"Field","name":{"kind":"Name","value":"bear_users"}}]}}]} as unknown as DocumentNode<OnNewRoundSubscription, OnNewRoundSubscriptionVariables>;