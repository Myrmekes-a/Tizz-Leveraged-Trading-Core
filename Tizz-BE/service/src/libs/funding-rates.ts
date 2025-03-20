import { CronJob } from 'cron';
import { logger } from '../utils/logger';
import { appConfig } from '../config';
import { NETWORKS } from '../constants';
import { getCurrentPricesRedis } from '../redis';
import { fetchPricesSupraPairs } from '../supra';
import { retryAsync } from 'ts-retry';
import { ethers } from 'ethers';
import { CollateralTypes, TizzFundingFees__factory } from '@tizz/sdk';
import { sleep } from '../utils/util';

const job = CronJob.from({
  cronTime: '0 */1 * * *', // in every an hour
  // cronTime: '0 8,16,22 * * *', // every 8 hours. at 8AM, 4PM and 10PM every day
  onTick: function () {
    console.log('You will see this message every minute');
    try {
      applyFundingRate();
    } catch (err) {
      logger.error('Error in cron job');
    }
  },
  start: false,
});

const applyFundingRate = async () => {
  const { CHAIN_ID } = appConfig();

  const priceData = await getCurrentPricesRedis();
  if (!priceData) {
    logger.info('no prices data. ignoring');
    return;
  }

  const newPrices: { [pair: string]: { price: string; decimal: number; timestamp: number; pairIndex: number; pairId: number } } =
    priceData;
  const pairIds = Object.values(newPrices).map((price) => +price.pairId);
  
  let collaterals = NETWORKS[CHAIN_ID].supportedCollaterals;
  
  // We don't use array.map to guarantee that contract calls will be triggered in order.
  for (let i = 0; i < collaterals.length; i++) {
    let { fundingRate, collateral } = collaterals[i];
    console.log('fundingRate address: ', collateral, fundingRate);
    // TODO For now, we test WBTC only. Should be removed once we deploy all funding fee contracts for all collateral and all chain
    if (collateral !== CollateralTypes.WBTC) continue;
    try {
      await retryAsync(
        async () => {
          return await callContract(fundingRate, pairIds);
        },
        { delay: 5000, maxTry: 5, until: (result) => result === true },
      );
    } catch (err) {
      logger.error('Error while applying funding fee: ', err);
    }

    await sleep(5000);
  }
};

async function callContract(contractAddress: string, pairIds: number[]): Promise<boolean> {
  try {
    if (!contractAddress) {
      logger.error(`contractAddress is not provided. skipping..`);
      return false;
    }
    const privKey = process.env.PRI_KEY;
    const { WEB3_HTTP_PROVIDER_URL } = appConfig();
    if (!privKey) {
      logger.error(`private key is not provided. skipping..`);
      return false;
    }

    if (!WEB3_HTTP_PROVIDER_URL) {
      logger.error(`web3 provider url not configured. skipping..`);
      return false;
    }
    // Fetch price bytes proof from supra
    const supra_res = await fetchPricesSupraPairs(pairIds);
    const { hex } = supra_res;

    // Construct funding rate fee contract
    const provider = new ethers.providers.JsonRpcProvider(WEB3_HTTP_PROVIDER_URL);
    const signer = new ethers.Wallet(privKey, provider);
    console.log('contract signer: ', await signer.getAddress());

    const fundingRateContract = TizzFundingFees__factory.connect(contractAddress, signer);
    // we use static gas due to supra future block issue.
    const gas = 2_000_000; // 2M
    const tx = await fundingRateContract.syncFundingFees(pairIds, hex);
    logger.info('Applied on funding rate successfully ', tx.hash);
    return true;
  } catch (err) {
    console.log('error_while_calling_funding_fee_contract: ', err);
    return false;
  }
}

export function runFundingRate() {
  job.start();
}
