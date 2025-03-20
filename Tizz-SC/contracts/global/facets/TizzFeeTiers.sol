// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TizzAddressStore.sol";

import "../../interfaces/interface-libs/IFeeTiersUtils.sol";

import "../../libraries/FeeTiersUtils.sol";
import "../../libraries/PairsStorageUtils.sol";

/**
 * @custom:version 7
 * @custom:oz-upgrades-unsafe-allow external-library-linking
 */
abstract contract TizzFeeTiers is TizzAddressStore, IFeeTiersUtils {
    FeeTiersStorage internal feeTiersStorage;

    function initializeFeeTiers(
        uint256[] calldata _groupIndices,
        uint256[] calldata _groupVolumeMultipliers,
        uint256[] calldata _feeTiersIndices,
        IFeeTiersUtils.FeeTier[] calldata _feeTiers
    ) external reinitializer(4) {
        uint256 feeTiersSlot;

        assembly {
            feeTiersSlot := feeTiersStorage.slot
        }
        if (feeTiersSlot != FeeTiersUtils.getSlot()) {
            revert WrongSlot();
        }

        FeeTiersUtils.initialize(
            _groupIndices,
            _groupVolumeMultipliers,
            _feeTiersIndices,
            _feeTiers
        );
    }

    // Management Setters
    function setGroupVolumeMultipliers(
        uint256[] calldata _groupIndices,
        uint256[] calldata _groupVolumeMultipliers
    ) external onlyRole(Role.GOV) {
        FeeTiersUtils.setGroupVolumeMultipliers(
            _groupIndices,
            _groupVolumeMultipliers
        );
    }

    function setFeeTiers(
        uint256[] calldata _feeTiersIndices,
        IFeeTiersUtils.FeeTier[] calldata _feeTiers
    ) external onlyRole(Role.GOV) {
        FeeTiersUtils.setFeeTiers(_feeTiersIndices, _feeTiers);
    }

    // Interactions
    function updateTraderPoints(
        address _trader,
        uint256 _volumeUsd, // 1e18
        uint256 _pairIndex
    ) external onlyRole(Role.CALLBACKS) {
        FeeTiersUtils.updateTraderPoints(
            _trader,
            _volumeUsd,
            PairsStorageUtils.getFeeIndex(_pairIndex)
        );
    }

    // Getters
    function calculateFeeAmount(
        address _trader,
        uint256 _normalFeeAmount
    ) external view returns (uint256) {
        return FeeTiersUtils.calculateFeeAmount(_trader, _normalFeeAmount);
    }

    function getFeeTiersCount() external view returns (uint256) {
        return FeeTiersUtils.getFeeTiersCount(feeTiersStorage.feeTiers);
    }

    function getFeeTier(
        uint256 _feeTierIndex
    ) external view returns (IFeeTiersUtils.FeeTier memory) {
        return feeTiersStorage.feeTiers[_feeTierIndex];
    }

    function getGroupVolumeMultiplier(
        uint256 _groupIndex
    ) external view returns (uint256) {
        return feeTiersStorage.groupVolumeMultipliers[_groupIndex];
    }

    function getFeeTiersTraderInfo(
        address _trader
    ) external view returns (IFeeTiersUtils.TraderInfo memory) {
        return feeTiersStorage.traderInfos[_trader];
    }

    function getFeeTiersTraderDailyInfo(
        address _trader,
        uint32 _day
    ) external view returns (IFeeTiersUtils.TraderDailyInfo memory) {
        return feeTiersStorage.traderDailyInfos[_trader][_day];
    }
}
