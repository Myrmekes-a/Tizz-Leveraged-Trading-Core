const { ethers, network } = require("hardhat");
const { getContract, bigNum, smallNum } = require("hardhat-libutils");
const { getProofBytes } = require("../params");
const { getCollateralType } = require("../collateralTypes");
const TizzTradingABI = require("../../abi/json/contracts/core/TizzTrading.sol/TizzTrading.json");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
        "Testing Tizz Finance Contracts with wallet: ",
        deployer.address
    );
    const collateralType = getCollateralType();

    let tx;
    const btcPairId = 18; // BTC_USD
    const pairIndex = 0; // BTC
    const bytesProof = getProofBytes();
    const TizzPriceAggregator = await getContract(
        "TizzPriceAggregator",
        `TizzPriceAggregator${collateralType}`
    );

    console.log("Request latest price");
    tx = await TizzPriceAggregator.GetPairPrice(bytesProof, btcPairId);
    await tx.wait();

    console.log("Fetch pair price");
    let btcMarketPrice = await TizzPriceAggregator.getPriceUsd(btcPairId);
    console.log("BTC price: ", smallNum(btcMarketPrice, 10));

    const tpPercent = 600; // 600%
    let collateralAmount = bigNum(1, 7); // 0.1 WBTC
    let leverage = 10;
    const tp =
        BigInt(btcMarketPrice) +
        (BigInt(btcMarketPrice) * BigInt(tpPercent)) /
            BigInt(100) /
            BigInt(leverage);

    const collateralToken = await getContract(
        "MockToken",
        `Mock${collateralType}`
    );
    let TizzTrading = await getContract(
        "TizzTrading",
        `TizzTrading${collateralType}`
    );
    TizzTrading = new ethers.Contract(
        TizzTrading.address,
        TizzTradingABI,
        deployer
    );
    const TizzTradingStorage = await getContract(
        "TizzTradingStorage",
        `TizzTradingStorage${collateralType}`
    );

    tx = await collateralToken.approve(
        TizzTradingStorage.address,
        BigInt(collateralAmount)
    );
    await tx.wait();

    const tradeInfo = {
        trader: deployer.address,
        pairIndex: pairIndex, // BTC
        index: 0,
        initialPosToken: 0,
        positionSizeBaseAsset: BigInt(collateralAmount),
        openPrice: BigInt(btcMarketPrice),
        buy: true,
        leverage: leverage,
        tp: BigInt(tp),
        sl: 0,
    };
    const orderType = 0; // MARKET
    const referrer = ethers.constants.AddressZero;
    const slippageP = 10000000000; // 1%

    console.log(
        "before open trades count: ",
        await TizzTradingStorage.openTradesCount(deployer.address, pairIndex)
    );

    tx = await TizzTrading.openTrade(
        tradeInfo,
        orderType,
        slippageP,
        referrer,
        bytesProof
    );
    await tx.wait();

    console.log(
        "after open trades count: ",
        await TizzTradingStorage.openTradesCount(deployer.address, pairIndex)
    );

    console.log("Done");
}

main()
    .then(() => {
        process.exit(1);
    })
    .catch((error) => {
        console.error(error);
    });
