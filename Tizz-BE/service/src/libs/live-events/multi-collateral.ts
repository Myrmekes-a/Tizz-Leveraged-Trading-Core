import { TRADE_EVENT } from "../../@types/trade";
import { useGlobalContext } from "../../contexts/global";
import { logger } from "../../utils/logger";
import { decreaseWindowOi, increaseWindowOi, transferOiWindows, updateWindowsCount, updateWindowsDuration } from "../../utils/util";

const {
  PRICE_IMPACT_OPEN_INTEREST_ADDED,
  PRICE_IMPACT_OPEN_INTEREST_REMOVED,
  PRICE_IMPACT_OI_TRANSFERRED_PAIRS,
  PRICE_IMPACT_WINDOWS_DURATION_UPDATED,
  PRICE_IMPACT_WINDOWS_COUNT_UPDATED,
  PAIR_CUSTOM_MAX_LEVERAGE_UPDATED,
} = TRADE_EVENT;

export async function handleMultiCollatEvents(event) {
    let { globalAppInfo, update } = useGlobalContext();
    try {
      if (event.event === PRICE_IMPACT_OPEN_INTEREST_ADDED) {
        const { pairIndex, windowId, long, openInterestUsd } = event.returnValues.oiWindowUpdate;
  
        increaseWindowOi(globalAppInfo.oiWindows, pairIndex, windowId, long, openInterestUsd);
      } else if (event.event === PRICE_IMPACT_OPEN_INTEREST_REMOVED) {
        const { oiWindowUpdate, notOutdated } = event.returnValues;
  
        decreaseWindowOi(
          globalAppInfo.oiWindows,
          oiWindowUpdate.pairIndex,
          oiWindowUpdate.windowId,
          oiWindowUpdate.long,
          oiWindowUpdate.openInterestUsd,
          notOutdated,
        );
      } else if (event.event === PRICE_IMPACT_OI_TRANSFERRED_PAIRS) {
        const { pairsCount, prevCurrentWindowId, prevEarliestWindowId, newCurrentWindowId } = event.returnValues;
  
        globalAppInfo.oiWindows = transferOiWindows(
          globalAppInfo.oiWindows,
          pairsCount,
          prevCurrentWindowId,
          prevEarliestWindowId,
          newCurrentWindowId,
        );
      } else if (event.event === PRICE_IMPACT_WINDOWS_DURATION_UPDATED) {
        const { windowsDuration } = event.returnValues;
  
        updateWindowsDuration(globalAppInfo.oiWindowsSettings, windowsDuration);
      } else if (event.event === PRICE_IMPACT_WINDOWS_COUNT_UPDATED) {
        const { windowsCount } = event.returnValues;
  
        updateWindowsCount(globalAppInfo.oiWindowsSettings, windowsCount);
      } else if (event.event === PAIR_CUSTOM_MAX_LEVERAGE_UPDATED) {
        const { index, maxLeverage } = event.returnValues;
  
        globalAppInfo.pairMaxLeverage[index] = Number(maxLeverage);
  
        logger.info(`${event.event}: Set pairMaxLeverage for pair ${index} to ${maxLeverage}.`);
      }
      logger.info(`Processed ${event.event}.`);
  
      update(globalAppInfo);
    } catch (error) {
      logger.error('Error occurred when handling MultiCollat event.', error);
    }
  }