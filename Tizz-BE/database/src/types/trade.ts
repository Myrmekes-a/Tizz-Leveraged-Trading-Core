export type TradeRecordType = {
  trader: string;
  pair: string;
  openPrice: number;
  closePrice?: number;
  action: string;
  collateralPriceUsd: number;
  buy: number;
  size: number;
  leverage: number;
  pnl: number;
  block: number;
  tx: string;
  timestamp: string;
  uri: string;
  collateral: string;
};
