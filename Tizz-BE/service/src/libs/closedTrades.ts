import { TradeRecordType, insertTradeRecords } from "@tizz/database";
import { addNewClosedTrade } from "../redis/contexts/openTrades";
import { logger } from '../utils/logger';
import { getPairName, toJSON } from "../utils/util";
import { publishNewTrades } from "../redis";

export async function addClosedTrades(newCloseTrade: [string, any], txId: string) {
    const closedTrade = await addNewClosedTrade(newCloseTrade);
  
    if (closedTrade) {
      logger.info(`Adding new closed trade record to DB..`);
      const pairIndex = Number(closedTrade.trade.pairIndex);
  
      const newRecord = {
        timestamp: closedTrade.date,
        pairIndex,
        pair: getPairName(pairIndex),
        trader: closedTrade.trade.trader,
        action: 'TradeClosedMarket',
        openPrice: closedTrade.trade.openPrice,
        closePrice: closedTrade.trade.closePrice,
        collateralPriceUsd: closedTrade.tradeData.collateralPriceUsd,
        buy: closedTrade.trade.buy ? 1 : 0,
        size: closedTrade.trade.positionSizeBaseAsset,
        leverage: closedTrade.trade.leverage,
        pnl: closedTrade.trade.pnl_net[0],
        block: closedTrade.tradeInitialAccFees.borrowing.block,
        tx: txId,
        uri: closedTrade.uri,
        collateral: closedTrade.collateral,
      } as TradeRecordType;
  
      await insertTradeRecords([newRecord]);
      await publishNewTrades(toJSON([newRecord]));
    } else {
      logger.info(`Already added new closed trade record. Ignoring..`);
    }
  }
  