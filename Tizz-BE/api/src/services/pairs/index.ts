import { logger } from '../../utils/logger';
import { DEFAULT_TRADING_VARIABLE_DATA } from './default';
import { isForexOpen, isStocksOpen, isIndicesOpen, isCommoditiesOpen, CollateralTypes } from '@tizz/sdk';
import { getTradingVariablesRedis } from '../../sockets/redis/contexts';

export async function getTradingVariables(collat: CollateralTypes) {
  logger.info(`  fetching trading variables data`);
  const data = await getTradingVariablesRedis();
  if (data) {
    return buildResDataFromJson(data, collat);
  } else logger.error('[ERROR][getTradingVariables] failed to parse extracted file data');

  return undefined;
}

export const buildResDataFromJson = (data, collat) => {
  let result = DEFAULT_TRADING_VARIABLE_DATA;

  result.lastRefreshed = new Date().toISOString();

  result.pairs = data.pairs.map((pair) => {
    return {
      from: pair['0'].from,
      to: pair['0'].to,
      spreadP: pair['0'].spreadP,
      groupIndex: pair['0'].groupIndex,
      feeIndex: pair['0'].feeIndex,
      pairId: pair['0'].pairId,
    };
  });

  result.groups = data.pairs
    .map((pair) => {
      return {
        name: pair['1'].name,
        minLeverage: pair['1'].minLeverage,
        maxLeverage: pair['1'].maxLeverage,
      };
    })
    .reduce((acc, cur) => {
      if (acc.map((group) => group.name).indexOf(cur.name) === -1) return [...acc, cur];
      else return acc;
    }, []);

  result.fees = data.pairs.map((pair) => {
    return {
      openFeeP: pair['2'].openFeeP,
      closeFeeP: pair['2'].closeFeeP,
      oracleFeeP: pair['2'].oracleFeeP,
      nftLimitrOrderFeeP: pair['2'].nftLimitOrderFeeP,
      minLevPosUsd: pair['2'].minLevPosUsd,
    };
  });

  result.openInterests = data.stacks[collat]?.openInterests;
  result.pairInfos.pairDepths = data.pairDepths;
  result.pairInfos.maxLeverages = Object.values(data.pairMaxLeverage);
  result.pairInfos.borrowingFees = data.stacks[collat]?.borrowingFeesContext;
  result.maxPosBaseAsset = data.stacks[collat]?.maxPosBaseAsset;
  result.currentBalanceBaseAsset = data.stacks[collat]?.currentBalanceBaseAsset;

  result.oiWindows = data.oiWindows;
  result.oiWindowsSettings = data.oiWindowsSettings;
  result.collateralConfig = data.stacks[collat]?.collateralConfig;

  let collatPrice = data.stacks[collat]?.collateralPriceUsd;
  if (!collatPrice) result.prices.collateralPriceUsd = '0';
  else {
    collatPrice = (BigInt(collatPrice) * BigInt(result.collateralConfig.precision)) / BigInt(1e10);
    result.prices.collateralPriceUsd = collatPrice.toString();
  }

  result.allTrades = Object.values(data.knownOpenTrades);
  result.allTrades = result.allTrades.filter((trade: any) => trade.collateral === collat);
  result.currentBlock = parseInt(data.blocks.web3ClientBlocks[0]);
  result.currentL1Block = parseInt(data.blocks.latestL2Block);

  const now = new Date();
  result.isForexOpen = isForexOpen(now);
  result.isStocksOpen = isStocksOpen(now);
  result.isIndicesOpen = isIndicesOpen(now);
  result.isCommoditiesOpen = isCommoditiesOpen(now);

  // TODO: need to extract remained fields

  // TODO: need to revise this func for the cases of ETH, USDC

  return result;
};
