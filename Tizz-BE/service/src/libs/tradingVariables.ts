import fs from 'fs';
import { getCurrentOiWindowId } from '@tizz/sdk';

import { logger } from '../utils/logger';
import { convertOiWindows, toJSON } from '../utils/util';
import { appConfig } from '../config';
import { useGlobalContext } from '../contexts/global';

const { FETCH_TRADING_VARIABLES_REFRESH_INTERVAL_MS, ENABLE_FS_LOGGING, ENABLE_CONSOLE_LOGGING } = appConfig();

let fetchTradingVariablesTimerId: NodeJS.Timeout | null = null;
let currentTradingVariablesFetchPromise: Promise<void[]> | null = null;

/// Fetch pairs
export async function fetchTradingVariables() {
  let { globalAppInfo, update } = useGlobalContext();
  logger.info('Fetching trading variables...');
  if (!globalAppInfo) {
    logger.info('Global app info is null. Skipping...');
    return;
  }

  if (fetchTradingVariablesTimerId !== null) {
    logger.debug(`Canceling existing fetchTradingVariables timer id.`);

    clearTimeout(fetchTradingVariablesTimerId);
    fetchTradingVariablesTimerId = null;
  }

  const executionStart = performance.now();

  try {
    const pairsCount = await globalAppInfo.multiCollatContract.methods.pairsCount().call();

    if (currentTradingVariablesFetchPromise !== null) {
      logger.warn(`A current fetchTradingVariables call was already in progress, just awaiting that...`);

      return await currentTradingVariablesFetchPromise;
    }

    currentTradingVariablesFetchPromise = Promise.all([
      fetchGlobalPairs(pairsCount),
      fetchPairs(pairsCount),
      fetchBorrowingFees(),
      fetchOiWindows(pairsCount),
    ]);

    await currentTradingVariablesFetchPromise;

    update(globalAppInfo);
    const json = toJSON(globalAppInfo);

    // Write extract info in log file for testing purpose
    if (ENABLE_FS_LOGGING) fs.writeFileSync('../logs/trading-variables.test.json', json);

    logger.info(`Done fetching trading variables; took ${performance.now() - executionStart}ms.`);

    if (FETCH_TRADING_VARIABLES_REFRESH_INTERVAL_MS > 0) {
      fetchTradingVariablesTimerId = setTimeout(() => {
        fetchTradingVariablesTimerId = null;
        fetchTradingVariables();
      }, FETCH_TRADING_VARIABLES_REFRESH_INTERVAL_MS);
    }
  } catch (error) {
    logger.error('Error while fetching trading variables!', { error });
    if (ENABLE_CONSOLE_LOGGING) console.dir(error, { depth: null });

    fetchTradingVariablesTimerId = setTimeout(() => {
      fetchTradingVariablesTimerId = null;
      fetchTradingVariables();
    }, 2 * 1000);
  } finally {
    currentTradingVariablesFetchPromise = null;
  }

  async function fetchGlobalPairs(pairsCount) {
    const [depths, maxLeverage, pairsBackend] = await Promise.all([
      globalAppInfo.multiCollatContract.methods.getPairDepths([...Array(parseInt(pairsCount)).keys()]).call(),
      globalAppInfo.multiCollatContract.methods.getAllPairsRestrictedMaxLeverage().call(),
      Promise.all(
        [...Array(parseInt(pairsCount)).keys()].map(async (_, pairIndex) =>
          globalAppInfo.multiCollatContract.methods.pairsBackend(pairIndex).call(),
        ),
      ),
    ]);

    globalAppInfo.pairMaxLeverage = Object.fromEntries(maxLeverage.map((l, idx) => [idx, Number(l)]));
    globalAppInfo.pairDepths = depths.map((value) => ({
      onePercentDepthAboveUsd: value.onePercentDepthAboveUsd,
      onePercentDepthBelowUsd: value.onePercentDepthBelowUsd,
    }));
    globalAppInfo.pairs = pairsBackend;
    globalAppInfo.spreadsP = pairsBackend.map((p) => p['0'].spreadP);
  }

  async function fetchPairs(pairsCount) {
    await Promise.all(
      globalAppInfo.collaterals.map(async (collat) => {
        // console.log('globalAppInfo: ', globalAppInfo.stacks[collat], collat)
        const contracts = globalAppInfo.stacks[collat].contracts;
        const maxPerPair = await contracts.storage.methods.maxTradesPerPair().call();
        const collateralPriceUsd = await contracts.aggregator.methods.getCollateralPriceUsd().call();
        const maxPosBaseAsset = await contracts.trading.methods.maxPosBaseAsset().call();
        const currentBalanceBaseAsset = await contracts.token.methods.currentBalanceBaseAsset().call();

        const newOpenInterests: any[] = [];

        await Promise.all(
          [...Array(parseInt(pairsCount)).keys()].map(async (_, pairIndex) => {
            const [openInterestLong, openInterestShort, openInterestMax] = await Promise.all([
              contracts.storage.methods.openInterestBaseAsset(pairIndex, 0).call(),
              contracts.storage.methods.openInterestBaseAsset(pairIndex, 1).call(),
              contracts.borrowingFees.methods.getCollateralPairMaxOi(pairIndex).call(),
            ]);

            newOpenInterests[pairIndex] = {
              long: openInterestLong,
              short: openInterestShort,
              max: openInterestMax, // already normalized
            };
          }),
        );

        globalAppInfo.stacks[collat].maxTradesPerPair = maxPerPair;
        globalAppInfo.stacks[collat].collateralPriceUsd = collateralPriceUsd;
        globalAppInfo.stacks[collat].openInterests = newOpenInterests;
        globalAppInfo.stacks[collat].maxPosBaseAsset = maxPosBaseAsset;
        globalAppInfo.stacks[collat].currentBalanceBaseAsset = currentBalanceBaseAsset;
      }),
    );
  }

  async function fetchBorrowingFees() {
    await Promise.all(
      globalAppInfo.collaterals.map(async (collat) => {
        const contracts = globalAppInfo.stacks[collat].contracts;
        const borrowingFeesInfo = await contracts.borrowingFees.methods.getAllPairs().call();

        const [borrowingFees, maxOis] = [borrowingFeesInfo['0'], borrowingFeesInfo['1']];

        const borrowingFeesPairs = borrowingFees.map((value, idx) => ({
          maxOi: maxOis[idx].max,
          feePerBlock: value.feePerBlock,
          accFeeLong: value.accFeeLong,
          accFeeShort: value.accFeeShort,
          accLastUpdatedBlock: value.accLastUpdatedBlock,
          lastAccBlockWeightedMarketCap: value.lastAccBlockWeightedMarketCap,
          feeExponent: value.feeExponent,
          groups: value.groups.map((value) => ({
            groupIndex: value.groupIndex,
            block: value.block,
            initialAccFeeLong: value.initialAccFeeLong,
            initialAccFeeShort: value.initialAccFeeShort,
            prevGroupAccFeeLong: value.prevGroupAccFeeLong,
            prevGroupAccFeeShort: value.prevGroupAccFeeShort,
            pairAccFeeLong: value.pairAccFeeLong,
            pairAccFeeShort: value.pairAccFeeShort,
          })),
        }));
        const borrowingFeesGroupIds: number[] = (
          [
            ...new Set(borrowingFeesPairs.map((value) => value.groups.map((value) => parseInt(value.groupIndex))).flat()),
          ] as number[]
        ).sort((a, b) => a - b);

        const borrowingFeesGroupsInfo =
          borrowingFeesGroupIds.length > 0
            ? await contracts.borrowingFees.methods
                .getGroups(Array.from(Array(+borrowingFeesGroupIds[borrowingFeesGroupIds.length - 1] + 1).keys()))
                .call()
            : [];

        const [borrowingFeesGroups, groupExponents] = [borrowingFeesGroupsInfo['0'], borrowingFeesGroupsInfo['1']];
        globalAppInfo.stacks[collat].borrowingFeesContext.pairs = borrowingFeesPairs;
        globalAppInfo.stacks[collat].borrowingFeesContext.groups = borrowingFeesGroups?.map((value, idx) => ({
          oiLong: value.oiLong,
          oiShort: value.oiShort,
          maxOi: value.maxOi,
          feePerBlock: value.feePerBlock,
          accFeeLong: value.accFeeLong,
          accFeeShort: value.accFeeShort,
          accLastUpdatedBlock: value.accLastUpdatedBlock,
          lastAccBlockWeightedMarketCap: value.lastAccBlockWeightedMarketCap,
          feeExponent: groupExponents[idx],
        }));
      }),
    );
  }
  async function fetchOiWindows(pairLength) {
    const { startTs, windowsDuration, windowsCount } = await globalAppInfo.multiCollatContract.methods
      .getOiWindowsSettings()
      .call();

    globalAppInfo.oiWindowsSettings = {
      startTs: parseInt(startTs),
      windowsDuration: parseInt(windowsDuration),
      windowsCount: parseInt(windowsCount),
    };

    const currWindowId = getCurrentOiWindowId(globalAppInfo.oiWindowsSettings);

    // Always fetch max window count
    const windowsToCheck = [...Array(5).keys()].map((i) => currWindowId - i).filter((v) => v > -1);

    const oiWindowsTemp = (
      await Promise.all(
        [...Array(parseInt(pairLength)).keys()].map((_, pairIndex) =>
          globalAppInfo.multiCollatContract.methods
            .getOiWindows(globalAppInfo.oiWindowsSettings.windowsDuration, pairIndex, windowsToCheck)
            .call()
            .then((r) => r.map((w) => ({ oiLongUsd: w.oiLongUsd, oiShortUsd: w.oiShortUsd }))),
        ),
      )
    ).map((pairWindows) => pairWindows.reduce((acc, curr, i) => ({ ...acc, [windowsToCheck[i]]: curr }), {}));

    globalAppInfo.oiWindows = convertOiWindows(oiWindowsTemp);
  }

  return true;
}
