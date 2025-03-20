import { pairs } from '@tizz-hive/sdk';
import { readFileSync } from 'fs';

export const toJSON = (data) => {
  return JSON.stringify(
    data,
    (key, value) => {
      if (typeof value === 'bigint') return value.toString();
      if (typeof value === 'object' && key === '_events') return {};
      return value;
    }, // return everything else unchanged
  );
};

export const getPairName = (pairIndex: number) => {
  return Object.keys(pairs)[pairIndex];
};

export const address2Uint160 = (address: string) => {
  const addressWithoutPrefix = address.toLowerCase().replace(/^0x/, ''); // Remove the '0x' prefix if present
  const bigintValue = BigInt('0x' + addressWithoutPrefix); // Convert the hexadecimal string to BigInt
  return bigintValue;
};

const hexes = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, '0'));

export function bytesToHex(value: Uint8Array): string {
  let string = '';
  for (let i = 0; i < value.length; i++) {
    string += hexes[value[i]];
  }
  const hex = `0x${string}`;

  return hex;
}

export const getProofBytes = async () => {
  let jsonData = readFileSync(`${__dirname}/../libs/proofBytes.json`);
  let data: any = JSON.parse(jsonData.toString());
  return bytesToHex(data.data);
};

export const sleep = async (ts: number) => {
  await new Promise((resolve, _) => {
    setTimeout(() => resolve(true), ts);
  });
};