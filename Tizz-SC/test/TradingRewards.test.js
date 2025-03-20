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

describe("Tizz Rewards Test", function () {
    let deployParams;
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

    it("stake tizz token", async function () {
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

    it("openTrade with buy Market", async function () {
        let priceUsd = await this.TizzPriceAggregator.getCollateralPriceUsd();
        console.log("USDT price: ", smallNum(priceUsd, 10));

        const btcPairId = 18;
        const pairIndex = 0; // BTC
        const bytesProof = getProofBytes();
        await this.TizzPriceAggregator.GetPairPrice(bytesProof, btcPairId);
        let btcMarketPrice = await this.TizzPriceAggregator.getPriceUsd(
            btcPairId
        );
        console.log("BTC price: ", smallNum(btcMarketPrice, 10));
        const tpDelta = BigInt(btcMarketPrice) / BigInt(100);

        let collateralAmount = bigNum(6000, 18);
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
            pairIndex: 0, // BTC
            index: 0,
            initialPosToken: 0,
            positionSizeBaseAsset: BigInt(collateralAmount),
            openPrice: BigInt(btcMarketPrice),
            buy: true,
            leverage: 10,
            tp: BigInt(btcMarketPrice) + BigInt(tpDelta),
            sl: BigInt(btcMarketPrice) - BigInt(tpDelta) * BigInt(2),
        };
        const orderType = 0; // MARKET
        const referrer = ethers.constants.AddressZero;
        const slippageP = 10000000000; // 1%

        const beforeOpenTradesCnt =
            await this.TizzTradingStorage.openTradesCount(
                this.deployer.address,
                pairIndex
            );
        const beforeStakingBal = await this.collateralToken.balanceOf(
            this.TizzStaking.address
        );
        const beforeStorageBal = await this.collateralToken.balanceOf(
            this.TizzTradingStorage.address
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
        const afterStakingBal = await this.collateralToken.balanceOf(
            this.TizzStaking.address
        );
        const afterStorageBal = await this.collateralToken.balanceOf(
            this.TizzTradingStorage.address
        );

        expect(afterOpenTradesCnt - beforeOpenTradesCnt).to.be.equal(1);

        const openTrade = await this.TizzTradingStorage.openTrades(
            this.deployer.address,
            pairIndex,
            0
        );
        console.log(smallNum(openTrade.positionSizeBaseAsset));
        console.log(
            smallNum(BigInt(afterStorageBal) - BigInt(beforeStorageBal)),
            smallNum(BigInt(afterStakingBal) - BigInt(beforeStakingBal))
        );
    });

    it("price rise then close position", async function () {
        await this.TizzPriceAggregator.setUpMode(true);
        await this.TizzPriceAggregator.setDeltaValue(bigNum(200, 10));

        let proofbytes = getProofBytes();
        const pairIndex = 0;
        const index = 0;
        // reverts if vault token doesn't have enough assset.
        await expect(
            this.TizzTrading.closeTradeMarket(pairIndex, index, proofbytes)
        ).to.be.revertedWith("NOT_ENOUGH_ASSETS");

        await this.TizzPriceAggregator.setDeltaValue(bigNum(100, 10));
        let beforeBal = await this.TizzEscrow.claimableAmounts(
            this.deployer.address,
            this.collateralToken.address
        );
        await this.TizzTrading.closeTradeMarket(pairIndex, index, proofbytes);
        let afterBal = await this.TizzEscrow.claimableAmounts(
            this.deployer.address,
            this.collateralToken.address
        );

        console.log(
            "received amount: ",
            smallNum(BigInt(afterBal) - BigInt(beforeBal))
        );
    });
});
