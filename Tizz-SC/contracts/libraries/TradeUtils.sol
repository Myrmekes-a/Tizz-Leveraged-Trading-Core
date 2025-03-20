// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/ITizzTradingCallbacks.sol";

/**
 * @custom:version 7
 */
library TradeUtils {
    function _getTradeLastUpdated(
        address _callbacks,
        address trader,
        uint256 pairIndex,
        uint256 index,
        ITizzTradingCallbacks.TradeType _type
    )
        internal
        view
        returns (
            ITizzTradingCallbacks,
            ITizzTradingCallbacks.LastUpdated memory,
            ITizzTradingCallbacks.SimplifiedTradeId memory
        )
    {
        ITizzTradingCallbacks callbacks = ITizzTradingCallbacks(_callbacks);
        ITizzTradingCallbacks.LastUpdated memory l = callbacks
            .getTradeLastUpdated(trader, pairIndex, index, _type);

        return (
            callbacks,
            l,
            ITizzTradingCallbacks.SimplifiedTradeId(
                trader,
                pairIndex,
                index,
                _type
            )
        );
    }

    function setTradeLastUpdated(
        address _callbacks,
        address trader,
        uint256 pairIndex,
        uint256 index,
        ITizzTradingCallbacks.TradeType _type,
        uint256 blockNumber
    ) external {
        uint32 b = uint32(blockNumber);
        ITizzTradingCallbacks callbacks = ITizzTradingCallbacks(_callbacks);
        callbacks.setTradeLastUpdated(
            ITizzTradingCallbacks.SimplifiedTradeId(
                trader,
                pairIndex,
                index,
                _type
            ),
            ITizzTradingCallbacks.LastUpdated(b, b, b, b)
        );
    }

    function setSlLastUpdated(
        address _callbacks,
        address trader,
        uint256 pairIndex,
        uint256 index,
        ITizzTradingCallbacks.TradeType _type,
        uint256 blockNumber
    ) external {
        (
            ITizzTradingCallbacks callbacks,
            ITizzTradingCallbacks.LastUpdated memory l,
            ITizzTradingCallbacks.SimplifiedTradeId memory id
        ) = _getTradeLastUpdated(_callbacks, trader, pairIndex, index, _type);

        l.sl = uint32(blockNumber);
        callbacks.setTradeLastUpdated(id, l);
    }

    function setTpLastUpdated(
        address _callbacks,
        address trader,
        uint256 pairIndex,
        uint256 index,
        ITizzTradingCallbacks.TradeType _type,
        uint256 blockNumber
    ) external {
        (
            ITizzTradingCallbacks callbacks,
            ITizzTradingCallbacks.LastUpdated memory l,
            ITizzTradingCallbacks.SimplifiedTradeId memory id
        ) = _getTradeLastUpdated(_callbacks, trader, pairIndex, index, _type);

        l.tp = uint32(blockNumber);
        callbacks.setTradeLastUpdated(id, l);
    }

    function setLimitMaxSlippageP(
        address _callbacks,
        address trader,
        uint256 pairIndex,
        uint256 index,
        uint256 maxSlippageP
    ) external {
        require(maxSlippageP <= type(uint40).max, "OVERFLOW");
        ITizzTradingCallbacks(_callbacks).setTradeData(
            ITizzTradingCallbacks.SimplifiedTradeId(
                trader,
                pairIndex,
                index,
                ITizzTradingCallbacks.TradeType.LIMIT
            ),
            ITizzTradingCallbacks.TradeData(uint40(maxSlippageP), 0, 0, 0)
        );
    }
}
