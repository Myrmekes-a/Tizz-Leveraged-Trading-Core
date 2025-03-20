"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useDisclosure, Spinner } from "@nextui-org/react";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "next-intl";

import BorderedInput from "@/components/inputs/BorderedInput/BorderedInput";
import Button from "@/components/buttons/Button/Button";
import DataTable, {
  TableColumnProps,
  TableRowProps,
} from "@/components/tables/DataTableV2";
import SearchIcon from "@/components/icons/SearchIcon";

import { useGuild } from "@/tizz-trade-hooks/guild/useGuild";
import { useGetUsers } from "@/tizz-trade-hooks/guild/useGetUsers";
import { useGetUser } from "@/tizz-trade-hooks/guild/useGetUser";
import { useGetGuildById } from "@/tizz-trade-hooks/guild/useGetGuildById";

import TeamInvitationCreationModal from "./modals/TeamInvitationCreationModal";
import ConfirmModal from "./modals/ConfirmModal";

import { IGuildUserWithAggregation } from "@/types/index";
import { getPriceStr } from "@/utils/price";

import { formatWalletAddress, getMedal } from "@/utils/index";
import { useAccount } from "wagmi";

export type TeamMembersProps = {
  guildId: number;
};

export default function TeamMembers({ guildId }: TeamMembersProps) {
  const t = useTranslations("Trade-TeamMembers");
  const account = useAccount();

  const columns: TableColumnProps[] = [
    {
      id: "rank",
      component: t("rank"),
    },
    {
      id: "address",
      component: t("address"),
    },
    { id: "trades", component: t("trades") },
    { id: "winrate", component: t("winrate") },
    { id: "pnl", component: "PnL($)" },
    { id: "", component: "" },
  ];

  const [filter, setFilter] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);

  const { sendInvitationMutation, kickUserMutation, leaveGuildMutation } =
    useGuild();
  const { data, isSuccess } = useGetGuildById(guildId);
  const usersQuery = useGetUsers();
  const userQuery = useGetUser();

  const {
    isOpen: isInvitationModalOpen,
    onOpen: onInvitationModalOpen,
    onClose: onInvitationModalClose,
    onOpenChange: onInvitationModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: isLeaveConfirmModalOpen,
    onOpen: onLeaveConfirmModalOpen,
    onClose: onLeaveConfirmModalClose,
    onOpenChange: onLeaveConfirmModalOpenChange,
  } = useDisclosure();

  useEffect(() => {
    if (sendInvitationMutation.data && sendInvitationMutation.isSuccess) {
      onInvitationModalClose();
    }
  }, [
    onInvitationModalClose,
    sendInvitationMutation.data,
    sendInvitationMutation.isSuccess,
  ]);

  useEffect(() => {
    if (leaveGuildMutation.data && leaveGuildMutation.isSuccess) {
      onLeaveConfirmModalClose();
    }
  }, [
    leaveGuildMutation.data,
    leaveGuildMutation.isSuccess,
    onLeaveConfirmModalClose,
  ]);

  const handleSendInvitation = (address: string) => {
    sendInvitationMutation.mutate({ guild_id: guildId, address });
  };

  const handleRemove = useCallback(
    (userId: number) => {
      setPendingId(userId);
      kickUserMutation.mutate({ guild_id: guildId, user_id: userId });
    },
    [guildId, kickUserMutation],
  );

  const handleLeaveGuild = useCallback(() => {
    leaveGuildMutation.mutate({ guild_id: guildId });
  }, [guildId, leaveGuildMutation]);

  const rows = useMemo(() => {
    if (!data || !isSuccess) {
      return [];
    }

    if (!usersQuery.data || !usersQuery.isSuccess || !account.address) {
      return [];
    }

    const usersMap = new Map<number, IGuildUserWithAggregation>();

    usersQuery.data.map((user) => usersMap.set(user.id, user));

    const isOwner =
      userQuery.data && data && userQuery.data.id === data.owner_user_id;

    return data.guildMembers
      .map((member) => {
        const user = usersMap.get(member.user_id);

        if (!user) {
          return null;
        }

        return user;
      })
      .filter((item): item is IGuildUserWithAggregation => !!item)
      .sort((a, b) => b.totalOverallPnL - a.totalOverallPnL)
      .map((user, index) => {
        return {
          id: `${user.id}`,
          className:
            user.id === data.owner_user_id ||
            user.wallet_address === account.address
              ? "bg-white/5"
              : undefined,
          data: {
            rank: {
              component: (
                <p
                  className={twMerge(
                    "text-sx md:text-lg",
                    user.id === data.owner_user_id ||
                      user.wallet_address === account.address
                      ? "text-amber-300"
                      : "text-neutral-200",
                  )}
                >
                  {user.id === data.owner_user_id
                    ? `Owner (Rank: ${getMedal(index + 1)})`
                    : user.wallet_address === account.address
                      ? `You (Rank: ${getMedal(index + 1)})`
                      : getMedal(index + 1)}
                </p>
              ),
            },
            address: {
              component: (
                <p className="text-sx text-neutral-200 md:text-lg">
                  {formatWalletAddress(user.wallet_address)}
                </p>
              ),
            },
            trades: {
              component: (
                <p className="text-sx text-zinc-400 md:text-lg">
                  {user.GeneralTradingActivity.length}
                </p>
              ),
            },
            winrate: {
              component: (
                <p className="text-sx text-emerald-400 md:text-lg">
                  {user.GeneralTradingActivity.length
                    ? `${((user.totalOverAllWins * 100) / user.GeneralTradingActivity.length).toFixed(2)}%`
                    : "-"}
                </p>
              ),
            },
            pnl: {
              component: (
                <p className="text-sx text-indigo-400 md:text-lg">
                  ${getPriceStr(user.totalOverallPnL)}
                </p>
              ),
            },
            "": {
              component: isOwner ? (
                <Button
                  onClick={() => handleRemove(user.id)}
                  className="bg-amber-300 px-4 py-2.5 text-xs text-black md:text-base"
                >
                  Remove
                  {pendingId === user.id && kickUserMutation.isPending && (
                    <Spinner color="default" size="sm" />
                  )}
                </Button>
              ) : null,
            },
          },
        };
      })
      .filter((row) => !!row) as TableRowProps[];
  }, [
    account.address,
    data,
    handleRemove,
    isSuccess,
    kickUserMutation.isPending,
    pendingId,
    userQuery.data,
    usersQuery.data,
    usersQuery.isSuccess,
  ]);

  const isOwner =
    userQuery.data && data && userQuery.data.id === data.owner_user_id;
  const isTeamMember =
    userQuery.data &&
    data &&
    data.guildMembers.find((item) => item.user_id === userQuery?.data?.id);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-2xl font-semibold leading-[38px] text-white md:text-3xl">
        {t("team-members")}
      </p>

      <div className="flex items-center justify-between">
        <BorderedInput
          type="text"
          placeholder={t("search")}
          labelPlacement="outside"
          required
          value={filter}
          onValueChange={setFilter}
          startContent={
            <SearchIcon
              size={24}
              width={24}
              height={24}
              filled
              className="text-gray-400"
            />
          }
          classNames={{
            base: "bg-neutral-900 w-[100px] md:w-[280px]",
            input: "text-sm",
          }}
        />

        <div className="flex items-center gap-3">
          {isOwner && (
            <Button
              onClick={onInvitationModalOpen}
              className="bg-amber-300 px-4 py-2.5 text-sm text-black"
            >
              {t("invite-team")}
            </Button>
          )}

          {isTeamMember && (
            <Button
              onClick={onLeaveConfirmModalOpen}
              className="px-4 py-2.5 text-sm text-gray-400"
            >
              Leave Team
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        classNames={{
          wrapper: "rounded-lg border border-gray-800",
          th: "py-[12px] bg-neutral-900 !rounded-none text-sm !text-neutral-200",
        }}
        EmptyContent={
          <div className="flex h-[310px] w-full flex-col items-center justify-center gap-3.5">
            <p className="text-lg font-semibold text-gray-400">
              {t("you-dont-have-a-team-yet")}
            </p>
            {isOwner ? (
              <Button
                onClick={onInvitationModalOpen}
                className={twMerge(
                  "h-[30px] w-[112px] text-xs",
                  "rounded-lg border border-slate-300",
                  "!bg-transparent from-transparent to-transparent",
                )}
              >
                {t("invite-team")}
              </Button>
            ) : null}
          </div>
        }
      />
      <TeamInvitationCreationModal
        isOpen={isInvitationModalOpen}
        isPending={sendInvitationMutation.isPending}
        onClose={onInvitationModalClose}
        onOpenChange={onInvitationModalOpenChange}
        onSave={handleSendInvitation}
        errors={sendInvitationMutation.error?.message}
      />
      <ConfirmModal
        title="Are you sure?"
        description={`You are about to leave ${data?.name}`}
        confirmLabel="Yes"
        cancelLabel="No"
        isOpen={isLeaveConfirmModalOpen}
        isPending={leaveGuildMutation.isPending}
        onClose={onLeaveConfirmModalClose}
        onOpenChange={onLeaveConfirmModalOpenChange}
        onConfirm={handleLeaveGuild}
        errors={leaveGuildMutation.error?.message}
      />
    </div>
  );
}
