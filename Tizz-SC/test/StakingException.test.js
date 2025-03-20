const { ethers } = require("hardhat");
const { expect } = require("chai");
const { bigNum, smallNum, increaseBlock, deploy } = require("hardhat-libutils");
const { getDeploymentParams } = require("../scripts/testParams");
const { getProofBytes } = require("../scripts/params");
const {
    deployContracts,
    initialCores,
    initialCollaterals,
} = require("./testHelper");

describe("TizzStaking Exception Test", function () {
    let deployParams;
    let USDTWhaleAddress = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
    const collateralType = "USDT";
    before(async function () {
        [
            this.deployer,
            this.admin,
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

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [USDTWhaleAddress],
        });
        this.USDTWhale = await ethers.getSigner(USDTWhaleAddress);
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

    it("stake finance token", async function () {
        const tizzMintAmount = bigNum(100, 18);
        await this.TizzFinanceToken.mint(
            this.deployer.address,
            BigInt(tizzMintAmount)
        );

        await this.TizzFinanceToken.approve(
            this.TizzStaking.address,
            BigInt(tizzMintAmount)
        );

        await this.TizzStaking.stakeTizz(BigInt(tizzMintAmount));
    });

    it("openTrade with buy Market with big leverage", async function () {
        let totalDeposited = await this.TizzVaultToken.totalDeposited();
        console.log(
            "total deposited vault token: ",
            smallNum(totalDeposited, 18),
            "USDT"
        );

        let solPairId = 65;
        let pairIndex = 1;
        let bytesProof = getProofBytes();
        await this.TizzPriceAggregator.GetPairPrice(bytesProof, solPairId);
        let solMarketPrice = await this.TizzPriceAggregator.getPriceUsd(
            solPairId
        );
        console.log("SOL market price: ", smallNum(solMarketPrice, 10));

        let collateralAmount = bigNum(30, 18);
        let leverage = 30;
        let deltaPercent = 5; // 0.5%
        let delta =
            (BigInt(solMarketPrice) * BigInt(deltaPercent)) / BigInt(1000);
        console.log("open trade 30 USDT with 30 leverage");

        await this.collateralToken.approve(
            this.TizzTradingStorage.address,
            BigInt(collateralAmount)
        );

        const tradeInfo = {
            trader: this.deployer.address,
            pairIndex: pairIndex,
            index: 0,
            initialPosToken: 0,
            positionSizeBaseAsset: BigInt(collateralAmount),
            openPrice: BigInt(solMarketPrice),
            buy: true,
            leverage: leverage,
            tp: BigInt(solMarketPrice) + BigInt(delta),
            sl: BigInt(solMarketPrice) - BigInt(delta) * BigInt(2),
        };

        const orderType = 0; // MARKET
        const referrer = ethers.constants.AddressZero;
        const slippageP = 10000000000;

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

        console.log(
            "new opened trade count: ",
            afterOpenTradesCnt - beforeOpenTradesCnt
        );

        expect(afterOpenTradesCnt - beforeOpenTradesCnt).to.be.equal(1);

        console.log(
            "opened trade successfully with large leverage than deposited token amount"
        );
    });
});
