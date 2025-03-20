const { ethers } = require("hardhat");
const { expect } = require("chai");
const { bigNum, smallNum, spendTime, day } = require("hardhat-libutils");
const { getDeploymentParams } = require("../scripts/testParams");
const { getOpenPnlProofBytes } = require("./utils");
const ERC20ABI = require("../external_abi/ERC20.abi.json");
const {
    deployContracts,
    initialCores,
    initialCollaterals,
} = require("./testHelper");

describe("Tizz Vault Token Test", function () {
    let deployParams;
    let USDTWhaleAddress = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
    const collateralType = "USDT";
    before(async function () {
        [
            this.deployer,
            this.gov,
            this.admin,
            this.trader,
            this.trader_1,
            this.owner,
            this.admin,
            this.manager,
            this.mockPnlHandler,
            this.mockTizzPriceProvider,
            this.mockPnlFeed,
            this.liquidator,
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
            this.TizzBorrowingFees,
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
            this.LockedDepositNft,
            false
        );

        await initialCollaterals(
            collateralType,
            this.TizzTradingPriceFeedManager,
            this.TizzTradingStorage,
            this.TizzVaultToken,
            this.TizzPriceAggregator,
            this.TizzTradingCallbacks,
            this.TizzTrading,
            this.TizzBorrowingFees,
            this.TizzMultiCollatDiamond,
            this.TizzStaking,
            this.TizzEscrow
        );
    });

    describe("TizzCollateralToken", function () {
        it("check initialized params", async function () {
            expect(await this.TizzVaultToken.currentEpoch()).to.be.equal(1);
            expect(
                smallNum(await this.TizzVaultToken.totalDeposited())
            ).to.be.equal(0);
            expect(await this.TizzVaultToken.lockedDepositNft()).to.be.equal(
                this.LockedDepositNft.address
            );
            expect(
                await this.TizzVaultToken.accBlockWeightedMarketCapLastStored()
            ).to.be.closeTo(await ethers.provider.getBlockNumber(), 1);
        });

        it("transferOwnership", async function () {
            let oldOwner = await this.TizzVaultToken.owner();
            await expect(
                this.TizzVaultToken.connect(this.owner).transferOwnership(
                    this.owner.address
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");

            await expect(
                this.TizzVaultToken.transferOwnership(
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("Ownable: new owner is the zero address");
            await expect(
                this.TizzVaultToken.transferOwnership(this.admin.address)
            ).to.be.revertedWith("WRONG_VALUE");

            await this.TizzVaultToken.transferOwnership(this.owner.address);
            expect(await this.TizzVaultToken.owner()).to.be.equal(
                this.owner.address
            );
            // revert owneship
            await this.TizzVaultToken.connect(this.owner).transferOwnership(
                oldOwner
            );
        });

        it("updates", async function () {
            let oldData;
            // updateManager(only owner)
            await this.TizzVaultToken.updateManager(this.manager.address);
            await expect(
                this.TizzVaultToken.connect(this.admin).updateManager(
                    this.manager.address
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(
                this.TizzVaultToken.updateManager(ethers.constants.AddressZero)
            ).to.be.revertedWith("ADDRESS_0");
            await expect(
                this.TizzVaultToken.updateManager(this.admin.address)
            ).to.be.revertedWith("WRONG_VALUE");
            expect(await this.TizzVaultToken.manager()).to.be.equal(
                this.manager.address
            );

            // updateAdmin(only manager)
            await expect(
                this.TizzVaultToken.connect(this.admin).updateAdmin(
                    this.admin.address
                )
            ).to.be.revertedWith("ONLY_MANAGER");
            await expect(
                this.TizzVaultToken.connect(this.manager).updateAdmin(
                    this.manager.address
                )
            ).to.be.revertedWith("WRONG_VALUE");
            await expect(
                this.TizzVaultToken.connect(this.manager).updateAdmin(
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("ADDRESS_0");
            await this.TizzVaultToken.connect(this.manager).updateAdmin(
                this.admin.address
            );
            expect(await this.TizzVaultToken.admin()).to.be.equal(
                this.admin.address
            );

            // updatePnlHandler(only owner)
            await expect(
                this.TizzVaultToken.connect(this.admin).updatePnlHandler(
                    this.mockPnlHandler.address
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(
                this.TizzVaultToken.updatePnlHandler(
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("ADDRESS_0");
            oldData = await this.TizzVaultToken.pnlHandler();
            await this.TizzVaultToken.updatePnlHandler(
                this.mockPnlHandler.address
            );
            expect(await this.TizzVaultToken.pnlHandler()).to.be.equal(
                this.mockPnlHandler.address
            );
            await this.TizzVaultToken.updatePnlHandler(oldData);

            // updateOpenTradesPnlFeed(only owner)
            await expect(
                this.TizzVaultToken.connect(this.admin).updateOpenTradesPnlFeed(
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(
                this.TizzVaultToken.updateOpenTradesPnlFeed(
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("ADDRESS_0");
            oldData = await this.TizzVaultToken.openTradesPnlFeed();
            await this.TizzVaultToken.updateOpenTradesPnlFeed(
                this.mockPnlFeed.address
            );
            expect(await this.TizzVaultToken.openTradesPnlFeed()).to.be.equal(
                this.mockPnlFeed.address
            );
            await this.TizzVaultToken.updateOpenTradesPnlFeed(oldData);

            // updateMaxAccOpenPnlDelta(only owner)
            let newMaxAccDelta = bigNum(5, 18);
            await this.TizzVaultToken.updateMaxAccOpenPnlDelta(
                BigInt(newMaxAccDelta)
            );
            expect(await this.TizzVaultToken.maxAccOpenPnlDelta()).to.be.equal(
                BigInt(newMaxAccDelta)
            );
            // updateMaxDailyAccPnlDelta(only manager)
            const newMaxAccPnlDelta = bigNum(2, 17);
            await this.TizzVaultToken.connect(
                this.manager
            ).updateMaxDailyAccPnlDelta(BigInt(newMaxAccPnlDelta));
            expect(
                BigInt(await this.TizzVaultToken.maxDailyAccPnlDelta())
            ).to.be.equal(BigInt(newMaxAccPnlDelta));
            // updateWithdrawLockThresholdsP(only owner)
            let newWithdrawLockThresholdsP = [bigNum(15, 18), bigNum(25, 18)];
            await this.TizzVaultToken.updateWithdrawLockThresholdsP(
                newWithdrawLockThresholdsP
            );
            expect(
                BigInt(await this.TizzVaultToken.withdrawLockThresholdsP(0))
            ).to.be.equal(BigInt(newWithdrawLockThresholdsP[0]));
            // updateMaxSupplyIncreaseDailyP(only manager)
            const newMaxSupplyIncreaseDailyP = bigNum(3, 18);
            await this.TizzVaultToken.connect(
                this.manager
            ).updateMaxSupplyIncreaseDailyP(BigInt(newMaxSupplyIncreaseDailyP));
            expect(
                BigInt(await this.TizzVaultToken.maxSupplyIncreaseDailyP())
            ).to.be.equal(BigInt(newMaxSupplyIncreaseDailyP));
            // updateLossesBurnP(only manager)
            const newLossesBurnP = bigNum(25, 18);
            await this.TizzVaultToken.connect(this.manager).updateLossesBurnP(
                BigInt(newLossesBurnP)
            );
            expect(BigInt(await this.TizzVaultToken.lossesBurnP())).to.be.equal(
                BigInt(newLossesBurnP)
            );
            // updateMaxTizzSupplyMintDailyP(only manager)
            const newMaxTizzSupplyMintDailyP = bigNum(4, 16);
            await this.TizzVaultToken.connect(
                this.manager
            ).updateMaxTizzSupplyMintDailyP(BigInt(newMaxTizzSupplyMintDailyP));
            expect(
                BigInt(await this.TizzVaultToken.maxTizzSupplyMintDailyP())
            ).to.be.equal(BigInt(newMaxTizzSupplyMintDailyP));
            // updateMaxDiscountP(only manager)
            const newMaxDiscountP = bigNum(4, 18);
            await this.TizzVaultToken.connect(this.manager).updateMaxDiscountP(
                BigInt(newMaxDiscountP)
            );
            expect(await this.TizzVaultToken.maxDiscountP()).to.be.equal(
                BigInt(newMaxDiscountP)
            );
            // updateMaxDiscountThresholdP(only manager)
            const newMaxDiscountThresholdP = bigNum(120, 18);
            await this.TizzVaultToken.connect(
                this.manager
            ).updateMaxDiscountThresholdP(BigInt(newMaxDiscountThresholdP));
            expect(
                await this.TizzVaultToken.maxDiscountThresholdP()
            ).to.be.equal(BigInt(newMaxDiscountThresholdP));
        });

        it("mint", async function () {
            let shareToAssetsPrice =
                await this.TizzVaultToken.shareToAssetsPrice();
            expect(smallNum(shareToAssetsPrice)).to.be.equal(1);
            let accPnlPerTokenUsed =
                await this.TizzVaultToken.accPnlPerTokenUsed();
            expect(accPnlPerTokenUsed).to.be.equal(0);

            let approveAmount = bigNum(1000, 18);
            await this.collateralToken.mint(
                this.trader.address,
                BigInt(approveAmount)
            );
            await this.collateralToken
                .connect(this.trader)
                .approve(this.TizzVaultToken.address, BigInt(approveAmount));
            let shares = bigNum(200, 18);
            let assets = await this.TizzVaultToken.previewMint(BigInt(shares));
            let beforeColBal = await this.collateralToken.balanceOf(
                this.trader.address
            );
            let beforeTizzBal = await this.TizzVaultToken.balanceOf(
                this.trader.address
            );
            await this.TizzVaultToken.connect(this.trader).mint(
                BigInt(shares),
                this.trader.address
            );
            let afterColBal = await this.collateralToken.balanceOf(
                this.trader.address
            );
            let afterTizzBal = await this.TizzVaultToken.balanceOf(
                this.trader.address
            );
            expect(BigInt(afterTizzBal) - BigInt(beforeTizzBal)).to.be.equal(
                BigInt(shares)
            );
            expect(BigInt(beforeColBal) - BigInt(afterColBal)).to.be.equal(
                BigInt(assets)
            );
        });

        it("makeWithdrawRequest", async function () {
            let shareAmount = await this.TizzVaultToken.balanceOf(
                this.trader.address
            );
            shareAmount = BigInt(shareAmount) / BigInt(2);
            await this.TizzVaultToken.connect(this.trader).makeWithdrawRequest(
                BigInt(shareAmount),
                this.trader.address
            );

            // make several epochs for withdrawing
            await spendTime(2 * day);
            let bytesproof = getOpenPnlProofBytes();
            await this.TizzTradingPriceFeedManager.newOpenPnlRequestOrEpoch(
                bytesproof
            );

            for (let i = 0; i < 3; i++) {
                await spendTime(4 * day);
                await this.TizzTradingPriceFeedManager.forceNewEpoch();
            }

            expect(
                smallNum(
                    await this.TizzVaultToken.maxWithdraw(this.trader.address)
                )
            ).to.be.equal(smallNum(shareAmount));
        });

        it("withdraw", async function () {
            let assets = bigNum(50, 18);
            let shares = await this.TizzVaultToken.previewWithdraw(
                BigInt(assets)
            );

            let beforeShareBal = await this.TizzVaultToken.balanceOf(
                this.trader.address
            );
            let beforeAssetBal = await this.collateralToken.balanceOf(
                this.trader.address
            );
            await this.TizzVaultToken.connect(this.trader).withdraw(
                BigInt(assets),
                this.trader.address,
                this.trader.address
            );
            let afterShareBal = await this.TizzVaultToken.balanceOf(
                this.trader.address
            );
            let afterAssetBal = await this.collateralToken.balanceOf(
                this.trader.address
            );
            expect(BigInt(beforeShareBal) - BigInt(afterShareBal)).to.be.equal(
                BigInt(shares)
            );
            expect(BigInt(afterAssetBal) - BigInt(beforeAssetBal)).to.be.equal(
                BigInt(assets)
            );
            expect(
                smallNum(
                    await this.TizzVaultToken.maxWithdraw(this.trader.address)
                )
            ).to.be.greaterThan(0);
        });

        it("redeem", async function () {
            const currentEpoch = await this.TizzVaultToken.currentEpoch();
            let sharesToRedeem = bigNum(50, 18);
            let expectAssets = await this.TizzVaultToken.previewRedeem(
                BigInt(sharesToRedeem)
            );
            await this.TizzVaultToken.connect(this.trader).approve(
                this.deployer.address,
                BigInt(sharesToRedeem)
            );

            let beforeShareBal = await this.TizzVaultToken.balanceOf(
                this.trader.address
            );
            let beforeAssets = await this.collateralToken.balanceOf(
                this.deployer.address
            );
            await this.TizzVaultToken.redeem(
                BigInt(sharesToRedeem),
                this.deployer.address,
                this.trader.address
            );
            let afterAssets = await this.collateralToken.balanceOf(
                this.deployer.address
            );
            let afterShareBal = await this.TizzVaultToken.balanceOf(
                this.trader.address
            );

            expect(
                smallNum(BigInt(afterAssets) - BigInt(beforeAssets), 18)
            ).to.be.equal(smallNum(expectAssets, 18));
            expect(
                smallNum(BigInt(beforeShareBal) - BigInt(afterShareBal))
            ).to.be.equal(smallNum(sharesToRedeem, 18));
        });

        it("transfer & transferFrom", async function () {
            let transferAmount = bigNum(10, 18);
            let beforeBal = await this.TizzVaultToken.balanceOf(
                this.trader_1.address
            );
            await expect(
                this.TizzVaultToken.transfer(
                    this.trader_1.address,
                    BigInt(transferAmount)
                )
            ).to.be.revertedWith("OVER_BALANCE");
            await this.TizzVaultToken.connect(this.trader).transfer(
                this.trader_1.address,
                BigInt(transferAmount)
            );
            let afterBal = await this.TizzVaultToken.balanceOf(
                this.trader_1.address
            );
            expect(
                smallNum(BigInt(afterBal) - BigInt(beforeBal), 18)
            ).to.be.equal(smallNum(transferAmount, 18));
            await this.TizzVaultToken.connect(this.trader).approve(
                this.trader_1.address,
                BigInt(transferAmount)
            );
            beforeBal = await this.TizzVaultToken.balanceOf(
                this.trader_1.address
            );
            await this.TizzVaultToken.connect(this.trader_1).transferFrom(
                this.trader.address,
                this.trader_1.address,
                BigInt(transferAmount)
            );
            afterBal = await this.TizzVaultToken.balanceOf(
                this.trader_1.address
            );
            expect(
                smallNum(BigInt(afterBal) - BigInt(beforeBal), 18)
            ).to.be.equal(smallNum(transferAmount, 18));
        });

        it("decimals", async function () {
            expect(await this.TizzVaultToken.decimals()).to.be.equal(18);
        });

        it("depositWithDiscountAndLock", async function () {
            let lockDuration = 20 * day;
            let assets = bigNum(100, 18);
            let receiver = this.trader_1.address;
            const PRECISION = bigNum(1, 18);
            const collateralizationP =
                await this.TizzVaultToken.collateralizationP();
            const lockDiscountP = await this.TizzVaultToken.lockDiscountP(
                BigInt(collateralizationP),
                lockDuration
            );
            let simulateAssets =
                (BigInt(assets) *
                    (BigInt(PRECISION) * BigInt(100) + BigInt(lockDiscountP))) /
                (BigInt(PRECISION) * BigInt(100));
            let expectShares = await this.TizzVaultToken.previewDeposit(
                BigInt(simulateAssets)
            );
            let beforeNftBal = await this.LockedDepositNft.balanceOf(
                this.trader_1.address
            );
            let beforeAssetBal = await this.collateralToken.balanceOf(
                this.trader.address
            );
            let beforeShareBal = await this.TizzVaultToken.balanceOf(
                this.TizzVaultToken.address
            );
            await this.TizzVaultToken.connect(
                this.trader
            ).depositWithDiscountAndLock(
                BigInt(assets),
                lockDuration,
                receiver
            );
            let afterNftBal = await this.LockedDepositNft.balanceOf(
                this.trader_1.address
            );
            let afterAssetBal = await this.collateralToken.balanceOf(
                this.trader.address
            );
            let afterShareBal = await this.TizzVaultToken.balanceOf(
                this.TizzVaultToken.address
            );
            expect(Number(afterNftBal) - Number(beforeNftBal)).to.be.equal(
                Number(1)
            );
            expect(
                smallNum(BigInt(beforeAssetBal) - BigInt(afterAssetBal), 18)
            ).to.be.equal(smallNum(assets, 18));
            expect(
                smallNum(BigInt(afterShareBal) - BigInt(beforeShareBal), 18)
            ).to.be.equal(smallNum(expectShares, 18));
        });

        it("mintWithDiscountAndLock", async function () {
            let shares = bigNum(20, 18);
            let lockDuration = 20 * day;
            let receiver = this.trader_1.address;
            let assets = await this.TizzVaultToken.previewMint(BigInt(shares));
            await this.collateralToken.mint(
                this.trader_1.address,
                BigInt(assets)
            );
            await this.collateralToken
                .connect(this.trader_1)
                .approve(this.TizzVaultToken.address, BigInt(assets));
            let beforeNftBal = await this.LockedDepositNft.balanceOf(receiver);
            let beforeShareBal = await this.TizzVaultToken.balanceOf(
                this.TizzVaultToken.address
            );
            let beforeAssetBal = await this.collateralToken.balanceOf(
                this.trader_1.address
            );
            await this.TizzVaultToken.connect(
                this.trader_1
            ).mintWithDiscountAndLock(BigInt(shares), lockDuration, receiver);
            let afterNftBal = await this.LockedDepositNft.balanceOf(receiver);
            let afterShareBal = await this.TizzVaultToken.balanceOf(
                this.TizzVaultToken.address
            );
            let afterAssetBal = await this.collateralToken.balanceOf(
                this.trader_1.address
            );
            expect(Number(afterNftBal) - Number(beforeNftBal)).to.be.equal(
                Number(1)
            );
            expect(
                smallNum(BigInt(afterShareBal) - BigInt(beforeShareBal), 18)
            ).to.be.equal(smallNum(shares, 18));
            expect(
                smallNum(BigInt(beforeAssetBal) - BigInt(afterAssetBal), 18)
            ).to.be.lessThan(smallNum(assets, 18));
        });

        it("unlock deposit", async function () {
            const depositId = await this.LockedDepositNft.tokenOfOwnerByIndex(
                this.trader_1.address,
                0
            );
            const receiver = this.trader.address;
            await expect(
                this.TizzVaultToken.connect(this.trader_1).unlockDeposit(
                    depositId,
                    receiver
                )
            ).to.be.revertedWith("NOT_UNLOCKED");
            await spendTime(25 * day);
            let beforeNftBal = await this.LockedDepositNft.balanceOf(
                this.trader_1.address
            );
            let beforeShareBal = await this.TizzVaultToken.balanceOf(
                this.trader.address
            );
            await this.TizzVaultToken.connect(this.trader_1).unlockDeposit(
                depositId,
                receiver
            );
            let afterNftBal = await this.LockedDepositNft.balanceOf(
                this.trader_1.address
            );
            let afterShareBal = await this.TizzVaultToken.balanceOf(
                this.trader.address
            );
            expect(
                smallNum(BigInt(afterShareBal) - BigInt(beforeShareBal), 18)
            ).to.be.greaterThan(0);
            expect(Number(beforeNftBal) - Number(afterNftBal)).to.be.equal(
                Number(1)
            );
        });
    });
});
