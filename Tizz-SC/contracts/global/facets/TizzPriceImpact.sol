// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TizzAddressStore.sol";

import "../../interfaces/interface-libs/IPriceImpactUtils.sol";

import "../../libraries/PriceImpactUtils.sol";

/**
 * @custom:version 7
 * @custom:oz-upgrades-unsafe-allow external-library-linking
 */
abstract contract TizzPriceImpact is TizzAddressStore, IPriceImpactUtils {
    PriceImpactStorage internal priceImpactStorage;

    function initializePriceImpact(
        uint48 _windowsDuration,
        uint48 _windowsCount
    ) external reinitializer(5) {
        // Double check diamond storage slot
        uint256 storageSlot;
        assembly {
            storageSlot := priceImpactStorage.slot
        }
        if (storageSlot != PriceImpactUtils.getSlot()) {
            revert WrongSlot();
        }

        PriceImpactUtils.initializeOiWindowsSettings(
            _windowsDuration,
            _windowsCount
        );
    }

    // Management Setters
    function setPriceImpactWindowsCount(
        uint48 _newWindowsCount
    ) external onlyRole(Role.GOV) {
        PriceImpactUtils.setPriceImpactWindowsCount(_newWindowsCount);
    }

    function setPriceImpactWindowsDuration(
        uint48 _newWindowsDuration
    ) external onlyRole(Role.GOV) {
        PriceImpactUtils.setPriceImpactWindowsDuration(
            _newWindowsDuration,
            IPairsStorageUtils(address(this)).pairsCount()
        );
    }

    function setPairDepths(
        uint256[] calldata _indices,
        uint128[] calldata _depthsAboveUsd,
        uint128[] calldata _depthsBelowUsd
    ) external onlyRole(Role.MANAGER) {
        PriceImpactUtils.setPairDepths(
            _indices,
            _depthsAboveUsd,
            _depthsBelowUsd
        );
    }

    // Interactions
    function addPriceImpactOpenInterest(
        uint256 _openInterestUsd, // 1e18 USD
        uint256 _pairIndex,
        bool _long
    ) external onlyRole(Role.CALLBACKS) {
        PriceImpactUtils.addPriceImpactOpenInterest(
            uint128(_openInterestUsd),
            _pairIndex,
            _long
        );
    }

    function removePriceImpactOpenInterest(
        uint256 _openInterestUsd, // 1e18 USD
        uint256 _pairIndex,
        bool _long,
        uint256 _addTs
    ) external onlyRole(Role.CALLBACKS) {
        PriceImpactUtils.removePriceImpactOpenInterest(
            uint128(_openInterestUsd),
            _pairIndex,
            _long,
            _addTs
        );
    }

    // Getters
    function getPriceImpactOi(
        uint256 _pairIndex,
        bool _long
    ) external view returns (uint256 activeOi) {
        return PriceImpactUtils.getPriceImpactOi(_pairIndex, _long);
    }

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
        (priceImpactP, priceAfterImpact) = PriceImpactUtils.getTradePriceImpact(
            _openPrice,
            _pairIndex,
            _long,
            _tradeOpenInterestUsd
        );
    }

    function getPairDepth(
        uint256 _pairIndex
    ) external view returns (PairDepth memory) {
        return priceImpactStorage.pairDepths[_pairIndex];
    }

    function getOiWindowsSettings()
        external
        view
        returns (OiWindowsSettings memory)
    {
        return priceImpactStorage.oiWindowsSettings;
    }

    function getOiWindow(
        uint48 _windowsDuration,
        uint256 _pairIndex,
        uint256 _windowId
    ) external view returns (PairOi memory) {
        return
            priceImpactStorage.windows[
                _windowsDuration > 0
                    ? _windowsDuration
                    : priceImpactStorage.oiWindowsSettings.windowsDuration
            ][_pairIndex][_windowId];
    }

    function getOiWindows(
        uint48 _windowsDuration,
        uint256 _pairIndex,
        uint256[] calldata _windowIds
    ) external view returns (PairOi[] memory) {
        uint256 length = _windowIds.length;
        PairOi[] memory _pairOis = new PairOi[](length);
        if (length == 0) {
            return _pairOis;
        }
        _windowsDuration = _windowsDuration > 0
            ? _windowsDuration
            : priceImpactStorage.oiWindowsSettings.windowsDuration;

        for (uint256 i; i < length; ++i) {
            _pairOis[i] = priceImpactStorage.windows[_windowsDuration][
                _pairIndex
            ][_windowIds[i]];
        }

        return _pairOis;
    }

    function getPairDepths(
        uint256[] calldata _indices
    ) external view returns (PairDepth[] memory) {
        uint256 length = _indices.length;
        PairDepth[] memory depths = new PairDepth[](length);
        if (length == 0) {
            return depths;
        }

        for (uint256 i = 0; i < length; ++i) {
            depths[i] = priceImpactStorage.pairDepths[_indices[i]];
        }

        return depths;
    }
}
