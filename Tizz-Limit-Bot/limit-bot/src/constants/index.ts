import { getContractAddressesForChain, CollateralTypes } from '@tizz/sdk';

export const CHAIN_IDS = {
  BOTANIX_TEST: 3636,
  BOTANIX: 3637,
  ARB_SEPOLIA_TEST: 421614,
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
const ARB_SEPOLIA_TEST_USDT_CONTRACTS = getContractAddressesForChain(CHAIN_IDS.ARB_SEPOLIA_TEST, COLLATERAL.USDT);
const ARB_SEPOLIA_TEST_WBTC_CONTRACTS = getContractAddressesForChain(CHAIN_IDS.ARB_SEPOLIA_TEST, COLLATERAL.WBTC);

export const NETWORKS = {
  [CHAIN_IDS.BOTANIX_TEST]: {
    chainName: 'botanix-test',
    chainId: CHAIN_IDS.BOTANIX_TEST,
    multiCollatDiamondAddress: BOTANIX_TEST_USDT_CONTRACTS.tizzMultiCollatDiamond,
    supportedCollaterals: [
      {
        collateral: COLLATERAL.USDT,
        storage: BOTANIX_TEST_USDT_CONTRACTS.tizzTradingStorage,
        trading: BOTANIX_TEST_USDT_CONTRACTS.tizzTrading,
      },
      {
        collateral: COLLATERAL.WBTC,
        storage: BOTANIX_TEST_WBTC_CONTRACTS.tizzTradingStorage,
        trading: BOTANIX_TEST_WBTC_CONTRACTS.tizzTrading,
      },
    ],
  },
  [CHAIN_IDS.ARB_SEPOLIA_TEST]: {
    chainName: 'arbitrum-sepolia',
    chainId: CHAIN_IDS.ARB_SEPOLIA_TEST,
    multiCollatDiamondAddress: ARB_SEPOLIA_TEST_USDT_CONTRACTS.tizzMultiCollatDiamond,
    supportedCollaterals: [
      {
        collateral: COLLATERAL.USDT,
        storage: ARB_SEPOLIA_TEST_USDT_CONTRACTS.tizzTradingStorage,
        trading: ARB_SEPOLIA_TEST_USDT_CONTRACTS.tizzTrading,
      },
      {
        collateral: COLLATERAL.WBTC,
        storage: ARB_SEPOLIA_TEST_WBTC_CONTRACTS.tizzTradingStorage,
        trading: ARB_SEPOLIA_TEST_WBTC_CONTRACTS.tizzTrading,
      },
    ],
  },
};

export const TRADE_TYPE = { MARKET: 0, LIMIT: 1 };

export const CONTRACTS_BY_COLLAT = {
  [CHAIN_IDS.BOTANIX_TEST]: {
    ['USDT'.toString()]: {
      trading: BOTANIX_TEST_USDT_CONTRACTS.tizzTrading,
      storage: BOTANIX_TEST_USDT_CONTRACTS.tizzTradingStorage,
    },
    ['WBTC'.toString()]: {
      trading: BOTANIX_TEST_WBTC_CONTRACTS.tizzTrading,
      storage: BOTANIX_TEST_WBTC_CONTRACTS.tizzTradingStorage,
    },
  },
  [CHAIN_IDS.ARB_SEPOLIA_TEST]: {
    ['USDT'.toString()]: {
      trading: ARB_SEPOLIA_TEST_USDT_CONTRACTS.tizzTrading,
      storage: ARB_SEPOLIA_TEST_USDT_CONTRACTS.tizzTradingStorage,
    },
    ['WBTC'.toString()]: {
      trading: ARB_SEPOLIA_TEST_WBTC_CONTRACTS.tizzTrading,
      storage: ARB_SEPOLIA_TEST_WBTC_CONTRACTS.tizzTradingStorage,
    },
  },
};


export const GAS_LIMIT = 2000000;