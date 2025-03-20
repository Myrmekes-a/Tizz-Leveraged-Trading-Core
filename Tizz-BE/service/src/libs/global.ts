import Web3 from 'web3';
import { ABIS as abis } from '@tizz/sdk';
import { appConfig } from '../config';
import { fetchTradingVariables } from './tradingVariables';
import { logger } from '../utils/logger';
import { initStack } from '../utils/multiCollateral';
import { fetchOpenTrades } from './openedTrades';
import { watchLiveTradingEvents } from './eventWatches';
import { DEFAULT_GLOBAL_APP_INFO, useGlobalContext } from '../contexts/global';
import { ethers } from 'ethers';
import { runFundingRate } from './funding-rates';

const { CHAIN, NETWORK, WEB3_PROVIDER_URLS, MAX_PROVIDER_BLOCK_DRIFT } = appConfig();
const COOLDOWN_PERIOD = 65000; // Cooldown period in milliseconds (e.g., 65 seconds)
let lastReconnectionAttempt = 0;
let isReconnecting = false;

export const initGlobalContext = async () => {
  let { globalAppInfo, update } = useGlobalContext();
  if (globalAppInfo === null) {
    globalAppInfo = { ...DEFAULT_GLOBAL_APP_INFO }; // Ensure deep copy
    let web3ProviderUrlIndex = 0; // set index to default 0

    // NOTE: Assuming to use only first WS RPC
    globalAppInfo.web3Clients.push(await createWeb3Client(web3ProviderUrlIndex, WEB3_PROVIDER_URLS[web3ProviderUrlIndex]));
    update(globalAppInfo);

    setCurrentWeb3Client(web3ProviderUrlIndex);
  }
};

async function setCurrentWeb3Client(newWeb3ClientIndex) {
  let { globalAppInfo, update } = useGlobalContext();
  if (!globalAppInfo) {
    globalAppInfo = { ...DEFAULT_GLOBAL_APP_INFO }; // Ensure deep copy
    update(globalAppInfo);
  }
  logger.info('Switching web3 client to ' + WEB3_PROVIDER_URLS[newWeb3ClientIndex] + ' (#' + newWeb3ClientIndex + ')...');

  const executionStartTime = performance.now();
  const newWeb3Client = globalAppInfo.web3Clients[newWeb3ClientIndex];

  if (await isWebSocketConnected(newWeb3Client)) {
    if (!NETWORK.multiCollatDiamondAddress || NETWORK.multiCollatDiamondAddress?.length < 42) {
      throw Error('Missing `multiCollatDiamondAddress` network configuration.');
    }

    try {
      globalAppInfo.multiCollatContract = new newWeb3Client.eth.Contract(
        abis.MULTI_COLLAT_DIAMOND,
        NETWORK.multiCollatDiamondAddress,
      );

      const supportedCollaterals: any[] = [];
      const stacks = await Promise.all(
        NETWORK.supportedCollaterals.map(async (stackConfig) => {
          return initStack(newWeb3Client, stackConfig);
        }),
      );

      for (const stack of stacks) {
        supportedCollaterals.push(stack.collateral);
        globalAppInfo.stacks[stack.collateral] = stack;
      }
      globalAppInfo.collaterals = supportedCollaterals;

      // Update the globally selected provider with this new provider
      globalAppInfo.currentlySelectedWeb3ClientIndex = newWeb3ClientIndex;
      globalAppInfo.currentlySelectedWeb3Client = newWeb3Client;
      globalAppInfo.providerStatus = globalAppInfo.providerStatus || {}; // Initialize if undefined
      globalAppInfo.providerStatus[newWeb3ClientIndex] = true; // Mark provider as available
      globalAppInfo.web3SocketProvider = new ethers.providers.WebSocketProvider(
        newWeb3Client.currentProvider._socketConnection._url,
      );

      update(globalAppInfo);
    } catch (error) {
      logger.error(`Error handling multiCollatContract Creation:`, error);
    }

    // Subscribe to events using the new provider
    watchLiveTradingEvents();

    // Trigger pairs and trades fetching interval
    fetchTradingVariables();
    fetchOpenTrades();
    runFundingRate();

    logger.info('New web3 client selection completed. Took: ' + (performance.now() - executionStartTime) + 'ms');
  } else {
    logger.error('New web3 client is not connected. Skipping...');
  }
}

async function isWebSocketConnected(web3Client: Web3): Promise<boolean> {
  try {
    await web3Client.eth.getNodeInfo();
    return true;
  } catch (error) {
    logger.error('Web3 provider is not connected:', error);
    return false;
  }
}

function handleReconnection(providerUrl, attempt = 0) {
  const currentTime = Date.now();

  if (isReconnecting || currentTime - lastReconnectionAttempt < COOLDOWN_PERIOD) {
    logger.info(`Reconnection attempt skipped for provider ${providerUrl} due to cooldown.`);
    return;
  }

  isReconnecting = true;
  lastReconnectionAttempt = currentTime;

  const maxAttempts = 7;
  const baseDelay = 1000;

  const reconnect = async () => {
    if (attempt >= maxAttempts) {
      logger.error(`Maximum number of reconnect attempts reached for provider ${providerUrl}`);
      return;
    }

    const delay = baseDelay * Math.pow(2, Math.min(attempt, 10)); // Cap delay at 1024 seconds
    logger.info(`Reconnecting to provider ${providerUrl} in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})...`);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      logMemoryUsage('Before reconnection attempt');

      const newProvider = createWeb3Provider(providerUrl);
      if (await isWebSocketConnected(new Web3(newProvider))) {
        replaceWeb3ClientProvider(newProvider, providerUrl);
        logger.info(`Successfully reconnected to provider ${providerUrl}`);
      } else {
        logger.warn(`Provider ${providerUrl} is still not connected after attempt ${attempt + 1}`);
        handleReconnection(providerUrl, attempt + 1);
      }
      logMemoryUsage('After reconnection attempt');
    } catch (error) {
      logger.error(`Error while reconnecting to provider ${providerUrl}:`, error);
      handleReconnection(providerUrl, attempt + 1);
    } finally {
      isReconnecting = false;
    }
  };

  reconnect();
}

