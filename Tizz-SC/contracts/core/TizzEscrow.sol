// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../external/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../external/@openzeppelin/contracts/access/AccessControl.sol";
import "../external/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../external/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../external/@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

struct ClaimableInfo {
    address token;
    uint256 amount;
}

contract TizzEscrow is OwnableUpgradeable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    address public tizzTradingCallbacks;

    /// @notice user => token => amount
    mapping(address => mapping(address => uint256)) public claimableAmounts;
    /// @notice token => amount
    mapping(address => uint256) public totalAmounts;
    mapping(address => EnumerableSet.AddressSet) private claimableTokens;

    modifier onlyTradingCallbacks() {
        require(msg.sender == tizzTradingCallbacks, "ONLY_CALLBACKS");
        _;
    }

    function initialize() public initializer {
        __Ownable_init_unchained();
    }

    function initializeV2(
        address _tizzTradingCallbacks
    ) external reinitializer(2) {
        tizzTradingCallbacks = _tizzTradingCallbacks;
    }

    function updateTizzTradingCallbacks(
        address _tizzTradingCallbacks
    ) external onlyOwner {
        tizzTradingCallbacks = _tizzTradingCallbacks;
    }

    function receiveAssets(
        address _token,
        address _user,
        uint256 _amount
    ) external onlyTradingCallbacks {
        if (!claimableTokens[_user].contains(_token)) {
            require(claimableTokens[_user].add(_token), "REGIST_TOKEN_FAILED");
        }

        uint256 beforeBal = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 afterBal = IERC20(_token).balanceOf(address(this));
        uint256 receivedAmount = afterBal - beforeBal;

        claimableAmounts[_user][_token] += receivedAmount;
        totalAmounts[_token] += receivedAmount;
    }

    function claim(address _token) external {
        address sender = msg.sender;
        require(claimableAmounts[sender][_token] > 0, "NO_CLAIMABLE_AMOUNT");
        _claim(_token, sender);
    }

    function claimAll() external {
        address sender = msg.sender;
        uint256 length = claimableTokens[sender].length();
        require(length > 0, "NO_CLAIMABLE_TOKENS");
        for (uint256 i = 0; i < length; i++) {
            address token = claimableTokens[sender].at(i);
            _claim(token, sender);
        }
    }

    function getClaimableTokens(
        address _user
    ) external view returns (ClaimableInfo[] memory) {
        uint256 length = claimableTokens[_user].length();
        ClaimableInfo[] memory values = new ClaimableInfo[](length);
        if (length == 0) {
            return values;
        }
        for (uint256 i = 0; i < length; i++) {
            address token = claimableTokens[_user].at(i);
            values[i] = ClaimableInfo(token, claimableAmounts[_user][token]);
        }

        return values;
    }

    function withdraw(address _token) external onlyOwner {
        uint256 lockedAmount = totalAmounts[_token];
        uint256 amount = IERC20(_token).balanceOf(address(this));
        uint256 withdrawableAmount = amount - lockedAmount;
        require(withdrawableAmount > 0, "NO_WITHDRAWABLE_AMOUNT");
        IERC20(_token).safeTransfer(msg.sender, withdrawableAmount);
    }

    function _claim(address _token, address _user) internal {
        uint256 amount = claimableAmounts[_user][_token];
        IERC20(_token).safeTransfer(_user, amount);
        claimableAmounts[_user][_token] = 0;
        totalAmounts[_token] -= amount;
        require(claimableTokens[_user].remove(_token), "UNREGIST_TOKEN_FAILED");
    }
}
