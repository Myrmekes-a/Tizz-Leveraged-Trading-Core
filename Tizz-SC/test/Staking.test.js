/*const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
    deploy,
    bigNum,
    deployProxy,
    smallNum,
    getCurrentTimestamp,
    month,
    spendTime,
    day,
} = require("hardhat-libutils");

describe("Tizz deploying test", function () {
    let minStakeAmount = bigNum(10, 18);
    before(async function () {
        [this.deployer, this.owner, this.staker, this.manager] =
            await ethers.getSigners();

        this.mockTizzFinanceToken = await deploy(
            "MockToken",
            "MockTizz",
            "MockTizz",
            "MockTizz",
            0,
            18
        );
        this.mockUSDT = await deploy(
            "MockToken",
            "MockUSDT",
            "MockUSDT",
            "MockUSDT",
            bigNum(10000, 18),
            18
        );

        this.TizzVault = await deployProxy("TizzVault", "TizzVault", [
            this.owner.address,
            this.mockTizzFinanceToken.address,
            this.mockUSDT.address,
            BigInt(minStakeAmount),
        ]);
    });

    it("check initialization", async function () {
        console.log("initialized successfully!");
    });

    it("initializeV2", async function () {
        await this.TizzVault.initializeV2();
        let baseAsset = await this.TizzVault.baseAsset();
        let rewardTokens = await this.TizzVault.getRewardTokens();
        let ownerAddress = await this.TizzVault.owner();
        let minAmount = await this.TizzVault.minStakeAmount();
        expect(baseAsset).to.be.equal(this.mockUSDT.address);
        expect(rewardTokens.length).to.be.equal(1);
        expect(rewardTokens[0]).to.be.equal(this.mockUSDT.address);
        expect(ownerAddress).to.be.equal(this.owner.address);
        expect(smallNum(minAmount, 18)).to.be.equal(
            smallNum(minStakeAmount, 18)
        );
    });

    it("addRewardToken", async function () {
        await expect(
            this.TizzVault.addRewardToken(this.mockUSDT.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        await expect(
            this.TizzVault.connect(this.owner).addRewardToken(
                ethers.constants.AddressZero
            )
        ).to.be.revertedWith("ZERO_ADDRESS");

        await expect(
            this.TizzVault.connect(this.owner).addRewardToken(
                this.mockUSDT.address
            )
        ).to.be.revertedWith("DUPLICATE");

        this.mockDAI = await deploy(
            "MockToken",
            "MockToken",
            "MockDAI",
            "MockDAI",
            0,
            18
        );
        await this.TizzVault.connect(this.owner).addRewardToken(
            this.mockDAI.address
        );
        let rewardTokens = await this.TizzVault.getRewardTokens();
        expect(rewardTokens.length).to.be.equal(2);
        expect(rewardTokens[1]).to.be.equal(this.mockDAI.address);
    });

    // it("stakeTizz first time", async function () {
    //     await expect(this.TizzVault.stakeTizz(1)).to.be.revertedWith(
    //         "LESS_THAN_MIN_AMOUNT"
    //     );

    //     let stakeAmount = bigNum(100, 18);
    //     await this.mockTizzFinanceToken.mint(
    //         this.staker.address,
    //         BigInt(stakeAmount)
    //     );
    //     await this.mockTizzFinanceToken
    //         .connect(this.staker)
    //         .approve(this.TizzVault.address, BigInt(stakeAmount));

    //     let beforeTizzBal = await this.mockTizzFinanceToken.balanceOf(
    //         this.staker.address
    //     );
    //     let beforeBaseAssetBal = await this.mockUSDT.balanceOf(
    //         this.staker.address
    //     );
    //     await expect(
    //         this.TizzVault.connect(this.staker).stakeTizz(BigInt(stakeAmount))
    //     )
    //         .to.be.emit(this.TizzVault, "TizzStaked")
    //         .withArgs(this.staker.address, BigInt(stakeAmount));
    //     let afterTizzBal = await this.mockTizzFinanceToken.balanceOf(
    //         this.staker.address
    //     );
    //     let afterBaseAssetBal = await this.mockUSDT.balanceOf(
    //         this.staker.address
    //     );
    //     expect(
    //         smallNum(BigInt(beforeTizzBal) - BigInt(afterTizzBal), 18)
    //     ).to.be.equal(smallNum(stakeAmount, 18));
    //     expect(
    //         Number(BigInt(afterBaseAssetBal) - BigInt(beforeBaseAssetBal))
    //     ).to.be.equal(0);

    //     let stakerInfo = await this.TizzVault.stakers(this.staker.address);
    //     expect(smallNum(stakerInfo.stakedTizz, 18)).to.be.equal(
    //         smallNum(stakeAmount, 18)
    //     );
    //     expect(smallNum(stakerInfo.debtBaseAsset, 18)).to.be.equal(0);
    //     expect(
    //         smallNum(await this.TizzVault.tizzFinanceTokenBalance(), 18)
    //     ).to.be.equal(smallNum(stakeAmount, 18));
    // });

    // it("stakeTizz again", async function () {
    //     let stakeAmount = bigNum(200, 18);
    //     await this.mockTizzFinanceToken.mint(this.staker.address, BigInt(stakeAmount));
    //     await this.mockTizzFinanceToken
    //         .connect(this.staker)
    //         .approve(this.TizzVault.address, BigInt(stakeAmount));

    //     let beforeTizzBal = await this.mockTizzFinanceToken.balanceOf(
    //         this.staker.address
    //     );
    //     let beforeBaseAssetBal = await this.mockUSDT.balanceOf(
    //         this.staker.address
    //     );
    //     let beforeStakerInfo = await this.TizzVault.stakers(
    //         this.staker.address
    //     );
    //     let beforeTzBal = await this.TizzVault.tizzFinanceTokenBalance();
    //     await expect(
    //         this.TizzVault.connect(this.staker).stakeTizz(BigInt(stakeAmount))
    //     )
    //         .to.be.emit(this.TizzVault, "TizzStaked")
    //         .withArgs(this.staker.address, BigInt(stakeAmount));
    //     let afterTizzBal = await this.mockTizzFinanceToken.balanceOf(
    //         this.staker.address
    //     );
    //     let afterBaseAssetBal = await this.mockUSDT.balanceOf(
    //         this.staker.address
    //     );
    //     expect(
    //         smallNum(BigInt(beforeTizzBal) - BigInt(afterTizzBal), 18)
    //     ).to.be.equal(smallNum(stakeAmount, 18));
    //     expect(
    //         Number(BigInt(afterBaseAssetBal) - BigInt(beforeBaseAssetBal))
    //     ).to.be.equal(0);
    //     let afterStakerInfo = await this.TizzVault.stakers(this.staker.address);
    //     let afterTzBal = await this.TizzVault.tizzFinanceTokenBalance();
    //     expect(
    //         smallNum(
    //             BigInt(
    //                 afterStakerInfo.stakedTizz - beforeStakerInfo.stakedTizz
    //             ),
    //             18
    //         )
    //     ).to.be.equal(smallNum(stakeAmount, 18));
    //     expect(smallNum(afterStakerInfo.debtBaseAsset, 18)).to.be.equal(0);
    //     expect(
    //         smallNum(BigInt(afterTzBal) - BigInt(beforeTzBal), 18)
    //     ).to.be.equal(smallNum(stakeAmount, 18));

    //     expect(
    //         Number(
    //             (await this.TizzVault.rewardTokenState(this.mockUSDT.address))
    //                 .accRewardPerTizz
    //         )
    //     ).to.be.equal(Number(0));
    // });

    // it("distributeRewards", async function () {
    //     let distributeUSDTAmount = bigNum(50, 18);
    //     let distributeDAIAmount = bigNum(35, 18);
    //     await this.mockUSDT.mint(
    //         this.deployer.address,
    //         BigInt(distributeUSDTAmount)
    //     );
    //     await this.mockDAI.mint(
    //         this.deployer.address,
    //         BigInt(distributeDAIAmount)
    //     );

    //     await this.mockUSDT.approve(
    //         this.TizzVault.address,
    //         BigInt(distributeUSDTAmount)
    //     );
    //     await this.mockDAI.approve(
    //         this.TizzVault.address,
    //         BigInt(distributeDAIAmount)
    //     );

    //     let accRewardPerTizz = await this.TizzVault.rewardTokenState(
    //         this.mockUSDT.address
    //     );
    //     expect(Number(accRewardPerTizz.accRewardPerTizz)).to.be.equal(0);
    //     accRewardPerTizz = await this.TizzVault.rewardTokenState(
    //         this.mockDAI.address
    //     );
    //     expect(Number(accRewardPerTizz.accRewardPerTizz)).to.be.equal(0);

    //     await this.TizzVault.distributeReward(
    //         this.mockUSDT.address,
    //         BigInt(distributeUSDTAmount)
    //     );

    //     await this.TizzVault.distributeReward(
    //         this.mockDAI.address,
    //         BigInt(distributeDAIAmount)
    //     );

    //     let tizzFinanceTokenBalance =
    //         await this.TizzVault.tizzFinanceTokenBalance();
    //     let expectAccRewardPerTizz =
    //         (BigInt(distributeUSDTAmount) * BigInt(bigNum(1, 18))) /
    //         BigInt(tizzFinanceTokenBalance);
    //     accRewardPerTizz = await this.TizzVault.rewardTokenState(
    //         this.mockUSDT.address
    //     );
    //     expect(Number(accRewardPerTizz.accRewardPerTizz)).to.be.equal(
    //         Number(expectAccRewardPerTizz)
    //     );

    //     expectAccRewardPerTizz =
    //         (BigInt(distributeDAIAmount) * BigInt(bigNum(1, 18))) /
    //         BigInt(tizzFinanceTokenBalance);
    //     accRewardPerTizz = await this.TizzVault.rewardTokenState(
    //         this.mockDAI.address
    //     );
    //     expect(Number(accRewardPerTizz.accRewardPerTizz)).to.be.equal(
    //         Number(expectAccRewardPerTizz)
    //     );
    // });

    // it("stake again and check", async function () {
    //     let stakeTizzAmount = bigNum(180, 18);

    //     let stakerInfo = await this.TizzVault.stakers(this.staker.address);
    //     let stakedTizzAmount = stakerInfo.stakedTizz;
    //     let rewardStateDAI = await this.TizzVault.rewardTokenState(
    //         this.mockDAI.address
    //     );
    //     let accDAIRewardPerTizz = rewardStateDAI.accRewardPerTizz;
    //     let userRewardDAI = await this.TizzVault.userTokenRewards(
    //         this.staker.address,
    //         this.mockDAI.address
    //     );

    //     expect(Number(stakedTizzAmount)).to.be.greaterThan(Number(0));
    //     expect(Number(userRewardDAI.debtToken)).to.be.equal(Number(0));

    //     let expectDebtToken =
    //         (BigInt(stakedTizzAmount) * BigInt(accDAIRewardPerTizz)) /
    //         BigInt(bigNum(1, 18));
    //     let pendingTokens =
    //         BigInt(expectDebtToken) - BigInt(userRewardDAI.debtToken);
    //     expectDebtToken =
    //         ((BigInt(stakedTizzAmount) + BigInt(stakeTizzAmount)) *
    //             BigInt(accDAIRewardPerTizz)) /
    //         BigInt(bigNum(1, 18));

    //     await this.mockTizzFinanceToken.mint(
    //         this.staker.address,
    //         BigInt(stakeTizzAmount)
    //     );
    //     await this.mockTizzFinanceToken
    //         .connect(this.staker)
    //         .approve(this.TizzVault.address, BigInt(stakeTizzAmount));

    //     let beforeDAIBal = await this.mockDAI.balanceOf(this.staker.address);
    //     let beforeUSDTBal = await this.mockUSDT.balanceOf(this.staker.address);
    //     await this.TizzVault.connect(this.staker).stakeTizz(
    //         BigInt(stakeTizzAmount)
    //     );
    //     let afterDAIBal = await this.mockDAI.balanceOf(this.staker.address);
    //     let afterUSDTBal = await this.mockUSDT.balanceOf(this.staker.address);
    //     expect(
    //         smallNum(BigInt(afterDAIBal) - BigInt(beforeDAIBal), 18)
    //     ).to.be.equal(smallNum(pendingTokens, 18));

    //     userRewardDAI = await this.TizzVault.userTokenRewards(
    //         this.staker.address,
    //         this.mockDAI.address
    //     );

    //     expect(smallNum(userRewardDAI.debtToken, 18)).to.be.equal(
    //         smallNum(expectDebtToken, 18)
    //     );
    //     expect(
    //         smallNum(BigInt(afterUSDTBal) - BigInt(beforeUSDTBal), 18)
    //     ).to.be.greaterThan(0);
    // });

    // it("setUnlockManager", async function () {
    //     await expect(
    //         this.TizzVault.setUnlockManager(this.manager.address, true)
    //     ).to.be.revertedWith("Ownable: caller is not the owner");

    //     await this.TizzVault.connect(this.owner).setUnlockManager(
    //         this.manager.address,
    //         true
    //     );
    // });

    // it("createUnlockSchedule", async function () {
    //     let lockTizzAmount = bigNum(600, 18);
    //     await this.mockTizzFinanceToken.mint(
    //         this.staker.address,
    //         BigInt(lockTizzAmount)
    //     );
    //     await this.mockTizzFinanceToken
    //         .connect(this.staker)
    //         .approve(this.TizzVault.address, BigInt(lockTizzAmount));
    //     await this.TizzVault.connect(this.staker).createUnlockSchedule(
    //         {
    //             totalTizz: BigInt(lockTizzAmount),
    //             start: BigInt(await getCurrentTimestamp()),
    //             duration: month * 2,
    //             revocable: false,
    //             unlockType: 0,
    //         },
    //         this.staker.address
    //     );

    //     let unlockSchedules = await this.TizzVault[
    //         "getUnlockSchedules(address)"
    //     ](this.staker.address);
    //     expect(unlockSchedules.length).to.be.equal(1);
    //     let unlockSchedule = await this.TizzVault[
    //         "getUnlockSchedules(address,uint256)"
    //     ](this.staker.address, 0);
    //     expect(smallNum(unlockSchedule.totalTizz, 18)).to.be.equal(
    //         smallNum(lockTizzAmount, 18)
    //     );

    //     let releasableTizz = await this.TizzVault.releasableTizz(
    //         unlockSchedule,
    //         BigInt(await getCurrentTimestamp())
    //     );
    //     expect(smallNum(releasableTizz, 18)).to.be.equal(0);
    // });

    // it("after time, check releasable amount", async function () {
    //     await spendTime(day * 10);
    //     let beforeUnlockSchedule = await this.TizzVault[
    //         "getUnlockSchedules(address,uint256)"
    //     ](this.staker.address, 0);
    //     let releasableTizz = await this.TizzVault.releasableTizz(
    //         beforeUnlockSchedule,
    //         BigInt(await getCurrentTimestamp())
    //     );
    //     console.log(smallNum(releasableTizz, 18));
    //     let beforeBal = await this.mockTizzFinanceToken.balanceOf(this.staker.address);
    //     let beforeDAIBal = await this.mockDAI.balanceOf(this.staker.address);
    //     let beforeUSDTBal = await this.mockUSDT.balanceOf(this.staker.address);

    //     await this.TizzVault.connect(this.staker).claimUnlockedTizz([0]);

    //     let afterBal = await this.mockTizzFinanceToken.balanceOf(this.staker.address);
    //     let afterDAIBal = await this.mockDAI.balanceOf(this.staker.address);
    //     let afterUSDTBal = await this.mockUSDT.balanceOf(this.staker.address);
    //     let afterUnlockSchedule = await this.TizzVault[
    //         "getUnlockSchedules(address,uint256)"
    //     ](this.staker.address, 0);

    //     expect(smallNum(BigInt(afterBal) - BigInt(beforeBal))).to.be.closeTo(
    //         smallNum(releasableTizz, 18),
    //         0.001
    //     );

    //     expect(
    //         smallNum(
    //             BigInt(afterUnlockSchedule.claimedTizz) -
    //                 BigInt(beforeUnlockSchedule.claimedTizz),
    //             18
    //         )
    //     ).to.be.equal(smallNum(BigInt(afterBal) - BigInt(beforeBal)));

    //     expect(
    //         smallNum(BigInt(afterUSDTBal) - BigInt(beforeUSDTBal), 18)
    //     ).to.be.equal(0);
    //     expect(
    //         smallNum(BigInt(afterDAIBal) - BigInt(beforeDAIBal), 18)
    //     ).to.be.equal(0);

    //     beforeDAIBal = await this.mockDAI.balanceOf(this.staker.address);
    //     await this.TizzVault.connect(this.staker).harvestTokenFromUnlock(
    //         this.mockDAI.address,
    //         [0]
    //     );
    //     afterDAIBal = await this.mockDAI.balanceOf(this.staker.address);
    //     console.log(smallNum(BigInt(afterDAIBal) - BigInt(beforeDAIBal), 18));

    //     await spendTime(15 * day);
    //     beforeDAIBal = await this.mockDAI.balanceOf(this.staker.address);
    //     await this.TizzVault.connect(this.staker).harvestTokenFromUnlock(
    //         this.mockDAI.address,
    //         [0]
    //     );
    //     afterDAIBal = await this.mockDAI.balanceOf(this.staker.address);
    //     console.log(smallNum(BigInt(afterDAIBal) - BigInt(beforeDAIBal), 18));
    // });
});
*/
