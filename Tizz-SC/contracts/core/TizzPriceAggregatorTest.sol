// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Initializable} from "../external/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeERC20} from "../external/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SupraOracleClient, SupraStructs, ISupraOraclePull, ISupraSValueFeed} from "../supra/SupraOracleClient.sol";

import "../interfaces/ITizzMultiCollatDiamond.sol";
import "../interfaces/ITizzTradingStorage.sol";
import "../interfaces/ITizzPriceAggregator.sol";
import "../interfaces/IERC20.sol";

import "../libraries/CollateralUtils.sol";
import "../commonLib/PackingUtils.sol";
import {Utils} from "../commonLib/Utils.sol";

/**
 * @custom:version 7
 * @custom:oz-upgrades-unsafe-allow external-library-linking
 */
contract TizzPriceAggregatorTest is
    Initializable,
    SupraOracleClient,
    ITizzPriceAggregator
{
    using PackingUtils for uint256;
    using SafeERC20 for IERC20;

    ITizzTradingStorage public storageT;
    ITizzMultiCollatDiamond public multiCollatDiamond;
    CollateralUtils.CollateralConfig public collateralConfig;

    uint256 public tokenOracleId;
    uint256 public collateralPairId;

    // Params (constant)
    uint256 private constant PRECISION = 1e10;

    bool public upMode;
    uint256 public deltaValue;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        ITizzTradingStorage _storageT,
        ITizzMultiCollatDiamond _multiCollatDiamond,
        uint256 _collateralPairId,
        ISupraOraclePull _supraOraclePull,
        ISupraSValueFeed _supraOracleStorage
    ) external initializer {
        _checkZero(address(_storageT));
        _checkZero(address(_multiCollatDiamond));
        _checkZero(address(_supraOraclePull));
        _checkZero(address(_supraOracleStorage));

        __initSupraOracle(_supraOraclePull, _supraOracleStorage);

        storageT = _storageT;
        multiCollatDiamond = _multiCollatDiamond;
        collateralPairId = _collateralPairId;
        tokenOracleId = storageT.tokenOracleId();
        address _collateral = storageT.baseAsset();
        collateralConfig = CollateralUtils.getCollateralConfig(_collateral);
        upMode = false;
        deltaValue = 0;
    }

    function setUpMode(bool _upMode) external {
        upMode = _upMode;
    }

    function setDeltaValue(uint256 _deltaValue) external {
        deltaValue = _deltaValue;
    }

    // Modifiers
    modifier onlyGov() {
        require(
            multiCollatDiamond.hasRole(msg.sender, IAddressStoreUtils.Role.GOV),
            "GOV_ONLY"
        );
        _;
    }
    modifier onlyTrading() {
        require(
            multiCollatDiamond.hasRole(
                msg.sender,
                IAddressStoreUtils.Role.TRADING
            ),
            "TRADING_ONLY"
        );
        _;
    }

    // Returns collateral usd price (1e10)
    function getCollateralPriceUsd() public view override returns (uint256) {
        return getPriceUsd(collateralPairId);
    }

    // Returns 1e18
    function getUsdNormalizedValue(
        uint256 _collateralValue
    ) external view override returns (uint256) {
        return
            (_collateralValue *
                collateralConfig.precisionDelta *
                getCollateralPriceUsd()) / PRECISION;
    }

    // Returns value as origin collateral decimals.
    // e.g. USDC: 6, BaseAsset: 18
    function getCollateralFromUsdNormalizedValue(
        uint256 _normalizedValue // 1e18
    ) external view override returns (uint256) {
        return
            (_normalizedValue * PRECISION) /
            getCollateralPriceUsd() /
            collateralConfig.precisionDelta;
    }

    function updateCollateralPairId(
        uint256 _newValue
    ) external override onlyGov {
        collateralPairId = _newValue;
        emit CollateralPriceIdUpdated(_newValue);
    }

    function updatePullAddress(
        ISupraOraclePull oracle_
    ) external virtual override onlyGov {
        _checkZero(address(oracle_));
        supra_pull = oracle_;
        emit SupraOracleUpdated(address(oracle_));
    }

    function updateStorageAddress(
        ISupraSValueFeed storage_
    ) external virtual override onlyGov {
        _checkZero(address(storage_));
        supra_storage = storage_;
        emit SupraOracleStorageUpdated(address(storage_));
    }

    function GetPairPrice(
        bytes calldata _bytesProof,
        uint256 pair
    ) public override returns (uint256) {
        SupraStructs.PriceData memory prices = supra_pull.verifyOracleProof(
            _bytesProof
        );
        uint256 price = 0;
        uint256 decimals = 0;
        uint256 length = prices.pairs.length;
        for (uint256 i = 0; i < length; i++) {
            if (prices.pairs[i] == pair) {
                price = prices.prices[i];
                decimals = prices.decimals[i];
                break;
            }
        }
        if (price == 0) {
            return 0;
        } else {
            uint256 pairPriceUsd = _getPairPriceUsd(price, decimals);
            if (pair != collateralPairId) {
                pairPriceUsd = upMode
                    ? pairPriceUsd + deltaValue
                    : pairPriceUsd - deltaValue;
            }
            return pairPriceUsd;
        }
    }

    function getPrice(
        uint256 _pairIndex,
        OrderType _orderType,
        ITizzTradingStorage.PendingMarketOrder memory _pendingOrder,
        ITizzTradingStorage.PendingNftOrder memory _pendingNft,
        bytes calldata _bytesproof
    ) external onlyTrading returns (uint256) {
        (uint256 pairId, uint256 orderId) = multiCollatDiamond.pairIdByJob(
            _pairIndex
        );
        (
            uint256 pairIndex,
            OrderType orderType,
            ITizzTradingStorage.PendingMarketOrder memory pendingOrder,
            ITizzTradingStorage.PendingNftOrder memory pendingNft
        ) = (_pairIndex, _orderType, _pendingOrder, _pendingNft);
        uint256 price = GetPairPrice(_bytesproof, pairId);
        GetPairPrice(_bytesproof, collateralPairId); // update collateral price
        bool isLookback = orderType ==
            ITizzPriceAggregator.OrderType.LIMIT_OPEN ||
            orderType == ITizzPriceAggregator.OrderType.LIMIT_CLOSE;

        ITizzMultiCollatDiamond.Feed memory feed = multiCollatDiamond.pairFeed(
            pairIndex
        );

        if (isLookback) {
            ITizzPriceAggregator.LookbackOrderAnswer memory newAnswer;
            (
                newAnswer.open,
                newAnswer.high,
                newAnswer.low,
                newAnswer.ts
            ) = price.unpack256To64();

            require(
                (newAnswer.high == 0 && newAnswer.low == 0) ||
                    (newAnswer.high >= newAnswer.open &&
                        newAnswer.low <= newAnswer.open &&
                        newAnswer.low > 0),
                "INVALID_CANDLE"
            );

            if (
                _isPriceWithinDeviation(
                    newAnswer.high,
                    price,
                    feed.maxDeviationP
                ) &&
                _isPriceWithinDeviation(
                    newAnswer.low,
                    price,
                    feed.maxDeviationP
                )
            ) {
                ITizzTradingCallbacks.AggregatorAnswer memory answer;
                (answer.orderId, answer.open, answer.high, answer.low) = (
                    orderId,
                    newAnswer.open,
                    newAnswer.high,
                    newAnswer.low
                );
                answer.spreadP = multiCollatDiamond.pairSpreadP(pairIndex);

                ITizzTradingCallbacks callbacks = ITizzTradingCallbacks(
                    storageT.callbacks()
                );

                if (orderType == ITizzPriceAggregator.OrderType.LIMIT_OPEN) {
                    callbacks.executeNftOpenOrderCallback(answer, pendingNft);
                } else {
                    callbacks.executeNftCloseOrderCallback(answer, pendingNft);
                }

                emit CallbackExecuted(answer, orderType);
            }
        } else {
            (uint64 packedPrice, , , ) = price.unpack256To64();

            if (
                _isPriceWithinDeviation(packedPrice, price, feed.maxDeviationP)
            ) {
                ITizzTradingCallbacks.AggregatorAnswer memory answer;
                (answer.orderId, answer.price, answer.spreadP) = (
                    orderId,
                    price,
                    multiCollatDiamond.pairSpreadP(pairIndex)
                );

                ITizzTradingCallbacks callbacks = ITizzTradingCallbacks(
                    storageT.callbacks()
                );

                if (orderType == ITizzPriceAggregator.OrderType.MARKET_OPEN) {
                    callbacks.openTradeMarketCallback(answer, pendingOrder);
                } else {
                    callbacks.closeTradeMarketCallback(answer, pendingOrder);
                }

                emit CallbackExecuted(answer, orderType);
            }
        }
        emit PriceReceived(pairId, _bytesproof, price);

        return orderId;
    }

    function _isPriceWithinDeviation(
        uint256 price,
        uint256 feedPrice,
        uint256 maxDeviationP
    ) private pure returns (bool) {
        return
            price == 0 ||
            feedPrice == 0 ||
            ((price >= feedPrice ? price - feedPrice : feedPrice - price) *
                PRECISION *
                100) /
                feedPrice <=
            maxDeviationP;
    }
}
