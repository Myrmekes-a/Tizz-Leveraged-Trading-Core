import { pack, ABIS, TizzTrading__factory, TizzTradingStorage__factory } from '@tizz-hive/sdk';
import { logger } from '../../utils/logger';
import { address2Uint160, sleep } from '../../utils/util';
import { CONTRACTS_BY_COLLAT } from '../../constants';
import { TriggerOrder } from '../../constants/types';
import { appConfig } from '../../config';
import { BigNumber, ethers } from 'ethers';
export * from '.';

const { CHAIN_ID, WEB3_HTTP_PROVIDER_URL } = appConfig();
// Construct funding rate fee contract
const provider = new ethers.providers.JsonRpcProvider(WEB3_HTTP_PROVIDER_URL);
const privKey = process.env.PRI_KEY;
const signer = new ethers.Wallet(privKey || '', provider);
let isProcessing = false;

export const hasOpenTrade = async (collateral: string, trader: string, pairIndex: number, index: number) => {
  console.log('tradingStorage: ', CONTRACTS_BY_COLLAT[CHAIN_ID][collateral].storage);
  const tradingStorageContract = TizzTradingStorage__factory.connect(CONTRACTS_BY_COLLAT[CHAIN_ID][collateral].storage, signer);
  if (tradingStorageContract === undefined) {
    logger.error(` tradingStorageContract is not ready. skipping..`);
    return false;
  }

  try {
    const openTrade = await tradingStorageContract.openTrades(trader, pairIndex, index);
    return openTrade.leverage > BigNumber.from(0);
  } catch (error) {
    console.log('error while fetch open trades from trading storage: ', error);
    return false;
  }
};

export const triggerOrder = async (liqTrades: TriggerOrder[]) => {
  if (!privKey) {
    logger.error(`  wallet account not configured. skipping..`);
    return;
  }

  if (!WEB3_HTTP_PROVIDER_URL) {
    logger.error(`  web3 provider url not configured. skipping..`);
    return;
  }

  console.log('Indexer bot wallet is', signer.address);

  console.log('isProcessing: ', isProcessing);
  if (isProcessing) {
    console.log('Already in processing');
    return;
  }

  isProcessing = true;
  try {
    for (let trade of liqTrades) {
      const isExist = await hasOpenTrade(trade.collateral, trade.trader, Number(trade.pairIndex), Number(trade.index));
      if (isExist == false) {
        console.log('Not found trade: ', trade.collateral, trade.trader, Number(trade.pairIndex), Number(trade.index));
        continue;
      }

      const tradingContract = TizzTrading__factory.connect(CONTRACTS_BY_COLLAT[CHAIN_ID][trade.collateral].trading, signer);
      console.log('tradingContractAddress: ', CONTRACTS_BY_COLLAT[CHAIN_ID][trade.collateral].trading);
      if (tradingContract === undefined) {
        logger.error(` tradingContract is not ready. skipping..`);
        continue;
      }

      try {
        console.log('triggering order..');
        console.log('params: ', trade.type, trade.trader, trade.pairIndex, trade.index);

        const tx = await tradingContract.triggerOrder(
          pack(
            [
              BigInt(trade.type),
              address2Uint160(trade.trader),
              BigInt(trade.pairIndex),
              BigInt(trade.index),
              BigInt(0),
              BigInt(0),
            ],
            [BigInt(8), BigInt(160), BigInt(16), BigInt(16), BigInt(16), BigInt(16)],
          ),
          trade.proof,
        );
        console.log('tx: ', tx);
        await sleep(1000);
      } catch (error) {
        console.log('error while liquidating orders: ', error);
        await sleep(3000);
      }
    }
  } catch (err) {
    console.log('error: ', err);
  } finally {
    isProcessing = false;
  }
};
