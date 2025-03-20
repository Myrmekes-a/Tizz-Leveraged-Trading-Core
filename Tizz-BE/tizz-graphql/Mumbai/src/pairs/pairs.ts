class PairInfo {
  baseAsset: string;
  quoteAsset: string;
  chainId: i32;
  decimals: i32;
  constructor(
    baseAsset: string,
    quoteAsset: string,
    chainId: i32,
    decimals: i32
  ) {
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
    this.chainId = chainId;
    this.decimals = decimals;
  }
}

export const pairs = new Map<string, PairInfo>();

pairs.set(
  "0x11e187fd2c832a95bdd78a46dda774d5821e7569",
  new PairInfo("BTC", "USD", 80001, 8)
);

pairs.set(
  "0xB4cCB58dD3d35530E54B631AC0561F0c6D424D38".toLowerCase(),
  new PairInfo("ETH", "USD", 80001, 8)
);

pairs.set(
  "0xe0Ef78E847dc1A6aA410897B053E3C8a2B411828".toLowerCase(),
  new PairInfo("DAI", "USD", 80001, 8)
);
