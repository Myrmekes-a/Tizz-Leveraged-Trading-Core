// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/ITizzMultiCollatDiamond.sol";

import "./StorageUtils.sol";

/**
 * @custom:version 7
 *
 * @dev This is a library to apply fee tiers to trading fees based on a trailing point system.
 *
 * TizzMultiCollatDiamond contains the storage and wrapper functions.
 * TizzTradingCallbacks calls the wrappers in TizzMultiCollatDiamond to apply fee tiers and update a trader's points.
 */
library FeeTiersUtils {
    uint256 private constant MAX_FEE_TIERS = 8;
    uint32 private constant TRAILING_PERIOD_DAYS = 30;
    uint32 private constant FEE_MULTIPLIER_SCALE = 1e3;
    uint224 private constant POINTS_THRESHOLD_SCALE = 1e18;
    uint256 private constant GROUP_VOLUME_MULTIPLIER_SCALE = 1e3;

    // Keep errors in library instead of IFeeTiersUtils to not conflict (ITizzMultiCollatDiamond inherits from multiple libraries interfaces)
    error ZeroAddress();
    error WrongFeeTier();
    error WrongOrder();
    error WrongLength();

    // Events are in IFeeTiersUtils but have to be duplicated in library for now
    event GroupVolumeMultipliersUpdated(
        uint256[] groupIndices,
        uint256[] groupVolumeMultipliers
    );
    event FeeTiersUpdated(
        uint256[] feeTiersIndices,
        IFeeTiersUtils.FeeTier[] feeTiers
    );
    event TraderDailyPointsIncreased(
        address indexed trader,
        uint32 indexed day,
        uint224 points
    );
    event TraderInfoFirstUpdate(address indexed trader, uint32 day);
    event TraderTrailingPointsExpired(
        address indexed trader,
        uint32 fromDay,
        uint32 toDay,
        uint224 amount
    );
    event TraderInfoUpdated(
        address indexed trader,
        IFeeTiersUtils.TraderInfo traderInfo
    );
    event TraderFeeMultiplierCached(
        address indexed trader,
        uint32 indexed day,
        uint32 feeMultiplier
    );

    /**
     * @dev Returns storage slot to use when fetching storage relevant to library
     */
    function getSlot() public pure returns (uint256) {
        return StorageUtils.GLOBAL_FEE_TIERS_STORAGE_SLOT;
    }

    /**
     * @dev Returns storage pointer for FeeTiersStorage struct in diamond contract, at defined slot
     */
    function _getStorage()
        private
        pure
        returns (ITizzMultiCollatDiamond.FeeTiersStorage storage s)
    {
        uint256 storageSlot = getSlot();
        assembly {
            s.slot := storageSlot
        }
    }

    /**
     * @dev Initialize diamond storage.
     */
    function initialize(
        uint256[] calldata _groupIndices,
        uint256[] calldata _groupVolumeMultipliers,
        uint256[] calldata _feeTiersIndices,
        IFeeTiersUtils.FeeTier[] calldata _feeTiers
    ) external {
        setGroupVolumeMultipliers(_groupIndices, _groupVolumeMultipliers);
        setFeeTiers(_feeTiersIndices, _feeTiers);
    }

    /**
     * @dev Set groups trading volume multipliers.
     */
    function setGroupVolumeMultipliers(
        uint256[] calldata _groupIndices,
        uint256[] calldata _groupVolumeMultipliers
    ) public {
        uint256 length = _groupIndices.length;
        if (length != _groupVolumeMultipliers.length || length == 0) {
            revert WrongLength();
        }

        mapping(uint256 => uint256)
            storage groupVolumeMultipliers = _getStorage()
                .groupVolumeMultipliers;

        for (uint256 i; i < length; ++i) {
            groupVolumeMultipliers[_groupIndices[i]] = _groupVolumeMultipliers[
                i
            ];
        }

        emit GroupVolumeMultipliersUpdated(
            _groupIndices,
            _groupVolumeMultipliers
        );
    }

    /**
     * @dev Checks validity of a single fee tier update (feeMultiplier: descending, pointsThreshold: ascending, no gap)
     */
    function _checkFeeTierUpdateValid(
        uint256 _index,
        IFeeTiersUtils.FeeTier calldata _feeTier,
        IFeeTiersUtils.FeeTier[8] storage _feeTiers
    ) private view {
        bool isDisabled = _feeTier.feeMultiplier == 0 &&
            _feeTier.pointsThreshold == 0;

        // Either both feeMultiplier and pointsThreshold are 0 or none
        // And make sure feeMultiplier < 1 otherwise useless
        if (
            !isDisabled &&
            (_feeTier.feeMultiplier >= FEE_MULTIPLIER_SCALE ||
                _feeTier.feeMultiplier == 0 ||
                _feeTier.pointsThreshold == 0)
        ) {
            revert WrongFeeTier();
        }

        bool hasNextValue = _index < MAX_FEE_TIERS - 1;

        // If disabled, only need to check the next fee tier is disabled as well to create no gaps in active tiers
        if (isDisabled) {
            if (hasNextValue && _feeTiers[_index + 1].feeMultiplier > 0) {
                revert WrongOrder();
            }
        } else {
            // Check next value order
            if (hasNextValue) {
                IFeeTiersUtils.FeeTier memory feeTier = _feeTiers[_index + 1];
                if (
                    feeTier.feeMultiplier != 0 &&
                    (feeTier.feeMultiplier >= _feeTier.feeMultiplier ||
                        feeTier.pointsThreshold <= _feeTier.pointsThreshold)
                ) {
                    revert WrongOrder();
                }
            }

            // Check previous value order
            if (_index > 0) {
                IFeeTiersUtils.FeeTier memory feeTier = _feeTiers[_index - 1];
                if (
                    feeTier.feeMultiplier <= _feeTier.feeMultiplier ||
                    feeTier.pointsThreshold >= _feeTier.pointsThreshold
                ) {
                    revert WrongOrder();
                }
            }
        }
    }

    /**
     * @dev Set multiple fee tiers.
     */
    function setFeeTiers(
        uint256[] calldata _feeTiersIndices,
        IFeeTiersUtils.FeeTier[] calldata _feeTiers
    ) public {
        uint256 length = _feeTiersIndices.length;
        if (length != _feeTiers.length || length == 0) {
            revert WrongLength();
        }

        IFeeTiersUtils.FeeTier[8] storage feeTiersStorage = _getStorage()
            .feeTiers;

        // First do all updates
        for (uint256 i; i < length; ++i) {
            feeTiersStorage[_feeTiersIndices[i]] = _feeTiers[i];
        }

        // Then check updates are valid
        for (uint256 i; i < length; ++i) {
            _checkFeeTierUpdateValid(
                _feeTiersIndices[i],
                _feeTiers[i],
                feeTiersStorage
            );
        }

        emit FeeTiersUpdated(_feeTiersIndices, _feeTiers);
    }

    /**
     * @dev Calculate trader fee amount, applying cached fee tier.
     */
    function calculateFeeAmount(
        address _trader,
        uint256 _normalFeeAmount
    ) external view returns (uint256) {
        uint32 feeMultiplier = _getStorage()
        .traderDailyInfos[_trader][getCurrentDay()].feeMultiplierCache;
        return
            feeMultiplier == 0
                ? _normalFeeAmount
                : (uint256(feeMultiplier) * _normalFeeAmount) /
                    uint256(FEE_MULTIPLIER_SCALE);
    }

    /**
     * @dev Returns active fee tiers count
     */
    function getFeeTiersCount(
        IFeeTiersUtils.FeeTier[8] storage _feeTiers
    ) public view returns (uint256) {
        for (uint256 i = MAX_FEE_TIERS; i > 0; --i) {
            if (_feeTiers[i - 1].feeMultiplier > 0) {
                return i;
            }
        }

        return 0;
    }

    /**
     * @dev Get current day (index of mapping traderDailyInfo)
     */
    function getCurrentDay() public view returns (uint32) {
        return uint32(block.timestamp / 1 days);
    }

    /**
     * @dev Update daily points, re-calculate trailing points, and cache daily fee tier for trader.
     * @dev IMPORTANT: `_volumeUsd` is expected as a normalized 1e18 usd value
     */
    function updateTraderPoints(
        address _trader,
        uint256 _volumeUsd,
        uint256 _groupIndex
    ) external {
        ITizzMultiCollatDiamond.FeeTiersStorage storage s = _getStorage();

        // Scale amount by group multiplier
        uint224 points = uint224(
            (_volumeUsd * s.groupVolumeMultipliers[_groupIndex]) /
                GROUP_VOLUME_MULTIPLIER_SCALE
        );

        mapping(uint32 => IFeeTiersUtils.TraderDailyInfo)
            storage traderDailyInfo = s.traderDailyInfos[_trader];
        uint32 currentDay = getCurrentDay();
        IFeeTiersUtils.TraderDailyInfo
            storage traderCurrentDayInfo = traderDailyInfo[currentDay];

        // Increase points for current day
        if (points > 0) {
            traderCurrentDayInfo.points += points;
            emit TraderDailyPointsIncreased(_trader, currentDay, points);
        }

        IFeeTiersUtils.TraderInfo storage traderInfo = s.traderInfos[_trader];

        // Return early if first update ever for trader since trailing points would be 0 anyway
        if (traderInfo.lastDayUpdated == 0) {
            traderInfo.lastDayUpdated = currentDay;
            emit TraderInfoFirstUpdate(_trader, currentDay);

            return;
        }

        // Update trailing points & re-calculate cached fee tier.
        // Only run if at least 1 day elapsed since last update
        if (currentDay > traderInfo.lastDayUpdated) {
            // Trailing points = sum of all daily points accumulated for last TRAILING_PERIOD_DAYS.
            // It determines which fee tier to apply (pointsThreshold)
            uint224 curTrailingPoints;

            // Calculate trailing points if less than or exactly TRAILING_PERIOD_DAYS have elapsed since update.
            // Otherwise, trailing points is 0 anyway.
            uint32 earliestActiveDay = currentDay - TRAILING_PERIOD_DAYS;

            if (traderInfo.lastDayUpdated >= earliestActiveDay) {
                // Load current trailing points and add last day updated points since they are now finalized
                curTrailingPoints =
                    traderInfo.trailingPoints +
                    traderDailyInfo[traderInfo.lastDayUpdated].points;

                // Expire outdated trailing points
                uint32 earliestOutdatedDay = traderInfo.lastDayUpdated -
                    TRAILING_PERIOD_DAYS;
                uint32 lastOutdatedDay = earliestActiveDay - 1;

                uint224 expiredTrailingPoints;
                for (
                    uint32 i = earliestOutdatedDay;
                    i <= lastOutdatedDay;
                    ++i
                ) {
                    expiredTrailingPoints += traderDailyInfo[i].points;
                }

                curTrailingPoints -= expiredTrailingPoints;

                emit TraderTrailingPointsExpired(
                    _trader,
                    earliestOutdatedDay,
                    lastOutdatedDay,
                    expiredTrailingPoints
                );
            }

            // Store last updated day and new trailing points
            traderInfo.lastDayUpdated = currentDay;
            traderInfo.trailingPoints = curTrailingPoints;

            emit TraderInfoUpdated(_trader, traderInfo);

            // Re-calculate current fee tier for trader
            IFeeTiersUtils.FeeTier[8] storage feeTiersStorage = s.feeTiers;
            uint32 newFeeMultiplier = FEE_MULTIPLIER_SCALE; // use 1 by default (if no fee tier corresponds)

            for (uint256 i = getFeeTiersCount(feeTiersStorage); i > 0; --i) {
                IFeeTiersUtils.FeeTier memory feeTier = feeTiersStorage[i - 1];

                if (
                    curTrailingPoints >=
                    uint224(feeTier.pointsThreshold) * POINTS_THRESHOLD_SCALE
                ) {
                    newFeeMultiplier = feeTier.feeMultiplier;
                    break;
                }
            }

            // Update trader cached fee multiplier
            traderCurrentDayInfo.feeMultiplierCache = newFeeMultiplier;
            emit TraderFeeMultiplierCached(
                _trader,
                currentDay,
                newFeeMultiplier
            );
        }
    }
}
