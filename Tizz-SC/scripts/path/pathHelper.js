const { getContract, smallNum, bigNum } = require("hardhat-libutils");
const { getProofBytes } = require("../params");
const { ethers } = require("hardhat");
const checkTizzFundingFees = async (
    collateralType,
    trader,
    pairIndex,
    collateralAmount,
    leverage,
    long
) => {
    const TizzFrontEndInfoAggregator = await getContract(
        "TizzFrontEndInfoAggregator",
        `TizzFrontEndInfoAggregator${collateralType}`
    );

    return await TizzFrontEndInfoAggregator.predictFees({
        trader: trader,
        pairIndex: pairIndex,
        collateral: BigInt(collateralAmount),
        leverage: leverage,
        long: long,
    });
};

const checkTizzTradingFundingFees = async (
    collateralType,
    pairIndex,
    collateral,
    leverage,
    long
) => {
    console.log("TizzFundingFees", `TizzFundingFees${collateralType}`);
    const TizzFundingFees = await getContract(
        "TizzFundingFees",
        `TizzFundingFees${collateralType}`
    );

    return await TizzFundingFees.predictTradeFundingFee(
        pairIndex,
        BigInt(collateral),
        leverage,
        long
    );
};

const syncFundingRate = async (collateralType, pairIndex) => {
    const TizzFundingFees = await getContract(
        "TizzFundingFees",
        `TizzFundingFees${collateralType}`
    );

    const proofbytes = getProofBytes();
    let tx = await TizzFundingFees.syncFundingFee(pairIndex, proofbytes);
    await tx.wait();
};

const openMarket = async (collateralType, traderAddress) => {
    const proofbytes = getProofBytes();
    let collateral = await getContract("MockToken", `Mock${collateralType}`);
    let TizzPriceAggregator = await getContract(
        "TizzPriceAggregator",
        `TizzPriceAggregator${collateralType}`
    );

    let pairId, pairIndex;
    if (collateralType == "WBTC") {
        pairId = 18;
        pairIndex = 0;
    } else if (collateralType == "USDT") {
        pairId = 48;
        pairIndex = 1;
    }

    console.log("Request latest price");
    let tx = await TizzPriceAggregator.GetPairPrice(proofbytes, pairId);
    await tx.wait();

    console.log("Fetch pair price");
    let marketPrice = await TizzPriceAggregator.getPriceUsd(pairId);
    console.log(`${collateralType} market price`, smallNum(marketPrice, 10));

    const tpPercent = 600;
    let collateralAmount;
    if (collateralType == "WBTC") {
        collateralAmount = bigNum(1, 8);
    } else {
        collateralAmount = bigNum(200, 18);
    }
    let leverage = 5;

    const tp =
        BigInt(marketPrice) +
        (BigInt(marketPrice) * BigInt(tpPercent)) /
            BigInt(100) /
            BigInt(leverage);

    const TizzTrading = await getContract(
        "TizzTrading",
        `TizzTrading${collateralType}`
    );
    const TizzTradingStorage = await getContract(
        "TizzTradingStorage",
        `TizzTradingStorage${collateralType}`
    );

    tx = await collateral.approve(
        TizzTradingStorage.address,
        BigInt(collateralAmount)
    );
    await tx.wait();

    const tradeInfo = {
        trader: traderAddress,
        pairIndex: pairIndex,
        index: 0,
        initialPosToken: 0,
        positionSizeBaseAsset: BigInt(collateralAmount),
        openPrice: BigInt(marketPrice),
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
        await TizzTradingStorage.openTradesCount(traderAddress, pairIndex)
    );

    tx = await TizzTrading.openTrade(
        tradeInfo,
        orderType,
        slippageP,
        referrer,
        proofbytes
    );
    await tx.wait();

    console.log(
        "after open trades count: ",
        await TizzTradingStorage.openTradesCount(traderAddress, pairIndex)
    );

    console.log("Done");
};

const getTradeFundingFee = async (collateralType, traderAddress) => {
    const proofbytes = getProofBytes();
    const TizzFundingFees = await getContract(
        "TizzFundingFees",
        `TizzFundingFees${collateralType}`
    );
    const TizzTradingStorage = await getContract(
        "TizzTradingStorage",
        `TizzTradingStorage${collateralType}`
    );

    let pairIndex = collateralType == "WBTC" ? 0 : 1;
    let index = 0;
    const openTrade = await TizzTradingStorage.openTrades(
        traderAddress,
        pairIndex,
        index
    );

    const fundingFeeInput = {
        trader: traderAddress,
        pairIndex: pairIndex,
        index: index,
        long: openTrade.buy,
        collateral: BigInt(openTrade.positionSizeBaseAsset),
        leverage: openTrade.leverage,
    };

    const fee = await TizzFundingFees.getTradeFundingFee(fundingFeeInput);
    const decimals = collateralType == "WBTC" ? 8 : 18;
    console.log("tradeFundingFee: ", smallNum(fee, decimals));
};

const getTradeLiquidationPrice = async (
    collateralType,
    trader,
    pairIndex,
    index
) => {
    const TizzTradingStorage = await getContract(
        "TizzTradingStorage",
        `TizzTradingStorage${collateralType}`
    );
    const TizzFundingFees = await getContract(
        "TizzFundingFees",
        `TizzFundingFees${collateralType}`
    );

    const openTrade = await TizzTradingStorage.openTrades(
        trader,
        pairIndex,
        index
    );

    console.log(smallNum(openTrade.openPrice, 10));

    let liqPrice = await TizzFundingFees.getTradeLiquidationPrice({
        trader: openTrade.trader,
        pairIndex: openTrade.pairIndex,
        index: openTrade.index,
        openPrice: BigInt(openTrade.openPrice),
        long: openTrade.buy,
        collateral: BigInt(openTrade.positionSizeBaseAsset),
        leverage: openTrade.leverage,
    });
    console.log(smallNum(liqPrice, 10));

    let delta = Number(openTrade.openPrice) - Number(liqPrice);
    delta = delta < 0 ? -delta : delta;
    console.log(
        ((Number(delta) * Number(openTrade.leverage)) /
            Number(openTrade.openPrice)) *
            Number(100),
        "%"
    );
};

const checkTriggerOrder = async (
    collateralType,
    orderType,
    trader,
    pairIndex,
    index,
    bytesProof
) => {
    const TizzTrading = await getContract(
        "TizzTrading",
        `TizzTrading${collateralType}`
    );
    const PackingUtils = await getContract("PackingUtils", "PackingUtils");
    const packed = await PackingUtils.packTriggerOrder(
        orderType,
        BigInt(trader),
        pairIndex,
        index,
        0,
        0
    );

    await TizzTrading.triggerOrder(packed, bytesProof);
};

module.exports = {
    checkTizzFundingFees,
    checkTizzTradingFundingFees,
    syncFundingRate,
    openMarket,
    getTradeFundingFee,
    getTradeLiquidationPrice,
    checkTriggerOrder,
};
