// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "../external/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    uint8 private _decimals;
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _amountToMint,
        uint8 _tokenDecimal
    ) ERC20(_name, _symbol) {
        _decimals = _tokenDecimal;
        _mint(msg.sender, _amountToMint);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address _recipient, uint256 _amount) external {
        _mint(_recipient, _amount);
    }
}
