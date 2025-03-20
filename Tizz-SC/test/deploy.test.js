const { ethers } = require("hardhat");
const {
    deployContracts,
    initialCores,
    initialCollaterals,
} = require("./testHelper");

describe("Tizz deploying test", function () {
    before(async function () {
        [this.deployer, this.gov, this.admin] = await ethers.getSigners();
    });

    it("check initialization", async function () {
        console.log("initialized successfully!");
    });

    describe("USDT collateral", function () {
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
            ] = await deployContracts("USDT", this.deployer, this.admin);
        });

        it("initial contracts", async function () {
            await initialCores(
                this.deployer,
                "USDT",
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
                "USDT",
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
        });
    });

    describe("WBTC collateral", function () {
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
            ] = await deployContracts("WBTC", this.deployer, this.admin);
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
        });
    });

    describe("Native collateral", function () {
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
            ] = await deployContracts("Native", this.deployer, this.admin);
        });

        it("initial contracts", async function () {
            await initialCores(
                this.deployer,
                "Native",
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
                "Native",
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
        });
    });
});
