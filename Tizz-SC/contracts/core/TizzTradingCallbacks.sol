// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Initializable} from "../external/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../interfaces/ITizzTradingCallbacks.sol";
import "../interfaces/ITizzVaultToken.sol";
import "../interfaces/ITizzStaking.sol";
import "../interfaces/ITizzFundingFees.sol";
import "../interfaces/ITizzEscrow.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/ITizzMultiCollatDiamond.sol";

import "../libraries/ChainUtils.sol";
import "../libraries/TradingCallbacksUtils.sol";
import "../libraries/CollateralUtils.sol";

/**
 * @custom:version 7
 * @custom:oz-upgrades-unsafe-allow external-library-linking
 */
contract TizzTradingCallbacks is Initializable, ITizzTradingCallbacks {
    // Contracts (constant)
    ITizzTradingStorage public storageT;
    ITizzEscrow public tizzEscrow;
    ITizzStaking public staking;

    // Params (constant)
    uint256 private constant PRECISION = 1e10; // 10 decimals

    // Params (adjustable)
    uint256 public baseAssetVaultFeeP; // % of closing fee going to BaseAsset vault (eg. 40)
    uint256 public lpFeeP; // % of closing fee going to Tizz/BaseAsset LPs (eg. 20)
    uint256 public sssFeeP; // % of closing fee going to Tizz staking (eg. 40)

    // State
    bool public isPaused; // Prevent opening new trades
    bool public isDone; // Prevent any interaction with the contract

    // Last Updated State
    mapping(address => mapping(uint256 => mapping(uint256 => mapping(TradeType => LastUpdated))))
        public tradeLastUpdated; // Block numbers for last updated

    // v6.3.2 Storage
    ITizzFundingFees public fundingFees;

    // v6.4 Storage
    mapping(address => mapping(uint256 => mapping(uint256 => mapping(TradeType => TradeData))))
        public tradeData; // More storage for trades / limit orders

    // v6.4.1 Storage
    uint256 public govFeesBaseAsset; // 1e18 | 1e6

    // v7 Storage
    CollateralUtils.CollateralConfig public collateralConfig;
    ITizzMultiCollatDiamond public multiCollatDiamond;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        ITizzTradingStorage _storageT,
        ITizzStaking _staking,
        ITizzEscrow _tizzEscrow,
        uint256 _baseAssetVaultFeeP,
        uint256 _lpFeeP,
        uint256 _sssFeeP
    ) external initializer {
        if (
            !(address(_storageT) != address(0) &&
                address(_staking) != address(0) &&
                address(_tizzEscrow) != address(0) &&
                _baseAssetVaultFeeP + _lpFeeP + _sssFeeP == 100)
        ) {
            revert WrongParams();
        }

        storageT = _storageT;
        staking = _staking;
        tizzEscrow = _tizzEscrow;

        baseAssetVaultFeeP = _baseAssetVaultFeeP;
        lpFeeP = _lpFeeP;
        sssFeeP = _sssFeeP;

        IERC20 t = IERC20(storageT.baseAsset());
        t.approve(address(staking), type(uint256).max);
    }

    function initializeV2(
        ITizzFundingFees _fundingFees,
        address vaultToApprove
    ) external reinitializer(2) {
        if (
            address(_fundingFees) == address(0) || vaultToApprove == address(0)
        ) {
            revert WrongParams();
        }
        fundingFees = _fundingFees;
        IERC20 t = IERC20(storageT.baseAsset());
        t.approve(vaultToApprove, type(uint256).max);
    }

    // skip v3 to be synced with testnet
    function initializeV4(ITizzStaking _staking) external reinitializer(4) {
        if (!(address(_staking) != address(0))) {
            revert WrongParams();
        }

        IERC20 t = IERC20(storageT.baseAsset());
        t.approve(address(staking), 0); // revoke old staking contract
        t.approve(address(_staking), type(uint256).max); // approve new staking contract

        staking = _staking;
    }

    // skip v5 as it was used to set trading diamond address
    function initializeV6(
        ITizzMultiCollatDiamond _multiCollatDiamond
    ) external reinitializer(6) {
        if (address(_multiCollatDiamond) == address(0)) {
            revert WrongParams();
        }

        collateralConfig = CollateralUtils.getCollateralConfig(
            storageT.baseAsset()
        );
        multiCollatDiamond = _multiCollatDiamond;
    }

    // Modifiers
    modifier onlyGov() {
        _isGov();
        _;
    }
    modifier onlyPriceAggregator() {
        _isPriceAggregator();
        _;
    }
    modifier notDone() {
        _isNotDone();
        _;
    }
    modifier onlyTrading() {
        _isTrading();
        _;
    }

    // Saving code size by calling these functions inside modifiers
    function _isGov() private view {
        if (
            !multiCollatDiamond.hasRole(msg.sender, IAddressStoreUtils.Role.GOV)
        ) {
            revert Forbidden();
        }
    }

    function _isPriceAggregator() private view {
        if (
            !multiCollatDiamond.hasRole(
                msg.sender,
                IAddressStoreUtils.Role.AGGREGATOR
            )
        ) {
            revert Forbidden();
        }
    }

    function _isNotDone() private view {
        if (isDone) {
            revert Forbidden();
        }
    }

    function _isTrading() private view {
        if (
            !multiCollatDiamond.hasRole(
                msg.sender,
                IAddressStoreUtils.Role.TRADING
            )
        ) {
            revert Forbidden();
        }
    }

    function setClosingFeeSharesP(
        uint256 _baseAssetVaultFeeP,
        uint256 _lpFeeP,
        uint256 _sssFeeP
    ) external onlyGov {
        if (_baseAssetVaultFeeP + _lpFeeP + _sssFeeP != 100) {
            revert WrongParams();
        }

        baseAssetVaultFeeP = _baseAssetVaultFeeP;
        lpFeeP = _lpFeeP;
        sssFeeP = _sssFeeP;

        emit ClosingFeeSharesPUpdated(_baseAssetVaultFeeP, _lpFeeP, _sssFeeP);
    }

    // Manage state
    function pause() external onlyGov {
        isPaused = !isPaused;

        emit Pause(isPaused);
    }

    function done() external onlyGov {
        isDone = !isDone;

        emit Done(isDone);
    }

    // Claim fees
    function claimGovFees() external onlyGov {
        uint256 valueBaseAsset = govFeesBaseAsset;
        govFeesBaseAsset = 0;

        valueBaseAsset = _transferFromStorageToAddress(
            storageT.gov(),
            valueBaseAsset
        );

        emit GovFeesClaimed(valueBaseAsset);
    }

    // Callbacks
    function openTradeMarketCallback(
        AggregatorAnswer memory a,
        ITizzTradingStorage.PendingMarketOrder memory o
    ) external onlyPriceAggregator notDone {
        ITizzTradingStorage.Trade memory t = o.trade;

        (
            uint256 priceImpactP,
            uint256 priceAfterImpact,
            CancelReason cancelReason
        ) = TradingCallbacksUtils.openTradePrep(
                OpenTradePrepInput(
                    isPaused,
                    a.price,
                    o.wantedPrice,
                    a.price,
                    a.spreadP,
                    t.buy,
                    t.pairIndex,
                    t.positionSizeBaseAsset,
                    t.leverage,
                    o.slippageP,
                    t.tp,
                    t.sl
                ),
                fundingFees,
                storageT,
                multiCollatDiamond,
                _getPriceAggregator()
            );

        t.openPrice = priceAfterImpact;

        if (cancelReason == CancelReason.NONE) {
            RegisterTradeOutput memory output = _registerTrade(t, false);

            emit MarketExecuted(
                a.orderId,
                output.finalTrade,
                true,
                output.finalTrade.openPrice,
                priceImpactP,
                _convertTokenToCollateral(
                    output.finalTrade.initialPosToken,
                    output.collateralPrecisionDelta,
                    output.tokenPriceBaseAsset
                ),
                0,
                0,
                output.collateralPriceUsd
            );
        } else {
            // Gov fee to pay for oracle cost
            _updateTraderPoints(t.trader, 0, t.pairIndex);
            uint256 govFees = _handleGovFees(
                t.trader,
                t.pairIndex,
                t.positionSizeBaseAsset * t.leverage,
                true
            );
            _transferFromStorageToAddress(
                t.trader,
                t.positionSizeBaseAsset - govFees
            );

            emit MarketOpenCanceled(
                a.orderId,
                t.trader,
                t.pairIndex,
                cancelReason
            );
        }
    }

    function closeTradeMarketCallback(
        AggregatorAnswer memory a,
        ITizzTradingStorage.PendingMarketOrder memory o
    ) external onlyPriceAggregator notDone {
        ITizzTradingStorage.Trade memory t = _getOpenTrade(
            o.trade.trader,
            o.trade.pairIndex,
            o.trade.index
        );

        CancelReason cancelReason = t.leverage == 0
            ? CancelReason.NO_TRADE
            : (a.price == 0 ? CancelReason.MARKET_CLOSED : CancelReason.NONE);

        if (cancelReason != CancelReason.NO_TRADE) {
            ITizzTradingStorage.TradeInfo memory i = _getOpenTradeInfo(
                t.trader,
                t.pairIndex,
                t.index
            );
            ITizzPriceAggregator aggregator = _getPriceAggregator();

            Values memory v;
            v.collateralPrecisionDelta = collateralConfig.precisionDelta;
            v.levPosBaseAsset = _convertTokenToCollateral(
                t.initialPosToken * t.leverage,
                v.collateralPrecisionDelta,
                i.tokenPriceBaseAsset
            );
            v.tokenPriceBaseAsset = aggregator.getCollateralPriceUsd();

            if (cancelReason == CancelReason.NONE) {
                v.profitP = TradingCallbacksUtils.currentPercentProfit(
                    t.openPrice,
                    a.price,
                    t.buy,
                    t.leverage
                );
                v.posBaseAsset = v.levPosBaseAsset / t.leverage;

                v.baseAssetSentToTrader = _unregisterTrade(
                    t,
                    true,
                    v.profitP,
                    v.posBaseAsset,
                    i.openInterestBaseAsset,
                    (v.levPosBaseAsset *
                        multiCollatDiamond.pairCloseFeeP(t.pairIndex)) /
                        100 /
                        PRECISION,
                    (v.levPosBaseAsset *
                        multiCollatDiamond.pairNftLimitOrderFeeP(t.pairIndex)) /
                        100 /
                        PRECISION
                );

                emit MarketExecuted(
                    a.orderId,
                    t,
                    false,
                    a.price,
                    0,
                    v.posBaseAsset,
                    v.profitP,
                    v.baseAssetSentToTrader,
                    _getCollateralPriceUsd(aggregator)
                );
            } else {
                // Gov fee to pay for oracle cost
                _updateTraderPoints(t.trader, 0, t.pairIndex);
                uint256 govFee = _handleGovFees(
                    t.trader,
                    t.pairIndex,
                    v.levPosBaseAsset,
                    t.positionSizeBaseAsset > 0
                );
                t.initialPosToken -= _convertCollateralToToken(
                    govFee,
                    v.collateralPrecisionDelta,
                    i.tokenPriceBaseAsset
                );

                storageT.updateTrade(t);
            }
        }

        if (cancelReason != CancelReason.NONE) {
            emit MarketCloseCanceled(
                a.orderId,
                o.trade.trader,
                o.trade.pairIndex,
                o.trade.index,
                cancelReason
            );
        }
    }

    function executeNftOpenOrderCallback(
        AggregatorAnswer memory a,
        ITizzTradingStorage.PendingNftOrder memory n
    ) external onlyPriceAggregator notDone {
        CancelReason cancelReason = !storageT.hasOpenLimitOrder(
            n.trader,
            n.pairIndex,
            n.index
        )
            ? CancelReason.NO_TRADE
            : CancelReason.NONE;

        if (cancelReason == CancelReason.NONE) {
            ITizzTradingStorage.OpenLimitOrder memory o = storageT
                .getOpenLimitOrder(n.trader, n.pairIndex, n.index);

            ITizzTradingStorage.OpenLimitOrderType t = storageT
                .openLimitOrderTypes(n.trader, n.pairIndex, n.index);

            cancelReason = (a.high >= o.orderTradeInfo.maxPrice &&
                a.low <= o.orderTradeInfo.maxPrice)
                ? CancelReason.NONE
                : CancelReason.NOT_HIT;

            // Note: o.minPrice always equals o.maxPrice so can use either
            (
                uint256 priceImpactP,
                uint256 priceAfterImpact,
                CancelReason _cancelReason
            ) = TradingCallbacksUtils.openTradePrep(
                    OpenTradePrepInput(
                        isPaused,
                        cancelReason == CancelReason.NONE
                            ? o.orderTradeInfo.maxPrice
                            : a.open,
                        o.orderTradeInfo.maxPrice,
                        a.open,
                        a.spreadP,
                        o.buy,
                        o.pairIndex,
                        o.positionSize,
                        o.orderTradeInfo.leverage,
                        tradeData[o.trader][o.pairIndex][o.index][
                            TradeType.LIMIT
                        ].maxSlippageP,
                        o.orderTradeInfo.tp,
                        o.orderTradeInfo.sl
                    ),
                    fundingFees,
                    storageT,
                    multiCollatDiamond,
                    _getPriceAggregator()
                );

            bool exactExecution = cancelReason == CancelReason.NONE;

            cancelReason = !exactExecution &&
                (
                    o.orderTradeInfo.maxPrice == 0 ||
                        t == ITizzTradingStorage.OpenLimitOrderType.STOP_LIMIT
                        ? (
                            o.buy
                                ? a.open < o.orderTradeInfo.maxPrice
                                : a.open > o.orderTradeInfo.maxPrice
                        )
                        : (
                            o.buy
                                ? a.open > o.orderTradeInfo.maxPrice
                                : a.open < o.orderTradeInfo.maxPrice
                        )
                )
                ? CancelReason.NOT_HIT
                : _cancelReason;

            if (cancelReason == CancelReason.NONE) {
                RegisterTradeOutput memory output = _registerTrade(
                    ITizzTradingStorage.Trade(
                        o.trader,
                        o.pairIndex,
                        0,
                        0,
                        o.positionSize,
                        priceAfterImpact,
                        o.buy,
                        o.orderTradeInfo.leverage,
                        o.orderTradeInfo.tp,
                        o.orderTradeInfo.sl
                    ),
                    true
                );

                storageT.unregisterOpenLimitOrder(
                    o.trader,
                    o.pairIndex,
                    o.index
                );

                emit LimitExecuted(
                    a.orderId,
                    n.index,
                    output.finalTrade,
                    n.nftHolder,
                    ITizzTradingStorage.LimitOrder.OPEN,
                    output.finalTrade.openPrice,
                    priceImpactP,
                    _convertTokenToCollateral(
                        output.finalTrade.initialPosToken,
                        output.collateralPrecisionDelta,
                        output.tokenPriceBaseAsset
                    ),
                    0,
                    0,
                    output.collateralPriceUsd,
                    exactExecution
                );
            }
        }

        if (cancelReason != CancelReason.NONE) {
            emit NftOrderCanceled(
                a.orderId,
                n.nftHolder,
                ITizzTradingStorage.LimitOrder.OPEN,
                cancelReason
            );
        }
    }

    function executeNftCloseOrderCallback(
        AggregatorAnswer memory a,
        ITizzTradingStorage.PendingNftOrder memory o
    ) external onlyPriceAggregator notDone {
        ITizzTradingStorage.Trade memory t = _getOpenTrade(
            o.trader,
            o.pairIndex,
            o.index
        );

        ITizzPriceAggregator aggregator = _getPriceAggregator();

        CancelReason cancelReason = a.open == 0
            ? CancelReason.MARKET_CLOSED
            : (t.leverage == 0 ? CancelReason.NO_TRADE : CancelReason.NONE);

        if (cancelReason == CancelReason.NONE) {
            ITizzTradingStorage.TradeInfo memory i = _getOpenTradeInfo(
                t.trader,
                t.pairIndex,
                t.index
            );

            Values memory v;
            v.collateralPrecisionDelta = collateralConfig.precisionDelta;
            v.levPosBaseAsset = _convertTokenToCollateral(
                t.initialPosToken * t.leverage,
                v.collateralPrecisionDelta,
                i.tokenPriceBaseAsset
            );
            v.posBaseAsset = v.levPosBaseAsset / t.leverage;

            if (o.orderType == ITizzTradingStorage.LimitOrder.LIQ) {
                v.liqPrice = fundingFees.getTradeLiquidationPrice(
                    ITizzFundingFees.LiqPriceInput(
                        t.trader,
                        t.pairIndex,
                        t.index,
                        t.openPrice,
                        t.buy,
                        v.posBaseAsset,
                        t.leverage
                    )
                );
            }

            v.price = o.orderType == ITizzTradingStorage.LimitOrder.TP
                ? t.tp
                : (
                    o.orderType == ITizzTradingStorage.LimitOrder.SL
                        ? t.sl
                        : v.liqPrice
                );

            v.exactExecution =
                v.price > 0 &&
                a.low <= v.price &&
                a.high >= v.price;

            if (v.exactExecution) {
                v.reward1 = o.orderType == ITizzTradingStorage.LimitOrder.LIQ
                    ? (v.posBaseAsset * 5) / 100
                    : (v.levPosBaseAsset *
                        multiCollatDiamond.pairNftLimitOrderFeeP(t.pairIndex)) /
                        100 /
                        PRECISION;
            } else {
                v.price = a.open;

                v.reward1 = o.orderType == ITizzTradingStorage.LimitOrder.LIQ
                    ? (
                        (t.buy ? a.open <= v.liqPrice : a.open >= v.liqPrice)
                            ? (v.posBaseAsset * 5) / 100
                            : 0
                    )
                    : (
                        ((o.orderType == ITizzTradingStorage.LimitOrder.TP &&
                            t.tp > 0 &&
                            (t.buy ? a.open >= t.tp : a.open <= t.tp)) ||
                            (o.orderType == ITizzTradingStorage.LimitOrder.SL &&
                                t.sl > 0 &&
                                (t.buy ? a.open <= t.sl : a.open >= t.sl)))
                            ? (v.levPosBaseAsset *
                                multiCollatDiamond.pairNftLimitOrderFeeP(
                                    t.pairIndex
                                )) /
                                100 /
                                PRECISION
                            : 0
                    );
            }

            cancelReason = v.reward1 == 0
                ? CancelReason.NOT_HIT
                : CancelReason.NONE;

            // If can be triggered
            if (cancelReason == CancelReason.NONE) {
                v.profitP = TradingCallbacksUtils.currentPercentProfit(
                    t.openPrice,
                    v.price,
                    t.buy,
                    t.leverage
                );
                v.tokenPriceBaseAsset = aggregator.getCollateralPriceUsd();

                v.baseAssetSentToTrader = _unregisterTrade(
                    t,
                    false,
                    v.profitP,
                    v.posBaseAsset,
                    i.openInterestBaseAsset,
                    o.orderType == ITizzTradingStorage.LimitOrder.LIQ
                        ? v.reward1
                        : (v.levPosBaseAsset *
                            multiCollatDiamond.pairCloseFeeP(t.pairIndex)) /
                            100 /
                            PRECISION,
                    v.reward1
                );

                emit LimitExecuted(
                    a.orderId,
                    o.index,
                    t,
                    o.nftHolder,
                    o.orderType,
                    v.price,
                    0,
                    v.posBaseAsset,
                    v.profitP,
                    v.baseAssetSentToTrader,
                    _getCollateralPriceUsd(aggregator),
                    v.exactExecution
                );
            }
        }

        if (cancelReason != CancelReason.NONE) {
            emit NftOrderCanceled(
                a.orderId,
                o.nftHolder,
                o.orderType,
                cancelReason
            );
        }
    }

    // Shared code between market & limit callbacks
    function _registerTrade(
        ITizzTradingStorage.Trade memory trade,
        bool isLimitOrder
    ) private returns (RegisterTradeOutput memory) {
        ITizzPriceAggregator aggregator = _getPriceAggregator();

        Values memory v;
        v.collateralPrecisionDelta = collateralConfig.precisionDelta;
        v.collateralPriceUsd = _getCollateralPriceUsd(aggregator);

        v.levPosBaseAsset = trade.positionSizeBaseAsset * trade.leverage;
        v.tokenPriceBaseAsset = aggregator.getCollateralPriceUsd();

        // 0. Before charging any fee, re-calculate current trader fee tier cache
        _updateTraderPoints(trade.trader, v.levPosBaseAsset, trade.pairIndex);

        // 1. Charge referral fee (if applicable) and send BaseAsset amount to vault
        if (multiCollatDiamond.getTraderReferrer(trade.trader) != address(0)) {
            // Use this variable to store lev pos baseAsset for dev/gov fees after referral fees
            // and before volumeReferredUsd increases
            v.posBaseAsset =
                (v.levPosBaseAsset *
                    (100 *
                        PRECISION -
                        multiCollatDiamond.calculateFeeAmount(
                            trade.trader,
                            multiCollatDiamond.getReferralsPercentOfOpenFeeP(
                                trade.trader
                            )
                        ))) /
                100 /
                PRECISION;

            v.reward1 = _distributeReferralReward(
                trade.trader,
                multiCollatDiamond.calculateFeeAmount(
                    trade.trader,
                    v.levPosBaseAsset
                ), // apply fee tiers here to v.levPosBaseAsset itself to make correct calculations inside referrals
                multiCollatDiamond.pairOpenFeeP(trade.pairIndex),
                v.tokenPriceBaseAsset
            );

            _sendToVault(v.reward1, trade.trader);
            trade.positionSizeBaseAsset -= v.reward1;

            emit ReferralFeeCharged(trade.trader, v.reward1);
        }

        // 2. Calculate gov fee (- referral fee if applicable)
        uint256 govFee = _handleGovFees(
            trade.trader,
            trade.pairIndex,
            (v.posBaseAsset > 0 ? v.posBaseAsset : v.levPosBaseAsset),
            true
        );
        v.reward1 = govFee; // SSS fee (previously dev fee)

        // 3. Calculate Market/Limit fee
        v.reward2 = multiCollatDiamond.calculateFeeAmount(
            trade.trader,
            (v.levPosBaseAsset *
                multiCollatDiamond.pairNftLimitOrderFeeP(trade.pairIndex)) /
                100 /
                PRECISION
        );

        // 3.1 Deduct gov fee, SSS fee (previously dev fee), Market/Limit fee
        uint256 openingFees = govFee + v.reward1 + v.reward2;
        trade.positionSizeBaseAsset -= openingFees;
        emit OpeningFeeCharged(
            trade.trader,
            trade.pairIndex,
            trade.index,
            openingFees
        );
        // 3.2 Distribute Oracle fee and send BaseAsset amount to vault if applicable
        if (isLimitOrder) {
            v.reward3 = (v.reward2 * 2) / 10; // 20% of limit fees
            _sendToVault(v.reward3, trade.trader);
        }

        // 3.3 Distribute SSS fee (previous dev fee + market/limit fee - oracle reward)
        _distributeStakingReward(
            trade.trader,
            v.reward1 + v.reward2 - v.reward3
        );

        // 4. Set trade final details
        trade.index = storageT.firstEmptyTradeIndex(
            trade.trader,
            trade.pairIndex
        );
        trade.initialPosToken = _convertCollateralToToken(
            trade.positionSizeBaseAsset,
            v.collateralPrecisionDelta,
            v.tokenPriceBaseAsset
        );

        (trade.tp, trade.sl) = TradingCallbacksUtils.handleTradeSlTp(trade);

        // 5. Call other contracts
        v.levPosBaseAsset = trade.positionSizeBaseAsset * trade.leverage; // after fees now
        TradingCallbacksUtils.handleExternalOnRegisterUpdates(
            fundingFees,
            multiCollatDiamond,
            aggregator,
            trade,
            v.levPosBaseAsset
        );

        // 6. Store trade metadata
        TradingCallbacksUtils.setTradeMetadata(
            tradeData[trade.trader][trade.pairIndex][trade.index][
                TradeType.MARKET
            ],
            tradeLastUpdated[trade.trader][trade.pairIndex][trade.index][
                TradeType.MARKET
            ],
            v.collateralPriceUsd,
            uint32(ChainUtils.getBlockNumber())
        );

        // 7. Store final trade in storage contract
        storageT.storeTrade(
            trade,
            ITizzTradingStorage.TradeInfo(
                v.tokenPriceBaseAsset,
                v.levPosBaseAsset,
                0,
                0,
                false
            )
        );

        return
            RegisterTradeOutput(
                trade,
                v.tokenPriceBaseAsset,
                v.collateralPriceUsd,
                v.collateralPrecisionDelta
            );
    }

    function _unregisterTrade(
        ITizzTradingStorage.Trade memory trade,
        bool marketOrder,
        int256 percentProfit, // PRECISION
        uint256 currentBaseAssetPos, // 1e18 | 1e6
        uint256 openInterestBaseAsset, // 1e18 | 1e6
        uint256 closingFeeBaseAsset, // 1e18 | 1e6
        uint256 nftFeeBaseAsset // 1e18 | 1e6 (= SSS reward if market order)
    ) private returns (uint256 baseAssetSentToTrader) {
        ITizzVaultToken vaultToken = ITizzVaultToken(storageT.vault());

        // 0. Re-calculate current trader fee tier and apply it
        _updateTraderPoints(
            trade.trader,
            openInterestBaseAsset,
            trade.pairIndex
        );
        closingFeeBaseAsset = multiCollatDiamond.calculateFeeAmount(
            trade.trader,
            closingFeeBaseAsset
        );
        nftFeeBaseAsset = multiCollatDiamond.calculateFeeAmount(
            trade.trader,
            nftFeeBaseAsset
        );

        emit ClosingFeeCharged(
            trade.trader,
            trade.pairIndex,
            trade.index,
            closingFeeBaseAsset + nftFeeBaseAsset
        );

        // 1. Calculate net PnL (after all closing and holding fees)
        {
            uint256 fundingFee;
            (baseAssetSentToTrader, fundingFee) = TradingCallbacksUtils
                .getTradeValue(
                    trade,
                    currentBaseAssetPos,
                    percentProfit,
                    closingFeeBaseAsset + nftFeeBaseAsset,
                    collateralConfig.precisionDelta,
                    fundingFees
                );
            emit FundingFeeCharged(
                trade.trader,
                trade.pairIndex,
                baseAssetSentToTrader,
                fundingFee
            );
        }

        // 2. Call other contracts
        fundingFees.handleTradeAction(
            trade.trader,
            trade.pairIndex,
            trade.index,
            openInterestBaseAsset,
            false,
            trade.buy
        ); // funding fees
        {
            TradeData memory td = tradeData[trade.trader][trade.pairIndex][
                trade.index
            ][TradeType.MARKET];
            multiCollatDiamond.removePriceImpactOpenInterest(
                _convertCollateralToUsd(
                    openInterestBaseAsset,
                    collateralConfig.precisionDelta,
                    td.collateralPriceUsd
                ),
                trade.pairIndex,
                trade.buy,
                td.lastOiUpdateTs
            ); // price impact oi windows
        }

        // 3. Unregister trade from storage
        storageT.unregisterTrade(trade.trader, trade.pairIndex, trade.index);

        address trader = trade.trader;
        IERC20 asset = IERC20(vaultToken.baseAsset());
        // 4.1 If collateral in storage
        if (trade.positionSizeBaseAsset > 0) {
            Values memory v;

            // 5. BaseAsset vault reward
            v.reward2 = (closingFeeBaseAsset * baseAssetVaultFeeP) / 100;
            if (v.reward2 > 0) {
                v.reward2 = _transferFromStorageToAddress(
                    address(this),
                    v.reward2
                );
                vaultToken.distributeReward(v.reward2);
            }

            emit BaseAssetVaultFeeCharged(trade.trader, v.reward2);

            // 6. SSS reward
            v.reward3 =
                (marketOrder ? nftFeeBaseAsset : (nftFeeBaseAsset * 8) / 10) +
                (closingFeeBaseAsset * sssFeeP) /
                100;
            if (v.reward3 > 0) {
                _distributeStakingReward(trade.trader, v.reward3);
            }

            // 7. Take BaseAsset from vault if winning trade
            // or send BaseAsset to vault if losing trade
            uint256 baseAssetLeftInStorage = currentBaseAssetPos -
                v.reward3 -
                v.reward2;

            if (baseAssetSentToTrader > baseAssetLeftInStorage) {
                vaultToken.sendAssets(
                    baseAssetSentToTrader - baseAssetLeftInStorage,
                    address(this)
                );
                if (baseAssetLeftInStorage > 0) {
                    _transferFromStorageToAddress(
                        address(this),
                        baseAssetLeftInStorage
                    );
                }

                asset.approve(address(tizzEscrow), baseAssetSentToTrader);
                tizzEscrow.receiveAssets(
                    address(asset),
                    trader,
                    baseAssetSentToTrader
                );
            } else {
                if (baseAssetLeftInStorage - baseAssetSentToTrader > 0) {
                    _sendToVault(
                        baseAssetLeftInStorage - baseAssetSentToTrader,
                        trader
                    );
                }

                if (baseAssetSentToTrader > 0) {
                    _transferFromStorageToAddress(
                        address(this),
                        baseAssetSentToTrader
                    );

                    asset.approve(address(tizzEscrow), baseAssetSentToTrader);
                    tizzEscrow.receiveAssets(
                        address(asset),
                        trader,
                        baseAssetSentToTrader
                    );
                }
            }

            // 4.2 If collateral in vault, just send baseAsset to trader from vault
        } else {
            if (baseAssetSentToTrader > 0) {
                vaultToken.sendAssets(baseAssetSentToTrader, address(this));
                asset.approve(address(tizzEscrow), baseAssetSentToTrader);
                tizzEscrow.receiveAssets(
                    address(asset),
                    trader,
                    baseAssetSentToTrader
                );
            }
        }
    }

    // Setters (external)
    function setTizzEscrow(ITizzEscrow _tizzEscrow) external {
        require(address(_tizzEscrow) != address(0), "WRONG_PARAM");
        tizzEscrow = _tizzEscrow;
        emit TizzEscrowUpdated(address(_tizzEscrow));
    }
    function setTradeLastUpdated(
        SimplifiedTradeId calldata _id,
        LastUpdated memory _lastUpdated
    ) external onlyTrading {
        tradeLastUpdated[_id.trader][_id.pairIndex][_id.index][
            _id.tradeType
        ] = _lastUpdated;
    }

    function setTradeData(
        SimplifiedTradeId calldata _id,
        TradeData memory _tradeData
    ) external onlyTrading {
        tradeData[_id.trader][_id.pairIndex][_id.index][
            _id.tradeType
        ] = _tradeData;
    }

    // Getters (private)

    function _getPriceAggregator() private view returns (ITizzPriceAggregator) {
        return storageT.priceAggregator();
    }

    function _getCollateralPriceUsd(
        ITizzPriceAggregator aggregator
    ) private view returns (uint256) {
        return aggregator.getCollateralPriceUsd();
    }

    function _getOpenTrade(
        address trader,
        uint256 pairIndex,
        uint256 index
    ) private view returns (ITizzTradingStorage.Trade memory) {
        return storageT.openTrades(trader, pairIndex, index);
    }

    function _getOpenTradeInfo(
        address trader,
        uint256 pairIndex,
        uint256 index
    ) private view returns (ITizzTradingStorage.TradeInfo memory) {
        return storageT.openTradesInfo(trader, pairIndex, index);
    }

    // Utils (private)
    function _distributeStakingReward(
        address trader,
        uint256 amountBaseAsset
    ) private {
        amountBaseAsset = _transferFromStorageToAddress(
            address(this),
            amountBaseAsset
        );
        staking.distributeReward(storageT.baseAsset(), amountBaseAsset);
        emit SssFeeCharged(trader, amountBaseAsset);
    }

    function _sendToVault(uint256 amountBaseAsset, address trader) private {
        amountBaseAsset = _transferFromStorageToAddress(
            address(this),
            amountBaseAsset
        );
        ITizzVaultToken(storageT.vault()).receiveAssets(
            amountBaseAsset,
            trader
        );
    }

    function _transferFromStorageToAddress(
        address to,
        uint256 amountBaseAsset
    ) private returns (uint256) {
        return
            storageT.transferBaseAsset(address(storageT), to, amountBaseAsset);
    }

    function _convertCollateralToUsd(
        uint256 _collateral,
        uint128 _collateralPrecisionDelta,
        uint256 _collateralPriceUsd // 1e8
    ) private pure returns (uint256) {
        return
            (_collateral * _collateralPrecisionDelta * _collateralPriceUsd) /
            1e8;
    }

    function _convertCollateralToToken(
        uint256 _collateral,
        uint128 _collateralPrecisionDelta,
        uint256 _tokenPriceBaseAsset
    ) private pure returns (uint256) {
        return ((_collateral * _collateralPrecisionDelta * PRECISION) /
            _tokenPriceBaseAsset);
    }

    function _convertTokenToCollateral(
        uint256 _tokenAmount,
        uint128 _collateralPrecisionDelta,
        uint256 _tokenPriceBaseAsset
    ) private pure returns (uint256) {
        return
            (_tokenAmount * _tokenPriceBaseAsset) /
            _collateralPrecisionDelta /
            PRECISION;
    }

    function _handleGovFees(
        address trader,
        uint256 pairIndex,
        uint256 levPosBaseAsset,
        bool distribute
    ) private returns (uint256 govFee) {
        govFee = multiCollatDiamond.calculateFeeAmount(
            trader,
            (levPosBaseAsset * multiCollatDiamond.pairOpenFeeP(pairIndex)) /
                PRECISION /
                100
        );

        if (distribute) {
            govFeesBaseAsset += govFee;
        }

        emit GovFeeCharged(trader, govFee, distribute);
    }

    function _updateTraderPoints(
        address trader,
        uint256 levPosBaseAsset,
        uint256 pairIndex
    ) private {
        uint256 usdNormalizedPositionSize = _getPriceAggregator()
            .getUsdNormalizedValue(levPosBaseAsset);
        multiCollatDiamond.updateTraderPoints(
            trader,
            usdNormalizedPositionSize,
            pairIndex
        );
    }

    function _distributeReferralReward(
        address trader,
        uint256 levPosBaseAsset, // collateralPrecision
        uint256 pairOpenFeeP,
        uint256 tokenPriceCollateral // PRECISION
    ) private returns (uint256) {
        ITizzPriceAggregator aggregator = _getPriceAggregator();

        return
            aggregator.getCollateralFromUsdNormalizedValue(
                multiCollatDiamond.distributeReferralReward(
                    trader,
                    aggregator.getUsdNormalizedValue(levPosBaseAsset),
                    pairOpenFeeP,
                    tokenPriceCollateral
                )
            );
    }

    // Getters (public)
    function getTradeLastUpdated(
        address trader,
        uint256 pairIndex,
        uint256 index,
        TradeType tradeType
    ) external view returns (LastUpdated memory) {
        return tradeLastUpdated[trader][pairIndex][index][tradeType];
    }
}
