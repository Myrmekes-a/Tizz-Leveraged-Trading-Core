// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/interface-libs/IPriceImpactUtils.sol";

import "./StorageUtils.sol";

/**
 * @custom:version 7
 *
 * @dev This is a library to help manage a price impact decay algorithm .
 *
 * When a trade is placed, OI is added to the window corresponding to time of open.
 * When a trade is removed, OI is removed from the window corresponding to time of open.
 *
 * When calculating price impact, only the most recent X windows are taken into account.
 */
library PriceImpactUtils {
    uint256 private constant PRECISION = 1e10; // 10 decimals

    uint48 private constant MAX_WINDOWS_COUNT = 5;
    uint48 private constant MAX_WINDOWS_DURATION = 30 days;
    uint48 private constant MIN_WINDOWS_DURATION = 10 minutes;

    /**
     * @dev Triggered when OiWindowsSettings is initialized (once)
     */
    event OiWindowsSettingsInitialized(
        uint48 indexed windowsDuration,
        uint48 indexed windowsCount
    );

    /**
     * @dev Triggered when OiWindowsSettings.windowsCount is updated
     */
    event PriceImpactWindowsCountUpdated(uint48 indexed windowsCount);

    /**
     * @dev Triggered when OiWindowsSettings.windowsDuration is updated
     */
    event PriceImpactWindowsDurationUpdated(uint48 indexed windowsDuration);

    /**
     * @dev Triggered when OI is added to a window.
     */
    event PriceImpactOpenInterestAdded(
        IPriceImpactUtils.OiWindowUpdate oiWindowUpdate
    );

    /**
     * @dev Triggered when OI is (tentatively) removed from a window.
     */
    event PriceImpactOpenInterestRemoved(
        IPriceImpactUtils.OiWindowUpdate oiWindowUpdate,
        bool notOutdated
    );

    /**
     * @dev Triggered when multiple pairs' OI are transferred to a new window.
     */
    event PriceImpactOiTransferredPairs(
        uint256 pairsCount,
        uint256 prevCurrentWindowId,
        uint256 prevEarliestWindowId,
        uint256 newCurrentWindowId
    );

    /**
     * @dev Triggered when a pair's OI is transferred to a new window.
     */
    event PriceImpactOiTransferredPair(
        uint256 indexed pairIndex,
        IPriceImpactUtils.PairOi totalPairOi
    );

    /**
     * @dev Triggered when a pair's depth is updated.
     */
    event OnePercentDepthUpdated(
        uint256 indexed pairIndex,
        uint128 valueAboveUsd,
        uint128 valueBelowUsd
    );

    /**
     * @dev Returns storage slot to use when fetching storage relevant to library
     */
    function getSlot() public pure returns (uint256) {
        return StorageUtils.GLOBAL_PRICE_IMPACT_STORAGE_SLOT;
    }

    /**
     * @dev Returns storage pointer for struct in funding contract, at defined slot
     */
    function getStorage()
        private
        pure
        returns (IPriceImpactUtils.PriceImpactStorage storage s)
    {
        uint256 storageSlot = getSlot();
        assembly {
            s.slot := storageSlot
        }
    }

    /**
     * @dev Validates new windowsDuration value
     */
    modifier validWindowsDuration(uint48 _windowsDuration) {
        require(
            _windowsDuration >= MIN_WINDOWS_DURATION &&
                _windowsDuration <= MAX_WINDOWS_DURATION,
            "WRONG_WINDOWS_DURATION"
        );
        _;
    }

    /**
     * @dev Initializes OiWindowsSettings startTs and windowsDuration.
     * windowsCount is 0 for now for backwards-compatible behavior until oi windows have enough data.
     *
     * Should only be called once, in initializeV2() of funding contract.
     * Emits a {OiWindowsSettingsInitialized} event.
     */
    function initializeOiWindowsSettings(
        uint48 _windowsDuration,
        uint48 _windowsCount
    ) external validWindowsDuration(_windowsDuration) {
        require(_windowsCount <= MAX_WINDOWS_COUNT, "ABOVE_MAX_WINDOWS_COUNT");

        getStorage().oiWindowsSettings = IPriceImpactUtils.OiWindowsSettings({
            startTs: uint48(block.timestamp),
            windowsDuration: _windowsDuration,
            windowsCount: _windowsCount
        });

        emit OiWindowsSettingsInitialized(_windowsDuration, _windowsCount);
    }

    /**
     * @dev Updates OiWindowSettings.windowsCount storage value
     *
     * Emits a {PriceImpactWindowsCountUpdated} event.
     */
    function setPriceImpactWindowsCount(uint48 _newWindowsCount) external {
        IPriceImpactUtils.OiWindowsSettings storage settings = getStorage()
            .oiWindowsSettings;

        require(
            _newWindowsCount <= MAX_WINDOWS_COUNT,
            "ABOVE_MAX_WINDOWS_COUNT"
        );

        settings.windowsCount = _newWindowsCount;

        emit PriceImpactWindowsCountUpdated(_newWindowsCount);
    }

    /**
     * @dev Updates OiWindowSettings.windowsDuration storage value,
     * and transfers the OI from all pairs past active windows (current window duration)
     * to the new current window (new window duration).
     *
     * Emits a {PriceImpactWindowsDurationUpdated} event.
     */
    function setPriceImpactWindowsDuration(
        uint48 _newWindowsDuration,
        uint256 _pairsCount
    ) external validWindowsDuration(_newWindowsDuration) {
        IPriceImpactUtils.PriceImpactStorage
            storage priceImpactStorage = getStorage();
        IPriceImpactUtils.OiWindowsSettings
            storage settings = priceImpactStorage.oiWindowsSettings;

        if (settings.windowsCount > 0) {
            transferPriceImpactOiForPairs(
                _pairsCount,
                priceImpactStorage.windows[settings.windowsDuration],
                priceImpactStorage.windows[_newWindowsDuration],
                settings,
                _newWindowsDuration
            );
        }

        settings.windowsDuration = _newWindowsDuration;

        emit PriceImpactWindowsDurationUpdated(_newWindowsDuration);
    }

    /**
     * @dev Sets `_indices` pair one percent depth above and below (USD).
     *
     * Emits a {OnePercentDepthUpdated} event per `_indices` value.
     */
    function setPairDepths(
        uint256[] calldata _indices,
        uint128[] calldata _depthsAboveUsd,
        uint128[] calldata _depthsBelowUsd
    ) external {
        uint256 length = _indices.length;
        require(
            length == _depthsAboveUsd.length &&
                _depthsAboveUsd.length == _depthsBelowUsd.length &&
                length > 0,
            "INVALID_ARRAY_LENGTH"
        );

        IPriceImpactUtils.PriceImpactStorage storage s = getStorage();

        for (uint256 i = 0; i < length; ++i) {
            s.pairDepths[_indices[i]] = IPriceImpactUtils.PairDepth({
                onePercentDepthAboveUsd: _depthsAboveUsd[i],
                onePercentDepthBelowUsd: _depthsBelowUsd[i]
            });

            emit OnePercentDepthUpdated(
                _indices[i],
                _depthsAboveUsd[i],
                _depthsBelowUsd[i]
            );
        }
    }

    /**
     * @dev Adds long / short `_openInterestUsd` (1e18 USD) to current window of `_pairIndex`.
     *
     * Emits a {PriceImpactOpenInterestAdded} event.
     */
    function addPriceImpactOpenInterest(
        uint128 _openInterestUsd,
        uint256 _pairIndex,
        bool _long
    ) public {
        IPriceImpactUtils.PriceImpactStorage
            storage priceImpactStorage = getStorage();
        IPriceImpactUtils.OiWindowsSettings
            storage settings = priceImpactStorage.oiWindowsSettings;

        uint256 currentWindowId = getCurrentWindowId(settings);
        IPriceImpactUtils.PairOi storage pairOi = priceImpactStorage.windows[
            settings.windowsDuration
        ][_pairIndex][currentWindowId];

        if (_long) {
            pairOi.oiLongUsd += _openInterestUsd;
        } else {
            pairOi.oiShortUsd += _openInterestUsd;
        }

        emit PriceImpactOpenInterestAdded(
            IPriceImpactUtils.OiWindowUpdate(
                settings.windowsDuration,
                _pairIndex,
                currentWindowId,
                _long,
                _openInterestUsd
            )
        );
    }

    /**
     * @dev Removes `_openInterestUsd` (1e18 USD) from window at `_addTs` of `_pairIndex`.
     *
     * Emits a {PriceImpactOpenInterestRemoved} event when `_addTs` is greater than zero.
     */
    function removePriceImpactOpenInterest(
        uint128 _openInterestUsd,
        uint256 _pairIndex,
        bool _long,
        uint256 _addTs
    ) public {
        // If trade opened before update, OI wasn't stored in any window so we return
        if (_openInterestUsd == 0 || _addTs == 0) {
            return;
        }

        IPriceImpactUtils.PriceImpactStorage
            storage priceImpactStorage = getStorage();
        IPriceImpactUtils.OiWindowsSettings
            storage settings = priceImpactStorage.oiWindowsSettings;

        uint256 currentWindowId = getCurrentWindowId(settings);
        uint256 addWindowId = getWindowId(_addTs, settings);

        bool notOutdated = isWindowPotentiallyActive(
            addWindowId,
            currentWindowId
        );

        // Only remove OI if window is not outdated already
        if (notOutdated) {
            IPriceImpactUtils.PairOi storage pairOi = priceImpactStorage
                .windows[settings.windowsDuration][_pairIndex][addWindowId];

            if (_long) {
                pairOi.oiLongUsd = _openInterestUsd < pairOi.oiLongUsd
                    ? pairOi.oiLongUsd - _openInterestUsd
                    : 0;
            } else {
                pairOi.oiShortUsd = _openInterestUsd < pairOi.oiShortUsd
                    ? pairOi.oiShortUsd - _openInterestUsd
                    : 0;
            }
        }

        emit PriceImpactOpenInterestRemoved(
            IPriceImpactUtils.OiWindowUpdate(
                settings.windowsDuration,
                _pairIndex,
                addWindowId,
                _long,
                _openInterestUsd
            ),
            notOutdated
        );
    }

    /**
     * @dev Transfers total long / short OI from last '_settings.windowsCount' windows of `_prevPairOiWindows`
     * to current window of `_newPairOiWindows` for `_pairsCount` pairs.
     *
     * Emits a {PriceImpactOiTransferredPairs} event.
     */
    function transferPriceImpactOiForPairs(
        uint256 _pairsCount,
        mapping(uint256 => mapping(uint256 => IPriceImpactUtils.PairOi))
            storage _prevPairOiWindows, // pairIndex => windowId => PairOi
        mapping(uint256 => mapping(uint256 => IPriceImpactUtils.PairOi))
            storage _newPairOiWindows, // pairIndex => windowId => PairOi
        IPriceImpactUtils.OiWindowsSettings memory _settings,
        uint48 _newWindowsDuration
    ) private {
        uint256 prevCurrentWindowId = getCurrentWindowId(_settings);
        uint256 prevEarliestWindowId = getEarliestActiveWindowId(
            prevCurrentWindowId,
            _settings.windowsCount
        );

        uint256 newCurrentWindowId = getCurrentWindowId(
            IPriceImpactUtils.OiWindowsSettings(
                _settings.startTs,
                _newWindowsDuration,
                _settings.windowsCount
            )
        );

        for (uint256 pairIndex; pairIndex < _pairsCount; ) {
            transferPriceImpactOiForPair(
                pairIndex,
                prevCurrentWindowId,
                prevEarliestWindowId,
                _prevPairOiWindows[pairIndex],
                _newPairOiWindows[pairIndex][newCurrentWindowId]
            );

            unchecked {
                ++pairIndex;
            }
        }

        emit PriceImpactOiTransferredPairs(
            _pairsCount,
            prevCurrentWindowId,
            prevEarliestWindowId,
            newCurrentWindowId
        );
    }

    /**
     * @dev Transfers total long / short OI from `prevEarliestWindowId` to `prevCurrentWindowId` windows of
     * `_prevPairOiWindows` to `_newPairOiWindow` window.
     *
     * Emits a {PriceImpactOiTransferredPair} event.
     */
    function transferPriceImpactOiForPair(
        uint256 _pairIndex,
        uint256 _prevCurrentWindowId,
        uint256 _prevEarliestWindowId,
        mapping(uint256 => IPriceImpactUtils.PairOi) storage _prevPairOiWindows,
        IPriceImpactUtils.PairOi storage _newPairOiWindow
    ) private {
        IPriceImpactUtils.PairOi memory totalPairOi;

        // Aggregate sum of total long / short OI for past windows
        for (uint256 id = _prevEarliestWindowId; id <= _prevCurrentWindowId; ) {
            IPriceImpactUtils.PairOi memory pairOi = _prevPairOiWindows[id];

            totalPairOi.oiLongUsd += pairOi.oiLongUsd;
            totalPairOi.oiShortUsd += pairOi.oiShortUsd;

            // Clean up previous map once added to the sum
            delete _prevPairOiWindows[id];

            unchecked {
                ++id;
            }
        }

        bool longOiTransfer = totalPairOi.oiLongUsd > 0;
        bool shortOiTransfer = totalPairOi.oiShortUsd > 0;

        if (longOiTransfer) {
            _newPairOiWindow.oiLongUsd += totalPairOi.oiLongUsd;
        }

        if (shortOiTransfer) {
            _newPairOiWindow.oiShortUsd += totalPairOi.oiShortUsd;
        }

        // Only emit even if there was an actual OI transfer
        if (longOiTransfer || shortOiTransfer) {
            emit PriceImpactOiTransferredPair(_pairIndex, totalPairOi);
        }
    }

    /**
     * @dev Returns window id at `_timestamp` given `_settings`.
     */
    function getWindowId(
        uint256 _timestamp,
        IPriceImpactUtils.OiWindowsSettings memory _settings
    ) public pure returns (uint256) {
        return (_timestamp - _settings.startTs) / _settings.windowsDuration;
    }

    /**
     * @dev Returns window id at current timestamp given `_settings`.
     */
    function getCurrentWindowId(
        IPriceImpactUtils.OiWindowsSettings memory _settings
    ) public view returns (uint256) {
        return getWindowId(block.timestamp, _settings);
    }

    /**
     * @dev Returns earliest active window id given `_currentWindowId` and `_windowsCount`.
     */
    function getEarliestActiveWindowId(
        uint256 _currentWindowId,
        uint48 _windowsCount
    ) public pure returns (uint256) {
        uint256 windowNegativeDelta = _windowsCount - 1; // -1 because we include current window
        return
            _currentWindowId > windowNegativeDelta
                ? _currentWindowId - windowNegativeDelta
                : 0;
    }

    /**
     * @dev Returns whether '_windowId' can be potentially active id given `_currentWindowId`
     */
    function isWindowPotentiallyActive(
        uint256 _windowId,
        uint256 _currentWindowId
    ) public pure returns (bool) {
        return _currentWindowId - _windowId < MAX_WINDOWS_COUNT;
    }

    /**
     * @dev Returns total long / short OI `activeOi`, from last active windows of `_pairOiWindows`
     * given `_settings` (backwards-compatible).
     */
    function getPriceImpactOi(
        uint256 _pairIndex,
        bool _long
    ) public view returns (uint256 activeOi) {
        IPriceImpactUtils.PriceImpactStorage
            storage priceImpactStorage = getStorage();
        IPriceImpactUtils.OiWindowsSettings
            storage settings = priceImpactStorage.oiWindowsSettings;

        // Return 0 if windowsCount is 0 (no price impact OI)
        if (settings.windowsCount == 0) {
            return 0;
        }

        uint256 currentWindowId = getCurrentWindowId(settings);
        uint256 earliestWindowId = getEarliestActiveWindowId(
            currentWindowId,
            settings.windowsCount
        );

        for (uint256 i = earliestWindowId; i <= currentWindowId; ) {
            IPriceImpactUtils.PairOi memory _pairOi = priceImpactStorage
                .windows[settings.windowsDuration][_pairIndex][i];
            activeOi += _long ? _pairOi.oiLongUsd : _pairOi.oiShortUsd;

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Returns trade price impact % and opening price after impact, fetched from `getTradePriceImpact` pure function.
     */
    function getTradePriceImpact(
        uint256 _openPrice, // PRECISION
        uint256 _pairIndex,
        bool _long,
        uint256 _tradeOpenInterestUsd // 1e18 USD
    )
        external
        view
        returns (
            uint256 priceImpactP, // PRECISION (%)
            uint256 priceAfterImpact // PRECISION
        )
    {
        IPriceImpactUtils.PairDepth storage pDepth = getStorage().pairDepths[
            _pairIndex
        ];
        uint256 depth = _long
            ? pDepth.onePercentDepthAboveUsd
            : pDepth.onePercentDepthBelowUsd;

        (priceImpactP, priceAfterImpact) = getTradePriceImpact(
            _openPrice,
            _long,
            depth > 0 ? getPriceImpactOi(_pairIndex, _long) : 0, // saves gas if depth is 0
            _tradeOpenInterestUsd,
            depth
        );
    }

    /**
     * @dev Returns trade price impact % and opening price after impact.
     */
    function getTradePriceImpact(
        uint256 _openPrice, // PRECISION
        bool _long,
        uint256 _startOpenInterestUsd, // 1e18 USD
        uint256 _tradeOpenInterestUsd, // 1e18 USD
        uint256 _onePercentDepthUsd // USD
    )
        public
        pure
        returns (
            uint256 priceImpactP, // PRECISION (%)
            uint256 priceAfterImpact // PRECISION
        )
    {
        if (_onePercentDepthUsd == 0) {
            return (0, _openPrice);
        }

        priceImpactP =
            ((_startOpenInterestUsd + _tradeOpenInterestUsd / 2) * PRECISION) /
            _onePercentDepthUsd /
            1e18;

        uint256 priceImpact = (priceImpactP * _openPrice) / PRECISION / 100;
        priceAfterImpact = _long
            ? _openPrice + priceImpact
            : _openPrice - priceImpact;
    }
}
