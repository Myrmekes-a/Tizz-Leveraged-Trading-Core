import { getContractAddressesForChain, CollateralTypes } from '@tizz/sdk';

export const CHAIN_IDS = {
  BOTANIX_TEST: 3636,
  BOTANIX: 3637,
  ARB_SEPOLIA: 421614,
};

export const COLLATERAL = CollateralTypes;

export const COLLATERAL_CONFIG = {
  [COLLATERAL.USDT]: {
    decimals: 18,
    precision: 1e18,
    precisionDelta: 1,
  },
  [COLLATERAL.WBTC]: {
    decimals: 8,
    precision: 1e8,
    precisionDelta: 1e10,
  },
};

const BOTANIX_TEST_USDT_CONTRACTS = getContractAddressesForChain(CHAIN_IDS.BOTANIX_TEST, COLLATERAL.USDT);
const BOTANIX_TEST_WBTC_CONTRACTS = getContractAddressesForChain(CHAIN_IDS.BOTANIX_TEST, COLLATERAL.WBTC);
const ARB_SEPOLIA_USDT_CONTRACTS = getContractAddressesForChain(CHAIN_IDS.ARB_SEPOLIA, COLLATERAL.USDT);
const ARB_SEPOLIA_WBTC_CONTRACTS = getContractAddressesForChain(CHAIN_IDS.ARB_SEPOLIA, COLLATERAL.WBTC);

export const NETWORKS = {
  [CHAIN_IDS.BOTANIX_TEST]: {
    chainName: 'botanix-test',
    chainId: CHAIN_IDS.BOTANIX_TEST,
    customMulticallAddress: BOTANIX_TEST_USDT_CONTRACTS.customMulticall,
    multiCollatDiamondAddress: BOTANIX_TEST_USDT_CONTRACTS.tizzMultiCollatDiamond,
    supportedCollaterals: [
      {
        collateral: COLLATERAL.USDT,
        storage: BOTANIX_TEST_USDT_CONTRACTS.tizzTradingStorage,
        trading: BOTANIX_TEST_USDT_CONTRACTS.tizzTrading,
        token: BOTANIX_TEST_USDT_CONTRACTS.tizzToken,
        fundingRate: BOTANIX_TEST_USDT_CONTRACTS.tizzFundingRate,
      },
      {
        collateral: COLLATERAL.WBTC,
        storage: BOTANIX_TEST_WBTC_CONTRACTS.tizzTradingStorage,
        trading: BOTANIX_TEST_WBTC_CONTRACTS.tizzTrading,
        token: BOTANIX_TEST_WBTC_CONTRACTS.tizzToken,
        fundingRate: BOTANIX_TEST_WBTC_CONTRACTS.tizzFundingRate,
      },
    ],
  },
  [CHAIN_IDS.ARB_SEPOLIA]: {
    chainName: 'arbitrum-sepolia',
    chainId: CHAIN_IDS.ARB_SEPOLIA,
    customMulticallAddress: ARB_SEPOLIA_USDT_CONTRACTS.customMulticall,
    multiCollatDiamondAddress: ARB_SEPOLIA_USDT_CONTRACTS.tizzMultiCollatDiamond,
    supportedCollaterals: [
      {
        collateral: COLLATERAL.USDT,
        storage: ARB_SEPOLIA_USDT_CONTRACTS.tizzTradingStorage,
        trading: ARB_SEPOLIA_USDT_CONTRACTS.tizzTrading,
        token: ARB_SEPOLIA_USDT_CONTRACTS.tizzToken,
        fundingRate: ARB_SEPOLIA_USDT_CONTRACTS.tizzFundingRate,
      },
      {
        collateral: COLLATERAL.WBTC,
        storage: ARB_SEPOLIA_WBTC_CONTRACTS.tizzTradingStorage,
        trading: ARB_SEPOLIA_WBTC_CONTRACTS.tizzTrading,
        token: ARB_SEPOLIA_WBTC_CONTRACTS.tizzToken,
        fundingRate: ARB_SEPOLIA_WBTC_CONTRACTS.tizzFundingRate,
      },
    ],
  },
};

export const TRADE_TYPE = { MARKET: 0, LIMIT: 1 };
