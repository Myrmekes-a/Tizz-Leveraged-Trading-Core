import Web3 from 'web3';
import { SUPRA_CHAIN_TYPE, SUPRA_GRPC_SERVER } from './constants';
import PullServiceClient from './pullServiceClient';
import { OracleProofABI, SignedCoherentClusterABI } from './abi';
import { appConfig } from '../config';

export const fetchPricesSupraPairs = async (
  pairIds: number[],
): Promise<{ result: { [id: string]: { price: string; decimal: number; timestamp: number } }; hex: string }> => {
  const client = new PullServiceClient(SUPRA_GRPC_SERVER);

  const request = {
    pair_indexes: pairIds,
    chain_type: SUPRA_CHAIN_TYPE,
  };
  // Requesting proof for price indexs
  return new Promise((resolve, _reject) => {
    client.getProof(request, async (err, response) => {
      if (err) {
        if (appConfig().ENABLE_CONSOLE_LOGGING) console.error('Error:', err.details);
        resolve({ result: {}, hex: '' });
        return;
      }
      // Calling contract to verify the proofs
      const res = await callContract(response.evm);
      resolve(res);
    });
  });
};

async function callContract(response) {
  const web3 = new Web3(new Web3.providers.HttpProvider(appConfig().WEB3_HTTP_PROVIDER_URL)); // Rpc url for desired chain

  const hex = web3.utils.bytesToHex(response.proof_bytes);

  let proof_data: any = web3.eth.abi.decodeParameters(OracleProofABI, hex); // Deserialising the Oracle Proof data

  let pairId: string[] = []; // list of all the pair ids requested
  let pairPrice: string[] = []; // list of prices for the corresponding pair ids
  let pairDecimal: string[] = []; // list of pair decimals for the corresponding pair ids
  let pairTimestamp: string[] = []; // list of pair last updated timestamp for the corresponding pair ids

  for (let i = 0; i < proof_data[0].data.length; ++i) {
    for (let j = 0; j < proof_data[0].data[i].committee_data.committee_feed.length; j++) {
      pairId.push(proof_data[0].data[i].committee_data.committee_feed[j].pair.toString(10)); // pushing the pair ids requested in the output vector

      pairPrice.push(proof_data[0].data[i].committee_data.committee_feed[j].price.toString(10)); // pushing the pair price for the corresponding ids

      pairDecimal.push(proof_data[0].data[i].committee_data.committee_feed[j].decimals.toString(10)); // pushing the pair decimals for the corresponding ids requested

      pairTimestamp.push(proof_data[0].data[i].committee_data.committee_feed[j].timestamp.toString(10)); // pushing the pair timestamp for the corresponding ids requested
    }
  }
  let result = {};
  pairId.map((id, idx) => {
    result[id] = {
      price: pairPrice[idx],
      decimal: parseInt(pairDecimal[idx]),
      timestamp: parseInt(pairTimestamp[idx]),
    };
  });
  return { result, hex };
}
