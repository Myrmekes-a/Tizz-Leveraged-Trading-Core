// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ITizzEscrow {
    function receiveAssets(
        address _token,
        address _user,
        uint256 _amount
    ) external;
}
