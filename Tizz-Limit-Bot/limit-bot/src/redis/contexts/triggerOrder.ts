import Web3 from 'web3';

import { StorageLimitOrder, pack, ABIS } from '@tizz/sdk';
import { logger } from '../../utils/logger';
import { address2Uint160, getPairName, toJSON } from '../../utils/util';
import { CONTRACTS_BY_COLLAT, GAS_LIMIT } from '../../constants';
import { TriggerOrder } from '../../constants/types';
import { appConfig } from '../../config';
export * from '../contexts';

const { CHAIN_ID, WEB3_HTTP_PROVIDER_URL } = appConfig();

export const hasOpenLimitOrder = async (
  web3Client: any,
  collateral: string,
  trader: string,
  pairIndex: number,
  index: number,
) => {
  const tradingStorageContract = new web3Client.eth.Contract(ABIS.STORAGE, CONTRACTS_BY_COLLAT[CHAIN_ID][collateral].storage);
  if (tradingStorageContract === undefined) {
    logger.error(` tradingStorageContract is not ready. skipping..`);
    return false;
  }

  try {
    const isExist = await tradingStorageContract.methods.hasOpenLimitOrder(trader, pairIndex, index).call();
    return isExist;
  } catch (error) {
    return false;
  }
};

export const hasOpenTrade = async (web3Client: any, collateral: string, trader: string, pairIndex: number, index: number) => {
  const tradingStorageContract = new web3Client.eth.Contract(ABIS.STORAGE, CONTRACTS_BY_COLLAT[CHAIN_ID][collateral].storage);
  if (tradingStorageContract === undefined) {
    logger.error(` tradingStorageContract is not ready. skipping..`);
    return false;
  }

  try {
    const openTrade: any = await tradingStorageContract.methods.openTrades(trader, pairIndex, index).call();
    return openTrade.leverage > 0;
  } catch (error) {
    return false;
  }
};

export const triggerOrder = async (limitOrders: TriggerOrder[]) => {
  const privKey = process.env.PRI_KEY;
  if (!privKey) {
    logger.error(`  wallet account not configured. skipping..`);
    return;
  }

  if (!WEB3_HTTP_PROVIDER_URL) {
    logger.error(`  web3 provider url not configured. skipping..`);
    return;
  }

  const web3Client = new Web3(WEB3_HTTP_PROVIDER_URL);
  const account = web3Client.eth.accounts.privateKeyToAccount('0x' + privKey);
  console.log('Indexer bot wallet is', account.address);

  limitOrders.forEach(async (limitOrder) => {
    if (limitOrder.type == StorageLimitOrder.OPEN) {
      const isExist = await hasOpenLimitOrder(
        web3Client,
        limitOrder.collateral,
        limitOrder.trader,
        Number(limitOrder.pairIndex),
        Number(limitOrder.index),
      );
      if (isExist == false) {
        return;
      }
    } else {
      const isExist = await hasOpenTrade(
        web3Client,
        limitOrder.collateral,
        limitOrder.trader,
        Number(limitOrder.pairIndex),
        Number(limitOrder.index),
      );
      if (isExist == false) {
        return;
      }
    }

    const tradingContract = new web3Client.eth.Contract(
      ABIS.TRADING,
      CONTRACTS_BY_COLLAT[CHAIN_ID][limitOrder.collateral].trading,
    );
    if (tradingContract === undefined) {
      logger.error(` tradingContract is not ready. skipping..`);
      return;
    }

    try {
      console.log('triggering order..');
      const gasPrice = await web3Client.eth.getGasPrice();
      const approveTxData = tradingContract.methods
        .triggerOrder(
          pack(
            [
              BigInt(limitOrder.type),
              address2Uint160(limitOrder.trader),
              BigInt(limitOrder.pairIndex),
              BigInt(limitOrder.index),
              BigInt(0),
              BigInt(0),
            ],
            [BigInt(8), BigInt(160), BigInt(16), BigInt(16), BigInt(16), BigInt(16)],
          ),
          limitOrder.proof as `0x`,
        )
        .encodeABI();

      const approveTxObj = {
        from: account.address,
        to: tradingContract.options.address,
        data: approveTxData,
      };
      // const approveGas = await web3Client.eth.estimateGas(approveTxObj);

      const sTx = await web3Client.eth.accounts.signTransaction(
        { ...approveTxObj, gas: GAS_LIMIT, gasPrice },
        account.privateKey,
      );
      await web3Client.eth.sendSignedTransaction(sTx.rawTransaction);
    } catch (error) {}
  });
};
