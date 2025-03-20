// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../external/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../external/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library Utils {
    using SafeERC20 for IERC20;

    // Median function
    function swap(int256[] memory array, uint256 i, uint256 j) internal pure {
        (array[i], array[j]) = (array[j], array[i]);
    }

    function swap(uint256[] memory array, uint256 i, uint256 j) internal pure {
        (array[i], array[j]) = (array[j], array[i]);
    }

    function sortAll(
        uint256[] memory array
    ) internal pure returns (uint256[] memory) {
        uint256 length = array.length;
        for (uint256 i = 0; i < length - 1; i++) {
            for (uint256 j = i + 1; j < length; j++) {
                if (array[i] > array[j]) {
                    (array[i], array[j]) = (array[j], array[i]);
                }
            }
        }

        return array;
    }

    function sort(
        uint256[] memory array,
        uint256 begin,
        uint256 end
    ) internal pure {
        if (begin >= end) {
            return;
        }

        uint256 j = begin;
        uint256 pivot = array[j];

        for (uint256 i = begin + 1; i < end; ++i) {
            if (array[i] < pivot) {
                swap(array, i, ++j);
            }
        }

        swap(array, begin, j);
        sort(array, begin, j);
        sort(array, j + 1, end);
    }

    function sort(
        int256[] memory array,
        uint256 begin,
        uint256 end
    ) internal pure {
        if (begin >= end) {
            return;
        }

        uint256 j = begin;
        int256 pivot = array[j];

        for (uint256 i = begin + 1; i < end; ++i) {
            if (array[i] < pivot) {
                swap(array, i, ++j);
            }
        }

        swap(array, begin, j);
        sort(array, begin, j);
        sort(array, j + 1, end);
    }

    function median(int256[] memory array) internal pure returns (int256) {
        uint256 length = array.length;
        sort(array, 0, length);

        return
            length % 2 == 0
                ? (array[length / 2 - 1] + array[length / 2]) / 2
                : array[length / 2];
    }

    function median(uint256[] memory array) internal pure returns (uint256) {
        uint256 length = array.length;
        sort(array, 0, length);

        return
            length % 2 == 0
                ? (array[length / 2 - 1] + array[length / 2]) / 2
                : array[length / 2];
    }

    // Average function
    function average(int256[] memory array) internal pure returns (int256) {
        int256 sum;
        uint256 length = array.length;
        if (length == 0) {
            return 0;
        }
        for (uint256 i; i < length; ++i) {
            sum += array[i];
        }

        return sum / int256(length);
    }

    function transferFrom(
        address _token,
        address _from,
        address _to,
        uint256 _amount
    ) internal returns (uint256) {
        uint256 beforeBal = IERC20(_token).balanceOf(_to);
        IERC20(_token).safeTransferFrom(_from, _to, _amount);
        uint256 afterBal = IERC20(_token).balanceOf(_to);
        return afterBal - beforeBal;
    }

    function transfer(
        address _token,
        address _to,
        uint256 _amount
    ) internal returns (uint256) {
        uint256 beforeBal = IERC20(_token).balanceOf(_to);
        IERC20(_token).safeTransfer(_to, _amount);
        uint256 afterBal = IERC20(_token).balanceOf(_to);
        return afterBal - beforeBal;
    }
}
