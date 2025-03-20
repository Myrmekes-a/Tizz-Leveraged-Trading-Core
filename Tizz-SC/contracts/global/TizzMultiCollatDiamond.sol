// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/ITizzMultiCollatDiamond.sol";

import "./facets/TizzAddressStore.sol";
import "./facets/TizzPairsStorage.sol";
import "./facets/TizzReferrals.sol";
import "./facets/TizzFeeTiers.sol";
import "./facets/TizzPriceImpact.sol";

/**
 * @custom:version 7
 * @custom:oz-upgrades-unsafe-allow external-library-linking
 */
contract TizzMultiCollatDiamond is
    TizzAddressStore, // base: Initializable + global storage, always first
    TizzPairsStorage, // facet
    TizzReferrals, // facet
    TizzFeeTiers, // facet
    TizzPriceImpact, // last facet. new facets need to be added between this entry and diamond interface
    ITizzMultiCollatDiamond // diamond interface, always last
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
}
