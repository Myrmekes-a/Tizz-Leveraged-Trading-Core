const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
    bigNum,
    smallNum,
    week,
    day,
    hour,
    minute,
    spendTime,
    getETHBalance,
} = require("hardhat-libutils");
const {
    getSimpleProofBytes,
    getProofBytes,
    getOpenPnlProofBytes,
} = require("./utils");
const ERC20ABI = require("../external_abi/ERC20.abi.json");
const {
    deployContracts,
    initialCores,
    initialCollaterals,
} = require("./testHelper");

describe("Tizz Liquidation Test", function () {
    before(async function () {
        [
            this.deployer,
            this.admin,
            this.gov,
            this.trader,
            this.trader_1,
            this.owner,
            this.oraclePull,
            this.oracleStorage,
            this.feeUpdator,
        ] = await ethers.getSigners();
    });

    it("check initialization", async function () {
        console.log("initialized successfully!");
    });

    it("deploy contracts", async function () {
        [
            this.collateralToken,
            this.TizzFinanceToken,
            this.LockedDepositNftDesign,
            this.LockedDepositNft,
            this.TizzTimelockManager,
            this.TizzTimelockOwner,
            this.TizzMultiCollatDiamond,
            this.TizzStaking,
            this.TizzTradingStorage,
            this.TizzFundingFees,
            this.TizzPriceAggregator,
            this.TizzTradingPriceFeedManager,
            this.TizzTrading,
            this.TizzTradingCallbacks,
            this.TizzVaultToken,
            this.TizzEscrow,
            this.PackingUtils,
            this.FundingFeesUtils,
        ] = await deployContracts("WBTC", this.deployer, this.admin, 8);
    });

    it("initial contracts", async function () {
        await initialCores(
            this.deployer,
            "WBTC",
            this.TizzFinanceToken,
            this.TizzTrading,
            this.TizzTradingStorage,
            this.TizzMultiCollatDiamond,
            this.TizzTradingCallbacks,
            this.TizzPriceAggregator,
            this.TizzStaking,
            this.collateralToken,
            this.TizzVaultToken,
            this.LockedDepositNft
        );

        await initialCollaterals(
            "WBTC",
            this.TizzTradingPriceFeedManager,
            this.TizzTradingStorage,
            this.TizzVaultToken,
            this.TizzPriceAggregator,
            this.TizzTradingCallbacks,
            this.TizzTrading,
            this.TizzFundingFees,
            this.TizzMultiCollatDiamond,
            this.TizzStaking,
            this.TizzEscrow
        );

        await this.collateralToken.mint(this.trader.address, bigNum(10000, 18));

        await this.TizzMultiCollatDiamond.setRoles(
            [this.feeUpdator.address],
            [6],
            [true]
        );
    });

    it("open trade", async function () {
        const pairIndex = 0;
        const bytesProof = getProofBytes();

        await this.TizzFundingFees.connect(this.feeUpdator).syncFundingFee(
            pairIndex,
            bytesProof
        );

        await this.TizzPriceAggregator.GetPairPrice(bytesProof, 0);
        let openPrice = await this.TizzPriceAggregator.getPriceUsd(0);
        console.log(smallNum(openPrice, 10));

        const delta = BigInt(openPrice) / BigInt(10);
        const tp = BigInt(openPrice) + delta;

        let collateralAmount = bigNum(5, 8);
        await this.collateralToken.mint(
            this.deployer.address,
            BigInt(collateralAmount)
        );
        await this.collateralToken.approve(
            this.TizzTradingStorage.address,
            BigInt(collateralAmount)
        );

        const tradeInfo = {
            trader: this.deployer.address,
            pairIndex: 0,
            index: 0,
            initialPosToken: 0,
            positionSizeBaseAsset: BigInt(collateralAmount),
            openPrice: BigInt(openPrice),
            buy: true,
            leverage: 10,
            tp: BigInt(tp),
            sl: 0,
        };
        const orderType = 0; // MARKET
        const referrer = ethers.constants.AddressZero;
        const slippageP = 10000000000; // 1%

        const beforeOpenTradesCnt =
            await this.TizzTradingStorage.openTradesCount(
                this.deployer.address,
                pairIndex
            );
        await this.TizzTrading.openTrade(
            tradeInfo,
            orderType,
            slippageP,
            referrer,
            bytesProof
        );
        const afterOpenTradesCnt =
            await this.TizzTradingStorage.openTradesCount(
                this.deployer.address,
                pairIndex
            );
        expect(
            Number(afterOpenTradesCnt) - Number(beforeOpenTradesCnt)
        ).to.be.equal(Number(1));
    });

    it("liquidate", async function () {
        const orderType = 2;
        const traderValue = BigInt(this.deployer.address);
        const pairIndex = 0;
        const index = 0;
        const packed = await this.PackingUtils.packTriggerOrder(
            orderType,
            traderValue,
            pairIndex,
            index,
            0,
            0
        );
        const proofbytes = getProofBytes();
        await this.TizzPriceAggregator.setUpMode(false);
        await this.TizzPriceAggregator.setDeltaValue(bigNum(10, 10));
        let beforeCnt = await this.TizzTradingStorage.openTradesCount(
            this.deployer.address,
            pairIndex
        );
        await this.TizzTrading.triggerOrder(packed, proofbytes);
        let afterCnt = await this.TizzTradingStorage.openTradesCount(
            this.deployer.address,
            pairIndex
        );
        expect(Number(beforeCnt)).to.be.equal(Number(afterCnt));
    });
});
