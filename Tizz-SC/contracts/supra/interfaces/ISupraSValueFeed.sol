// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../SupraStructs.sol";
interface ISupraSValueFeed {
    /// @notice Function to retrive the data for single data pair.
    function getSvalue(
        uint256 _pairId
    ) external view returns (SupraStructs.priceFeed memory);

    /// @notice Function fetch the data for multiple data pairs.
    function getSvalues(
        uint256[] memory _pairIds
    ) external view returns (SupraStructs.priceFeed[] memory);

    /// @notice Function to convert and derive new data pairs using
    ///         two pair IDs and a mathmatical operator (*) or (/)
    function getDerivedSvalue(
        uint256 pair_id_1,
        uint256 pair_id_2,
        uint256 operation
    ) external view returns (SupraStructs.derivedData memory);

    /// @notice Function to check the latest timestamp on which data pair is updated.
    ///         This will help you check the staleness of a data pair before performing an action.
    function getTimestamp(uint256 _tradingPair) external view returns (uint256);
}