function createWeb3Provider(providerUrl) {
  try {
    logMemoryUsage('Before creating new Web3 client');

    const provider = new Web3.providers.WebsocketProvider(providerUrl);

    provider.on('connect', () => {
      logger.info(`Connected to provider ${providerUrl}`);
      updateProviderStatus(providerUrl, true); // Mark provider as available
    });

    provider.on('reconnect', () => {
      logger.info(`Provider ${providerUrl} is reconnecting...`);
    });

    provider.on('error', (error) => {
      logger.error(`Provider error: ${providerUrl}`, error);
      updateProviderStatus(providerUrl, false); // Mark provider as unavailable
      if (error.message.includes('404')) {
        // Stop trying to reconnect on 404 errors
        logger.error(`Received 404 error from provider ${providerUrl}. Stopping reconnection attempts.`);
      } else {
        handleReconnection(providerUrl);
      }
    });

    provider.on('end', (event) => {
      logger.info(`Provider connection ended: ${providerUrl}`, event);
      updateProviderStatus(providerUrl, false); // Mark provider as unavailable
      handleReconnection(providerUrl);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    logMemoryUsage('After creating new Web3 client');

    return provider;
  } catch (e) {
    logger.error(`Error creating Web3 provider for URL ${providerUrl}:`, e);
    throw e;
  }
}

function updateProviderStatus(providerUrl, status) {
  let { globalAppInfo, update } = useGlobalContext();
  if (!globalAppInfo) {
    globalAppInfo = { ...DEFAULT_GLOBAL_APP_INFO }; // Ensure deep copy
    update(globalAppInfo);
  }
  const providerIndex = WEB3_PROVIDER_URLS.indexOf(providerUrl);
  if (providerIndex !== -1) {
    if (!globalAppInfo.providerStatus) {
      globalAppInfo.providerStatus = {};
    }
    globalAppInfo.providerStatus[providerIndex] = status;
    update(globalAppInfo);
  }
}

function replaceWeb3ClientProvider(newProvider, providerUrl) {
  let { globalAppInfo, update } = useGlobalContext();
  if (!globalAppInfo) {
    globalAppInfo = { ...DEFAULT_GLOBAL_APP_INFO }; // Ensure deep copy
    update(globalAppInfo);
  }
  const providerIndex = globalAppInfo.web3Clients.findIndex((client) => (client.currentProvider as any)?.host === providerUrl);
  if (providerIndex !== -1) {
    const web3Client = new Web3(newProvider);
    globalAppInfo.web3Clients[providerIndex] = web3Client;
    update(globalAppInfo);

    if (globalAppInfo.currentlySelectedWeb3ClientIndex === providerIndex) {
      setCurrentWeb3Client(providerIndex);
    }
  }
}

async function createWeb3Client(providerIndex, providerUrl) {
  const provider = createWeb3Provider(providerUrl);
  const web3Client = new Web3(provider);
  web3Client.eth.handleRevert = true;
  web3Client.eth.defaultAccount = undefined;
  web3Client.eth.defaultChain = CHAIN;

  provider.on('connect', () => {
    logger.info(`Web3 client connected to provider ${providerUrl}`);
  });

  (await web3Client.eth.subscribe('newBlockHeaders')).on('data', async (header) => {
    let { globalAppInfo, update } = useGlobalContext();
    if (!globalAppInfo) {
      globalAppInfo = { ...DEFAULT_GLOBAL_APP_INFO }; // Ensure deep copy
      update(globalAppInfo);
    }
    const newBlockNumber = header?.number;

    if (!newBlockNumber) {
      logger.debug(`Received unfinished block from provider ${providerUrl}; ignoring...`);
      return;
    }

    if (newBlockNumber > globalAppInfo.blocks.latestL2Block) {
      globalAppInfo.blocks.latestL2Block = newBlockNumber;
    }

    globalAppInfo.blocks.web3ClientBlocks[providerIndex] = newBlockNumber;

    update(globalAppInfo);
    logger.debug(`New block received ${newBlockNumber} from provider ${providerUrl}...`);

    if (globalAppInfo.currentlySelectedWeb3ClientIndex === providerIndex) {
      return;
    }

    const blockDiff =
      globalAppInfo.currentlySelectedWeb3ClientIndex === -1
        ? newBlockNumber
        : (newBlockNumber as number) - globalAppInfo.blocks.web3ClientBlocks[globalAppInfo.currentlySelectedWeb3ClientIndex];

    logger.debug(`Block difference between current and new provider: ${blockDiff}`);

    if ((blockDiff as number) > MAX_PROVIDER_BLOCK_DRIFT) {
      logger.info(
        `Switching to provider ${providerUrl} #${providerIndex} because it is ${blockDiff} block(s) ahead of current provider (${newBlockNumber} vs ${
          globalAppInfo.blocks.web3ClientBlocks[globalAppInfo.currentlySelectedWeb3ClientIndex]
        })`,
      );

      setCurrentWeb3Client(providerIndex);
    }
  });

  return web3Client;
}

function logMemoryUsage(context) {
  const memoryUsage = process.memoryUsage();
  logger.info(`${context} - Memory usage: ${JSON.stringify(memoryUsage)}`);
}
