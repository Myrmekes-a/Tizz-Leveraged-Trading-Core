// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ITizzVaultToken.sol";

/**
 * @custom:version 6.3
 */
interface ITizzTokenLockedDepositNftDesign {
    function buildTokenURI(
        uint256 tokenId,
        ITizzVaultToken.LockedDeposit memory lockedDeposit,
        string memory tTokenSymbol,
        string memory assetSymbol,
        uint8 numberInputDecimals,
        uint8 numberOutputDecimals
    ) external pure returns (string memory);
}
