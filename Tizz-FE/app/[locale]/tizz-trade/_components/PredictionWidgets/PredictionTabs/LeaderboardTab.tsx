"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { twMerge } from "tailwind-merge";

import DataTable, { TableColumnProps } from "@/components/tables/DataTableV2";

import {
  useGetAllUsers,
  useGetPredictionUser,
} from "@/tizz-trade-hooks/prediction/useGetPredictionUser";

import { getMedal, formatWalletAddress } from "@/utils/index";
import { getPercentageStr, getPriceStr } from "@/utils/price";

export default function LeaderboardTab() {
  const columns: TableColumnProps[] = [
    {
      id: "rank",
      component: "Rank",
    },
    {
      id: "walletAddress",
      component: "Address",
    },
    { id: "winrate", component: "Winrate" },
    { id: "roundsPlayed", component: "Rounds Played" },
    { id: "roundsWon", component: "Rounds Won" },
    { id: "earned", component: "Total Earned (BTC)" },
  ];

  const { address } = useAccount();

  const users = useGetAllUsers();
  const user = useGetPredictionUser(address);

  const rows = useMemo(() => {
    if (users.length === 0 || !address || !user) {
      return [];
    }

    const rows = [user, ...users];

    return rows.map((user, index) => {
      if (user) {
        return {
          id: index === 0 ? `${user.id}-0` : `${user.id}`,
          className: index === 0 ? "bg-white/5" : undefined,
          data: {
            rank: {
              component: (
                <div
                  className={twMerge(
                    "min-w-[100px] text-sm",
                    index === 0 ? "text-amber-300" : "text-neutral-200",
                  )}
                >
                  {index === 0
                    ? `You (Rank: ${getMedal(user.rank)})`
                    : getMedal(user.rank)}
                </div>
              ),
            },
            walletAddress: {
              component: (
                <p className="text-sm text-neutral-200">
                  {formatWalletAddress(user.address)}
                </p>
              ),
            },
            winrate: {
              component: (
                <p className="text-sm text-emerald-400">
                  {getPercentageStr(
                    ((user.win_bets || 0) * 100) / (user.total_bets || 0),
                  )}
                  %
                </p>
              ),
            },
            roundsPlayed: {
              component: (
                <p className="text-sm text-white">{user.total_bets || 0}</p>
              ),
            },
            roundsWon: {
              component: (
                <p className="text-sm text-emerald-400">{user.win_bets || 0}</p>
              ),
            },
            earned: {
              component: (
                <p className="text-sm text-[#839bec]">
                  {getPriceStr(user.claimed_amount || 0)}
                </p>
              ),
            },
          },
        };
      } else {
        return {
          id: index === 0 ? "none-0" : "none",
          className: index === 0 ? "bg-white/5" : undefined,
          data: {
            rank: {
              component: (
                <p
                  className={twMerge(
                    "text-sm",
                    index === 0 ? "text-amber-300" : "text-neutral-200",
                  )}
                >
                  {index === 0 ? `You (Rank: NA})` : "NA"}
                </p>
              ),
            },
            walletAddress: {
              component: <p className="text-sm text-white">-</p>,
            },
            winrate: {
              component: <p className="text-sm text-emerald-400">-</p>,
            },
            roundsPlayed: {
              component: <p className="text-sm text-white">0</p>,
            },
            roundsWon: {
              component: <p className="text-sm text-emerald-400">0</p>,
            },
            earned: {
              component: <p className="text-sm text-[#839bec]">0</p>,
            },
          },
        };
      }
    });
  }, [address, user, users]);

  return (
    <div className="flex flex-col gap-6">
      <DataTable
        columns={columns}
        rows={rows}
        classNames={{
          wrapper: "rounded-lg border border-gray-800",
          th: "py-[12px] bg-neutral-900 !rounded-none text-sm !text-neutral-200",
        }}
      />
    </div>
  );
}
