/**
 * Context to maintain global app info of service runtime
 */

import BN from 'bn.js';
import { appConfig } from '../config';

const { WEB3_PROVIDER_URLS } = appConfig();

let globalAppInfo: any = null;

export const useGlobalContext = () => {
  return {
    globalAppInfo,
    update: (newInfo) => (globalAppInfo = newInfo),
  };
};

export const DEFAULT_GLOBAL_APP_INFO = {
  // web3
  currentlySelectedWeb3ClientIndex: -1, // -1, // set index 0 default
  currentlySelectedWeb3Client: null,
  web3Clients: [],
  // contracts
  collaterals: [],
  stacks: {},
  multiCollatContract: null,
  eventSubs: {},
  // params
  spreadsP: [],
  oiWindows: {},
  oiWindowsSettings: { startTs: 0, windowsDuration: 0, windowsCount: 0 },
  blocks: {
    web3ClientBlocks: new Array(WEB3_PROVIDER_URLS.length).fill(0),
    latestL2Block: 0,
  },
  // storage/tracking
  knownOpenTrades: null,
  tradesLastUpdated: {},
  triggeredOrders: {},
  triggerRetries: {},
  gas: {
    priorityTransactionMaxPriorityFeePerGas: 50,
    standardTransactionGasFees: { maxFee: 31, maxPriorityFee: 31 },

    gasPriceBn: new BN(0.1 * 1e9),
  },
};
