import { Redis } from "..";

export const getTradingVariablesRedis = async () => {
  if (Redis === null) return undefined;
  const tradingVariables = await Redis.get("trading-variables");
  return tradingVariables ? JSON.parse(tradingVariables) : null;
};

export const getTradingHistoryRedis = async () => {
  if (Redis === null) return undefined;
  const tradingVariables = await Redis.get("trading-variables");

  if (!tradingVariables) return {};

  const json = JSON.parse(tradingVariables);

  if (!json.knownOpenTrades) return {};

  return json.knownOpenTrades;
};
