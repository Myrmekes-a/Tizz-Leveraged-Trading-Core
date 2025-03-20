// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {SupraOracleClient, ISupraOraclePull, ISupraSValueFeed} from "../supra/SupraOracleClient.sol";
import "../interfaces/ITizzTradingPriceFeedManager.sol";
import "../interfaces/ITizzPriceAggregator.sol";
import "../interfaces/IOwnable.sol";
import "../interfaces/ITizzVaultToken.sol";

import {Utils} from "../commonLib/Utils.sol";

contract TizzTradingPriceFeedManager is
    SupraOracleClient,
    ITizzTradingPriceFeedManager
{
    ITizzVaultToken public tToken;

    address public owner;
    uint256 public requestsStart = 2 days;
    uint256 public requestsEvery = 6 hours;
    uint256 public requestsCount = 4;
    uint256[] public oraclePairIds;

    // Constants
    uint256 constant MIN_REQUESTS_START = 1 hours;
    uint256 constant MAX_REQUESTS_START = 1 weeks;
    uint256 constant MIN_REQUESTS_EVERY = 1 hours;
    uint256 constant MAX_REQUESTS_EVERY = 1 days;
    uint256 constant MIN_REQUESTS_COUNT = 3;
    uint256 constant MAX_REQUESTS_COUNT = 10;

    // State
    int256[] public nextEpochValues;
    uint256 public nextEpochValuesRequestCount;
    uint256 public nextEpochValuesLastRequest;
    uint256 public lastRequestId;

    constructor(
        ISupraOraclePull _oracle,
        ISupraSValueFeed _storage,
        uint256[] memory _oraclePairIds
    ) {
        require(
            address(_oracle) != address(0) &&
                address(_storage) != address(0) &&
                _oraclePairIds.length > 0,
            "WRONG_PARAMS"
        );

        oraclePairIds = Utils.sortAll(_oraclePairIds);
        owner = msg.sender;

        __initSupraOracle(_oracle, _storage);
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    modifier onlyTizzVaultTokenOwner() {
        // 2-week timelock
        require(msg.sender == IOwnable(address(tToken)).owner(), "ONLY_OWNER");
        _;
    }

    modifier onlyTizzVaultTokenAdmin() {
        // bypasses timelock, emergency functions only
        require(msg.sender == tToken.admin(), "ONLY_ADMIN");
        _;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "ZERO_ADDRESS");
        owner = _newOwner;
    }

    function setTizzVaultToken(ITizzVaultToken _tToken) external onlyOwner {
        require(address(_tToken) != address(0), "WRONG_PARAMS");
        tToken = _tToken;
    }

    function updateRequestsStart(
        uint256 _newValue
    ) public override onlyTizzVaultTokenOwner {
        require(_newValue >= MIN_REQUESTS_START, "BELOW_MIN");
        require(_newValue <= MAX_REQUESTS_START, "ABOVE_MAX");
        requestsStart = _newValue;
        emit NumberParamUpdated("requestsStart", _newValue);
    }

    function updateRequestsEvery(
        uint256 _newValue
    ) public override onlyTizzVaultTokenOwner {
        require(_newValue >= MIN_REQUESTS_EVERY, "BELOW_MIN");
        require(_newValue <= MAX_REQUESTS_EVERY, "ABOVE_MAX");
        requestsEvery = _newValue;
        emit NumberParamUpdated("requestsEvery", _newValue);
    }

    function updateRequestsCount(
        uint256 _newValue
    ) public override onlyTizzVaultTokenOwner {
        require(_newValue >= MIN_REQUESTS_COUNT, "BELOW_MIN");
        require(_newValue <= MAX_REQUESTS_COUNT, "ABOVE_MAX");
        requestsCount = _newValue;
        emit NumberParamUpdated("requestsCount", _newValue);
    }

    function updateRequestsInfoBatch(
        uint256 _newRequestsStart,
        uint256 _newRequestsEvery,
        uint256 _newRequestsCount
    ) external override onlyTizzVaultTokenOwner {
        updateRequestsStart(_newRequestsStart);
        updateRequestsEvery(_newRequestsEvery);
        updateRequestsCount(_newRequestsCount);
    }

    function updatePullAddress(
        ISupraOraclePull oracle_
    ) external virtual override onlyTizzVaultTokenOwner {
        _checkZero(address(oracle_));
        supra_pull = oracle_;
        emit OracleUpdated(address(oracle_));
    }

    function updateStorageAddress(
        ISupraSValueFeed storage_
    ) external virtual override onlyTizzVaultTokenOwner {
        _checkZero(address(storage_));
        supra_storage = storage_;
        emit OracleStorageUpdated(address(storage_));
    }

    function resetNextEpochValueRequests()
        external
        override
        onlyTizzVaultTokenAdmin
    {
        uint256 reqToResetCount = nextEpochValuesRequestCount;
        require(reqToResetCount > 0, "NO_REQUEST_TO_RESET");

        delete nextEpochValues;

        nextEpochValuesRequestCount = 0;
        nextEpochValuesLastRequest = 0;

        emit NextEpochValuesReset(tToken.currentEpoch(), reqToResetCount);
    }

    function forceNewEpoch() external override {
        require(
            block.timestamp - tToken.currentEpochStart() >=
                requestsStart + requestsEvery * requestsCount,
            "TOO_EARLY"
        );
        uint256 newEpoch = _startNewEpoch();
        emit NewEpochForced(newEpoch);
    }

    function newOpenPnlRequestOrEpoch(
        bytes calldata _bytesProof
    ) external override {
        bool firstRequest = nextEpochValuesLastRequest == 0;
        uint256 curTime = block.timestamp;

        require(
            (firstRequest &&
                curTime - tToken.currentEpochStart() >= requestsStart) ||
                (!firstRequest &&
                    curTime - nextEpochValuesLastRequest >= requestsEvery),
            "TOO_EARLY"
        );

        if (
            firstRequest &&
            block.timestamp - tToken.currentEpochStart() >= requestsStart
        ) {
            _makeOpenPnlRequest(_bytesProof);
        } else if (
            !firstRequest &&
            block.timestamp - nextEpochValuesLastRequest >= requestsEvery
        ) {
            if (nextEpochValuesRequestCount < requestsCount) {
                _makeOpenPnlRequest(_bytesProof);
            } else if (nextEpochValues.length >= requestsCount) {
                _startNewEpoch();
            }
        }
    }

    function getNextEpochValues() external view returns (int256[] memory) {
        return nextEpochValues;
    }

    function _startNewEpoch() internal returns (uint256 newEpoch) {
        nextEpochValuesRequestCount = 0;
        nextEpochValuesLastRequest = 0;

        uint256 currentEpochPositiveOpenPnl = tToken
            .currentEpochPositiveOpenPnl();

        // If all responses arrived, use mean, otherwise it means we forced a new epoch,
        // so as a safety we use the last epoch value
        int256 newEpochOpenPnl = nextEpochValues.length >= requestsCount
            ? Utils.average(nextEpochValues)
            : int256(currentEpochPositiveOpenPnl);

        uint256 finalNewEpochPositiveOpenPnl = tToken.updateAccPnlPerTokenUsed(
            currentEpochPositiveOpenPnl,
            newEpochOpenPnl > 0 ? uint256(newEpochOpenPnl) : 0
        );

        newEpoch = tToken.currentEpoch();

        emit NewEpoch(
            newEpoch,
            lastRequestId,
            nextEpochValues,
            newEpochOpenPnl,
            finalNewEpochPositiveOpenPnl
        );

        delete nextEpochValues;
    }

    function _makeOpenPnlRequest(bytes calldata _bytesProof) internal {
        int256[] memory answers = GetPairPrices(_bytesProof, oraclePairIds);
        nextEpochValuesRequestCount++;
        lastRequestId++;
        nextEpochValuesLastRequest = block.timestamp;

        uint256 currentEpoch = tToken.currentEpoch();
        int256 medianValue = Utils.median(answers);
        nextEpochValues.push(medianValue);

        emit RequestMedianValueSet(currentEpoch, answers, medianValue);
    }
}
