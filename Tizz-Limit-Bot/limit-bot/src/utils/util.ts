import { pairs } from '@tizz/sdk';
import { BigNumberish, utils } from 'ethers';

export const mulPriceInfo = (
  a: { price: string; decimal: number; timestamp: number },
  b: { price: string; decimal: number; timestamp: number },
): { price: string; decimal: number; timestamp: number } => {
  let p1 = BigInt(a.price);
  let p2 = BigInt(b.price);
  let d1 = BigInt(10 ** a.decimal);
  let d2 = BigInt(10 ** b.decimal);
  if (a.decimal > b.decimal) {
    return {
      price: ((p1 * p2) / d2).toString(),
      decimal: b.decimal,
      timestamp: b.timestamp,
    };
  } else {
    return {
      price: ((p1 * p2) / d1).toString(),
      decimal: a.decimal,
      timestamp: a.timestamp,
    };
  }
};

export const divPriceInfo = (
  a: { price: string; decimal: number; timestamp: number },
  b: { price: string; decimal: number; timestamp: number },
): { price: string; decimal: number; timestamp: number } => {
  let p1 = BigInt(a.price);
  let p2 = BigInt(b.price);
  let d2 = BigInt(10 ** b.decimal);

  return {
    price: ((p1 * d2) / p2).toString(),
    decimal: a.decimal,
    timestamp: a.timestamp,
  };
};

// Data transform

export const sleep = async (ts: number) => {
  await new Promise((resolve, _) => {
    setTimeout(() => resolve(true), ts);
  });
};

export const toJSON = (data: any) => {
  return JSON.stringify(
    data,
    (key, value) => {
      if (typeof value === 'bigint') return value.toString();
      if (typeof value === 'object' && key === '_events') return {};
      return value;
    }, // return everything else unchanged
  );
};

export const bn2Float = (value: BigNumberish, decimal: number = 18): number => {
  const bnStr = utils.formatUnits(value, decimal);

  return parseFloat(bnStr);
};

export const bnObj2StrObj = (data: any) => {
  if (typeof data === 'bigint') return data.toString();

  if (typeof data !== 'object') return data;

  let res = data;

  for (let entry of Object.entries(data)) {
    res[entry[0]] = bnObj2StrObj(entry[1]);
  }

  return res;
};

export const getPairName = (pairIndex: number) => {
  return Object.keys(pairs)[pairIndex];
};

export const address2Uint160 = (address: string) => {
  const addressWithoutPrefix = address.toLowerCase().replace(/^0x/, ''); // Remove the '0x' prefix if present
  const bigintValue = BigInt('0x' + addressWithoutPrefix); // Convert the hexadecimal string to BigInt
  return bigintValue;
};
