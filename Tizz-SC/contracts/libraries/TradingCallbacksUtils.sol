// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/ITizzTradingStorage.sol";
import "../interfaces/ITizzFundingFees.sol";
import "../interfaces/ITizzTradingCallbacks.sol";
import "../interfaces/ITizzMultiCollatDiamond.sol";

/**
 * @custom:version 7
 *
 * @dev This is a library with methods used by TizzTradingCallbacks contract.
 */
library TradingCallbacksUtils {
    uint256 private constant PRECISION = 1e10; // 10 decimals
    uint256 private constant MAX_SL_P = 75; // -75% pnl
    uint256 private constant MAX_GAIN_P = 900; // 900% pnl (10x)
    uint256 private constant MAX_OPEN_NEGATIVE_PNL_P = 40 * 1e10; // -40% pnl
    uint256 private constant LIQ_THRESHOLD_P = 90; // -90% pnl

    function getTradeValuePure(
        uint256 _collateral, // 1e18 | 1e6 (BaseAsset)
        int256 _percentProfit, // PRECISION (%)
        uint256 _fundingFee, // 1e18 | 1e6 (BaseAsset)
        uint256 _closingFee, // 1e18 | 1e6 (BaseAsset)
        uint128 _collateralPrecisionDelta
    ) public pure returns (uint256) {
        int256 precisionDelta = int256(uint256(_collateralPrecisionDelta));

        // Multiply collateral by precisionDelta so we don't lose precision for low decimals
        int256 value = (int256(_collateral) *
            precisionDelta +
            (int256(_collateral) * precisionDelta * _percentProfit) /
            int256(PRECISION) /
            100) /
            precisionDelta -
            int256(_fundingFee);

        if (
            value <= (int256(_collateral) * int256(100 - LIQ_THRESHOLD_P)) / 100
        ) {
            return 0;
        }

        value -= int256(_closingFee);

        return value > 0 ? uint256(value) : 0;
    }

    /**
     * @dev Returns trade value and funding fee.
     */
    function getTradeValue(
        ITizzTradingStorage.Trade memory _trade,
        uint256 _currentBaseAssetPos, // 1e18 | 1e6
        int256 _percentProfit, // PRECISION
        uint256 _closingFees, // 1e18 | 1e6
        uint128 _collateralPrecisionDelta, // 1e18 | 1e6
        ITizzFundingFees _fundingFees
    ) external view returns (uint256 value, uint256 fundingFee) {
        fundingFee = _fundingFees.getTradeFundingFee(
            ITizzFundingFees.FundingFeeInput(
                _trade.trader,
                _trade.pairIndex,
                _trade.index,
                _trade.buy,
                _currentBaseAssetPos,
                _trade.leverage
            )
        );

        value = getTradeValuePure(
            _currentBaseAssetPos,
            _percentProfit,
            fundingFee,
            _closingFees,
            _collateralPrecisionDelta
        );
    }

    /**
     * @dev Checks if total position size is not higher than maximum allowed open interest for a pair
     */
    function withinExposureLimits(
        uint256 _pairIndex,
        bool _long,
        uint256 _positionSizeBaseAsset, // 1e18 | 1e6
        uint256 _leverage,
        ITizzTradingStorage _storageT,
        ITizzFundingFees _fundingFees
    ) public view returns (bool) {
        uint256 levPositionSizeBaseAsset = _positionSizeBaseAsset * _leverage;

        return
            _storageT.openInterestBaseAsset(_pairIndex, _long ? 0 : 1) +
                levPositionSizeBaseAsset <=
            _fundingFees.getCollateralPairMaxOi(_pairIndex) &&
            _fundingFees.withinMaxGroupOi(
                _pairIndex,
                _long,
                levPositionSizeBaseAsset
            );
    }

    /**
     * @dev Calculates percent profit for long/short based on '_openPrice', '_currentPrice', '_leverage'.
     */
    function currentPercentProfit(
        uint256 _openPrice, // PRECISION
        uint256 _currentPrice, // PRECISION
        bool _long,
        uint256 _leverage
    ) public pure returns (int256 p) {
        int256 maxPnlP = int256(MAX_GAIN_P) * int256(PRECISION);

        p = _openPrice > 0
            ? ((
                _long
                    ? int256(_currentPrice) - int256(_openPrice)
                    : int256(_openPrice) - int256(_currentPrice)
            ) *
                100 *
                int256(PRECISION) *
                int256(_leverage)) / int256(_openPrice)
            : int256(0);

        p = p > maxPnlP ? maxPnlP : p;
    }

    /**
     * @dev Corrects take profit price for long/short based on '_openPrice', '_tp, '_leverage'.
     */
    function correctTp(
        uint256 _openPrice,
        uint256 _leverage,
        uint256 _tp,
        bool _long
    ) public pure returns (uint256) {
        if (
            _tp == 0 ||
            currentPercentProfit(_openPrice, _tp, _long, _leverage) ==
            int256(MAX_GAIN_P) * int256(PRECISION)
        ) {
            uint256 tpDiff = (_openPrice * MAX_GAIN_P) / _leverage / 100;
            return
                _long
                    ? _openPrice + tpDiff
                    : (tpDiff <= _openPrice ? _openPrice - tpDiff : 0);
        }

        return _tp;
    }

    /**
     * @dev Corrects stop loss price for long/short based on '_openPrice', '_sl, '_leverage'.
     */
    function correctSl(
        uint256 _openPrice,
        uint256 _leverage,
        uint256 _sl,
        bool _long
    ) public pure returns (uint256) {
        if (
            _sl > 0 &&
            currentPercentProfit(_openPrice, _sl, _long, _leverage) <
            int256(MAX_SL_P) * int256(PRECISION) * -1
        ) {
            uint256 slDiff = (_openPrice * MAX_SL_P) / _leverage / 100;
            return _long ? _openPrice - slDiff : _openPrice + slDiff;
        }

        return _sl;
    }

    /**
     * @dev Corrects '_trade' stop loss and take profit prices and returns the modified object
     */
    function handleTradeSlTp(
        ITizzTradingStorage.Trade memory _trade
    ) external pure returns (uint256, uint256) {
        _trade.tp = correctTp(
            _trade.openPrice,
            _trade.leverage,
            _trade.tp,
            _trade.buy
        );
        _trade.sl = correctSl(
            _trade.openPrice,
            _trade.leverage,
            _trade.sl,
            _trade.buy
        );

        return (_trade.tp, _trade.sl);
    }

    /**
     * @dev Calculates market execution price based on '_price', '_spreadP' for short/long positions.
     */
    function marketExecutionPrice(
        uint256 _price,
        uint256 _spreadP,
        bool _long
    ) public pure returns (uint256) {
        uint256 priceDiff = (_price * _spreadP) / 100 / PRECISION;

        return _long ? _price + priceDiff : _price - priceDiff;
    }

    /**
     * @dev Makes pre-trade checks: price impact, if trade should be cancelled based on parameters like: PnL, leverage, slippage, etc.
     */
    function openTradePrep(
        ITizzTradingCallbacks.OpenTradePrepInput memory _input,
        ITizzFundingFees _fundingFees,
        ITizzTradingStorage _storageT,
        ITizzMultiCollatDiamond _multiCollatDiamond,
        ITizzPriceAggregator _aggregator
    )
        external
        view
        returns (
            uint256 priceImpactP,
            uint256 priceAfterImpact,
            ITizzTradingCallbacks.CancelReason cancelReason
        )
    {
        uint256 usdValue = _aggregator.getUsdNormalizedValue(
            _input.positionSize * _input.leverage
        );
        (priceImpactP, priceAfterImpact) = _multiCollatDiamond
            .getTradePriceImpact(
                marketExecutionPrice(
                    _input.executionPrice,
                    _input.spreadP,
                    _input.buy
                ),
                _input.pairIndex,
                _input.buy,
                usdValue
            );

        uint256 maxSlippage = _input.maxSlippageP > 0
            ? (_input.wantedPrice * _input.maxSlippageP) / 100 / PRECISION
            : _input.wantedPrice / 100; // 1% by default

        cancelReason = _input.isPaused
            ? ITizzTradingCallbacks.CancelReason.PAUSED
            : (
                _input.marketPrice == 0
                    ? ITizzTradingCallbacks.CancelReason.MARKET_CLOSED
                    : (
                        _input.buy
                            ? priceAfterImpact >
                                _input.wantedPrice + maxSlippage
                            : priceAfterImpact <
                                _input.wantedPrice - maxSlippage
                    )
                        ? ITizzTradingCallbacks.CancelReason.SLIPPAGE
                        : (_input.tp > 0 &&
                            (
                                _input.buy
                                    ? priceAfterImpact >= _input.tp
                                    : priceAfterImpact <= _input.tp
                            ))
                            ? ITizzTradingCallbacks.CancelReason.TP_REACHED
                            : (_input.sl > 0 &&
                                (
                                    _input.buy
                                        ? _input.executionPrice <= _input.sl
                                        : _input.executionPrice >= _input.sl
                                ))
                                ? ITizzTradingCallbacks.CancelReason.SL_REACHED
                                : !withinExposureLimits(
                                    _input.pairIndex,
                                    _input.buy,
                                    _input.positionSize,
                                    _input.leverage,
                                    _storageT,
                                    _fundingFees
                                )
                                    ? ITizzTradingCallbacks
                                        .CancelReason
                                        .EXPOSURE_LIMITS
                                    : priceImpactP * _input.leverage >
                                        MAX_OPEN_NEGATIVE_PNL_P
                                        ? ITizzTradingCallbacks
                                            .CancelReason
                                            .PRICE_IMPACT
                                        : _input.leverage >
                                            _multiCollatDiamond.pairMaxLeverage(
                                                _input.pairIndex
                                            )
                                            ? ITizzTradingCallbacks
                                                .CancelReason
                                                .MAX_LEVERAGE
                                            : ITizzTradingCallbacks
                                                .CancelReason
                                                .NONE
            );
    }

    /**
     * @dev Calls funding and multi collat diamond to update acc fees and price impact oi windows when registering a trade
     */
    function handleExternalOnRegisterUpdates(
        ITizzFundingFees _fundingFees,
        ITizzMultiCollatDiamond _multiCollatDiamond,
        ITizzPriceAggregator _aggregator,
        ITizzTradingStorage.Trade memory _trade,
        uint256 _levPosBaseAsset // 1e18 | 1e6
    ) external {
        _fundingFees.handleTradeAction(
            _trade.trader,
            _trade.pairIndex,
            _trade.index,
            _levPosBaseAsset,
            true,
            _trade.buy
        ); // funding fees
        _multiCollatDiamond.addPriceImpactOpenInterest(
            _aggregator.getUsdNormalizedValue(_levPosBaseAsset),
            _trade.pairIndex,
            _trade.buy
        ); // price impact oi windows
    }

    /**
     * @dev Updates a trade's `_tradeData` and `_lastUpdated` with the `_currBlock` and timestamp
     */
    function setTradeMetadata(
        ITizzTradingCallbacks.TradeData storage _tradeData,
        ITizzTradingCallbacks.LastUpdated storage _lastUpdated,
        uint256 _collateralPrice,
        uint32 _currBlock
    ) external {
        _tradeData.maxSlippageP = 0;
        _tradeData.lastOiUpdateTs = uint64(block.timestamp);
        _tradeData.collateralPriceUsd = _collateralPrice;

        _lastUpdated.tp = _currBlock;
        _lastUpdated.sl = _currBlock;
        _lastUpdated.created = _currBlock;
    }
}
