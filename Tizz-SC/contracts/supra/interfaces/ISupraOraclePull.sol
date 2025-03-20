// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../SupraStructs.sol";

interface ISupraOraclePull {
    function verifyOracleProof(
        bytes calldata _bytesproof
    ) external returns (SupraStructs.PriceData memory);
}
