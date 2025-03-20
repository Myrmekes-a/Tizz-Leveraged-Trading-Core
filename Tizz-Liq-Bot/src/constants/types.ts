export type TriggerOrder = {
  trader: string;
  index: string;
  pairIndex: string;
  type: number; // Consider StorageLimitOrder
  collateral: string;
  proof: string;
};
