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

const ERC20ABI = require("../external_abi/ERC20.abi.json");

describe("Tizz Simple Test", function () {
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
        console.log(smallNum(priceUsd, 8));

        const solPairId = 65;
        const pairIndex = 1; // SOL
        const bytesProof = getProofBytes();
        const tpDelta = bigNum(6, 10); // $6
        await this.TizzPriceAggregator.GetPairPrice(bytesProof, solPairId);
        let solMarketPrice = await this.TizzPriceAggregator.getPriceUsd(
            solPairId
        );
        console.log(smallNum(solMarketPrice, 8));
        solMarketPrice = BigInt(solMarketPrice); // make as 10 decimals

        let collateralAmount = bigNum(300, 18);

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
            pairIndex: 1, // SOL
            index: 0,
            initialPosToken: 0,
            positionSizeBaseAsset: BigInt(collateralAmount),
            openPrice: BigInt(solMarketPrice),
            buy: true,
            leverage: 10,
            tp: BigInt(solMarketPrice) + BigInt(tpDelta),
            sl: BigInt(solMarketPrice) - BigInt(tpDelta) * BigInt(10),
        };

        console.log(
            BigInt(solMarketPrice),
            BigInt(solMarketPrice) - BigInt(tpDelta) * BigInt(10)
        );

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
        console.log(openTrade.sl);
    });

    it("sync funding rate", async function () {
        const pairIndex = 1;
        const proofbytes = getProofBytes();
        await this.TizzFundingFees.connect(this.feeUpdator).syncFundingFee(
            pairIndex,
            proofbytes
        );
    });

    it("openTrade with short Market", async function () {
        const solPairId = 65;
        const pairIndex = 1; // SOL
        const bytesProof = getProofBytes();
        const tpDelta = bigNum(6, 10); // $6
        await this.TizzPriceAggregator.GetPairPrice(bytesProof, solPairId);
        let solMarketPrice = await this.TizzPriceAggregator.getPriceUsd(
            solPairId
        );
        solMarketPrice = BigInt(solMarketPrice); // make as 10 decimals

        let collateralAmount = bigNum(300, 18);

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
            pairIndex: 1, // SOL
            index: 0,
            initialPosToken: 0,
            positionSizeBaseAsset: BigInt(collateralAmount),
            openPrice: BigInt(solMarketPrice),
            buy: false,
            leverage: 10,
            tp: BigInt(solMarketPrice) - BigInt(tpDelta),
            sl: 0,
        };
        const orderType = 0; // MARKET
        const referrer = ethers.constants.AddressZero;
        const slippageP = 10000000000; // 1%

        let [fundingFees, fundingRate] =
            await this.TizzFrontEndInfoAggregator.predictFees(
                tradeInfo.trader,
                BigInt(tradeInfo.positionSizeBaseAsset),
                tradeInfo.leverage,
                tradeInfo.pairIndex
            );
        console.log("fundingRate: ", fundingRate);
        console.log("fundingFees: ", smallNum(fundingFees, 18));

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
    });

    it("closeTrade", async function () {
        const pairIndex = 1;
        const index = 1;
        const bytesProof = getProofBytes();

        // set delta value
        await this.TizzPriceAggregator.setUpMode(false);
        await this.TizzPriceAggregator.setDeltaValue(bigNum(5, 10)); // profit $5

        const trade = await this.TizzTradingStorage.openTrades(
            this.deployer.address,
            pairIndex,
            index
        );
        expect(trade.buy).to.be.equal(false);
        const tradeInfo = await this.TizzTradingStorage.openTradesInfo(
            this.deployer.address,
            pairIndex,
            index
        );
        expect(tradeInfo.beingMarketClosed).to.be.equal(false);

        let beforeOpenTradesCount =
            await this.TizzTradingStorage.openTradesCount(
                this.deployer.address,
                pairIndex
            );

        await this.TizzTrading.closeTradeMarket(pairIndex, index, bytesProof);

        let afterOpenTradesCount =
            await this.TizzTradingStorage.openTradesCount(
                this.deployer.address,
                pairIndex
            );
        expect(beforeOpenTradesCount - afterOpenTradesCount).to.be.equal(1);

        let claimableTokens = await this.TizzEscrow.getClaimableTokens(
            this.deployer.address
        );
        expect(claimableTokens.length).to.be.equal(1);
        expect(Number(claimableTokens[0].amount)).to.be.greaterThan(Number(0));

        let beforeBal = await this.collateralToken.balanceOf(
            this.deployer.address
        );
        await this.TizzEscrow.claimAll();
        let afterBal = await this.collateralToken.balanceOf(
            this.deployer.address
        );
        expect(smallNum(BigInt(afterBal) - BigInt(beforeBal))).to.be.equal(
            smallNum(claimableTokens[0].amount)
        );

        claimableTokens = await this.TizzEscrow.getClaimableTokens(
            this.deployer.address
        );
        expect(claimableTokens.length).to.be.equal(0);
    });

    it("openTrade with short STOP LIMIT mode and check", async function () {
        const solPairId = 65;
        const pairIndex = 1; // SOL
        const bytesProof = getProofBytes();
        const tpDelta = bigNum(6, 10); // $6
        await this.TizzPriceAggregator.GetPairPrice(bytesProof, solPairId);
        let solMarketPrice = await this.TizzPriceAggregator.getPriceUsd(
            solPairId
        );
        solMarketPrice = BigInt(solMarketPrice); // make as 10 decimals

        let collateralAmount = bigNum(300, 18);

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
            pairIndex: 1, // SOL
            index: 0,
            initialPosToken: 0,
            positionSizeBaseAsset: BigInt(collateralAmount),
            openPrice: BigInt(solMarketPrice),
            buy: false,
            leverage: 10,
            tp: BigInt(solMarketPrice) - BigInt(tpDelta),
            sl: 0,
        };
        let orderType = 2; // STOP_LIMIT
        const referrer = ethers.constants.AddressZero;
        const slippageP = 10000000000; // 1%
        let index = await this.TizzTradingStorage.firstEmptyOpenLimitIndex(
            this.deployer.address,
            pairIndex
        );

        const beforeOpenLimitCnt =
            await this.TizzTradingStorage.openLimitOrdersCount(
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

        const afterOpenLimitCnt =
            await this.TizzTradingStorage.openLimitOrdersCount(
                this.deployer.address,
                pairIndex
            );

        expect(afterOpenLimitCnt - beforeOpenLimitCnt).to.be.equal(1);
        const openLimitOrderInfo =
            await this.TizzTradingStorage.getOpenLimitOrder(
                this.deployer.address,
                pairIndex,
                index
            );

        expect(Number(openLimitOrderInfo.orderTradeInfo.tp)).to.be.greaterThan(
            Number(0)
        );
        expect(openLimitOrderInfo.trader).to.be.equal(this.deployer.address);
    });

    it("liquidates orders and check", async function () {
        const trader = this.deployer.address;
        const pairIndex = 1;
        const index = 0;
        const bytesProof = getProofBytes();
        const originTradesCount = await this.TizzTradingStorage.openTradesCount(
            trader,
            pairIndex
        );
        expect(Number(originTradesCount)).to.be.equal(Number(1));

        const openTrade = await this.TizzTradingStorage.openTrades(
            trader,
            pairIndex,
            index
        );
        expect(openTrade.trader).to.be.equal(trader);

        await expect(
            this.TizzTrading.connect(this.liquidator).closeTradeMarket(
                pairIndex,
                index,
                bytesProof
            )
        ).to.be.revertedWith("NO_TRADE");

        const orderType = 2; // LIQ
        const traderValue = BigInt(trader);
        const packed = await this.PackingUtils.packTriggerOrder(
            orderType,
            traderValue,
            pairIndex,
            index,
            0,
            0
        );

        await increaseBlock(1000000);
        await this.TizzPriceAggregator.setUpMode(false);
        await this.TizzPriceAggregator.setDeltaValue(0); // profit $5

        // if price isn't dropped to liquidation price.
        await expect(
            this.TizzTrading.connect(this.liquidator).triggerOrder(
                packed,
                bytesProof
            )
        ).to.be.emit(this.TizzTradingCallbacks, "NftOrderCanceled");

        let tradesCount = await this.TizzTradingStorage.openTradesCount(
            trader,
            pairIndex
        );
        expect(Number(originTradesCount) - Number(tradesCount)).to.be.equal(
            Number(0)
        );

        // drop price for testing
        let dropPrice = bigNum(20, 10);
        await this.TizzPriceAggregator.setUpMode(false);
        await this.TizzPriceAggregator.setDeltaValue(BigInt(dropPrice));
        await this.TizzTrading.connect(this.liquidator).triggerOrder(
            packed,
            bytesProof
        );
        tradesCount = await this.TizzTradingStorage.openTradesCount(
            trader,
            pairIndex
        );
        expect(Number(originTradesCount) - Number(tradesCount)).to.be.equal(
            Number(1)
        );
    });

    it("setMaxPosBaseAsset", async function () {
        const maxPosBaseAsset = await this.TizzTrading.maxPosBaseAsset();
        const newMaxPosBaseAsset = BigInt(maxPosBaseAsset) * BigInt(2);

        await expect(
            this.TizzTrading.connect(this.gov).setMaxPosBaseAsset(
                BigInt(newMaxPosBaseAsset)
            )
        ).to.be.revertedWith("GOV_ONLY");

        await this.TizzTrading.setMaxPosBaseAsset(BigInt(newMaxPosBaseAsset));

        expect(BigInt(await this.TizzTrading.maxPosBaseAsset())).to.be.equal(
            BigInt(newMaxPosBaseAsset)
        );
    });

    describe("PriceAggregator", function () {
        it("getCollateralFromUsdNormalizedValue", async function () {
            const collateralPrice =
                await this.TizzPriceAggregator.getCollateralPriceUsd();
            console.log(smallNum(collateralPrice, 10));

            const collateralAmount = bigNum(10, 18);
            const normalizeValue =
                await this.TizzPriceAggregator.getCollateralFromUsdNormalizedValue(
                    BigInt(collateralAmount)
                );

            if (BigInt(collateralPrice) > BigInt(bigNum(1, 10))) {
                expect(smallNum(normalizeValue, 18)).to.be.lessThan(
                    smallNum(collateralAmount, 18)
                );
            } else {
                expect(smallNum(normalizeValue, 18)).to.be.greaterThan(
                    smallNum(collateralAmount, 18)
                );
            }
        });
    });

    describe("Trigger limit and stop limit order, and check", function () {
        it("Open limit order position and trigger order(triggerOrder)", async function () {
            const solPairId = 65;
            const pairIndex = 1; // SOL
            const bytesProof = getProofBytes();
            const tpPercent = 600; // 600%
            await this.TizzPriceAggregator.GetPairPrice(bytesProof, solPairId);
            let solMarketPrice = await this.TizzPriceAggregator.getPriceUsd(
                solPairId
            );
            let collateralAmount = bigNum(300, 18);
            let leverage = 10;
            const tp =
                BigInt(solMarketPrice) +
                (BigInt(solMarketPrice) * BigInt(tpPercent)) /
                    BigInt(100) /
                    BigInt(leverage);

            await this.collateralToken.mint(
                this.deployer.address,
                BigInt(collateralAmount)
            );
            await this.collateralToken.approve(
                this.TizzTradingStorage.address,
                BigInt(collateralAmount)
            );

            let delta = BigInt(solMarketPrice) / BigInt(200);
            const openPrice = BigInt(solMarketPrice) - BigInt(delta);
            const tradeInfo = {
                trader: this.deployer.address,
                pairIndex: pairIndex, // SOL
                index: 0,
                initialPosToken: 0,
                positionSizeBaseAsset: BigInt(collateralAmount),
                openPrice: BigInt(openPrice),
                buy: true,
                leverage: leverage,
                tp: BigInt(tp),
                sl: 0,
            };
            let orderType = 1; // Limit
            const referrer = ethers.constants.AddressZero;
            const slippageP = 10000000000; // 1%
            let index = await this.TizzTradingStorage.firstEmptyOpenLimitIndex(
                this.deployer.address,
                pairIndex
            );

            let beforeOpenLimitCnt =
                await this.TizzTradingStorage.openLimitOrdersCount(
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

            let afterOpenLimitCnt =
                await this.TizzTradingStorage.openLimitOrdersCount(
                    this.deployer.address,
                    pairIndex
                );

            expect(afterOpenLimitCnt - beforeOpenLimitCnt).to.be.equal(1);

            await this.TizzPriceAggregator.setUpMode(false);
            await this.TizzPriceAggregator.setDeltaValue(BigInt(delta));

            let triggerOrderType = 3; // LIMIT_OPEN
            const packed = await this.PackingUtils.packTriggerOrder(
                triggerOrderType,
                BigInt(this.deployer.address),
                pairIndex,
                index,
                0,
                0
            );

            beforeOpenLimitCnt =
                await this.TizzTradingStorage.openLimitOrdersCount(
                    this.deployer.address,
                    pairIndex
                );
            const beforeOpenTradesCnt =
                await this.TizzTradingStorage.openTradesCount(
                    this.deployer.address,
                    pairIndex
                );
            index = this.TizzTradingStorage.firstEmptyTradeIndex(
                this.deployer.address,
                pairIndex
            );
            await this.TizzTrading.connect(this.liquidator).triggerOrder(
                packed,
                bytesProof
            );
            afterOpenLimitCnt =
                await this.TizzTradingStorage.openLimitOrdersCount(
                    this.deployer.address,
                    pairIndex
                );
            const afterOpenTradesCnt =
                await this.TizzTradingStorage.openTradesCount(
                    this.deployer.address,
                    pairIndex
                );

            expect(beforeOpenLimitCnt - afterOpenLimitCnt).to.be.equal(1);
            expect(afterOpenTradesCnt - beforeOpenTradesCnt).to.be.equal(1);

            const newOpenTrade = await this.TizzTradingStorage.openTrades(
                this.deployer.address,
                pairIndex,
                index
            );
            const newOpenTradeInfo =
                await this.TizzTradingStorage.openTradesInfo(
                    this.deployer.address,
                    pairIndex,
                    index
                );

            expect(newOpenTrade.trader).to.be.equal(this.deployer.address);
            expect(newOpenTrade.pairIndex).to.be.equal(pairIndex);
            // this is wrong. executionPrice should be greater/less than trigger price.
            const spreadP = await this.TizzMultiCollatDiamond.pairSpreadP(1);
            const FIXED_POINT = bigNum(1, 12);
            const spread =
                (BigInt(openPrice) * BigInt(spreadP)) / BigInt(FIXED_POINT);

            expect(
                BigInt(newOpenTrade.openPrice) - BigInt(openPrice)
            ).to.be.equal(BigInt(spread));
            expect(Number(spreadP)).to.be.greaterThan(Number(0));
            expect(Number(newOpenTrade.openPrice)).to.be.greaterThan(
                Number(openPrice)
            );
            expect(BigInt(newOpenTrade.tp)).to.be.equal(BigInt(tp));
            expect(
                Number(newOpenTradeInfo.openInterestBaseAsset)
            ).to.be.lessThan(Number(collateralAmount) * Number(leverage));
        });
    });
});
