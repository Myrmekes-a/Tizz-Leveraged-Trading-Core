import { TRADE_EVENT } from '../../@types/trade';
import { logger } from '../../utils/logger';
import { useGlobalContext } from '../../contexts/global';

const { PAIR_ACC_FEES_UPDATED, GROUP_ACC_FEES_UPDATED, GROUP_OI_UPDATED, PAIR_PARAMS_UPDATED } = TRADE_EVENT;

export async function handleBorrowingFeesEvent(collat, event) {
  let { globalAppInfo, update } = useGlobalContext();
  const stack = globalAppInfo.stacks[collat];

  try {
    if (!stack.borrowingFeesContext || !stack.openInterests) {
      throw new Error('borrowing fees context or open interests is undefined');
      return;
    }
    if (event.event === PAIR_ACC_FEES_UPDATED) {
      const { pairIndex, accFeeLong, accFeeShort } = event.returnValues;
      const pairBorrowingFees = stack.borrowingFeesContext.pairs[pairIndex];

      if (pairBorrowingFees) {
        pairBorrowingFees.accFeeLong = accFeeLong.toString();
        pairBorrowingFees.accFeeShort = accFeeShort.toString();
        pairBorrowingFees.accLastUpdateBlock = event.blockNumber.toString();
      }
    } else if (event.event === GROUP_ACC_FEES_UPDATED) {
      const { groupIndex, accFeeLong, accFeeShort } = event.returnValues;
      const groupBorrowingFees = stack.borrowingFeesContext.groups[groupIndex];

      if (groupBorrowingFees) {
        groupBorrowingFees.accFeeLong = accFeeLong.toString();
        groupBorrowingFees.accFeeShort = accFeeShort.toString();
        groupBorrowingFees.accLastUpdateBlock = event.blockNumber.toString();
      }
    } else if (event.event === GROUP_OI_UPDATED) {
      const { groupIndex, oiLong, oiShort } = event.returnValues;
      const groupBorrowingFees = stack.borrowingFeesContext.groups[groupIndex];

      if (groupBorrowingFees) {
        groupBorrowingFees.oiLong = oiLong.toString();
        groupBorrowingFees.oiShort = oiShort.toString();
      }
    } else if (event.event === PAIR_PARAMS_UPDATED) {
      const { pairIndex, maxOi } = event.returnValues;

      if (stack.openInterests[pairIndex] === undefined) {
        logger.warn(`Cannot process PairParamsUpdated event for pairIndex ${pairIndex}. Contract parameters not yet loaded.`);
        return;
      }
      stack.openInterests[pairIndex].max = maxOi.toString();
      stack.borrowingFeesContext.pairs[pairIndex].maxOi = maxOi.toString();
    }
    globalAppInfo.stacks[collat] = stack;
    update(globalAppInfo);
    logger.info(`Processed ${event.event}.`);
  } catch (error) {
    logger.error('Error occurred when handling BorrowingFees event.', error);
  }
}
