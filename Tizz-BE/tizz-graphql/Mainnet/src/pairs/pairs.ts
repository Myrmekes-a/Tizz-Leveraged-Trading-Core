class PairInfo {
  baseAsset: string;
  quoteAsset: string;
  chainId: i32;
  decimals: i32;
}

export const pairs = new Map<string, PairInfo>();

pairs.set("0xA39434A63A52E749F02807ae27335515BA4b07F7", {
  baseAsset: "BTC",
  quoteAsset: "USD",
  chainId: 1,
  decimals: 8,
});
pairs.set("0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", {
  baseAsset: "ETH",
  quoteAsset: "USD",
  chainId: 1,
  decimals: 18,
});
