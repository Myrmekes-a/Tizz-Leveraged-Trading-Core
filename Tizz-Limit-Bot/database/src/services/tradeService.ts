import Trade from "../models/TradeModel";
import { TradeRecordType } from "../types/trade";

export const findTradesByFilter = async (filters: {
  addresses?: string[];
  start?: number;
  end?: number;
}) => {
  const { addresses, start, end } = filters;
  const query: any = {};

  if (addresses !== undefined) {
    query["trader"] = { $in: addresses };
  }

  if (start !== undefined || end !== undefined) {
    query["$and"] = [];

    if (start !== undefined) {
      query["$and"].push({ timestamp: { $gt: start } });
    }

    if (end !== undefined) {
      query["$and"].push({ timestamp: { $lt: end } });
    }
  }

  const trades = await Trade.find(query);

  return trades;
};

export const insertTradeRecords = async (trades: TradeRecordType[]) => {
  if (!trades.length) return;

  const updatePromises = trades.map(trade =>
    Trade.updateOne(
      { uri: trade.uri },
      {
        ...trade,
        timestamp: new Date(trade.timestamp),
      },
      {
        upsert: true,
      }
    )
  );

  await Promise.all(updatePromises);
};
