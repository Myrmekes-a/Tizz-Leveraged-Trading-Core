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

export const aggregate24hPairVolumes = async (collateral: string) => {
  const pairVolumes = await Trade.aggregate([
    {
      $match: {
        $and: [
          {
            timestamp: {
              $gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
              // $gte: new Date("2024-06-17T18:43:36.000Z"),
            },
          },
          {
            collateral,
          },
          {
            action: "TradeOpenedMarket",
          },
        ],
      },
    },
    {
      $group: {
        _id: "$pair",
        volume: { $sum: { $toDouble: "$size" } }, // Sum the size for each pair
        count: { $sum: 1 },
      },
    },
  ]);

  return pairVolumes;
};

export const aggregate24hVolume = async (collateral: string) => {
  const dailyTrades = await Trade.find({
    collateral,
    action: "TradeOpenedMarket",
    timestamp: {
      $gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      // $gte: new Date("2024-06-17T18:43:36.000Z"),
    },
  });

  const volume = dailyTrades.reduce(
    (acc, trade) => acc + BigInt(trade.size),
    BigInt(0)
  );

  return {
    collateral,
    volume: volume.toString(),
    count: dailyTrades.length,
  };
};

export const aggregateAllVolume = async (collateral: string) => {
  const trades = await Trade.find({
    collateral,
    action: "TradeOpenedMarket",
  });

  const volume = trades.reduce(
    (acc, trade) => acc + BigInt(trade.size),
    BigInt(0)
  );

  return {
    collateral,
    volume: volume.toString(),
    count: trades.length,
  };
};
