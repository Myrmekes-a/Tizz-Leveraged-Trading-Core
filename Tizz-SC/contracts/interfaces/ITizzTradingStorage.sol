// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ITizzPriceAggregator.sol";
import "./IERC20.sol";

/**
 * @custom:version 7
 */
interface ITizzTradingStorage {
    enum LimitOrder {
        TP,
        SL,
        LIQ,
        OPEN
    }

    enum OpenLimitOrderType {
        MARKET,
        LIMIT,
        STOP_LIMIT
    }

    struct PerpsTrade {
        uint256 openPrice;
        uint256 openCount;
    }

    struct Trade {
        address trader;
        uint256 pairIndex;
        uint256 index;
        uint256 initialPosToken; // 1e18
        uint256 positionSizeBaseAsset; // 1e18 | 1e6
        uint256 openPrice; // PRECISION
        bool buy;
        uint256 leverage;
        uint256 tp; // PRECISION
        uint256 sl; // PRECISION
    }
    struct TradeInfo {
        uint256 tokenPriceBaseAsset; // PRECISION
        uint256 openInterestBaseAsset; // 1e18 | 1e6
        uint256 tpLastUpdated;
        uint256 slLastUpdated;
        bool beingMarketClosed;
    }
    struct OrderTradeInfo {
        uint256 leverage;
        uint256 tp; // PRECISION (%)
        uint256 sl; // PRECISION (%)
        uint256 minPrice; // PRECISION
        uint256 maxPrice; // PRECISION
        uint256 block;
    }

    struct OpenLimitOrder {
        address trader;
        uint256 pairIndex;
        uint256 index;
        uint256 positionSize; // 1e18 | 1e6
        bool buy;
        OrderTradeInfo orderTradeInfo;
    }
    struct PendingMarketOrder {
        Trade trade;
        uint256 block;
        uint256 wantedPrice; // PRECISION
        uint256 slippageP; // PRECISION (%)
        uint256 spreadReductionP;
    }
    struct PendingNftOrder {
        address nftHolder;
        uint256 nftId;
        address trader;
        uint256 pairIndex;
        uint256 index;
        LimitOrder orderType;
    }

    function PRECISION() external pure returns (uint256);

    function gov() external view returns (address);

    function baseAsset() external view returns (address);

    function token() external view returns (address);

    function tokenOracleId() external view returns (uint256);

    function priceAggregator() external view returns (ITizzPriceAggregator);

    function vault() external view returns (address);

    function callbacks() external view returns (address);

    function transferBaseAsset(
        address,
        address,
        uint256
    ) external returns (uint256);

    function unregisterTrade(address, uint256, uint256) external;

    function unregisterOpenLimitOrder(address, uint256, uint256) external;

    function hasOpenLimitOrder(
        address,
        uint256,
        uint256
    ) external view returns (bool);

    function openTrades(
        address,
        uint256,
        uint256
    ) external view returns (Trade memory);

    function openTradesInfo(
        address,
        uint256,
        uint256
    ) external view returns (TradeInfo memory);

    function updateSl(address, uint256, uint256, uint256) external;

    function updateTp(address, uint256, uint256, uint256) external;

    function getOpenLimitOrder(
        address,
        uint256,
        uint256
    ) external view returns (OpenLimitOrder memory);

    function getOpenLimitOrders()
        external
        view
        returns (OpenLimitOrder[] memory);

    function openLimitOrderTypes(
        address,
        uint256,
        uint256
    ) external view returns (OpenLimitOrderType);

    function spreadReductionsP(uint256) external view returns (uint256);

    function setOpenLimitOrderType(
        address _trader,
        uint256 _pairIndex,
        uint256 _index,
        OpenLimitOrderType _type
    ) external;

    function storeOpenLimitOrder(OpenLimitOrder memory) external;

    function updateOpenLimitOrder(OpenLimitOrder calldata) external;

    function firstEmptyTradeIndex(
        address,
        uint256
    ) external view returns (uint256);

    function firstEmptyOpenLimitIndex(
        address,
        uint256
    ) external view returns (uint256);

    function nftSuccessTimelock() external view returns (uint256);

    function updateTrade(Trade memory) external;

    function storeTrade(Trade memory, TradeInfo memory) external;

    function openLimitOrdersCount(
        address,
        uint256
    ) external view returns (uint256);

    function openTradesCount(address, uint256) external view returns (uint256);

    function maxTradesPerPair() external view returns (uint256);

    function openInterestBaseAsset(
        uint256,
        uint256
    ) external view returns (uint256);

    function getPersPrice(uint256 pairIndex) external view returns (uint256);
}
