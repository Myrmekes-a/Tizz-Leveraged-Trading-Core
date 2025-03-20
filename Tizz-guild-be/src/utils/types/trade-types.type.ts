type TraderData = {
  address: string;
  tradeCount: number;
  wins: number;
  pnl: string;
  volume: string;
  collateral: string;
  size: string;
  collateralPriceUsd: string;
};
export type WinsType = {
  [address: string]: TraderData;
};

type TradeRecord = {
  _id: string;
  trader: string;
  block: number;
  __v: number;
  action: string;
  buy: number;
  collateral: string;
  collateralPriceUsd: string;
  leverage: number;
  pair: string;
  pnl: string;
  price: number;
  size: string;
  timestamp: string;
  tx: string;
};
export type TradeData = {
  data: TradeRecord[];
};
