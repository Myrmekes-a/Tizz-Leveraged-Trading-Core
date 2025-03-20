// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ITizzTradingStorage.sol";

/**
 * @custom:version 6.4.2
 */
interface ITizzTrading {
    struct TriggerOrderParams {
        address trader;
        uint256 pairIndex;
        uint256 index;
        ITizzTradingStorage.LimitOrder orderType;
        bool isOpenLimit;
        bytes bytesproof;
    }

    event Done(bool done);
    event Paused(bool paused);

    event NumberUpdated(string name, uint256 value);

    event MarketOrderInitiated(
        uint256 indexed orderId,
        address indexed trader,
        uint256 indexed pairIndex,
        bool open
    );

    event OpenLimitPlaced(
        address indexed trader,
        uint256 indexed pairIndex,
        uint256 index
    );
    event OpenLimitUpdated(
        address indexed trader,
        uint256 indexed pairIndex,
        uint256 index,
        uint256 newPrice,
        uint256 newTp,
        uint256 newSl,
        uint256 maxSlippageP
    );
    event OpenLimitCanceled(
        address indexed trader,
        uint256 indexed pairIndex,
        uint256 index
    );

    event TpUpdated(
        address indexed trader,
        uint256 indexed pairIndex,
        uint256 index,
        uint256 newTp
    );
    event SlUpdated(
        address indexed trader,
        uint256 indexed pairIndex,
        uint256 index,
        uint256 newSl
    );

    event OrderTriggered(
        uint256 orderId,
        address indexed trader,
        uint256 indexed pairIndex,
        ITizzTradingStorage.LimitOrder orderType
    );

    event CouldNotCloseTrade(
        address indexed trader,
        uint256 indexed pairIndex,
        uint256 index
    );
}
