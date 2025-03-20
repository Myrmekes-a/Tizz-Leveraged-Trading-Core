// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/ITizzFundingFees.sol";
import "../interfaces/ITizzMultiCollatDiamond.sol";
import "../interfaces/ITizzTradingCallbacks.sol";
import "../interfaces/ITizzTradingStorage.sol";

contract TizzFrontEndInfoAggregator {
    ITizzFundingFees public tizzFundingFees;
    ITizzMultiCollatDiamond public tizzMultiCollatDiamond;
    ITizzTradingStorage public storageT;
    ITizzTradingCallbacks public tradingCallbacks;
    uint256 public constant PRECISION = 1e10;

    constructor(
        address _tizzFundingFees,
        address _tizzMultiCollatDiamond,
        address _storageT,
        address _tradingCallbacks
    ) {
        require(
            _tizzFundingFees != address(0) &&
                _tizzMultiCollatDiamond != address(0) &&
                _storageT != address(0) &&
                _tradingCallbacks != address(0),
            "WRONG_ADDRESS"
        );
        tizzFundingFees = ITizzFundingFees(_tizzFundingFees);
        tizzMultiCollatDiamond = ITizzMultiCollatDiamond(
            _tizzMultiCollatDiamond
        );
        storageT = ITizzTradingStorage(_storageT);
        tradingCallbacks = ITizzTradingCallbacks(_tradingCallbacks);
    }

    function predictFees(
        address _trader,
        uint256 _collateral,
        uint256 _leverage,
        uint256 _pairIndex
    ) external view returns (uint256 fees, uint256 fundingRate) {
        (, fundingRate) = tizzFundingFees.getFundingFees(_pairIndex);

        // Calculate govFee
        uint256 levPosBaseAsset = _collateral * _leverage;
        uint256 govFee = tizzMultiCollatDiamond.calculateFeeAmount(
            _trader,
            (levPosBaseAsset *
                tizzMultiCollatDiamond.pairOpenFeeP(_pairIndex)) /
                PRECISION /
                100
        );
        uint256 reward1 = govFee;
        uint256 reward2 = tizzMultiCollatDiamond.calculateFeeAmount(
            _trader,
            (levPosBaseAsset *
                tizzMultiCollatDiamond.pairNftLimitOrderFeeP(_pairIndex)) /
                100 /
                PRECISION
        );

        fees = govFee + reward1 + reward2;
    }
}
