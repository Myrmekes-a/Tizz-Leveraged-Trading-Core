// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/ITizzFundingFees.sol";

/**
 * @custom:version 7
 *
 * @dev This is a library with methods used by TizzFundingFees contract.
 */
library FundingFeesUtils {
    uint256 private constant LIQ_THRESHOLD_P = 90; // -90% pnl

    function getPendingAccFees(
        ITizzFundingFees.PendingAccFeesInput memory input,
        bool isBullish
    )
        external
        pure
        returns (uint64 newAccFeeLong, uint64 newAccFeeShort, uint64 delta)
    {
        if (input.currentBlock < input.accLastUpdatedBlock) {
            revert ITizzFundingFees.BlockOrder();
        }

        uint256 _delta = (input.currentBlock - input.accLastUpdatedBlock) *
            input.feePerBlock;

        if (_delta > type(uint64).max) {
            revert ITizzFundingFees.Overflow();
        }
        delta = uint64(_delta);

        (newAccFeeLong, newAccFeeShort) = isBullish
            ? (input.accFeeLong + delta, input.accFeeShort)
            : (input.accFeeLong, input.accFeeShort + delta);
    }

    function getTradeLiquidationPrice(
        uint256 openPrice, // PRECISION
        bool long,
        uint256 collateral, // 1e18 (BaseAsset)
        uint256 leverage,
        uint256 fundingFee, // 1e18 (BaseAsset)
        uint128 collateralPrecisionDelta
    ) external pure returns (uint256) {
        uint256 precisionDeltaUint = uint256(collateralPrecisionDelta);
        int256 precisionDeltaInt = int256(precisionDeltaUint);

        // PRECISION
        int256 liqPriceDistance = (int256(openPrice) *
            (int256((collateral * LIQ_THRESHOLD_P * precisionDeltaUint) / 100) -
                int256(fundingFee) *
                precisionDeltaInt)) /
            int256(collateral) /
            int256(leverage) /
            precisionDeltaInt;

        int256 liqPrice = long
            ? int256(openPrice) - liqPriceDistance
            : int256(openPrice) + liqPriceDistance;

        return liqPrice > 0 ? uint256(liqPrice) : 0;
    }
}
