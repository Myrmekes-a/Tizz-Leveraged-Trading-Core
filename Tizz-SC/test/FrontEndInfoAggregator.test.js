const { ethers } = require("hardhat");
const { expect } = require("chai");
const { deploy, bigNum, smallNum } = require("hardhat-libutils");
const {
    deployContracts,
    initialCores,
    initialCollaterals,
} = require("./testHelper");
const { getDeploymentParams } = require("../scripts/testParams");
const { getProofBytes } = require("../scripts/params");
const ERC20ABI = require("../external_abi/ERC20.abi.json");

describe("TizzFrontEndInfoAggregator Test", function () {
    let deployParams;
    const collateralType = "WBTC";
    before(async function () {
        [
            this.deployer,
            this.gov,
            this.trader,
            this.trader_1,
            this.owner,
            this.admin,
            this.manager,
            this.mockPnlHandler,
            this.mockTizzPriceProvider,
            this.mockPnlFeed,
            this.liquidator,
            this.feeUpdator,
        ] = await ethers.getSigners();

        deployParams = getDeploymentParams(collateralType);
    });

    it("check initialize", async function () {
        console.log("Initialized successfully!");
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
        ] = await deployContracts(collateralType, this.deployer, this.admin);
    });

    it("initial contracts", async function () {
        await initialCores(
            this.deployer,
            collateralType,
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
            collateralType,
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

        this.TizzFrontEndInfoAggregator = await deploy(
            "TizzFrontEndInfoAggregator",
            "TizzFrontEndInfoAggregator",
            this.TizzFundingFees.address,
            this.TizzMultiCollatDiamond.address,
            this.TizzTradingStorage.address,
            this.TizzTradingCallbacks.address
        );

        await this.TizzMultiCollatDiamond.setRoles(
            [this.feeUpdator.address],
            [6],
            [true]
        );
    });

    it("sync funding rate", async function () {
        let proofbytes = getProofBytes();
        let beforePair = await this.TizzFundingFees.pairs(0);
        await this.TizzFundingFees.connect(this.feeUpdator).syncFundingFee(
            0,
            proofbytes
        );
        let afterPair = await this.TizzFundingFees.pairs(0);
        expect(Number(beforePair.fundingRate)).to.be.equal(Number(0));
        expect(Number(afterPair.fundingRate)).to.be.equal(Number(0));
    });

    it("openTrade with buy Market", async function () {
        const wbtcPairId = 18;
        const pairIndex = 0; // WBTC
        const bytesProof = getProofBytes();
        const tpDelta = bigNum(60, 10); // $60
        await this.TizzPriceAggregator.GetPairPrice(bytesProof, wbtcPairId);
        let wbtcMarketPrice = await this.TizzPriceAggregator.getPriceUsd(
            wbtcPairId
        );
        wbtcMarketPrice = BigInt(wbtcMarketPrice); // make as 10 decimals

        let collateralAmount = bigNum(50, 18);

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
            pairIndex: pairIndex, // WBTC
            index: 0,
            initialPosToken: 0,
            positionSizeBaseAsset: BigInt(collateralAmount),
            openPrice: BigInt(wbtcMarketPrice),
            buy: true,
            leverage: 60,
            tp: BigInt(wbtcMarketPrice) + BigInt(tpDelta),
            sl: BigInt(wbtcMarketPrice) - BigInt(tpDelta) * BigInt(10),
        };

        let [fundingFees, fundingRate] =
            await this.TizzFrontEndInfoAggregator.predictFees(
                tradeInfo.trader,
                BigInt(collateralAmount),
                tradeInfo.leverage,
                pairIndex
            );

        console.log(fundingFees, fundingRate);

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

        expect(afterOpenTradesCnt - beforeOpenTradesCnt).to.be.equal(1);

        const openTrade = await this.TizzTradingStorage.openTrades(
            this.deployer.address,
            pairIndex,
            0
        );
        let positionSizeBaseAsset = openTrade.positionSizeBaseAsset;
        let expectSizeBaseBasset =
            BigInt(collateralAmount) - BigInt(fundingFees);

        expect(smallNum(positionSizeBaseAsset, 8)).to.be.equal(
            smallNum(expectSizeBaseBasset, 8)
        );
    });

    it("sync funding rate", async function () {
        let proofbytes = getProofBytes();
        let beforePair = await this.TizzFundingFees.pairs(0);
        await this.TizzFundingFees.connect(this.feeUpdator).syncFundingFee(
            0,
            proofbytes
        );
        let afterPair = await this.TizzFundingFees.pairs(0);
        expect(Number(beforePair.fundingRate)).to.be.equal(Number(0));
        expect(Number(afterPair.fundingRate)).to.be.greaterThan(Number(0));
    });
});
