const { ethers } = require("hardhat");
const { expect } = require("chai");
const { bigNum, getETHBalance, smallNum } = require("hardhat-libutils");
const { getDeploymentParams } = require("../scripts/testParams");
const {
    deployContracts,
    initialCores,
    initialCollaterals,
} = require("./testHelper");
const { getProofBytes } = require("../scripts/params");

describe("Tizz Halborn Audit Test", function () {
    let deployParams;
    let collateralType = "Native";
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
            this.attacker,
        ] = await ethers.getSigners();

        deployParams = getDeploymentParams(collateralType);
    });

    it("check initialize", async function () {
        console.log("Initialized successfully!");
    });

    describe("Native token refund issue test", function () {
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
            ] = await deployContracts(
                collateralType,
                this.deployer,
                this.admin
            );
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
        });

        it("open trade with more native token and check if it's refunded", async function () {
            let ethAmount = bigNum(3, 18);
            let tradeInfo = {
                trader: this.trader_1.address,
                pairIndex: 0,
                index: 0,
                initialPosToken: 0,
                positionSizeBaseAsset: BigInt(ethAmount),
                openPrice: "1799516666600", // $179.95
                buy: true,
                leverage: 20,
                tp: "1809516666600", // $180.95 take profit
                sl: "1199486607100", // $119.94 stop loss
            };
            let orderType = 0; // LEGACY
            let referrer = ethers.constants.AddressZero;
            let slippageP = 10000000000; // 1%
            const proofbytes = getProofBytes();
            let beforeBal = await getETHBalance(this.TizzTrading.address);
            await this.TizzTrading.connect(this.trader_1).openTrade(
                tradeInfo,
                orderType,
                slippageP,
                referrer,
                proofbytes,
                { value: BigInt(ethAmount) * BigInt(2) }
            );
            let afterBal = await getETHBalance(this.TizzTrading.address);
            expect(smallNum(BigInt(afterBal) - BigInt(beforeBal))).to.be.equal(
                0
            );
        });
    });

    describe("Overflow issue test", function () {
        it("deploy contracts", async function () {
            collateralType = "USDT";
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
            ] = await deployContracts(
                collateralType,
                this.deployer,
                this.admin
            );
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
        });

        describe("TizzStaking issue", async function () {
            it("stake tizz token", async function () {
                const tizzMintAmount = bigNum(100, 18);
                await this.TizzFinanceToken.mint(
                    this.attacker.address,
                    BigInt(tizzMintAmount)
                );

                await this.TizzFinanceToken.connect(this.attacker).approve(
                    this.TizzStaking.address,
                    BigInt(tizzMintAmount)
                );

                await expect(
                    this.TizzStaking.connect(this.attacker).stakeTizz(1)
                ).to.be.revertedWith("LESS_THAN_MIN_AMOUNT");

                await this.TizzStaking.connect(this.attacker).stakeTizz(
                    BigInt(tizzMintAmount)
                );
            });

            it("distribute rewards", async function () {
                let amountToken = bigNum(38000000, 18);
                await this.collateralToken.mint(
                    this.attacker.address,
                    BigInt(amountToken)
                );

                await this.collateralToken
                    .connect(this.attacker)
                    .approve(this.TizzStaking.address, BigInt(amountToken));

                await this.TizzStaking.connect(this.attacker).distributeReward(
                    this.collateralToken.address,
                    BigInt(amountToken)
                );

                // distribute again and overflowed
                console.log("distibute again and checked if overflowed");
                amountToken = bigNum(2000, 18);
                await this.collateralToken.mint(
                    this.attacker.address,
                    BigInt(amountToken)
                );

                await this.collateralToken
                    .connect(this.attacker)
                    .approve(this.TizzStaking.address, BigInt(amountToken));

                await this.TizzStaking.connect(this.attacker).distributeReward(
                    this.collateralToken.address,
                    BigInt(amountToken)
                );
            });
        });
    });
});
