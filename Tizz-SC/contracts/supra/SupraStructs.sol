// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SupraStructs {
    /// @notice Verified price data
    struct PriceData {
        // List of pairs
        uint256[] pairs;
        // List of prices
        // prices[i] is the price of pairs[i]
        uint256[] prices;
        // List of decimals
        // decimals[i] is the decimals of pairs[i]
        uint256[] decimals;
    }

    struct derivedData {
        int256 roundDifference;
        uint256 derivedPrice;
        uint256 decimals;
    }

    struct priceFeed {
        uint256 round;
        uint256 decimals;
        uint256 time;
        uint256 price;
    }
}
