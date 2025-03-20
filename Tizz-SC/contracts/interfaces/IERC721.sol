// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @custom:version 5
 */
interface IERC721 {
    function balanceOf(address) external view returns (uint256);

    function ownerOf(uint256) external view returns (address);

    function transferFrom(address, address, uint256) external;

    function tokenOfOwnerByIndex(
        address,
        uint256
    ) external view returns (uint256);
}
