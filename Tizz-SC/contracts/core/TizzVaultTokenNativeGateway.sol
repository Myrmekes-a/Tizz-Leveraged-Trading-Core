// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../external/@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "../external/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../external/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IWBTC.sol";

interface ITizzVaultToken {
    function deposit(
        uint256 _assets,
        address _receiver
    ) external returns (uint256);

    function mint(
        uint256 _shares,
        address _receiver
    ) external returns (uint256);

    function withdraw(
        uint256 _assets,
        address _receiver,
        address _owner
    ) external returns (uint256);

    function redeem(
        uint256 _shares,
        address _receiver,
        address _owner
    ) external returns (uint256);

    function depositWithDiscountAndLock(
        uint256 _assets,
        uint256 _lockDuration,
        address _receiver
    ) external returns (uint256);

    function mintWithDiscountAndLock(
        uint256 _shares,
        uint256 _lockDuration,
        address _receiver
    ) external returns (uint256);

    function previewMint(uint256 _shares) external view returns (uint256);

    function previewRedeem(uint256 shares) external view returns (uint256);
}

/// @title Wrapped Tizz Token Gateway.
/// @notice Allows users to deposit with native token.
contract TizzVaultTokenNativeGateway is Ownable2StepUpgradeable {
    using SafeERC20 for IERC20;

    ITizzVaultToken public tizzVaultToken;
    address public baseAsset;

    constructor() {
        _disableInitializers();
    }

    function initialize(
        ITizzVaultToken _tizzVaultToken,
        address _baseAsset
    ) external initializer {
        require(
            address(_tizzVaultToken) != address(0) && _baseAsset != address(0),
            "WRONG_PARAMS"
        );
        tizzVaultToken = _tizzVaultToken;
        baseAsset = _baseAsset;
        __Ownable2Step_init();
    }

    function deposit(address _receiver) external payable returns (uint256) {
        uint256 assets = msg.value;
        require(assets > 0, "VALUE_0");

        uint256 amount = _convertToWBTC(assets);
        IERC20(baseAsset).safeApprove(address(tizzVaultToken), amount);
        return tizzVaultToken.deposit(assets, _receiver);
    }

    function mint(
        uint256 _shares,
        address _receiver
    ) external payable returns (uint256) {
        uint256 assets = msg.value;
        require(assets > 0, "VALUE_0");

        uint256 amount = _convertToWBTC(assets);
        IERC20(baseAsset).safeApprove(address(tizzVaultToken), amount);
        uint256 usedAmount = tizzVaultToken.mint(_shares, _receiver);

        _refundTo(msg.sender, amount, usedAmount);

        return usedAmount;
    }

    function depositWithDiscountAndLock(
        uint256 _lockDuration,
        address _receiver
    ) external payable returns (uint256) {
        uint256 assets = msg.value;
        require(assets > 0, "VALUE_0");
        uint256 amount = _convertToWBTC(assets);
        IERC20(baseAsset).safeApprove(address(tizzVaultToken), amount);
        return
            tizzVaultToken.depositWithDiscountAndLock(
                assets,
                _lockDuration,
                _receiver
            );
    }

    function mintWithDiscountAndLock(
        uint256 _shares,
        uint256 _lockDuration,
        address _receiver
    ) external payable returns (uint256) {
        uint256 assets = msg.value;
        require(assets > 0, "VALUE_0");

        uint256 amount = _convertToWBTC(assets);
        IERC20(baseAsset).safeApprove(address(tizzVaultToken), amount);
        uint256 usedAmount = tizzVaultToken.previewMint(_shares);
        uint256 depositId = tizzVaultToken.mintWithDiscountAndLock(
            _shares,
            _lockDuration,
            _receiver
        );

        _refundTo(msg.sender, amount, usedAmount);

        return depositId;
    }

    function withdraw(
        uint256 _assets,
        address _receiver,
        address _owner
    ) external returns (uint256) {
        require(_assets > 0, "VALUE_0");
        uint256 shares = tizzVaultToken.withdraw(
            _assets,
            address(this),
            _owner
        );
        _refundTo(_receiver, _assets, 0);
        return shares;
    }

    function redeem(
        uint256 _shares,
        address _receiver,
        address _owner
    ) external returns (uint256) {
        require(_shares > 0, "VALUE_0");
        uint256 assets = tizzVaultToken.previewRedeem(_shares);
        tizzVaultToken.redeem(_shares, address(this), _owner);
        _refundTo(_receiver, assets, 0);
        return assets;
    }

    function _refundTo(
        address _caller,
        uint256 _wrappedAmount,
        uint256 _usedAmount
    ) internal {
        if (_wrappedAmount == _usedAmount) {
            return;
        }

        uint256 wad = _wrappedAmount - _usedAmount;
        IWBTC(baseAsset).withdraw(wad);
        _transferBTC(_caller, wad);
    }

    function _convertToWBTC(uint256 _amount) internal returns (uint256) {
        uint256 beforeBal = IERC20(baseAsset).balanceOf(address(this));
        IWBTC(baseAsset).deposit{value: _amount}();
        uint256 afterBal = IERC20(baseAsset).balanceOf(address(this));
        return afterBal - beforeBal;
    }

    function _transferBTC(address _to, uint256 _amount) internal {
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "TRANSFER_BTC_FAILED");
    }

    receive() external payable {}
}
