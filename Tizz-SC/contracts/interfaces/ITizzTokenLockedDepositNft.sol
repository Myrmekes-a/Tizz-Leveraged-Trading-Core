// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC721} from "../external/@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./ITizzTokenLockedDepositNftDesign.sol";

/**
 * @custom:version 6.3
 */
interface ITizzTokenLockedDepositNft is IERC721 {
    function mint(address to, uint256 tokenId) external;

    function burn(uint256 tokenId) external;

    event DesignUpdated(ITizzTokenLockedDepositNftDesign newValue);
    event DesignDecimalsUpdated(uint8 newValue);
}
