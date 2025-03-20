import { Redis } from '..';
import { toJSON } from '../../utils/util';

export const updateCurrentOpenedTrades = async (newOpenTrades: [string, any][]) => {
  if (Redis === null) return { openedTrades: [], closedTrades: [] };

  let currentOpenTrades = await getCurrentOpenedTrades();

  // filter new opened / closed trades
  let openedTrades: any[] = [];
  let closedTrades = Object.assign(currentOpenTrades);
  for (let trade of newOpenTrades) {
    if (currentOpenTrades[trade[0]]?.date === trade[1].date) {
      delete closedTrades[trade[0]];
      continue;
    }
    openedTrades.push({
      ...trade[1],
      uri: `${trade[0]}&date=${trade[1].date}&opened=true`,
    });
  }

  closedTrades = Object.entries<any>(closedTrades).map(([key, value]) => {
    return {
      ...value,
      uri: `${key}&date=${value.date}&opened=false`,
    };
  });

  await Redis.set('opened-trades', toJSON(Object.fromEntries(newOpenTrades)));
  return { openedTrades, closedTrades };
};

export const addNewOpenedTrade = async (newOpenTrade: [string, any]) => {
  if (Redis === null) return undefined;

  let currentOpenTrades = await getCurrentOpenedTrades();

  if (currentOpenTrades[newOpenTrade[0]]?.date === newOpenTrade[1].date) {
    return undefined;
  }
  currentOpenTrades[newOpenTrade[0]] = newOpenTrade[1];

  await Redis.set('opened-trades', toJSON(currentOpenTrades));
  return {
    ...newOpenTrade[1],
    uri: `${newOpenTrade[0]}&date=${newOpenTrade[1].date}&opened=true`,
  };
};

export const addNewClosedTrade = async (newCloseTrade: [string, any]) => {
  if (Redis === null) return undefined;

  let currentOpenTrades = await getCurrentOpenedTrades();

  if (currentOpenTrades[newCloseTrade[0]]?.date !== newCloseTrade[1].date) {
    return undefined;
  }
  delete currentOpenTrades[newCloseTrade[0]];

  await Redis.set('opened-trades', toJSON(currentOpenTrades));
  return {
    ...newCloseTrade[1],
    uri: `${newCloseTrade[0]}&date=${newCloseTrade[1].date}&opened=false`,
  };
};

export const getCurrentOpenedTrades = async () => {
  if (Redis === null) return {};
  const openedTrades = await Redis.get('opened-trades');

  if (!openedTrades) return {};
  return JSON.parse(openedTrades);
};
