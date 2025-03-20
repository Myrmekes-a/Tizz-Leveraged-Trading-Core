// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/interface-libs/IPairsStorageUtils.sol";
import "./StorageUtils.sol";

/**
 * @custom:version 7
 *
 * @dev This is a library to manage the listed trading pairs.
 * TizzMultiCollatDiamond contains the storage and wrapper functions.
 */
library PairsStorageUtils {
    uint256 private constant MIN_LEVERAGE = 2;
    uint256 private constant MAX_LEVERAGE = 1000;

    // Events are in IPairsStorageUtils but have to be duplicated in library for now
    event PairAdded(uint256 index, string from, string to);
    event PairUpdated(uint256 index);
    event PairCustomMaxLeverageUpdated(
        uint256 indexed index,
        uint256 maxLeverage
    );
    event GroupAdded(uint256 index, string name);
    event GroupUpdated(uint256 index);
    event FeeAdded(uint256 index, string name);
    event FeeUpdated(uint256 index);

    /**
     * @dev Returns storage slot to use when fetching storage relevant to library
     */
    function getSlot() public pure returns (uint256) {
        return StorageUtils.GLOBAL_PAIRS_STORAGE_SLOT;
    }

    /**
     * @dev Returns storage pointer for PairsStorage struct in global diamond contract, at defined slot
     */
    function _getStorage()
        private
        pure
        returns (IPairsStorageUtils.PairsStorage storage s)
    {
        uint256 storageSlot = getSlot();
        assembly {
            s.slot := storageSlot
        }
    }

    /**
     * @dev Initialize {PairsStorage} diamond storage.
     */
    function initialize(uint256 _currentOrderId) external {
        require(_currentOrderId > 0, "ORDER_ID_ZERO");
        _getStorage().currentOrderId = _currentOrderId;
    }

    modifier groupListed(uint256 _groupIndex) {
        require(
            _getStorage().groups[_groupIndex].minLeverage > 0,
            "GROUP_NOT_LISTED"
        );
        _;
    }
    modifier feeListed(uint256 _feeIndex) {
        require(_getStorage().fees[_feeIndex].openFeeP > 0, "FEE_NOT_LISTED");
        _;
    }

    modifier feedOk(IPairsStorageUtils.Feed calldata _feed) {
        require(
            _feed.maxDeviationP > 0 && _feed.feed1 != address(0),
            "WRONG_FEED"
        );
        require(
            _feed.feedCalculation !=
                IPairsStorageUtils.FeedCalculation.COMBINE ||
                _feed.feed2 != address(0),
            "FEED_2_MISSING"
        );
        _;
    }
    modifier groupOk(IPairsStorageUtils.Group calldata _group) {
        require(_group.job != bytes32(0), "JOB_EMPTY");
        require(
            _group.minLeverage >= MIN_LEVERAGE &&
                _group.maxLeverage <= MAX_LEVERAGE &&
                _group.minLeverage < _group.maxLeverage,
            "WRONG_LEVERAGES"
        );
        _;
    }
    modifier feeOk(IPairsStorageUtils.Fee calldata _fee) {
        require(
            _fee.openFeeP > 0 &&
                _fee.closeFeeP > 0 &&
                _fee.oracleFeeP > 0 &&
                _fee.nftLimitOrderFeeP > 0 &&
                _fee.minLevPosUsd > 0,
            "WRONG_FEES"
        );
        _;
    }

    // Manage pairs
    function _addPair(
        IPairsStorageUtils.Pair calldata _pair
    )
        private
        feedOk(_pair.feed)
        groupListed(_pair.groupIndex)
        feeListed(_pair.feeIndex)
    {
        IPairsStorageUtils.PairsStorage storage s = _getStorage();
        require(!s.isPairListed[_pair.from][_pair.to], "PAIR_ALREADY_LISTED");

        s.pairs[s.pairsCount] = _pair;
        s.isPairListed[_pair.from][_pair.to] = true;

        emit PairAdded(s.pairsCount++, _pair.from, _pair.to);
    }

    function addPairs(IPairsStorageUtils.Pair[] calldata _pairs) external {
        uint256 length = _pairs.length;
        require(length > 0, "INVALID_ARRAY_LENGTH");
        for (uint256 i = 0; i < length; ++i) {
            _addPair(_pairs[i]);
        }
    }

    function _updatePair(
        uint256 _pairIndex,
        IPairsStorageUtils.Pair calldata _pair
    )
        private
        feedOk(_pair.feed)
        groupListed(_pair.groupIndex)
        feeListed(_pair.feeIndex)
    {
        IPairsStorageUtils.PairsStorage storage s = _getStorage();

        IPairsStorageUtils.Pair storage p = s.pairs[_pairIndex];
        require(s.isPairListed[p.from][p.to], "PAIR_NOT_LISTED");

        p.feed = _pair.feed;
        p.spreadP = _pair.spreadP;
        p.groupIndex = _pair.groupIndex;
        p.feeIndex = _pair.feeIndex;

        emit PairUpdated(_pairIndex);
    }

    function updatePairs(
        uint256[] calldata _pairIndices,
        IPairsStorageUtils.Pair[] calldata _pairs
    ) external {
        uint256 length = _pairs.length;
        require(
            _pairIndices.length == length || length > 0,
            "INVALID_ARRAY_LENGTH"
        );

        for (uint256 i = 0; i < length; ++i) {
            _updatePair(_pairIndices[i], _pairs[i]);
        }
    }

    function setPairCustomMaxLeverages(
        uint256[] calldata _indices,
        uint256[] calldata _values
    ) external {
        uint256 length = _values.length;
        require(
            _indices.length == length || length > 0,
            "INVALID_ARRAY_LENGTH"
        );

        IPairsStorageUtils.PairsStorage storage s = _getStorage();

        for (uint256 i; i < length; ++i) {
            s.pairCustomMaxLeverage[_indices[i]] = _values[i];

            emit PairCustomMaxLeverageUpdated(_indices[i], _values[i]);
        }
    }

    // Manage groups
    function _addGroup(
        IPairsStorageUtils.Group calldata _group
    ) private groupOk(_group) {
        IPairsStorageUtils.PairsStorage storage s = _getStorage();
        s.groups[s.groupsCount] = _group;

        emit GroupAdded(s.groupsCount++, _group.name);
    }

    function addGroups(IPairsStorageUtils.Group[] calldata _groups) external {
        uint256 length = _groups.length;
        require(length > 0, "INVALID_ARRAY_LENGTH");
        for (uint256 i = 0; i < length; ++i) {
            _addGroup(_groups[i]);
        }
    }

    function _updateGroup(
        uint256 _id,
        IPairsStorageUtils.Group calldata _group
    ) private groupListed(_id) groupOk(_group) {
        _getStorage().groups[_id] = _group;

        emit GroupUpdated(_id);
    }

    function updateGroups(
        uint256[] calldata _ids,
        IPairsStorageUtils.Group[] calldata _groups
    ) external {
        uint256 length = _ids.length;
        require(length == _groups.length && length > 0, "INVALID_ARRAY_LENGTH");

        for (uint256 i = 0; i < length; ++i) {
            _updateGroup(_ids[i], _groups[i]);
        }
    }

    // Manage fees
    function _addFee(IPairsStorageUtils.Fee calldata _fee) private feeOk(_fee) {
        IPairsStorageUtils.PairsStorage storage s = _getStorage();
        s.fees[s.feesCount] = _fee;

        emit FeeAdded(s.feesCount++, _fee.name);
    }

    function addFees(IPairsStorageUtils.Fee[] calldata _fees) external {
        uint256 length = _fees.length;
        require(length > 0, "INVALID_ARRAY_LENGTH");
        for (uint256 i = 0; i < length; ++i) {
            _addFee(_fees[i]);
        }
    }

    function _updateFee(
        uint256 _id,
        IPairsStorageUtils.Fee calldata _fee
    ) private feeListed(_id) feeOk(_fee) {
        _getStorage().fees[_id] = _fee;

        emit FeeUpdated(_id);
    }

    function updateFees(
        uint256[] calldata _ids,
        IPairsStorageUtils.Fee[] calldata _fees
    ) external {
        uint256 length = _fees.length;
        require(_ids.length == length && length > 0, "INVALID_ARRAY_LENGTH");

        for (uint256 i = 0; i < length; ++i) {
            _updateFee(_ids[i], _fees[i]);
        }
    }

    // Fetch relevant info for order (aggregator)
    function pairJob(
        uint256 _pairIndex
    ) external returns (string memory, string memory, bytes32, uint256) {
        IPairsStorageUtils.PairsStorage storage s = _getStorage();
        IPairsStorageUtils.Pair memory p = s.pairs[_pairIndex];
        require(s.isPairListed[p.from][p.to], "PAIR_NOT_LISTED");

        return (p.from, p.to, s.groups[p.groupIndex].job, s.currentOrderId++);
    }

    function pairIdByJob(
        uint256 _pairIndex
    ) external returns (uint256, uint256) {
        IPairsStorageUtils.PairsStorage storage s = _getStorage();

        return (s.pairs[_pairIndex].pairId, s.currentOrderId++);
    }

    function getFeeIndex(uint256 _pairIndex) external view returns (uint256) {
        return _getStorage().pairs[_pairIndex].feeIndex;
    }

    function pairMaxLeverage(
        uint256 _pairIndex
    ) external view returns (uint256) {
        IPairsStorageUtils.PairsStorage storage s = _getStorage();

        uint256 maxLeverage = s.pairCustomMaxLeverage[_pairIndex];
        return
            maxLeverage > 0
                ? maxLeverage
                : s.groups[s.pairs[_pairIndex].groupIndex].maxLeverage;
    }
}
