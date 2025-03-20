// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @custom:version 6.3
 */
interface ITizzTradingPriceFeedManager {
    function updateRequestsStart(uint256 _newValue) external;

    function updateRequestsEvery(uint256 _newValue) external;

    function updateRequestsCount(uint256 _newValue) external;

    function updateRequestsInfoBatch(
        uint256 _newRequestsStart,
        uint256 _newRequestsEvery,
        uint256 _newRequestsCount
    ) external;

    function resetNextEpochValueRequests() external;

    function forceNewEpoch() external;

    function nextEpochValuesRequestCount() external view returns (uint256);

    function newOpenPnlRequestOrEpoch(bytes calldata _bytesProof) external;

    event NumberParamUpdated(string name, uint256 newValue);

    event OracleUpdated(address indexed newValue);

    event OracleStorageUpdated(address indexed newValue);

    event NextEpochValuesReset(
        uint256 indexed currEpoch,
        uint256 requestsResetCount
    );

    event NewEpochForced(uint256 indexed newEpoch);

    event NewEpoch(
        uint256 indexed newEpoch,
        uint256 indexed requestId,
        int256[] epochMedianValues,
        int256 epochAverageValue,
        uint256 newEpochPositiveOpenPnl
    );

    event RequestMedianValueSet(
        uint256 indexed currEpoch,
        int256[] requestValues,
        int256 medianValue
    );
}
