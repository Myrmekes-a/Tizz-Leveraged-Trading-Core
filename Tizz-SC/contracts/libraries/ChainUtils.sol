// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IArbSys.sol";

/**
 * @custom:version 7
 */
library ChainUtils {
    uint256 private constant ARBITRUM_MAINNET = 42161;
    uint256 private constant ARBITRUM_SEPOLIA = 421614;
    IArbSys private constant ARB_SYS = IArbSys(address(100));

    error Overflow();

    function getBlockNumber() internal view returns (uint256) {
        if (
            block.chainid == ARBITRUM_MAINNET ||
            block.chainid == ARBITRUM_SEPOLIA
        ) {
            return ARB_SYS.arbBlockNumber();
        }

        return block.number;
    }

    function getUint48BlockNumber(
        uint256 blockNumber
    ) internal pure returns (uint48) {
        if (blockNumber > type(uint48).max) revert Overflow();
        return uint48(blockNumber);
    }
}
