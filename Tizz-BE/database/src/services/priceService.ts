import Price from "../models/PriceModel";
import { PriceRecordType } from "../types/price";

export const findPrices = async (filter: {
  pairIndex?: number;
  start?: number;
  end?: number;
}) => {
  const { pairIndex, start, end } = filter;
  const query: any = {};

  if (pairIndex !== undefined) {
    query["pairIndex"] = pairIndex;
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

  const prices = await Price.find(query);

  return prices;
};

export const insertPrices = async (priceData: PriceRecordType[]) => {
  const priceDBInput = priceData;
  await Price.insertMany(priceDBInput);
};

export const getPastPrices = async () => {
  const pastPrices = await Price.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
          // $gte: new Date("2024-05-16T17:27:09.414+00:00"),
        },
      },
    },
    {
      $sort: { timestamp: 1 }, // Sort by timestamp in descending order
    },
    {
      $group: {
        _id: "$pairIndex",
        data: { $first: "$$ROOT" }, // Get the first document for each pairIndex
      },
    },
    {
      $replaceRoot: { newRoot: "$data" }, // Replace the output root with the selected documents
    },
  ]);
  let priceData = pastPrices.sort((p1, p2) => p1.pairIndex - p2.pairIndex);

  return priceData;
};
