import { findTradesByFilter } from '@tizz/database';
import { logger } from '../../utils/logger';
import { toJSON } from '../../utils/util';
import { CollateralPriceUsdPrecision, CollertalPrecision } from '../../constants';

export async function fetchWinnerTradesData(addresses?: string[], start?: number, end?: number) {
  logger.info(`  fetching trade data for winner: ${addresses}, start: ${start}, end: ${end}`);

  // load trades from DB
  const trades = await findTradesByFilter({
    addresses,
    start,
    end,
  });

  let result: {
    [winner: string]: {
      address: string;
      tradeCount: number;
      wins: number;
      pnl: number;
      volume: number;
    };
  } = {};

  trades.map((trade) => {
    let res = result[trade.trader];

    if (!res)
      result[trade.trader] = {
        address: trade.trader,
        tradeCount: 1,
        wins: parseFloat(trade.pnl) > 0 ? 1 : 0,
        pnl:
          (parseFloat(trade.pnl) * parseFloat(trade.collateralPriceUsd)) /
          parseFloat(CollertalPrecision[trade.collateral]) /
          parseFloat(CollateralPriceUsdPrecision),
        volume:
          (parseFloat(trade.size) * parseFloat(trade.collateralPriceUsd)) /
          parseFloat(CollertalPrecision[trade.collateral]) /
          parseFloat(CollateralPriceUsdPrecision),
      };
    else {
      res.tradeCount++;
      if (parseFloat(trade.pnl) > 0) res.wins++;
      res.pnl +=
        (parseFloat(trade.pnl) * parseFloat(trade.collateralPriceUsd)) /
        parseFloat(CollertalPrecision[trade.collateral]) /
        parseFloat(CollateralPriceUsdPrecision);
      res.volume +=
        (parseFloat(trade.size) * parseFloat(trade.collateralPriceUsd)) /
        parseFloat(CollertalPrecision[trade.collateral]) /
        parseFloat(CollateralPriceUsdPrecision);

      result[trade.trader] = res;
    }
  });

  return toJSON(result);
}

export async function fetchTradesData(addresses?: string[], start?: number, end?: number) {
  logger.info(`  fetching trade data for winner: ${addresses}, start: ${start}, end: ${end}`);

  // load trades from DB
  const trades = await findTradesByFilter({
    addresses,
    start,
    end,
  });

  return trades;
}
