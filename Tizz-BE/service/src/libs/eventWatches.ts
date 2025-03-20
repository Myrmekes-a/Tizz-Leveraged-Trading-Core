import { appConfig } from '../config';
import { useGlobalContext } from '../contexts/global';
import { synchronizeOpenTrades } from './live-events/synchronizedOpenTrades';
import { TRADE_EVENT } from '../@types/trade';
import { handleBorrowingFeesEvent } from './live-events/borrowing-fee';
import { handleMultiCollatEvents } from './live-events/multi-collateral';

const { EVENT_CONFIRMATIONS_MS } = appConfig();
const {
  OPEN_LIMIT_PLACED,
  OPEN_LIMIT_UPDATED,
  OPEN_LIMIT_CANCELED,
  TP_UPDATED,
  SL_UPDATED,
  MARKET_EXECUTED,
  LIMIT_EXECUTED,
  MARKET_CLOSE_CANCELED,
  SL_CANCELED,
  PAIR_ACC_FEES_UPDATED,
  GROUP_ACC_FEES_UPDATED,
  GROUP_OI_UPDATED,
  PAIR_PARAMS_UPDATED,
  PRICE_IMPACT_OPEN_INTEREST_ADDED,
  PRICE_IMPACT_OPEN_INTEREST_REMOVED,
  PRICE_IMPACT_OI_TRANSFERRED_PAIRS,
  PRICE_IMPACT_WINDOWS_DURATION_UPDATED,
  PRICE_IMPACT_WINDOWS_COUNT_UPDATED,
  PAIR_CUSTOM_MAX_LEVERAGE_UPDATED,
  MARKET_ORDER_INITIATED,
  MARKET_OPEN_CANCELED
} = TRADE_EVENT;

export function watchLiveTradingEvents() {
  let { globalAppInfo, update } = useGlobalContext();
  try {
    // Handle stack specific event subs
    globalAppInfo.collaterals.map(async (collat) => {
      const stack = globalAppInfo.stacks[collat];
      const subs = stack.eventSubs;

      subs?.trading?.unsubscribe();

      subs.trading = stack.contracts.trading.events.allEvents({ fromBlock: 'latest' }).on('data', (event) => {
        if ([OPEN_LIMIT_PLACED, OPEN_LIMIT_UPDATED, OPEN_LIMIT_CANCELED, TP_UPDATED, SL_UPDATED, MARKET_ORDER_INITIATED].indexOf(event.event) === -1) {
          return;
        }
        console.log('called_watchliveEvents_in_handler: ', subs.trading)

        setTimeout(() => synchronizeOpenTrades(collat, event), EVENT_CONFIRMATIONS_MS);
      });

      subs?.callbacks?.unsubscribe();

      subs.callbacks = stack.contracts.callbacks.events.allEvents({ fromBlock: 'latest' }).on('data', (event) => {
        if ([MARKET_EXECUTED, LIMIT_EXECUTED, MARKET_CLOSE_CANCELED, SL_CANCELED, MARKET_OPEN_CANCELED].indexOf(event.event) === -1) {
          return;
        }

        setTimeout(() => synchronizeOpenTrades(collat, event), EVENT_CONFIRMATIONS_MS);
      });

      subs?.borrowingFees?.unsubscribe();

      // we are no longer support borroing fees. we use funding fee
      subs.borrowingFees = stack.contracts.borrowingFees.events.allEvents({ fromBlock: 'latest' }).on('data', (event) => {
        if ([PAIR_ACC_FEES_UPDATED, GROUP_ACC_FEES_UPDATED, GROUP_OI_UPDATED, PAIR_PARAMS_UPDATED].indexOf(event.event) < 0) {
          return;
        }

        setTimeout(() => handleBorrowingFeesEvent(collat, event), EVENT_CONFIRMATIONS_MS);
      });
    });

    // Handle cross-stack event subs
    globalAppInfo?.eventSubs?.multiCollat?.unsubscribe();

    globalAppInfo.eventSubs.multiCollat = globalAppInfo.multiCollatContract.events
      .allEvents({ fromBlock: 'latest' })
      .on('data', (event) => {
        if (
          [
            PRICE_IMPACT_OPEN_INTEREST_ADDED,
            PRICE_IMPACT_OPEN_INTEREST_REMOVED,
            PRICE_IMPACT_OI_TRANSFERRED_PAIRS,
            PRICE_IMPACT_WINDOWS_DURATION_UPDATED,
            PRICE_IMPACT_WINDOWS_COUNT_UPDATED,
            PAIR_CUSTOM_MAX_LEVERAGE_UPDATED,
          ].indexOf(event.event) === -1
        ) {
          return;
        }

        setTimeout(() => handleMultiCollatEvents(event), EVENT_CONFIRMATIONS_MS);
      });

    update(globalAppInfo);
  } catch {
    setTimeout(() => {
      watchLiveTradingEvents();
    }, 2 * 1000);
  }
}