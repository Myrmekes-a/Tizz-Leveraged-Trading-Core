// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ITizzMultiCollatDiamond.sol";
import "./ITizzTradingCallbacks.sol";
import "./ITizzTradingStorage.sol";
import "./ITizzMultiCollatDiamond.sol";
import {IUniswapV3Pool} from "../external/@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

/**
 * @custom:version 7
 */
interface ITizzPriceAggregator {
    enum OrderType {
        MARKET_OPEN,
        MARKET_CLOSE,
        LIMIT_OPEN,
        LIMIT_CLOSE
    }

    struct LookbackOrderAnswer {
        uint64 open;
        uint64 high;
        uint64 low;
        uint64 ts;
    }

    function getCollateralPriceUsd() external view returns (uint256);

    function getUsdNormalizedValue(
        uint256 collateralValue // 1e18 | 1e6
    ) external view returns (uint256);

    function getCollateralFromUsdNormalizedValue(
        uint256 normalizedValue // (1e18 USD)
    ) external view returns (uint256);

    // SupraPriceAggregator
    function updateCollateralPairId(uint256 _newValue) external;

    function getPrice(
        uint256 _pairIndex,
        OrderType _orderType,
        ITizzTradingStorage.PendingMarketOrder memory _pendingOrder,
        ITizzTradingStorage.PendingNftOrder memory _pendingNft,
        bytes calldata _bytesproof
    ) external returns (uint256);

    event CollateralPriceIdUpdated(uint256 value);

    event SupraOracleUpdated(address indexed value);

    event SupraOracleStorageUpdated(address indexed value);

    event PriceReceived(
        uint256 indexed pairId,
        bytes bytesproof,
        uint256 indexed price
    );

    event CallbackExecuted(
        ITizzTradingCallbacks.AggregatorAnswer answer,
        ITizzPriceAggregator.OrderType orderType
    );
}
