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

describe("Tizz End-To-End Test", function () {
    let WETHWhaleAddr = "0x3368e17064C9BA5D6f1F93C4c678bea00cc78555";
    let WETHTokenAddress = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
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
        ] = await ethers.getSigners();
    });

    it("check initialization", async function () {
        console.log("initialized successfully!");
    });

    describe("Test with USDT collateral", function () {
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

            await this.collateralToken.mint(
                this.trader.address,
                bigNum(10000000000, 18)
            );
        });

        it("deposit collateral asset and check", async function () {
            let depositAmount = bigNum(10000, 18);
            let vaultAmount = await this.TizzVaultToken.previewDeposit(
                BigInt(depositAmount)
            );

            await this.collateralToken.mint(
                this.deployer.address,
                BigInt(depositAmount)
            );
            await this.collateralToken.approve(
                this.TizzVaultToken.address,
                BigInt(depositAmount)
            );
            let beforeVaultAmount = await this.TizzVaultToken.balanceOf(
                this.deployer.address
            );
            await this.TizzVaultToken.deposit(
                BigInt(depositAmount),
                this.deployer.address
            );
            let afterVaultAmount = await this.TizzVaultToken.balanceOf(
                this.deployer.address
            );
            expect(
                smallNum(
                    BigInt(afterVaultAmount) - BigInt(beforeVaultAmount),
                    18
                )
            ).to.be.equal(smallNum(vaultAmount, 18));
        });

        describe("TizzTrading", function () {
            describe("OpenTrade/CloseTrade with supra", function () {
                it("OpenTrade as MARKET mode and check", async function () {
                    let collateralAmount = bigNum(30, 18);
                    let transferAmount =
                        BigInt(collateralAmount) + BigInt(bigNum(5, 18));
                    await this.collateralToken.mint(
                        this.trader_1.address,
                        BigInt(transferAmount)
                    );
                    await this.collateralToken
                        .connect(this.trader_1)
                        .approve(
                            this.TizzTradingStorage.address,
                            BigInt(collateralAmount)
                        );
                    let tradeInfo = {
                        trader: this.trader_1.address,
                        pairIndex: 1,
                        index: 0,
                        initialPosToken: 0,
                        positionSizeBaseAsset: BigInt(collateralAmount),
                        openPrice: "1799516666600", // $179.95
                        buy: true,
                        leverage: 50,
                        tp: "1809516666600", // $180.95 take profit
                        sl: "1199486607100", // $119.94 stop loss
                    };
                    let orderType = 0; // MARKET
                    let referrer = ethers.constants.AddressZero;
                    let slippageP = 10000000000; // 1%
                    let predictIndex =
                        await this.TizzTradingStorage.firstEmptyOpenLimitIndex(
                            this.trader_1.address,
                            tradeInfo.pairIndex
                        );
                    expect(predictIndex).to.be.equal(0);

                    let currentOrderId =
                        await this.TizzMultiCollatDiamond.currentOrderId();
                    let bytesProof = getSimpleProofBytes();

                    let beforeBal = await this.collateralToken.balanceOf(
                        this.trader_1.address
                    );
                    await expect(
                        this.TizzTrading.connect(this.trader_1).openTrade(
                            tradeInfo,
                            orderType,
                            slippageP,
                            referrer,
                            bytesProof
                        )
                    ).to.be.emit(
                        this.TizzTradingCallbacks,
                        "MarketOpenCanceled"
                    );
                    let afterBal = await this.collateralToken.balanceOf(
                        this.trader_1.address
                    );
                    /// take gov fees
                    expect(
                        smallNum(BigInt(beforeBal) - BigInt(afterBal))
                    ).to.be.greaterThan(0);

                    await this.collateralToken
                        .connect(this.trader_1)
                        .approve(
                            this.TizzTradingStorage.address,
                            BigInt(collateralAmount)
                        );

                    bytesProof = getProofBytes();

                    await this.TizzPriceAggregator.GetPairPrice(bytesProof, 65);

                    const tpPercent = 600; // 600%
                    let openPrice = await this.TizzPriceAggregator.getPriceUsd(
                        65
                    );
                    tradeInfo.openPrice = openPrice;
                    tradeInfo.tp =
                        BigInt(openPrice) +
                        (BigInt(openPrice) * BigInt(tpPercent)) /
                            BigInt(100) /
                            BigInt(tradeInfo.leverage);

                    currentOrderId =
                        await this.TizzMultiCollatDiamond.currentOrderId();
                    await expect(
                        this.TizzTrading.connect(this.trader_1).openTrade(
                            tradeInfo,
                            orderType,
                            slippageP,
                            referrer,
                            bytesProof
                        )
                    )
                        .to.be.emit(this.TizzTrading, "MarketOrderInitiated")
                        .withArgs(
                            currentOrderId,
                            this.trader_1.address,
                            tradeInfo.pairIndex,
                            true
                        );

                    let openTradesCount =
                        await this.TizzTradingStorage.openTradesCount(
                            this.trader_1.address,
                            tradeInfo.pairIndex
                        );

                    expect(BigInt(openTradesCount)).to.be.equal(BigInt(1));
                    console.log("predictIndex: ", predictIndex);
                    let storeTrade = await this.TizzTradingStorage.openTrades(
                        this.trader_1.address,
                        tradeInfo.pairIndex,
                        predictIndex
                    );
                    expect(storeTrade.trader).to.be.equal(
                        this.trader_1.address
                    );
                });

                it("CloseTrade", async function () {
                    let pairIndex = 1;
                    let index = 0;
                    let bytesProof = getProofBytes();
                    let trade = await this.TizzTradingStorage.openTrades(
                        this.trader_1.address,
                        pairIndex,
                        index
                    );
                    console.log(
                        "openPrice & leverage: ",
                        smallNum(trade.openPrice, 8),
                        trade.leverage
                    );

                    expect(trade.trader).to.be.equal(this.trader_1.address);

                    let tradeInfo =
                        await this.TizzTradingStorage.openTradesInfo(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                    expect(tradeInfo.beingMarketClosed).to.be.equal(false);
                    let currentOrderId =
                        await this.TizzMultiCollatDiamond.currentOrderId();

                    let beforeOpenTradesCount =
                        await this.TizzTradingStorage.openTradesCount(
                            this.trader_1.address,
                            pairIndex
                        );

                    bytesProof = getSimpleProofBytes();
                    let beforeTrade = await this.TizzTradingStorage.openTrades(
                        this.trader_1.address,
                        pairIndex,
                        index
                    );
                    await this.TizzTrading.connect(
                        this.trader_1
                    ).closeTradeMarket(pairIndex, index, bytesProof);
                    let afterTrade = await this.TizzTradingStorage.openTrades(
                        this.trader_1.address,
                        pairIndex,
                        index
                    );
                    // take gov fee
                    expect(
                        smallNum(
                            BigInt(beforeTrade.initialPosToken) -
                                BigInt(afterTrade.initialPosToken)
                        )
                    ).to.be.greaterThan(0);

                    bytesProof = getProofBytes();
                    currentOrderId =
                        await this.TizzMultiCollatDiamond.currentOrderId();
                    await expect(
                        this.TizzTrading.connect(
                            this.trader_1
                        ).closeTradeMarket(pairIndex, index, bytesProof)
                    )
                        .to.be.emit(this.TizzTrading, "MarketOrderInitiated")
                        .withArgs(
                            currentOrderId,
                            this.trader_1.address,
                            pairIndex,
                            false
                        );

                    let afterOpenTradesCount =
                        await this.TizzTradingStorage.openTradesCount(
                            this.trader_1.address,
                            pairIndex
                        );

                    expect(
                        Number(beforeOpenTradesCount) -
                            Number(afterOpenTradesCount)
                    ).to.be.equal(1);

                    // TODO: build more test script to check received token as rewards.
                });

                it("OpenTrade as MOMENTUM mode and check", async function () {
                    let collateralAmount = bigNum(30, 18);
                    await this.collateralToken
                        .connect(this.trader)
                        .transfer(
                            this.trader_1.address,
                            BigInt(collateralAmount)
                        );
                    await this.collateralToken
                        .connect(this.trader_1)
                        .approve(
                            this.TizzTradingStorage.address,
                            BigInt(collateralAmount)
                        );
                    let tradeInfo = {
                        trader: this.trader_1.address,
                        pairIndex: 1,
                        index: 0,
                        initialPosToken: 0,
                        positionSizeBaseAsset: BigInt(collateralAmount),
                        openPrice: "1799516666600", // $179.95
                        buy: true,
                        leverage: 68,
                        tp: "1809516666600", // $180.95 take profit
                        sl: "1199486607100", // $119.94 stop loss
                    };
                    let orderType = 2; // MEMENTIUM
                    let referrer = ethers.constants.AddressZero;
                    let slippageP = 10000000000; // 1%

                    let predictIndex =
                        await this.TizzTradingStorage.firstEmptyOpenLimitIndex(
                            this.trader_1.address,
                            tradeInfo.pairIndex
                        );

                    let bytesProof = getProofBytes();
                    await expect(
                        this.TizzTrading.connect(this.trader_1).openTrade(
                            tradeInfo,
                            orderType,
                            slippageP,
                            referrer,
                            bytesProof
                        )
                    )
                        .to.be.emit(this.TizzTrading, "OpenLimitPlaced")
                        .withArgs(
                            this.trader_1.address,
                            tradeInfo.pairIndex,
                            predictIndex
                        );

                    await this.collateralToken
                        .connect(this.trader)
                        .transfer(
                            this.trader_1.address,
                            BigInt(collateralAmount)
                        );
                    await this.collateralToken
                        .connect(this.trader_1)
                        .approve(
                            this.TizzTradingStorage.address,
                            BigInt(collateralAmount)
                        );
                    let openLimitOrderCount =
                        await this.TizzTradingStorage.openLimitOrdersCount(
                            this.trader_1.address,
                            tradeInfo.pairIndex
                        );

                    expect(BigInt(openLimitOrderCount)).to.be.equal(BigInt(1));

                    tradeInfo = {
                        trader: this.trader.address,
                        pairIndex: 1,
                        index: 0,
                        initialPosToken: 0,
                        positionSizeBaseAsset: BigInt(collateralAmount),
                        openPrice: "1799516666600", // $179.95
                        buy: true,
                        leverage: 60,
                        tp: "1809516666600", // $180.95 take profit
                        sl: "1199486607100", // $119.94 stop loss
                    };

                    await this.collateralToken
                        .connect(this.trader)
                        .approve(
                            this.TizzTradingStorage.address,
                            BigInt(collateralAmount)
                        );

                    await this.TizzTrading.connect(this.trader).openTrade(
                        tradeInfo,
                        orderType,
                        slippageP,
                        referrer,
                        bytesProof
                    );
                });

                it("OpenTrade as MARKET mode for testing", async function () {
                    let collateralAmount = bigNum(50, 18);
                    await this.collateralToken
                        .connect(this.trader)
                        .transfer(
                            this.trader_1.address,
                            BigInt(collateralAmount)
                        );
                    await this.collateralToken
                        .connect(this.trader_1)
                        .approve(
                            this.TizzTradingStorage.address,
                            BigInt(collateralAmount)
                        );
                    let openPrice = await this.TizzPriceAggregator.getPriceUsd(
                        65
                    );
                    let tp = bigNum(6, 10);
                    let tradeInfo = {
                        trader: this.trader.address,
                        pairIndex: 1,
                        index: 0,
                        initialPosToken: 0,
                        positionSizeBaseAsset: BigInt(collateralAmount),
                        openPrice: BigInt(openPrice), // $179.95
                        buy: true,
                        leverage: 60,
                        tp: BigInt(openPrice) + BigInt(tp) * BigInt(5),
                        sl: BigInt(openPrice) - BigInt(tp),
                    };
                    let orderType = 0; // MARKET
                    let referrer = ethers.constants.AddressZero;
                    let slippageP = 10000000000; // 1%
                    let bytesProof = getProofBytes();
                    await this.collateralToken
                        .connect(this.trader_1)
                        .approve(
                            this.TizzTradingStorage.address,
                            BigInt(collateralAmount)
                        );
                    await this.TizzTrading.connect(this.trader_1).openTrade(
                        tradeInfo,
                        orderType,
                        slippageP,
                        referrer,
                        bytesProof
                    );
                });
            });

            describe("Update SL and TP", function () {
                describe("update SL", function () {
                    it("reverts if callers has not trades", async function () {
                        let pairIndex = 1;
                        let index = 0;
                        let newSl = "1199486607100";
                        await expect(
                            this.TizzTrading.connect(this.trader).updateSl(
                                pairIndex,
                                index,
                                newSl
                            )
                        ).to.be.revertedWith("NO_TRADE");
                    });

                    it("update SL and check", async function () {
                        let pairIndex = 1;
                        let openPrice =
                            await this.TizzPriceAggregator.getPriceUsd(65);
                        let tp = bigNum(8, 10);
                        let index = 0;
                        let newSl = BigInt(openPrice) + BigInt(tp);
                        let storeTrade =
                            await this.TizzTradingStorage.openTrades(
                                this.trader_1.address,
                                pairIndex,
                                index
                            );
                        expect(storeTrade.trader).to.be.equal(
                            this.trader_1.address
                        );
                        expect(BigInt(storeTrade.sl)).to.be.not.equal(
                            BigInt(newSl)
                        );
                        await this.TizzTrading.connect(this.trader_1).updateSl(
                            pairIndex,
                            index,
                            newSl
                        );
                        storeTrade = await this.TizzTradingStorage.openTrades(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                        expect(BigInt(storeTrade.sl)).to.be.equal(
                            BigInt(newSl)
                        );
                    });
                });
                describe("update TP", function () {
                    it("reverts if callers has not trades", async function () {
                        let pairIndex = 1;
                        let index = 0;
                        let newTp = "1819516666600";
                        await expect(
                            this.TizzTrading.connect(this.trader).updateTp(
                                pairIndex,
                                index,
                                newTp
                            )
                        ).to.be.revertedWith("NO_TRADE");
                    });
                    it("update TP and check", async function () {
                        let pairIndex = 1;
                        let index = 0;
                        let newTp = "1819516666600";
                        let storeTrade =
                            await this.TizzTradingStorage.openTrades(
                                this.trader_1.address,
                                pairIndex,
                                index
                            );
                        expect(storeTrade.trader).to.be.equal(
                            this.trader_1.address
                        );
                        expect(BigInt(storeTrade.tp)).to.be.not.equal(
                            BigInt(newTp)
                        );
                        await this.TizzTrading.connect(this.trader_1).updateTp(
                            pairIndex,
                            index,
                            newTp
                        );
                        storeTrade = await this.TizzTradingStorage.openTrades(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                        expect(BigInt(storeTrade.tp)).to.be.equal(
                            BigInt(newTp)
                        );
                    });
                });
            });

            describe("cancel and update OpenLimitOrder", function () {
                it("updateOpenLimitOrder", async function () {
                    let pairIndex = 1;
                    let index = 0;

                    expect(
                        await this.TizzTradingStorage.hasOpenLimitOrder(
                            this.trader_1.address,
                            pairIndex,
                            index
                        )
                    ).to.be.equal(true);
                    let price = "1242500000000";
                    let tp = "1255508928571";
                    let sl = "1200486607142";
                    let maxSlippage = "10000000000";
                    await expect(
                        this.TizzTrading.connect(
                            this.trader_1
                        ).updateOpenLimitOrder(
                            pairIndex,
                            index,
                            BigInt(price),
                            BigInt(tp),
                            BigInt(sl),
                            BigInt(maxSlippage)
                        )
                    )
                        .to.be.emit(this.TizzTrading, "OpenLimitUpdated")
                        .withArgs(
                            this.trader_1.address,
                            pairIndex,
                            index,
                            BigInt(price),
                            BigInt(tp),
                            BigInt(sl),
                            maxSlippage
                        );
                    let orderId =
                        await this.TizzTradingStorage.openLimitOrderIds(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                    let openLimitOrder =
                        await this.TizzTradingStorage.openLimitOrders(orderId);
                    expect(
                        BigInt(openLimitOrder.orderTradeInfo.minPrice)
                    ).to.be.equal(BigInt(price));
                    expect(
                        BigInt(openLimitOrder.orderTradeInfo.maxPrice)
                    ).to.be.equal(BigInt(price));
                    expect(
                        BigInt(openLimitOrder.orderTradeInfo.tp)
                    ).to.be.equal(BigInt(tp));
                    expect(
                        BigInt(openLimitOrder.orderTradeInfo.sl)
                    ).to.be.equal(BigInt(sl));
                    let tradeType = 1; // LIMIT
                    let lastUpdatedTrade =
                        await this.TizzTradingCallbacks.tradeLastUpdated(
                            this.trader_1.address,
                            pairIndex,
                            index,
                            tradeType
                        );
                    let lastBlock = await ethers.provider.getBlock("latest");
                    let lastBlockNumber = lastBlock.number;
                    expect(BigInt(lastUpdatedTrade.created)).to.be.equal(
                        BigInt(lastBlockNumber)
                    );
                    let trade = await this.TizzTradingCallbacks.tradeData(
                        this.trader_1.address,
                        pairIndex,
                        index,
                        tradeType
                    );
                    expect(BigInt(trade.maxSlippageP)).to.be.equal(
                        BigInt(maxSlippage)
                    );
                });

                it("cancelOpenLimitOrder", async function () {
                    let pairIndex = 1;
                    let index = 0;
                    let openLimitOrder =
                        await this.TizzTradingStorage.getOpenLimitOrder(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                    let beforeOpenLimitOrders =
                        await this.TizzTradingStorage.getOpenLimitOrders();
                    let lastOpenLimitOrder =
                        await this.TizzTradingStorage.openLimitOrders(
                            beforeOpenLimitOrders.length - 1
                        );
                    let positionSize = openLimitOrder.positionSize;
                    let orderId =
                        await this.TizzTradingStorage.openLimitOrderIds(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                    let beforeCollateralBal =
                        await this.collateralToken.balanceOf(
                            this.trader_1.address
                        );
                    let beforeOpenLimitOrderCnt =
                        await this.TizzTradingStorage.openLimitOrdersCount(
                            this.trader_1.address,
                            pairIndex
                        );
                    await expect(
                        this.TizzTrading.connect(
                            this.trader_1
                        ).cancelOpenLimitOrder(pairIndex, index)
                    )
                        .to.be.emit(this.TizzTrading, "OpenLimitCanceled")
                        .withArgs(this.trader_1.address, pairIndex, index);
                    let afterOpenLimitOrders =
                        await this.TizzTradingStorage.getOpenLimitOrders();
                    let afterCollateralBal =
                        await this.collateralToken.balanceOf(
                            this.trader_1.address
                        );
                    let afterOpenLimitOrderCnt =
                        await this.TizzTradingStorage.openLimitOrdersCount(
                            this.trader_1.address,
                            pairIndex
                        );
                    let updatedOpenLimitOrderId =
                        await this.TizzTradingStorage.openLimitOrderIds(
                            lastOpenLimitOrder.trader,
                            lastOpenLimitOrder.pairIndex,
                            lastOpenLimitOrder.index
                        );
                    expect(updatedOpenLimitOrderId).to.be.equal(orderId);
                    expect(
                        smallNum(
                            BigInt(afterCollateralBal) -
                                BigInt(beforeCollateralBal),
                            18
                        )
                    ).to.be.equal(smallNum(positionSize, 18));
                    expect(
                        beforeOpenLimitOrders.length -
                            afterOpenLimitOrders.length
                    ).to.be.equal(1);
                    expect(
                        beforeOpenLimitOrderCnt - afterOpenLimitOrderCnt
                    ).to.be.equal(1);
                });
            });

            describe("triggerOrder", function () {
                it("pack", async function () {
                    let pairIndex = 1;
                    let index = 0;
                    let orderType = 3; // OPEN
                    expect(
                        await this.TizzTradingStorage.hasOpenLimitOrder(
                            this.trader.address,
                            1,
                            0
                        )
                    ).to.be.equal(true);
                    let packed = await this.PackingUtils.packTriggerOrder(
                        orderType,
                        BigInt(this.trader.address),
                        pairIndex,
                        index,
                        0,
                        0
                    );
                    console.log("packed: ", packed);

                    let predictOrderId =
                        await this.TizzMultiCollatDiamond.currentOrderId();

                    let bytesProof = getProofBytes();
                    await expect(
                        this.TizzTrading.triggerOrder(
                            BigInt(packed),
                            bytesProof
                        )
                    )
                        .to.be.emit(this.TizzTrading, "OrderTriggered")
                        .withArgs(
                            predictOrderId,
                            this.trader.address,
                            pairIndex,
                            orderType
                        );
                });
            });
        });

        describe("Test TizzTradingPriceFeedManager", function () {
            it("updateRequestsStart", async function () {
                expect(
                    BigInt(
                        await this.TizzTradingPriceFeedManager.requestsStart()
                    )
                ).to.be.equal(BigInt(2) * BigInt(day));

                await expect(
                    this.TizzTradingPriceFeedManager.updateRequestsStart(
                        30 * minute
                    )
                ).to.be.revertedWith("BELOW_MIN");

                await expect(
                    this.TizzTradingPriceFeedManager.updateRequestsStart(
                        3 * week
                    )
                ).to.be.revertedWith("ABOVE_MAX");

                const newRequestsStart = day;
                await expect(
                    this.TizzTradingPriceFeedManager.updateRequestsStart(
                        newRequestsStart
                    )
                )
                    .to.be.emit(
                        this.TizzTradingPriceFeedManager,
                        "NumberParamUpdated"
                    )
                    .withArgs("requestsStart", newRequestsStart);

                expect(
                    BigInt(
                        await this.TizzTradingPriceFeedManager.requestsStart()
                    )
                ).to.be.equal(BigInt(newRequestsStart));
            });

            it("updateRequestsEvery", async function () {
                expect(
                    BigInt(
                        await this.TizzTradingPriceFeedManager.requestsEvery()
                    )
                ).to.be.equal(BigInt(6) * BigInt(hour));

                await expect(
                    this.TizzTradingPriceFeedManager.updateRequestsEvery(
                        30 * minute
                    )
                ).to.be.revertedWith("BELOW_MIN");

                await expect(
                    this.TizzTradingPriceFeedManager.updateRequestsEvery(
                        3 * day
                    )
                ).to.be.revertedWith("ABOVE_MAX");

                const newRequestsEvery = hour * 2;
                await expect(
                    this.TizzTradingPriceFeedManager.updateRequestsEvery(
                        newRequestsEvery
                    )
                )
                    .to.be.emit(
                        this.TizzTradingPriceFeedManager,
                        "NumberParamUpdated"
                    )
                    .withArgs("requestsEvery", newRequestsEvery);

                expect(
                    BigInt(
                        await this.TizzTradingPriceFeedManager.requestsEvery()
                    )
                ).to.be.equal(BigInt(newRequestsEvery));
            });

            it("updateRequestsCount", async function () {
                expect(
                    Number(
                        BigInt(
                            await this.TizzTradingPriceFeedManager.requestsCount()
                        )
                    )
                ).to.be.equal(Number(4));

                await expect(
                    this.TizzTradingPriceFeedManager.updateRequestsCount(2)
                ).to.be.revertedWith("BELOW_MIN");

                await expect(
                    this.TizzTradingPriceFeedManager.updateRequestsCount(12)
                ).to.be.revertedWith("ABOVE_MAX");

                const newRequestsCount = 3;
                await expect(
                    this.TizzTradingPriceFeedManager.updateRequestsCount(
                        newRequestsCount
                    )
                )
                    .to.be.emit(
                        this.TizzTradingPriceFeedManager,
                        "NumberParamUpdated"
                    )
                    .withArgs("requestsCount", newRequestsCount);

                expect(
                    BigInt(
                        await this.TizzTradingPriceFeedManager.requestsCount()
                    )
                ).to.be.equal(BigInt(newRequestsCount));
            });

            it("updateRequestsInfoBatch", async function () {
                const [start, every, count] = [day, 2 * hour, 3];
                await this.TizzTradingPriceFeedManager.updateRequestsInfoBatch(
                    start,
                    every,
                    count
                );

                expect(
                    Number(
                        await this.TizzTradingPriceFeedManager.requestsStart()
                    )
                ).to.be.equal(Number(start));
                expect(
                    Number(
                        await this.TizzTradingPriceFeedManager.requestsEvery()
                    )
                ).to.be.equal(Number(every));
                expect(
                    Number(
                        await this.TizzTradingPriceFeedManager.requestsCount()
                    )
                ).to.be.equal(Number(count));
            });

            it("transferOwnership", async function () {
                let curOwner = await this.TizzTradingPriceFeedManager.owner();
                expect(curOwner).to.be.equal(this.deployer.address);
                await this.TizzTradingPriceFeedManager.transferOwnership(
                    this.owner.address
                );
                expect(
                    await this.TizzTradingPriceFeedManager.owner()
                ).to.be.equal(this.owner.address);
            });

            it("updatePullAddress & updateStorageAddress", async function () {
                const [originPull, originStorage] = [
                    await this.TizzTradingPriceFeedManager.supra_pull(),
                    await this.TizzTradingPriceFeedManager.supra_storage(),
                ];
                await this.TizzTradingPriceFeedManager.updatePullAddress(
                    this.oraclePull.address
                );
                expect(
                    await this.TizzTradingPriceFeedManager.supra_pull()
                ).to.be.equal(this.oraclePull.address);

                await this.TizzTradingPriceFeedManager.updateStorageAddress(
                    this.oracleStorage.address
                );
                expect(
                    await this.TizzTradingPriceFeedManager.supra_storage()
                ).to.be.equal(this.oracleStorage.address);

                await this.TizzTradingPriceFeedManager.updatePullAddress(
                    originPull
                );
                await this.TizzTradingPriceFeedManager.updateStorageAddress(
                    originStorage
                );
            });

            it("newOpenPnlRequestOrEpoch(first)", async function () {
                let bytesProof = getOpenPnlProofBytes();
                const nextEpochValuesLastRequest =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesLastRequest();
                expect(Number(nextEpochValuesLastRequest)).to.be.equal(
                    Number(0)
                );

                await expect(
                    this.TizzTradingPriceFeedManager.newOpenPnlRequestOrEpoch(
                        bytesProof
                    )
                ).to.be.revertedWith("TOO_EARLY");

                await spendTime(day);

                let beforeRequestCount =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesRequestCount();
                let beforeLastRequestId =
                    await this.TizzTradingPriceFeedManager.lastRequestId();
                let beforeLastRequestTime =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesLastRequest();
                let beforeValues =
                    await this.TizzTradingPriceFeedManager.getNextEpochValues();

                await expect(
                    this.TizzTradingPriceFeedManager.newOpenPnlRequestOrEpoch(
                        bytesProof
                    )
                ).to.be.emit(
                    this.TizzTradingPriceFeedManager,
                    "RequestMedianValueSet"
                );

                let afterRequestCount =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesRequestCount();
                let afterLastRequestId =
                    await this.TizzTradingPriceFeedManager.lastRequestId();
                let afterLastRequestTime =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesLastRequest();
                let afterValues =
                    await this.TizzTradingPriceFeedManager.getNextEpochValues();

                expect(
                    Number(afterRequestCount) - Number(beforeRequestCount)
                ).to.be.equal(Number(1));
                expect(
                    Number(afterLastRequestId) - Number(beforeLastRequestId)
                ).to.be.equal(Number(1));
                expect(
                    Number(afterLastRequestTime) - Number(beforeLastRequestTime)
                ).to.be.greaterThan(Number(0));
                expect(afterValues.length - beforeValues.length).to.be.equal(1);
            });

            it("newOpenPnlRequestOrEpoch(second)", async function () {
                let bytesProof = getOpenPnlProofBytes();

                await expect(
                    this.TizzTradingPriceFeedManager.newOpenPnlRequestOrEpoch(
                        bytesProof
                    )
                ).to.be.revertedWith("TOO_EARLY");

                let beforeRequestCount =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesRequestCount();
                let beforeLastRequestId =
                    await this.TizzTradingPriceFeedManager.lastRequestId();
                let beforeLastRequestTime =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesLastRequest();
                let beforeValues =
                    await this.TizzTradingPriceFeedManager.getNextEpochValues();

                await spendTime(day);
                await expect(
                    this.TizzTradingPriceFeedManager.newOpenPnlRequestOrEpoch(
                        bytesProof
                    )
                ).to.be.emit(
                    this.TizzTradingPriceFeedManager,
                    "RequestMedianValueSet"
                );

                let afterRequestCount =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesRequestCount();
                let afterLastRequestId =
                    await this.TizzTradingPriceFeedManager.lastRequestId();
                let afterLastRequestTime =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesLastRequest();
                let afterValues =
                    await this.TizzTradingPriceFeedManager.getNextEpochValues();

                expect(
                    Number(afterRequestCount) - Number(beforeRequestCount)
                ).to.be.equal(Number(1));
                expect(
                    Number(afterLastRequestId) - Number(beforeLastRequestId)
                ).to.be.equal(Number(1));
                expect(
                    Number(afterLastRequestTime) - Number(beforeLastRequestTime)
                ).to.be.greaterThan(Number(0));
                expect(afterValues.length - beforeValues.length).to.be.equal(1);

                await spendTime(day);
                await this.TizzTradingPriceFeedManager.newOpenPnlRequestOrEpoch(
                    bytesProof
                );
            });

            it("newOpenPnlRequestOrEpoch(over max)", async function () {
                let bytesProof = getOpenPnlProofBytes();

                await expect(
                    this.TizzTradingPriceFeedManager.newOpenPnlRequestOrEpoch(
                        bytesProof
                    )
                ).to.be.revertedWith("TOO_EARLY");

                let beforeEpoch = await this.TizzVaultToken.currentEpoch();
                let beforeEpochStart =
                    await this.TizzVaultToken.currentEpochStart();
                await spendTime(day);
                await expect(
                    this.TizzTradingPriceFeedManager.newOpenPnlRequestOrEpoch(
                        bytesProof
                    )
                ).to.be.emit(this.TizzTradingPriceFeedManager, "NewEpoch");
                let afterEpoch = await this.TizzVaultToken.currentEpoch();
                let afterEpochStart =
                    await this.TizzVaultToken.currentEpochStart();

                let afterRequestCount =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesRequestCount();
                let afterLastRequestTime =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesLastRequest();

                expect(afterRequestCount).to.be.equal(0);
                expect(afterLastRequestTime).to.be.equal(0);
                expect(Number(afterEpoch) - Number(beforeEpoch)).to.be.equal(
                    Number(1)
                );
                expect(
                    Number(afterEpochStart) - Number(beforeEpochStart)
                ).to.be.greaterThan(Number(0));
            });

            it("forceNewEpoch", async function () {
                await expect(
                    this.TizzTradingPriceFeedManager.forceNewEpoch()
                ).to.be.revertedWith("TOO_EARLY");

                await spendTime(2 * day);
                let beforeEpoch = await this.TizzVaultToken.currentEpoch();
                let beforeEpochStart =
                    await this.TizzVaultToken.currentEpochStart();
                await expect(
                    this.TizzTradingPriceFeedManager.forceNewEpoch()
                ).to.be.emit(
                    this.TizzTradingPriceFeedManager,
                    "NewEpochForced"
                );
                let afterEpoch = await this.TizzVaultToken.currentEpoch();
                let afterEpochStart =
                    await this.TizzVaultToken.currentEpochStart();

                let afterRequestCount =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesRequestCount();
                let afterLastRequestTime =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesLastRequest();

                expect(afterRequestCount).to.be.equal(0);
                expect(afterLastRequestTime).to.be.equal(0);
                expect(Number(afterEpoch) - Number(beforeEpoch)).to.be.equal(
                    Number(1)
                );
                expect(
                    Number(afterEpochStart) - Number(beforeEpochStart)
                ).to.be.greaterThan(Number(0));
            });

            it("resetNextEpochValueRequests", async function () {
                let bytesProof = getOpenPnlProofBytes();
                await expect(
                    this.TizzTradingPriceFeedManager.connect(
                        this.admin
                    ).resetNextEpochValueRequests()
                ).to.be.revertedWith("NO_REQUEST_TO_RESET");

                await spendTime(day);
                await this.TizzTradingPriceFeedManager.newOpenPnlRequestOrEpoch(
                    bytesProof
                );

                await expect(
                    this.TizzTradingPriceFeedManager.connect(
                        this.admin
                    ).resetNextEpochValueRequests()
                ).to.be.emit(
                    this.TizzTradingPriceFeedManager,
                    "NextEpochValuesReset"
                );

                let epochValues =
                    await this.TizzTradingPriceFeedManager.getNextEpochValues();
                let requestStart =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesRequestCount();
                let lastRequest =
                    await this.TizzTradingPriceFeedManager.nextEpochValuesLastRequest();

                expect(epochValues.length).to.be.equal(0);
                expect(requestStart).to.be.equal(0);
                expect(lastRequest).to.be.equal(0);
            });
        });
    });

    describe("Test with Native", function () {
        it("fork tokens, whales and ensure the funds", async function () {
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [WETHWhaleAddr],
            });
            this.WETHWhale = await ethers.getSigner(WETHWhaleAddr);

            this.WETH = new ethers.Contract(
                WETHTokenAddress,
                ERC20ABI,
                this.deployer
            );

            let WETHBalance = await this.WETH.balanceOf(this.WETHWhale.address);
            await this.WETH.connect(this.WETHWhale).transfer(
                this.deployer.address,
                BigInt(WETHBalance)
            );
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

        it("deposit ETH and check", async function () {
            let depositAmount = bigNum(100, 18);
            let vaultAmount = await this.TizzVaultToken.previewDeposit(
                BigInt(depositAmount)
            );

            let beforeVaultAmount = await this.TizzVaultToken.balanceOf(
                this.deployer.address
            );
            await this.WETH.approve(
                this.TizzVaultToken.address,
                BigInt(depositAmount)
            );
            await this.TizzVaultToken.deposit(
                BigInt(depositAmount),
                this.deployer.address
            );
            let afterVaultAmount = await this.TizzVaultToken.balanceOf(
                this.deployer.address
            );
            expect(
                smallNum(
                    BigInt(afterVaultAmount) - BigInt(beforeVaultAmount),
                    18
                )
            ).to.be.equal(smallNum(vaultAmount, 18));
        });

        describe("TizzTrading", function () {
            describe("OpenTrade/CloseTrade with supra", function () {
                it("OpenTrade as MARKET mode and check", async function () {
                    let ethAmount = bigNum(30, 18);
                    let tradeInfo = {
                        trader: this.trader_1.address,
                        pairIndex: 1,
                        index: 0,
                        initialPosToken: 0,
                        positionSizeBaseAsset: BigInt(ethAmount),
                        openPrice: "1799516666600", // $179.95
                        buy: true,
                        leverage: 20,
                        tp: "1809516666600", // $180.95 take profit
                        sl: "1199486607100", // $119.94 stop loss
                    };
                    let orderType = 0; // MARKET
                    let referrer = ethers.constants.AddressZero;
                    let slippageP = 10000000000; // 1%
                    let predictIndex =
                        await this.TizzTradingStorage.firstEmptyOpenLimitIndex(
                            this.trader_1.address,
                            tradeInfo.pairIndex
                        );
                    expect(predictIndex).to.be.equal(0);

                    let currentOrderId =
                        await this.TizzMultiCollatDiamond.currentOrderId();
                    let bytesProof = getProofBytes();
                    await this.TizzPriceAggregator.GetPairPrice(bytesProof, 65);
                    let openPrice = await this.TizzPriceAggregator.getPriceUsd(
                        65
                    );
                    let delta = bigNum(6, 10);
                    tradeInfo.openPrice = openPrice;
                    tradeInfo.tp =
                        BigInt(openPrice) + BigInt(delta) * BigInt(5);
                    tradeInfo.sl = BigInt(openPrice) - BigInt(delta);
                    await expect(
                        this.TizzTrading.connect(this.trader_1).openTrade(
                            tradeInfo,
                            orderType,
                            slippageP,
                            referrer,
                            bytesProof,
                            { value: BigInt(ethAmount) }
                        )
                    )
                        .to.be.emit(this.TizzTrading, "MarketOrderInitiated")
                        .withArgs(
                            currentOrderId,
                            this.trader_1.address,
                            tradeInfo.pairIndex,
                            true
                        );

                    console.log("currentOrderId: ", currentOrderId);

                    let openTradesCount =
                        await this.TizzTradingStorage.openTradesCount(
                            this.trader_1.address,
                            tradeInfo.pairIndex
                        );

                    expect(BigInt(openTradesCount)).to.be.equal(BigInt(1));
                    console.log("predictIndex: ", predictIndex);
                    let storeTrade = await this.TizzTradingStorage.openTrades(
                        this.trader_1.address,
                        tradeInfo.pairIndex,
                        predictIndex
                    );
                    expect(storeTrade.trader).to.be.equal(
                        this.trader_1.address
                    );

                    const tradeData = await this.TizzTradingCallbacks.tradeData(
                        this.trader_1.address,
                        tradeInfo.pairIndex,
                        predictIndex,
                        orderType
                    );

                    expect(
                        smallNum(tradeData.collateralPriceUsd, 10)
                    ).to.be.equal(
                        smallNum(
                            await this.TizzPriceAggregator.getCollateralPriceUsd(),
                            10
                        )
                    );
                });

                it("CloseTrade", async function () {
                    let pairIndex = 1;
                    let index = 0;
                    let bytesProof = getProofBytes();
                    let trade = await this.TizzTradingStorage.openTrades(
                        this.trader_1.address,
                        pairIndex,
                        index
                    );
                    console.log(
                        "openPrice & leverage: ",
                        smallNum(trade.openPrice, 10),
                        trade.leverage
                    );

                    expect(trade.trader).to.be.equal(this.trader_1.address);

                    let tradeInfo =
                        await this.TizzTradingStorage.openTradesInfo(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                    expect(tradeInfo.beingMarketClosed).to.be.equal(false);
                    let currentOrderId =
                        await this.TizzMultiCollatDiamond.currentOrderId();

                    let beforeOpenTradesCount =
                        await this.TizzTradingStorage.openTradesCount(
                            this.trader_1.address,
                            pairIndex
                        );

                    await expect(
                        this.TizzTrading.connect(
                            this.trader_1
                        ).closeTradeMarket(pairIndex, index, bytesProof)
                    )
                        .to.be.emit(this.TizzTrading, "MarketOrderInitiated")
                        .withArgs(
                            currentOrderId,
                            this.trader_1.address,
                            pairIndex,
                            false
                        );

                    let afterOpenTradesCount =
                        await this.TizzTradingStorage.openTradesCount(
                            this.trader_1.address,
                            pairIndex
                        );

                    expect(
                        Number(beforeOpenTradesCount) -
                            Number(afterOpenTradesCount)
                    ).to.be.equal(1);

                    // TODO: build more test script to check received token as rewards.
                });

                it("OpenTrade as MOMENTUM mode and check", async function () {
                    let ethAmount = bigNum(30, 18);

                    let tradeInfo = {
                        trader: this.trader_1.address,
                        pairIndex: 1,
                        index: 0,
                        initialPosToken: 0,
                        positionSizeBaseAsset: BigInt(ethAmount),
                        openPrice: "1799516666600", // $179.95
                        buy: true,
                        leverage: 18,
                        tp: "1809516666600", // $180.95 take profit
                        sl: "1199486607100", // $119.94 stop loss
                    };
                    let orderType = 2; // MEMENTIUM
                    let referrer = ethers.constants.AddressZero;
                    let slippageP = 10000000000; // 1%

                    let predictIndex =
                        await this.TizzTradingStorage.firstEmptyOpenLimitIndex(
                            this.trader_1.address,
                            tradeInfo.pairIndex
                        );

                    let bytesProof = getProofBytes();
                    await expect(
                        this.TizzTrading.connect(this.trader_1).openTrade(
                            tradeInfo,
                            orderType,
                            slippageP,
                            referrer,
                            bytesProof,
                            { value: BigInt(ethAmount) }
                        )
                    )
                        .to.be.emit(this.TizzTrading, "OpenLimitPlaced")
                        .withArgs(
                            this.trader_1.address,
                            tradeInfo.pairIndex,
                            predictIndex
                        );

                    let openLimitOrderCount =
                        await this.TizzTradingStorage.openLimitOrdersCount(
                            this.trader_1.address,
                            tradeInfo.pairIndex
                        );

                    expect(BigInt(openLimitOrderCount)).to.be.equal(BigInt(1));

                    tradeInfo = {
                        trader: this.trader.address,
                        pairIndex: 1,
                        index: 0,
                        initialPosToken: 0,
                        positionSizeBaseAsset: BigInt(ethAmount),
                        openPrice: "1799516666600", // $179.95
                        buy: true,
                        leverage: 10,
                        tp: "1809516666600", // $180.95 take profit
                        sl: "1199486607100", // $119.94 stop loss
                    };

                    await this.TizzTrading.connect(this.trader).openTrade(
                        tradeInfo,
                        orderType,
                        slippageP,
                        referrer,
                        bytesProof,
                        { value: BigInt(ethAmount) }
                    );
                });

                it("OpenTrade as MARKET mode for testing", async function () {
                    let ethAmount = bigNum(50, 18);

                    let tradeInfo = {
                        trader: this.trader.address,
                        pairIndex: 1,
                        index: 0,
                        initialPosToken: 0,
                        positionSizeBaseAsset: BigInt(ethAmount),
                        openPrice: "1799516666600", // $179.95
                        buy: true,
                        leverage: 15,
                        tp: "1809516666600", // $180.95 take profit
                        sl: "1199486607100", // $119.94 stop loss
                    };
                    let orderType = 0; // MARKET
                    let referrer = ethers.constants.AddressZero;
                    let slippageP = 10000000000; // 1%
                    let bytesProof = getProofBytes();

                    await this.TizzPriceAggregator.GetPairPrice(bytesProof, 65);
                    let openPrice = await this.TizzPriceAggregator.getPriceUsd(
                        65
                    );
                    let delta = bigNum(6, 10);
                    tradeInfo.openPrice = BigInt(openPrice);
                    tradeInfo.tp =
                        BigInt(openPrice) + BigInt(delta) * BigInt(5);
                    tradeInfo.sl = BigInt(openPrice) - BigInt(delta);

                    await this.TizzTrading.connect(this.trader_1).openTrade(
                        tradeInfo,
                        orderType,
                        slippageP,
                        referrer,
                        bytesProof,
                        { value: BigInt(ethAmount) }
                    );
                });
            });

            describe("Update SL and TP", function () {
                describe("update SL", function () {
                    it("reverts if callers has not trades", async function () {
                        let pairIndex = 1;
                        let index = 0;
                        let newSl = "1199486607100";
                        await expect(
                            this.TizzTrading.connect(this.trader).updateSl(
                                pairIndex,
                                index,
                                newSl
                            )
                        ).to.be.revertedWith("NO_TRADE");
                    });
                    it("update SL and check", async function () {
                        let pairIndex = 1;
                        let index = 0;
                        let newSl = "1759486607100";
                        let storeTrade =
                            await this.TizzTradingStorage.openTrades(
                                this.trader_1.address,
                                pairIndex,
                                index
                            );
                        expect(storeTrade.trader).to.be.equal(
                            this.trader_1.address
                        );
                        expect(BigInt(storeTrade.sl)).to.be.not.equal(
                            BigInt(newSl)
                        );
                        await this.TizzTrading.connect(this.trader_1).updateSl(
                            pairIndex,
                            index,
                            newSl
                        );
                        storeTrade = await this.TizzTradingStorage.openTrades(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                        expect(BigInt(storeTrade.sl)).to.be.equal(
                            BigInt(newSl)
                        );
                    });
                });
                describe("update TP", function () {
                    it("reverts if callers has not trades", async function () {
                        let pairIndex = 1;
                        let index = 0;
                        let newTp = "1819516666600";
                        await expect(
                            this.TizzTrading.connect(this.trader).updateTp(
                                pairIndex,
                                index,
                                newTp
                            )
                        ).to.be.revertedWith("NO_TRADE");
                    });
                    it("update TP and check", async function () {
                        let pairIndex = 1;
                        let index = 0;
                        let newTp = "1819516666600";
                        let storeTrade =
                            await this.TizzTradingStorage.openTrades(
                                this.trader_1.address,
                                pairIndex,
                                index
                            );
                        expect(storeTrade.trader).to.be.equal(
                            this.trader_1.address
                        );
                        expect(BigInt(storeTrade.tp)).to.be.not.equal(
                            BigInt(newTp)
                        );
                        await this.TizzTrading.connect(this.trader_1).updateTp(
                            pairIndex,
                            index,
                            newTp
                        );
                        storeTrade = await this.TizzTradingStorage.openTrades(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                        expect(BigInt(storeTrade.tp)).to.be.equal(
                            BigInt(newTp)
                        );
                    });
                });
            });
            describe("cancel and update OpenLimitOrder", function () {
                it("updateOpenLimitOrder", async function () {
                    let pairIndex = 1;
                    let index = 0;

                    expect(
                        await this.TizzTradingStorage.hasOpenLimitOrder(
                            this.trader_1.address,
                            pairIndex,
                            index
                        )
                    ).to.be.equal(true);
                    let price = "1242500000000";
                    let tp = "1255508928571";
                    let sl = "1200486607142";
                    let maxSlippage = "10000000000";
                    await expect(
                        this.TizzTrading.connect(
                            this.trader_1
                        ).updateOpenLimitOrder(
                            pairIndex,
                            index,
                            BigInt(price),
                            BigInt(tp),
                            BigInt(sl),
                            BigInt(maxSlippage)
                        )
                    )
                        .to.be.emit(this.TizzTrading, "OpenLimitUpdated")
                        .withArgs(
                            this.trader_1.address,
                            pairIndex,
                            index,
                            BigInt(price),
                            BigInt(tp),
                            BigInt(sl),
                            maxSlippage
                        );
                    let orderId =
                        await this.TizzTradingStorage.openLimitOrderIds(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                    let openLimitOrder =
                        await this.TizzTradingStorage.openLimitOrders(orderId);
                    expect(
                        BigInt(openLimitOrder.orderTradeInfo.minPrice)
                    ).to.be.equal(BigInt(price));
                    expect(
                        BigInt(openLimitOrder.orderTradeInfo.maxPrice)
                    ).to.be.equal(BigInt(price));
                    expect(
                        BigInt(openLimitOrder.orderTradeInfo.tp)
                    ).to.be.equal(BigInt(tp));
                    expect(
                        BigInt(openLimitOrder.orderTradeInfo.sl)
                    ).to.be.equal(BigInt(sl));
                    let tradeType = 1; // LIMIT
                    let lastUpdatedTrade =
                        await this.TizzTradingCallbacks.tradeLastUpdated(
                            this.trader_1.address,
                            pairIndex,
                            index,
                            tradeType
                        );
                    let lastBlock = await ethers.provider.getBlock("latest");
                    let lastBlockNumber = lastBlock.number;
                    expect(BigInt(lastUpdatedTrade.created)).to.be.equal(
                        BigInt(lastBlockNumber)
                    );
                    let trade = await this.TizzTradingCallbacks.tradeData(
                        this.trader_1.address,
                        pairIndex,
                        index,
                        tradeType
                    );
                    expect(BigInt(trade.maxSlippageP)).to.be.equal(
                        BigInt(maxSlippage)
                    );
                });

                it("cancelOpenLimitOrder", async function () {
                    let pairIndex = 1;
                    let index = 0;
                    let openLimitOrder =
                        await this.TizzTradingStorage.getOpenLimitOrder(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                    let beforeOpenLimitOrders =
                        await this.TizzTradingStorage.getOpenLimitOrders();
                    let lastOpenLimitOrder =
                        await this.TizzTradingStorage.openLimitOrders(
                            beforeOpenLimitOrders.length - 1
                        );
                    let positionSize = openLimitOrder.positionSize;
                    let orderId =
                        await this.TizzTradingStorage.openLimitOrderIds(
                            this.trader_1.address,
                            pairIndex,
                            index
                        );
                    let beforeETHBal = await getETHBalance(
                        this.trader_1.address
                    );
                    let beforeOpenLimitOrderCnt =
                        await this.TizzTradingStorage.openLimitOrdersCount(
                            this.trader_1.address,
                            pairIndex
                        );
                    await expect(
                        this.TizzTrading.connect(
                            this.trader_1
                        ).cancelOpenLimitOrder(pairIndex, index)
                    )
                        .to.be.emit(this.TizzTrading, "OpenLimitCanceled")
                        .withArgs(this.trader_1.address, pairIndex, index);
                    let afterOpenLimitOrders =
                        await this.TizzTradingStorage.getOpenLimitOrders();
                    let afterETHBal = await getETHBalance(
                        this.trader_1.address
                    );
                    let afterOpenLimitOrderCnt =
                        await this.TizzTradingStorage.openLimitOrdersCount(
                            this.trader_1.address,
                            pairIndex
                        );
                    let updatedOpenLimitOrderId =
                        await this.TizzTradingStorage.openLimitOrderIds(
                            lastOpenLimitOrder.trader,
                            lastOpenLimitOrder.pairIndex,
                            lastOpenLimitOrder.index
                        );
                    expect(updatedOpenLimitOrderId).to.be.equal(orderId);
                    expect(
                        smallNum(BigInt(afterETHBal) - BigInt(beforeETHBal), 18)
                    ).to.be.closeTo(smallNum(positionSize, 18), 0.001);
                    expect(
                        beforeOpenLimitOrders.length -
                            afterOpenLimitOrders.length
                    ).to.be.equal(1);
                    expect(
                        beforeOpenLimitOrderCnt - afterOpenLimitOrderCnt
                    ).to.be.equal(1);
                });
            });

            describe("triggerOrder", function () {
                it("pack", async function () {
                    let pairIndex = 1;
                    let index = 0;
                    let orderType = 3; // OPEN
                    expect(
                        await this.TizzTradingStorage.hasOpenLimitOrder(
                            this.trader.address,
                            1,
                            0
                        )
                    ).to.be.equal(true);
                    let packed = await this.PackingUtils.packTriggerOrder(
                        orderType,
                        BigInt(this.trader.address),
                        pairIndex,
                        index,
                        0,
                        0
                    );
                    console.log("packed: ", packed);

                    let predictOrderId =
                        await this.TizzMultiCollatDiamond.currentOrderId();

                    let bytesProof = getProofBytes();
                    await expect(
                        this.TizzTrading.triggerOrder(
                            BigInt(packed),
                            bytesProof
                        )
                    )
                        .to.be.emit(this.TizzTrading, "OrderTriggered")
                        .withArgs(
                            predictOrderId,
                            this.trader.address,
                            pairIndex,
                            orderType
                        );
                });
            });
        });
    });
});
