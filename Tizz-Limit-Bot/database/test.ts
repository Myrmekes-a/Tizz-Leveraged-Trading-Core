import { connectDb } from "./src/config";
import { findPairByIndex, resetEntirePairs } from "./src/services/pairService";
import { findPrices, insertPrices } from "./src/services/priceService";

const TIZZ_DB_URL =
  "mongodb+srv://fury:1qazXSW%40@cluster1.dvuodar.mongodb.net/tizz-test";

const pairsMockup = [
  {
    index: 0,
    base: "BTC",
    quote: "USD",
  },
  {
    index: 1,
    base: "ETH",
    quote: "USD",
  },
  {
    index: 2,
    base: "LINK",
    quote: "USD",
  },
  {
    index: 4,
    base: "MATIC",
    quote: "USD",
  },
];

const pricesMockup = [
  {
    pairIndex: 0,
    price: "6646800000000",
    decimal: 8,
    timestamp: Date.now(),
  },
  { pairIndex: 2, price: "1957500000", decimal: 8, timestamp: Date.now() },
  {
    pairIndex: 0,
    price: "6646790000000",
    decimal: 8,
    timestamp: Date.now() - 10000,
  },
  { pairIndex: 1, price: "381740000000", decimal: 8, timestamp: Date.now() },
  {
    pairIndex: 2,
    price: "1957450000",
    decimal: 8,
    timestamp: Date.now() - 1000,
  },
  { pairIndex: 4, price: "106393333", decimal: 8, timestamp: Date.now() },
  {
    pairIndex: 0,
    price: "6646786000000",
    decimal: 8,
    timestamp: Date.now() - 2000,
  },
];

const main = async () => {
  console.log("Start database testing...");
  await connectDb(TIZZ_DB_URL);

  console.log("inserting pair values..");
  await resetEntirePairs(
    pairsMockup.map(pair => {
      return {
        ...pair,
        name: pair.base + "/" + pair.quote,
      };
    })
  );
  console.log(`${pairsMockup.length} pairs data inputed`);

  console.log("trying to find pairs by index...");
  const pair2 = await findPairByIndex(2);
  console.log(pair2);
  const pair3 = await findPairByIndex(3);
  console.log(pair3);

  console.log("trying to insert prices data...");
  await insertPrices(pricesMockup);

  console.log("trying to get prices with filter..");
  const btcPrices = await findPrices({ pairIndex: 0 });
  console.log(btcPrices);

  const datePrices = await findPrices({
    pairIndex: 4,
    start: 1709830451000,
    end: 1709834451000,
  });
  console.log(datePrices);
};

main();
