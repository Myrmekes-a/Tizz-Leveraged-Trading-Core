// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TizzAddressStore.sol";

import "../../interfaces/interface-libs/IPairsStorageUtils.sol";

import "../../libraries/PairsStorageUtils.sol";

/**
 * @custom:version 7
 * @custom:oz-upgrades-unsafe-allow external-library-linking
 */
abstract contract TizzPairsStorage is TizzAddressStore, IPairsStorageUtils {
    PairsStorage internal pairsStorage;

    function initializePairsStorage(
        uint256 _currentOrderId
    ) external reinitializer(2) {
        uint256 pairsStorageSlot;

        assembly {
            pairsStorageSlot := pairsStorage.slot
        }
        if (pairsStorageSlot != PairsStorageUtils.getSlot()) {
            revert WrongSlot();
        }

        PairsStorageUtils.initialize(_currentOrderId);
    }

    // Management Setters
    function addPairs(Pair[] calldata _pairs) external onlyRole(Role.GOV) {
        PairsStorageUtils.addPairs(_pairs);
    }

    function updatePairs(
        uint256[] calldata _pairIndices,
        Pair[] calldata _pairs
    ) external onlyRole(Role.GOV) {
        PairsStorageUtils.updatePairs(_pairIndices, _pairs);
    }

    function addGroups(Group[] calldata _groups) external onlyRole(Role.GOV) {
        PairsStorageUtils.addGroups(_groups);
    }

    function updateGroups(
        uint256[] calldata _ids,
        Group[] calldata _groups
    ) external onlyRole(Role.GOV) {
        PairsStorageUtils.updateGroups(_ids, _groups);
    }

    function addFees(Fee[] calldata _fees) external onlyRole(Role.GOV) {
        PairsStorageUtils.addFees(_fees);
    }

    function updateFees(
        uint256[] calldata _ids,
        Fee[] calldata _fees
    ) external onlyRole(Role.GOV) {
        PairsStorageUtils.updateFees(_ids, _fees);
    }

    function setPairCustomMaxLeverages(
        uint256[] calldata _indices,
        uint256[] calldata _values
    ) external onlyRole(Role.MANAGER) {
        PairsStorageUtils.setPairCustomMaxLeverages(_indices, _values);
    }

    // Interactions
    function pairJob(
        uint256 _pairIndex
    )
        external
        onlyRole(Role.AGGREGATOR)
        returns (string memory, string memory, bytes32, uint256)
    {
        return PairsStorageUtils.pairJob(_pairIndex);
    }

    function pairIdByJob(
        uint256 _pairIndex
    ) external onlyRole(Role.AGGREGATOR) returns (uint256, uint256) {
        return PairsStorageUtils.pairIdByJob(_pairIndex);
    }

    // Getters
    function currentOrderId() external view returns (uint256) {
        return pairsStorage.currentOrderId;
    }

    function isPairListed(
        string calldata _from,
        string calldata _to
    ) external view returns (bool) {
        return pairsStorage.isPairListed[_from][_to];
    }

    function pairs(uint256 _index) external view returns (Pair memory) {
        return pairsStorage.pairs[_index];
    }

    function pairsCount() external view returns (uint256) {
        return pairsStorage.pairsCount;
    }

    function pairFeed(uint256 _pairIndex) external view returns (Feed memory) {
        return pairsStorage.pairs[_pairIndex].feed;
    }

    function pairSpreadP(uint256 _pairIndex) external view returns (uint256) {
        return pairsStorage.pairs[_pairIndex].spreadP;
    }

    function pairMinLeverage(
        uint256 _pairIndex
    ) external view returns (uint256) {
        return
            pairsStorage
                .groups[pairsStorage.pairs[_pairIndex].groupIndex]
                .minLeverage;
    }

    function pairOpenFeeP(uint256 _pairIndex) external view returns (uint256) {
        return
            pairsStorage.fees[pairsStorage.pairs[_pairIndex].feeIndex].openFeeP;
    }

    function pairCloseFeeP(uint256 _pairIndex) external view returns (uint256) {
        return
            pairsStorage
                .fees[pairsStorage.pairs[_pairIndex].feeIndex]
                .closeFeeP;
    }

    function pairOracleFeeP(
        uint256 _pairIndex
    ) external view returns (uint256) {
        return
            pairsStorage
                .fees[pairsStorage.pairs[_pairIndex].feeIndex]
                .oracleFeeP;
    }

    function pairNftLimitOrderFeeP(
        uint256 _pairIndex
    ) external view returns (uint256) {
        return
            pairsStorage
                .fees[pairsStorage.pairs[_pairIndex].feeIndex]
                .nftLimitOrderFeeP;
    }

    function pairMinLevPosUsd(
        uint256 _pairIndex
    ) external view returns (uint256) {
        return
            pairsStorage
                .fees[pairsStorage.pairs[_pairIndex].feeIndex]
                .minLevPosUsd;
    }

    function groups(uint256 _index) external view returns (Group memory) {
        return pairsStorage.groups[_index];
    }

    function groupsCount() external view returns (uint256) {
        return pairsStorage.groupsCount;
    }

    function fees(uint256 _index) external view returns (Fee memory) {
        return pairsStorage.fees[_index];
    }

    function feesCount() external view returns (uint256) {
        return pairsStorage.feesCount;
    }

    function pairsBackend(
        uint256 _index
    ) external view returns (Pair memory, Group memory, Fee memory) {
        Pair memory p = pairsStorage.pairs[_index];
        return (
            p,
            pairsStorage.groups[p.groupIndex],
            pairsStorage.fees[p.feeIndex]
        );
    }

    function pairMaxLeverage(
        uint256 _pairIndex
    ) external view returns (uint256) {
        return PairsStorageUtils.pairMaxLeverage(_pairIndex);
    }

    function pairCustomMaxLeverage(
        uint256 _pairIndex
    ) external view returns (uint256) {
        return pairsStorage.pairCustomMaxLeverage[_pairIndex];
    }

    function getAllPairsRestrictedMaxLeverage()
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory lev = new uint256[](pairsStorage.pairsCount);

        if (pairsStorage.pairsCount == 0) {
            return lev;
        }
        for (uint256 i; i < pairsStorage.pairsCount; ++i) {
            lev[i] = pairsStorage.pairCustomMaxLeverage[i];
        }

        return lev;
    }
}
