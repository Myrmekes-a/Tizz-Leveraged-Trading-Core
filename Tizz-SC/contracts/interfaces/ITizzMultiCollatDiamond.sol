// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interface-libs/IAddressStoreUtils.sol";
import "./interface-libs/IPairsStorageUtils.sol";
import "./interface-libs/IReferralsUtils.sol";
import "./interface-libs/IFeeTiersUtils.sol";
import "./interface-libs/IPriceImpactUtils.sol";

/**
 * @custom:version 7
 */
interface ITizzMultiCollatDiamond is
    IAddressStoreUtils,
    IPairsStorageUtils,
    IReferralsUtils,
    IFeeTiersUtils,
    IPriceImpactUtils
{

}
