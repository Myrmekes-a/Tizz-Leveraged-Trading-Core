// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../supra/interfaces/ISupraOraclePull.sol";
import "../supra/SupraStructs.sol";

contract MockSupraPull {
    ISupraOraclePull public supraPull;
    SupraStructs.PriceData private lastPriceData;

    constructor(address _supraPull) {
        supraPull = ISupraOraclePull(_supraPull);
    }

    function verifyOracleProof(bytes calldata _bytesproof) external {
        lastPriceData = supraPull.verifyOracleProof(_bytesproof);
    }

    function getLastPriceData()
        external
        view
        returns (SupraStructs.PriceData memory)
    {
        return lastPriceData;
    }
}
