// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Initializable} from "../external/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IERC20.sol";

import "../interfaces/ITizzTrading.sol";
import "../interfaces/ITizzFundingFees.sol";
import "../interfaces/ITizzMultiCollatDiamond.sol";
import "../interfaces/IWBTC.sol";

import "../libraries/ChainUtils.sol";
import "../libraries/TradeUtils.sol";
import "../commonLib/PackingUtils.sol";
import "../libraries/CollateralUtils.sol";

import "../misc/Delegatable.sol";

/**
 * @custom:version 7
 * @custom:oz-upgrades-unsafe-allow external-library-linking delegatecall
 */
contract TizzTrading is Initializable, Delegatable, ITizzTrading {
    using TradeUtils for address;
    using PackingUtils for uint256;

    // Contracts (constant)
    ITizzTradingStorage public storageT;
    ITizzFundingFees public fundingFees;

    // Params (constant)
    uint256 private constant PRECISION = 1e10;
    uint256 private constant MAX_SL_P = 75; // -75% PNL
    uint256 private constant MAX_OPEN_NEGATIVE_PNL_P = 40 * 1e10; // -40% PNL

    // Params (adjustable)
    uint256 public maxPosBaseAsset; // 1e18 (eg. 75000 * 1e18)

    // State
    bool public isPaused; // Prevent opening new trades
    bool public isDone; // Prevent any interaction with the contract
    bool public isNative; // use native token or not.

    // v7
    CollateralUtils.CollateralConfig public collateralConfig;
    ITizzMultiCollatDiamond public multiCollatDiamond;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        ITizzTradingStorage _storageT,
        ITizzFundingFees _fundingFees,
        uint256 _maxPosBaseAsset,
        bool _isNative
    ) external initializer {
        require(
            address(_storageT) != address(0) &&
                address(_fundingFees) != address(0) &&
                _maxPosBaseAsset > 0,
            "WRONG_PARAMS"
        );

        storageT = _storageT;
        fundingFees = _fundingFees;

        maxPosBaseAsset = _maxPosBaseAsset;
        isNative = _isNative;
    }

    function initializeV2(
        ITizzMultiCollatDiamond _multiCollatDiamond
    ) external reinitializer(2) {
        require(address(_multiCollatDiamond) != address(0), "WRONG_PARAMS");

        collateralConfig = CollateralUtils.getCollateralConfig(
            storageT.baseAsset()
        );
        multiCollatDiamond = _multiCollatDiamond;
    }

    // Manage params
    function setMaxPosBaseAsset(uint256 value) external {
        _checkOnlyGove();
        require(value > 0, "VALUE_0");
        maxPosBaseAsset = value;
        emit NumberUpdated("maxPosBaseAsset", value);
    }

    // Manage state
    function pause() external {
        _checkOnlyGove();
        isPaused = !isPaused;
        emit Paused(isPaused);
    }

    function done() external {
        _checkOnlyGove();
        isDone = !isDone;
        emit Done(isDone);
    }

    // Open new trade (MARKET/LIMIT)
    function openTrade(
        ITizzTradingStorage.Trade memory t,
        ITizzTradingStorage.OpenLimitOrderType orderType,
        uint256 slippageP,
        address referrer,
        bytes memory bytesproof
    ) external payable {
        _checkCondition();
        _validateOpenTrade(t, slippageP, msg.value);
        _handleOpenTrade(t, orderType, slippageP, referrer, bytesproof);
    }

    function _validateOpenTrade(
        ITizzTradingStorage.Trade memory t,
        uint256 slippageP,
        uint256 nativeAmount
    ) private view {
        require(!isPaused, "PAUSED");
        require(t.openPrice * slippageP < type(uint256).max, "OVERFLOW");
        require(t.openPrice > 0, "PRICE_ZERO");
        require(
            !isNative || nativeAmount >= t.positionSizeBaseAsset,
            "WRONG_POSITIONSIZE"
        );

        ITizzPriceAggregator aggregator = storageT.priceAggregator();
        address sender = _msgSender();

        require(
            storageT.openTradesCount(sender, t.pairIndex) +
                storageT.openLimitOrdersCount(sender, t.pairIndex) <
                storageT.maxTradesPerPair(),
            "MAX_TRADES_PER_PAIR"
        );

        require(t.positionSizeBaseAsset <= maxPosBaseAsset, "ABOVE_MAX_POS");

        uint256 levPosBaseAsset = t.positionSizeBaseAsset * t.leverage;
        uint256 levPosUsd = aggregator.getUsdNormalizedValue(levPosBaseAsset);
        require(
            storageT.openInterestBaseAsset(t.pairIndex, t.buy ? 0 : 1) +
                levPosBaseAsset <=
                fundingFees.getCollateralPairMaxOi(t.pairIndex),
            "ABOVE_PAIR_MAX_OI"
        );
        require(
            fundingFees.withinMaxGroupOi(t.pairIndex, t.buy, levPosBaseAsset),
            "ABOVE_GROUP_MAX_OI"
        );
        require(
            levPosUsd >= multiCollatDiamond.pairMinLevPosUsd(t.pairIndex),
            "BELOW_MIN_POS"
        );

        require(
            t.leverage > 0 &&
                t.leverage >= multiCollatDiamond.pairMinLeverage(t.pairIndex) &&
                t.leverage <= multiCollatDiamond.pairMaxLeverage(t.pairIndex),
            "LEVERAGE_INCORRECT"
        );

        require(
            t.tp == 0 || (t.buy ? t.tp > t.openPrice : t.tp < t.openPrice),
            "WRONG_TP"
        );
        require(
            t.sl == 0 || (t.buy ? t.sl < t.openPrice : t.sl > t.openPrice),
            "WRONG_SL"
        );

        (uint256 priceImpactP, ) = multiCollatDiamond.getTradePriceImpact(
            0,
            t.pairIndex,
            t.buy,
            levPosUsd
        );
        require(
            priceImpactP * t.leverage <= MAX_OPEN_NEGATIVE_PNL_P,
            "PRICE_IMPACT_TOO_HIGH"
        );
    }

    function _handleOpenTrade(
        ITizzTradingStorage.Trade memory _t,
        ITizzTradingStorage.OpenLimitOrderType orderType,
        uint256 slippageP,
        address referrer,
        bytes memory bytesproof
    ) private {
        ITizzTradingStorage.Trade memory t = _t;
        address sender = _msgSender();
        address baseAsset = storageT.baseAsset();
        uint256 positionSizeBaseAsset = t.positionSizeBaseAsset;
        if (isNative) {
            uint256 inputValue = msg.value;
            IWBTC(baseAsset).deposit{value: positionSizeBaseAsset}();
            IERC20(baseAsset).approve(address(storageT), positionSizeBaseAsset);
            positionSizeBaseAsset = storageT.transferBaseAsset(
                address(this),
                address(storageT),
                positionSizeBaseAsset
            );
            if (inputValue > positionSizeBaseAsset) {
                (bool success, ) = (msg.sender).call{
                    value: inputValue - positionSizeBaseAsset
                }("");
                require(success, "FAILED_TRANSFER_NATIVE");
            }
        } else {
            positionSizeBaseAsset = storageT.transferBaseAsset(
                sender,
                address(storageT),
                positionSizeBaseAsset
            );
        }
        t.positionSizeBaseAsset = positionSizeBaseAsset;

        if (orderType != ITizzTradingStorage.OpenLimitOrderType.MARKET) {
            uint256 index = storageT.firstEmptyOpenLimitIndex(
                sender,
                t.pairIndex
            );

            storageT.storeOpenLimitOrder(
                ITizzTradingStorage.OpenLimitOrder(
                    sender,
                    t.pairIndex,
                    index,
                    t.positionSizeBaseAsset,
                    t.buy,
                    ITizzTradingStorage.OrderTradeInfo(
                        t.leverage,
                        t.tp,
                        t.sl,
                        t.openPrice,
                        t.openPrice,
                        ChainUtils.getBlockNumber()
                    )
                )
            );

            storageT.setOpenLimitOrderType(
                sender,
                t.pairIndex,
                index,
                orderType
            );

            address c = storageT.callbacks();
            c.setTradeLastUpdated(
                sender,
                t.pairIndex,
                index,
                ITizzTradingCallbacks.TradeType.LIMIT,
                ChainUtils.getBlockNumber()
            );
            c.setLimitMaxSlippageP(sender, t.pairIndex, index, slippageP);

            emit OpenLimitPlaced(sender, t.pairIndex, index);
        } else {
            ITizzPriceAggregator aggregator = storageT.priceAggregator();

            uint256 orderId = aggregator.getPrice(
                t.pairIndex,
                ITizzPriceAggregator.OrderType.MARKET_OPEN,
                ITizzTradingStorage.PendingMarketOrder(
                    ITizzTradingStorage.Trade(
                        sender,
                        t.pairIndex,
                        0,
                        0,
                        t.positionSizeBaseAsset,
                        0,
                        t.buy,
                        t.leverage,
                        t.tp,
                        t.sl
                    ),
                    0,
                    t.openPrice,
                    slippageP,
                    0
                ),
                ITizzTradingStorage.PendingNftOrder(
                    address(0),
                    0,
                    address(0),
                    0,
                    0,
                    ITizzTradingStorage.LimitOrder.OPEN
                ),
                bytesproof
            );

            emit MarketOrderInitiated(orderId, sender, t.pairIndex, true);
        }

        multiCollatDiamond.registerPotentialReferrer(sender, referrer);
    }

    // Close trade (MARKET)
    function closeTradeMarket(
        uint256 pairIndex,
        uint256 index,
        bytes memory bytesproof // Add this argument for Supra integration
    ) external {
        _checkCondition();
        address sender = _msgSender();

        ITizzTradingStorage.Trade memory t = storageT.openTrades(
            sender,
            pairIndex,
            index
        );
        ITizzTradingStorage.TradeInfo memory i = storageT.openTradesInfo(
            sender,
            pairIndex,
            index
        );

        require(!i.beingMarketClosed, "ALREADY_BEING_CLOSED");
        require(t.leverage > 0, "NO_TRADE");

        ITizzPriceAggregator aggregator = storageT.priceAggregator();

        uint256 orderId = aggregator.getPrice(
            pairIndex,
            ITizzPriceAggregator.OrderType.MARKET_CLOSE,
            ITizzTradingStorage.PendingMarketOrder(
                ITizzTradingStorage.Trade(
                    sender,
                    pairIndex,
                    index,
                    0,
                    0,
                    0,
                    false,
                    0,
                    0,
                    0
                ),
                0,
                0,
                0,
                0
            ),
            ITizzTradingStorage.PendingNftOrder(
                address(0),
                0,
                address(0),
                0,
                0,
                ITizzTradingStorage.LimitOrder.OPEN
            ),
            bytesproof
        );

        emit MarketOrderInitiated(orderId, sender, pairIndex, false);
    }

    // Manage limit order (OPEN)
    function updateOpenLimitOrder(
        uint256 pairIndex,
        uint256 index,
        uint256 price, // PRECISION
        uint256 tp,
        uint256 sl,
        uint256 maxSlippageP
    ) external {
        _checkCondition();
        require(price > 0, "PRICE_ZERO");

        address sender = _msgSender();
        require(
            storageT.hasOpenLimitOrder(sender, pairIndex, index),
            "NO_LIMIT"
        );

        ITizzTradingStorage.OpenLimitOrder memory o = storageT
            .getOpenLimitOrder(sender, pairIndex, index);

        require(tp == 0 || (o.buy ? tp > price : tp < price), "WRONG_TP");
        require(sl == 0 || (o.buy ? sl < price : sl > price), "WRONG_SL");

        require(price * maxSlippageP < type(uint256).max, "OVERFLOW");

        o.orderTradeInfo.minPrice = price;
        o.orderTradeInfo.maxPrice = price;
        o.orderTradeInfo.tp = tp;
        o.orderTradeInfo.sl = sl;

        storageT.updateOpenLimitOrder(o);

        address c = storageT.callbacks();
        c.setTradeLastUpdated(
            sender,
            pairIndex,
            index,
            ITizzTradingCallbacks.TradeType.LIMIT,
            ChainUtils.getBlockNumber()
        );
        c.setLimitMaxSlippageP(sender, pairIndex, index, maxSlippageP);

        emit OpenLimitUpdated(
            sender,
            pairIndex,
            index,
            price,
            tp,
            sl,
            maxSlippageP
        );
    }

    function cancelOpenLimitOrder(uint256 pairIndex, uint256 index) external {
        _checkCondition();
        address sender = _msgSender();
        require(
            storageT.hasOpenLimitOrder(sender, pairIndex, index),
            "NO_LIMIT"
        );

        ITizzTradingStorage.OpenLimitOrder memory o = storageT
            .getOpenLimitOrder(sender, pairIndex, index);

        storageT.unregisterOpenLimitOrder(sender, pairIndex, index);
        storageT.transferBaseAsset(address(storageT), sender, o.positionSize);

        emit OpenLimitCanceled(sender, pairIndex, index);
    }

    // Manage limit order (TP/SL)
    function updateTp(
        uint256 pairIndex,
        uint256 index,
        uint256 newTp
    ) external {
        _checkCondition();
        address sender = _msgSender();

        ITizzTradingStorage.Trade memory t = storageT.openTrades(
            sender,
            pairIndex,
            index
        );
        require(t.leverage > 0, "NO_TRADE");

        storageT.updateTp(sender, pairIndex, index, newTp);
        storageT.callbacks().setTpLastUpdated(
            sender,
            pairIndex,
            index,
            ITizzTradingCallbacks.TradeType.MARKET,
            ChainUtils.getBlockNumber()
        );

        emit TpUpdated(sender, pairIndex, index, newTp);
    }

    function updateSl(
        uint256 pairIndex,
        uint256 index,
        uint256 newSl
    ) external {
        _checkCondition();
        address sender = _msgSender();

        ITizzTradingStorage.Trade memory t = storageT.openTrades(
            sender,
            pairIndex,
            index
        );
        require(t.leverage > 0, "NO_TRADE");

        uint256 maxSlDist = (t.openPrice * MAX_SL_P) / 100 / t.leverage;

        require(
            newSl == 0 ||
                (
                    t.buy
                        ? newSl >= t.openPrice - maxSlDist
                        : newSl <= t.openPrice + maxSlDist
                ),
            "SL_TOO_BIG"
        );

        storageT.updateSl(sender, pairIndex, index, newSl);
        storageT.callbacks().setSlLastUpdated(
            sender,
            pairIndex,
            index,
            ITizzTradingCallbacks.TradeType.MARKET,
            ChainUtils.getBlockNumber()
        );

        emit SlUpdated(sender, pairIndex, index, newSl);
    }

    // Execute limit order
    function triggerOrder(uint256 packed, bytes memory bytesproof) external {
        _checkCondition();
        (
            uint256 _orderType,
            address trader,
            uint256 pairIndex,
            uint256 index,
            ,

        ) = packed.unpackTriggerOrder();

        ITizzTradingStorage.LimitOrder orderType = ITizzTradingStorage
            .LimitOrder(_orderType);
        bool isOpenLimit = orderType == ITizzTradingStorage.LimitOrder.OPEN;

        orderType = _validateTriggerOrder(
            trader,
            pairIndex,
            index,
            orderType,
            isOpenLimit
        );

        _handleTriggerOrder(
            TriggerOrderParams(
                trader,
                pairIndex,
                index,
                orderType,
                isOpenLimit,
                bytesproof
            )
        );
    }

    function _validateTriggerOrder(
        address trader,
        uint256 pairIndex,
        uint256 index,
        ITizzTradingStorage.LimitOrder orderType,
        bool isOpenLimit
    ) private view returns (ITizzTradingStorage.LimitOrder) {
        ITizzTradingStorage.Trade memory t;

        if (isOpenLimit) {
            require(
                storageT.hasOpenLimitOrder(trader, pairIndex, index),
                "NO_LIMIT"
            );
        } else {
            t = storageT.openTrades(trader, pairIndex, index);
            require(t.leverage > 0, "NO_TRADE");

            if (orderType == ITizzTradingStorage.LimitOrder.LIQ) {
                if (t.sl > 0) {
                    uint256 liqPrice = fundingFees.getTradeLiquidationPrice(
                        ITizzFundingFees.LiqPriceInput(
                            t.trader,
                            t.pairIndex,
                            t.index,
                            t.openPrice,
                            t.buy,
                            (t.initialPosToken *
                                storageT
                                    .openTradesInfo(
                                        t.trader,
                                        t.pairIndex,
                                        t.index
                                    )
                                    .tokenPriceBaseAsset) /
                                collateralConfig.precisionDelta /
                                PRECISION,
                            t.leverage
                        )
                    );

                    // If liq price not closer than SL, turn order into a SL order
                    if (
                        (t.buy && liqPrice <= t.sl) ||
                        (!t.buy && liqPrice >= t.sl)
                    ) {
                        orderType = ITizzTradingStorage.LimitOrder.SL;
                    }
                }
            } else {
                require(
                    orderType != ITizzTradingStorage.LimitOrder.SL || t.sl > 0,
                    "NO_SL"
                );
                require(
                    orderType != ITizzTradingStorage.LimitOrder.TP || t.tp > 0,
                    "NO_TP"
                );
            }
        }

        return orderType;
    }

    function _handleTriggerOrder(TriggerOrderParams memory params) private {
        address sender = _msgSender();
        uint256 leveragedPosBaseAsset;

        if (params.isOpenLimit) {
            ITizzTradingStorage.OpenLimitOrder memory l = storageT
                .getOpenLimitOrder(
                    params.trader,
                    params.pairIndex,
                    params.index
                );

            uint256 _leveragedPosBaseAsset = l.positionSize *
                l.orderTradeInfo.leverage;
            uint256 _leveragedPosUsd = storageT
                .priceAggregator()
                .getUsdNormalizedValue(_leveragedPosBaseAsset);
            (uint256 priceImpactP, ) = multiCollatDiamond.getTradePriceImpact(
                0,
                l.pairIndex,
                l.buy,
                _leveragedPosUsd
            );

            require(
                priceImpactP * l.orderTradeInfo.leverage <=
                    MAX_OPEN_NEGATIVE_PNL_P,
                "PRICE_IMPACT_TOO_HIGH"
            );

            leveragedPosBaseAsset = _leveragedPosBaseAsset;
        } else {
            ITizzTradingStorage.Trade memory t = storageT.openTrades(
                params.trader,
                params.pairIndex,
                params.index
            );
            leveragedPosBaseAsset =
                (t.initialPosToken *
                    storageT
                        .openTradesInfo(
                            params.trader,
                            params.pairIndex,
                            params.index
                        )
                        .tokenPriceBaseAsset *
                    t.leverage) /
                collateralConfig.precisionDelta /
                PRECISION;
        }

        uint256 orderId = _getPriceNftOrder(
            params.isOpenLimit,
            params.pairIndex,
            ITizzTradingStorage.PendingNftOrder({
                nftHolder: sender,
                nftId: 0,
                trader: params.trader,
                pairIndex: params.pairIndex,
                index: params.index,
                orderType: params.orderType
            }),
            params.bytesproof
        );

        emit OrderTriggered(
            orderId,
            params.trader,
            params.pairIndex,
            params.orderType
        );
    }

    // Helpers (private)

    function _getPriceNftOrder(
        bool isOpenLimit,
        uint256 pairIndex,
        ITizzTradingStorage.PendingNftOrder memory pendingNftOrder,
        bytes memory bytesproof // Add this argument for Supra integration
    ) private returns (uint256 orderId) {
        ITizzPriceAggregator aggregator = storageT.priceAggregator();
        orderId = aggregator.getPrice(
            pairIndex,
            isOpenLimit
                ? ITizzPriceAggregator.OrderType.LIMIT_OPEN
                : ITizzPriceAggregator.OrderType.LIMIT_CLOSE,
            ITizzTradingStorage.PendingMarketOrder(
                ITizzTradingStorage.Trade(
                    address(0),
                    0,
                    0,
                    0,
                    0,
                    0,
                    false,
                    0,
                    0,
                    0
                ),
                0,
                0,
                0,
                0
            ),
            pendingNftOrder,
            bytesproof // Pass the bytesproof for Supra integration
        );
    }

    function _checkOnlyGove() internal view {
        require(
            multiCollatDiamond.hasRole(msg.sender, IAddressStoreUtils.Role.GOV),
            "GOV_ONLY"
        );
    }

    function _checkCondition() internal view {
        require(tx.origin == msg.sender, "not contract");
        require(!isDone, "DONE");
    }
}
