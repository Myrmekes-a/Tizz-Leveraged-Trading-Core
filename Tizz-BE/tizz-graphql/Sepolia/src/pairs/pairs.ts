class PairInfo {
  baseAsset: string;
  quoteAsset: string;
  chainId: i32;
  decimals: i32;
}

export const pairs = new Map<string, PairInfo>();

pairs.set("0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", {
  baseAsset: "BTC",
  quoteAsset: "USD",
  chainId: 6,
  decimals: 8,
});
