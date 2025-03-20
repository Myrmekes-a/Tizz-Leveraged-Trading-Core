// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @custom:version 7
 *
 * @dev This is a library to help manage storage slots of TizzMultiCollatDiamond contract for our external libraries.
 *
 * BE EXTREMELY CAREFUL, DO NOT EDIT THIS WITHOUT A GOOD REASON
 *
 */
library StorageUtils {
    uint256 internal constant GLOBAL_ADDRESSES_STORAGE_SLOT = 1;
    uint256 internal constant GLOBAL_PAIRS_STORAGE_SLOT = 51;
    uint256 internal constant GLOBAL_REFERRALS_STORAGE_SLOT = 101;
    uint256 internal constant GLOBAL_FEE_TIERS_STORAGE_SLOT = 151;
    uint256 internal constant GLOBAL_PRICE_IMPACT_STORAGE_SLOT = 201;
}
