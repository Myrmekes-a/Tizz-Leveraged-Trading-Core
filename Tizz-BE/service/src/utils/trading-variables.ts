import { toJSON } from './util';

/**
 * @dev We need to optimize global context before saving in redis. If not, there will be large of codes will be saved, and it might cause heavy delay on redis.
 * @param data global context
 * @returns string for trading variable
 */
export const buildTradingVariablesFromJSON = (data: any): string => {
  const obj = JSON.parse(toJSON(data));

  delete obj?.currentlySelectedWeb3Client;
  delete obj?.web3Clients;

  const collaterals = obj?.collaterals as any[];

  collaterals.map((collateral) => {
    delete obj?.stacks?.[collateral]?.contracts;
  });

  delete obj?.multiCollatContract;

  return toJSON(obj);
};
