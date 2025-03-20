// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../external/@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface INft is IERC721 {
    function mint(address to, uint tokenId) external;

    function burn(uint tokenId) external;
}
