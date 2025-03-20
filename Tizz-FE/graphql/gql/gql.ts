/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  fragment RoundInfo on Round {\n    id\n    market\n    epoch\n    started_at\n    locked_at\n    ended_at\n    lock_price\n    end_price\n    total_bet_amount\n    bull_bet_amount\n    bear_bet_amount\n    total_users\n    bull_users\n    bear_users\n  }\n": types.RoundInfoFragmentDoc,
    "\n  query getRounds($where: RoundFilterInput) {\n    rounds(where: $where) {\n      ...RoundInfo\n    }\n  }\n": types.GetRoundsDocument,
    "\n  fragment UserInfo on User {\n    id\n    address\n    since\n    total_bets\n    total_bet_amount\n    bull_bet_amount\n    bear_bet_amount\n    win_bets\n    claimed_amount\n  }\n": types.UserInfoFragmentDoc,
    "\n  query getUsers($where: UserFilterInput, $orderBy: OrderByInput) {\n    users(where: $where, orderBy: $orderBy) {\n      ...UserInfo\n    }\n  }\n": types.GetUsersDocument,
    "\n  fragment BetInfo on Bet {\n    id\n    market\n    user {\n      address\n    }\n    round {\n      ...RoundInfo\n    }\n    amount\n    position\n    claimed\n    claimedAmount\n    hash\n  }\n": types.BetInfoFragmentDoc,
    "\n  query getBet($where: BetFilterInput) {\n    bets(where: $where) {\n      ...BetInfo\n    }\n  }\n": types.GetBetDocument,
    "\n  subscription OnNewUser {\n    newUser {\n      id\n      address\n      since\n      total_bets\n      total_bet_amount\n      bull_bet_amount\n      bear_bet_amount\n      claimed_amount\n    }\n  }\n": types.OnNewUserDocument,
    "\n  subscription OnNewBet {\n    newBet {\n      ...BetInfo\n    }\n  }\n": types.OnNewBetDocument,
    "\n  subscription OnNewRound {\n    newRound {\n      ...RoundInfo\n    }\n  }\n": types.OnNewRoundDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment RoundInfo on Round {\n    id\n    market\n    epoch\n    started_at\n    locked_at\n    ended_at\n    lock_price\n    end_price\n    total_bet_amount\n    bull_bet_amount\n    bear_bet_amount\n    total_users\n    bull_users\n    bear_users\n  }\n"): (typeof documents)["\n  fragment RoundInfo on Round {\n    id\n    market\n    epoch\n    started_at\n    locked_at\n    ended_at\n    lock_price\n    end_price\n    total_bet_amount\n    bull_bet_amount\n    bear_bet_amount\n    total_users\n    bull_users\n    bear_users\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getRounds($where: RoundFilterInput) {\n    rounds(where: $where) {\n      ...RoundInfo\n    }\n  }\n"): (typeof documents)["\n  query getRounds($where: RoundFilterInput) {\n    rounds(where: $where) {\n      ...RoundInfo\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserInfo on User {\n    id\n    address\n    since\n    total_bets\n    total_bet_amount\n    bull_bet_amount\n    bear_bet_amount\n    win_bets\n    claimed_amount\n  }\n"): (typeof documents)["\n  fragment UserInfo on User {\n    id\n    address\n    since\n    total_bets\n    total_bet_amount\n    bull_bet_amount\n    bear_bet_amount\n    win_bets\n    claimed_amount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getUsers($where: UserFilterInput, $orderBy: OrderByInput) {\n    users(where: $where, orderBy: $orderBy) {\n      ...UserInfo\n    }\n  }\n"): (typeof documents)["\n  query getUsers($where: UserFilterInput, $orderBy: OrderByInput) {\n    users(where: $where, orderBy: $orderBy) {\n      ...UserInfo\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment BetInfo on Bet {\n    id\n    market\n    user {\n      address\n    }\n    round {\n      ...RoundInfo\n    }\n    amount\n    position\n    claimed\n    claimedAmount\n    hash\n  }\n"): (typeof documents)["\n  fragment BetInfo on Bet {\n    id\n    market\n    user {\n      address\n    }\n    round {\n      ...RoundInfo\n    }\n    amount\n    position\n    claimed\n    claimedAmount\n    hash\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getBet($where: BetFilterInput) {\n    bets(where: $where) {\n      ...BetInfo\n    }\n  }\n"): (typeof documents)["\n  query getBet($where: BetFilterInput) {\n    bets(where: $where) {\n      ...BetInfo\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnNewUser {\n    newUser {\n      id\n      address\n      since\n      total_bets\n      total_bet_amount\n      bull_bet_amount\n      bear_bet_amount\n      claimed_amount\n    }\n  }\n"): (typeof documents)["\n  subscription OnNewUser {\n    newUser {\n      id\n      address\n      since\n      total_bets\n      total_bet_amount\n      bull_bet_amount\n      bear_bet_amount\n      claimed_amount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnNewBet {\n    newBet {\n      ...BetInfo\n    }\n  }\n"): (typeof documents)["\n  subscription OnNewBet {\n    newBet {\n      ...BetInfo\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnNewRound {\n    newRound {\n      ...RoundInfo\n    }\n  }\n"): (typeof documents)["\n  subscription OnNewRound {\n    newRound {\n      ...RoundInfo\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;