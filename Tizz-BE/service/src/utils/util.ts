import { pairs } from '@tizz/sdk';
import { BigNumberish, utils } from 'ethers';

// OI Windows

export const convertOiWindow = (oiWindow) => ({
  oiLongUsd: oiWindow.oiLongUsd.toString(),
  oiShortUsd: oiWindow.oiShortUsd.toString(),
});

export const convertOiWindows = (oiWindows) => {
  return oiWindows.map((pairWindows) =>
    Object.fromEntries(Object.entries(pairWindows).map(([key, oiWindow]) => [key, convertOiWindow(oiWindow)])),
  );
};

export const increaseWindowOi = (oiWindows, pairIndex, windowId, long, openInterest) => {
  if (!oiWindows[pairIndex]?.[windowId]) oiWindows[pairIndex][windowId] = { oiLongUsd: 0, oiShortUsd: 0 };

  const oi = parseFloat(openInterest) / 1e18;

  if (long) {
    oiWindows[pairIndex][windowId].oiLongUsd += oi;
  } else {
    oiWindows[pairIndex][windowId].oiShortUsd += oi;
  }
};

export const decreaseWindowOi = (oiWindows, pairIndex, windowId, long, openInterest, notOutdated) => {
  if (!notOutdated) return;

  if (!oiWindows[pairIndex][windowId]) {
    return;
  }

  const oi = parseFloat(openInterest) / 1e18;
  if (long) {
    oiWindows[pairIndex][windowId].oiLongUsd -= oi;
  } else {
    oiWindows[pairIndex][windowId].oiShortUsd -= oi;
  }
};

export const transferOiWindows = (oiWindows, pairsCount, prevCurrentWindowId, prevEarliestWindowId, newCurrentWindowId) => {
  const newOiWindows: { [x: number]: { oiLongUsd: number; oiShortUsd: number } } = [];

  for (let i = 0; i < pairsCount; i++) {
    const oi = { oiLongUsd: 0, oiShortUsd: 0 };

    for (let id = prevEarliestWindowId; id <= prevCurrentWindowId; id++) {
      const window = oiWindows?.[i]?.[id] || { oiLongUsd: 0, oiShortUsd: 0 };
      oi.oiLongUsd += window.oiLongUsd;
      oi.oiShortUsd += window.oiShortUsd;
    }

    newOiWindows[newCurrentWindowId] = { oiLongUsd: oi.oiLongUsd, oiShortUsd: oi.oiShortUsd };
  }

  return newOiWindows;
};

export const updateWindowsDuration = (oiWindowsSettings, windowsDuration) => {
  oiWindowsSettings.windowsDuration = parseFloat(windowsDuration);
};

export const updateWindowsCount = (oiWindowsSettings, windowsCount) => {
  oiWindowsSettings.windowsCount = parseFloat(windowsCount);
};

// Price utils

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

export const bn2Float = (value: BigNumberish, decimal: number = 18): number => {
  const bnStr = utils.formatUnits(value, decimal);

  return parseFloat(bnStr);
};

export const bnObj2StrObj = (data) => {
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
