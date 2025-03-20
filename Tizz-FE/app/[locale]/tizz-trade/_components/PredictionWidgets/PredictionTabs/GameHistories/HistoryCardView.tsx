import { Button } from "@nextui-org/react";
import { twMerge } from "tailwind-merge";
import { BetInfoFragment, RoundInfoFragment } from "@/gql/graphql";

import BaseCard from "@/components/cards/BaseCard/BaseCard";

import { ChangeRateBadge } from "../../components/ChangeRateBadge";
import { PayoutBadge } from "../../components/PayoutBadge";
import { getPriceStr } from "@/utils/price";

export type History = RoundInfoFragment & {
  bet?: BetInfoFragment;
};

export type HistoryCardProps = {
  history: History;
};

export function HistoryCardView({ history }: HistoryCardProps) {
  const roundPosition =
    !history.end_price || !history.lock_price
      ? 2
      : history.end_price > history.lock_price
        ? 0
        : history.end_price < history.lock_price
          ? 1
          : 2;

  const upPayout = Number(history.bull_bet_amount)
    ? Number(history.total_bet_amount) / Number(history.bull_bet_amount)
    : 0;
  const downPayout = Number(history.bear_bet_amount)
    ? Number(history.total_bet_amount) / Number(history.bear_bet_amount)
    : 0;

  const winnerPayout = roundPosition === 0 ? upPayout : downPayout;

  const claimableAmount =
    roundPosition === 2
      ? history.bet?.amount || 0
      : (history.bet?.amount || 0) * winnerPayout;

  const prizeItems = history.lock_price
    ? [
        {
          id: "lockedPrice",
          label: "Locked Price",
          value: `$${getPriceStr(history.lock_price / 1e8, 2)}`,
        },
        {
          id: "prizePool",
          label: "Prize Pool",
          value: `${getPriceStr(history.total_bet_amount || 0)} BTC`,
        },
      ]
    : [];

  const depositItems = history.bet
    ? [
        {
          id: "yourDeposit",
          label: "Your Deposit",
          value: `${getPriceStr(history.bet.amount || 0)} BTC`,
        },
        {
          id: "rewards",
          label: "Rewards",
          value: `${getPriceStr(claimableAmount)} BTC`,
          className: claimableAmount >= 0 ? "text-[#027a48]" : "text-[#b42318]",
        },
      ]
    : [];

  const isSkipped =
    !history.end_price ||
    !history.lock_price ||
    history.lock_price === 0 ||
    history.end_price === 0;

  let buttonLabel = "No Participation";

  if (history.bet) {
    if (roundPosition === history.bet.position) {
      buttonLabel = `Round Won${history.bet.claimed ? " (Claimed)" : ""}`;
    } else if (roundPosition === 2) {
      buttonLabel = "Bet Skipped";
    } else {
      buttonLabel = "Round Lost";
    }
  }

  if (isSkipped) {
    buttonLabel = "Bet Skipped";
  }

  const isDisabled =
    !history.bet ||
    (roundPosition === history.bet.position && Boolean(history.bet.claimed)) ||
    (roundPosition !== history.bet.position && roundPosition !== 2);

  return (
    <BaseCard
      classNames={{
        base: "px-[18px] shrink-0 py-6 rounded-[14px] w-[325px] h-[490px] gap-8 md:w-[450px] bg-[#14141A] justify-between mx-3",
      }}
    >
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between text-[#aaaaaa]">
          <span className="text-base font-semibold md:text-lg">Expired</span>
          <span className="rounded-lg border border-[#383848] bg-[#1e1e27] px-5 py-2 text-xs font-medium leading-[14px]">
            #{history.epoch}
          </span>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3.5">
            {!isSkipped ? (
              <span className="text-lg font-semibold leading-7 text-[#aaaaaa]">
                Closed Price
              </span>
            ) : (
              <div className="h-7" />
            )}

            {!isSkipped ? (
              <div className="flex items-center gap-3.5">
                <span
                  className={twMerge(
                    "text-3xl font-bold leading-[38px] md:text-5xl",
                    roundPosition === 0 ? "text-[#027a48]" : "text-[#EA3A3D]",
                  )}
                >
                  ${getPriceStr(history.end_price! / 1e8, 2)}
                </span>

                <ChangeRateBadge
                  rate={
                    ((history.end_price! - history.lock_price!) * 100) /
                    history.lock_price!
                  }
                />
              </div>
            ) : (
              <span className="text-3xl font-bold leading-[38px] text-[#aaa] md:text-5xl">
                Round Skipped
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              {prizeItems.map((item) => (
                <div key={item.id} className="flex w-1/2 flex-col gap-1">
                  <span className="text-sm font-bold leading-tight text-[#9494a8]">
                    {item.label}
                  </span>
                  <span className="text-base font-bold text-[#aaaaaa] md:text-xl">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex min-h-[50px] items-center justify-between">
              {depositItems.map((item) => (
                <div key={item.id} className="flex w-1/2 flex-col gap-1">
                  <span className="text-sm font-bold leading-tight text-[#9494a8]">
                    {item.label}
                  </span>
                  <span
                    className={twMerge(
                      "text-base font-bold text-[#aaaaaa] md:text-xl",
                      item.className,
                    )}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!isSkipped ? (
          <div className="flex items-center gap-2.5">
            <PayoutBadge
              variant="outlined"
              isDisabled={roundPosition !== 0}
              payout={upPayout}
              badgetType="up"
              className="w-full"
            />
            <PayoutBadge
              variant="outlined"
              isDisabled={roundPosition !== 1}
              payout={downPayout}
              badgetType="down"
              className="w-full"
            />
          </div>
        ) : (
          <p className="-mt-4 text-wrap text-xl leading-[30px] text-[#aaa]">
            This round has expired and was not executed due to insufficient bets
          </p>
        )}
      </div>

      <Button
        className={twMerge(
          "h-10 rounded-lg border px-[30px] py-2.5 text-justify text-sm font-bold leading-tight shadow",
          isDisabled || Boolean(isSkipped)
            ? "border-none bg-[#1E1E27] text-[#AAAAAA]"
            : "border-[#ff8744] bg-gradient-to-t from-[#ff8744] to-[#fda403] text-black",
        )}
        isDisabled={isDisabled || Boolean(isSkipped)}
      >
        {buttonLabel}
      </Button>
    </BaseCard>
  );
}
