// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {SafeERC20} from "../external/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/interface-libs/IReferralsUtils.sol";
import "../interfaces/ITizzTradingStorage.sol";
import "../interfaces/IERC20.sol";

import "./AddressStoreUtils.sol";
import "./StorageUtils.sol";

/**
 * @custom:version 7
 *
 * @dev This is a library to manage the referral system.
 * TizzMultiCollatDiamond contains the storage and wrapper functions.
 */
library ReferralsUtils {
    using SafeERC20 for IERC20;

    uint256 private constant PRECISION = 1e10;
    uint256 private constant MAX_ALLY_FEE_P = 50;
    uint256 private constant MAX_START_REFERRER_FEE_P = 100;
    uint256 private constant MAX_OPEN_FEE_P = 50;

    // Events are in IReferralsUtils but have to be duplicated in library for now
    event UpdatedAllyFeeP(uint256 value);
    event UpdatedStartReferrerFeeP(uint256 value);
    event UpdatedOpenFeeP(uint256 value);
    event UpdatedTargetVolumeUsd(uint256 value);
    event AllyWhitelisted(address indexed ally);
    event AllyUnwhitelisted(address indexed ally);
    event ReferrerWhitelisted(address indexed referrer, address indexed ally);
    event ReferrerUnwhitelisted(address indexed referrer);
    event ReferrerRegistered(address indexed trader, address indexed referrer);
    event AllyRewardDistributed(
        address indexed ally,
        address indexed trader,
        uint256 volumeUsd,
        uint256 amountToken,
        uint256 amountValueUsd
    );
    event ReferrerRewardDistributed(
        address indexed referrer,
        address indexed trader,
        uint256 volumeUsd,
        uint256 amountToken,
        uint256 amountValueUsd
    );
    event AllyRewardsClaimed(address indexed ally, uint256 amountToken);
    event ReferrerRewardsClaimed(address indexed referrer, uint256 amountToken);

    /**
     * @dev Returns storage slot to use when fetching storage relevant to library
     */
    function getSlot() public pure returns (uint256) {
        return StorageUtils.GLOBAL_REFERRALS_STORAGE_SLOT;
    }

    /**
     * @dev Returns storage pointer for ReferralsStorage struct in global diamond contract, at defined slot
     */
    function _getStorage()
        private
        pure
        returns (IReferralsUtils.ReferralsStorage storage s)
    {
        uint256 storageSlot = getSlot();
        assembly {
            s.slot := storageSlot
        }
    }

    /**
     * @dev Initialize {ReferralsStorage} diamond storage.
     */
    function initialize(
        uint256 _allyFeeP,
        uint256 _startReferrerFeeP,
        uint256 _openFeeP,
        uint256 _targetVolumeUsd
    ) external {
        require(
            _allyFeeP <= MAX_ALLY_FEE_P &&
                _startReferrerFeeP <= MAX_START_REFERRER_FEE_P &&
                _openFeeP <= MAX_OPEN_FEE_P &&
                _targetVolumeUsd > 0,
            "WRONG_PARAMS"
        );

        IReferralsUtils.ReferralsStorage storage s = _getStorage();

        s.allyFeeP = _allyFeeP;
        s.startReferrerFeeP = _startReferrerFeeP;
        s.openFeeP = _openFeeP;
        s.targetVolumeUsd = _targetVolumeUsd;
    }

    function updateAllyFeeP(uint256 _value) external {
        require(_value <= MAX_ALLY_FEE_P, "VALUE_ABOVE_50");

        _getStorage().allyFeeP = _value;

        emit UpdatedAllyFeeP(_value);
    }

    function updateStartReferrerFeeP(uint256 _value) external {
        require(_value <= MAX_START_REFERRER_FEE_P, "VALUE_ABOVE_100");

        _getStorage().startReferrerFeeP = _value;

        emit UpdatedStartReferrerFeeP(_value);
    }

    function updateOpenFeeP(uint256 _value) external {
        require(_value <= MAX_OPEN_FEE_P, "VALUE_ABOVE_50");

        _getStorage().openFeeP = _value;

        emit UpdatedOpenFeeP(_value);
    }

    function updateTargetVolumeUsd(uint256 _value) external {
        require(_value > 0, "VALUE_0");

        _getStorage().targetVolumeUsd = _value;

        emit UpdatedTargetVolumeUsd(_value);
    }

    // MANAGE ALLIES
    function whitelistAllies(address[] calldata _allies) external {
        uint256 length = _allies.length;
        require(length > 0, "INVALID_ARRAY_LENGTH");
        for (uint256 i = 0; i < length; ++i) {
            _whitelistAlly(_allies[i]);
        }
    }

    function _whitelistAlly(address _ally) private {
        require(_ally != address(0), "ADDRESS_0");

        IReferralsUtils.AllyDetails storage a = _getStorage().allyDetails[
            _ally
        ];
        require(!a.active, "ALLY_ALREADY_ACTIVE");

        a.active = true;

        emit AllyWhitelisted(_ally);
    }

    function unwhitelistAllies(address[] calldata _allies) external {
        uint256 length = _allies.length;
        require(length > 0, "INVALID_ARRAY_LENGTH");
        for (uint256 i = 0; i < length; ++i) {
            _unwhitelistAlly(_allies[i]);
        }
    }

    function _unwhitelistAlly(address _ally) private {
        IReferralsUtils.AllyDetails storage a = _getStorage().allyDetails[
            _ally
        ];
        require(a.active, "ALREADY_UNACTIVE");

        a.active = false;

        emit AllyUnwhitelisted(_ally);
    }

    // MANAGE REFERRERS
    function whitelistReferrers(
        address[] calldata _referrers,
        address[] calldata _allies
    ) external {
        uint256 length = _referrers.length;
        require(length == _allies.length && length > 0, "INVALID_ARRAY_LENGTH");

        for (uint256 i = 0; i < length; ++i) {
            _whitelistReferrer(_referrers[i], _allies[i]);
        }
    }

    function _whitelistReferrer(address _referrer, address _ally) private {
        require(_referrer != address(0), "ADDRESS_0");
        IReferralsUtils.ReferralsStorage storage s = _getStorage();

        IReferralsUtils.ReferrerDetails storage r = s.referrerDetails[
            _referrer
        ];
        require(!r.active, "REFERRER_ALREADY_ACTIVE");

        r.active = true;

        if (_ally != address(0)) {
            IReferralsUtils.AllyDetails storage a = s.allyDetails[_ally];
            require(a.active, "ALLY_NOT_ACTIVE");

            r.ally = _ally;
            a.referrersReferred.push(_referrer);
        }

        emit ReferrerWhitelisted(_referrer, _ally);
    }

    function unwhitelistReferrers(address[] calldata _referrers) external {
        uint256 length = _referrers.length;
        require(length > 0, "INVALID_ARRAY_LENGTH");
        for (uint256 i = 0; i < length; ++i) {
            _unwhitelistReferrer(_referrers[i]);
        }
    }

    function _unwhitelistReferrer(address _referrer) private {
        IReferralsUtils.ReferrerDetails storage r = _getStorage()
            .referrerDetails[_referrer];
        require(r.active, "ALREADY_UNACTIVE");

        r.active = false;

        emit ReferrerUnwhitelisted(_referrer);
    }

    function registerPotentialReferrer(
        address _trader,
        address _referrer
    ) external {
        IReferralsUtils.ReferralsStorage storage s = _getStorage();
        IReferralsUtils.ReferrerDetails storage r = s.referrerDetails[
            _referrer
        ];

        if (
            s.referrerByTrader[_trader] != address(0) ||
            _referrer == address(0) ||
            !r.active
        ) {
            return;
        }

        s.referrerByTrader[_trader] = _referrer;
        r.tradersReferred.push(_trader);

        emit ReferrerRegistered(_trader, _referrer);
    }

    // REWARDS DISTRIBUTION
    function distributeReferralReward(
        address _trader,
        uint256 _volumeUsd, // 1e18
        uint256 _pairOpenFeeP,
        uint256 _tokenPriceUsd // PRECISION (1e10)
    ) external returns (uint256) {
        IReferralsUtils.ReferralsStorage storage s = _getStorage();

        address referrer = s.referrerByTrader[_trader];
        IReferralsUtils.ReferrerDetails storage r = s.referrerDetails[referrer];

        if (!r.active) {
            return 0;
        }

        uint256 referrerRewardValueUsd = (_volumeUsd *
            getReferrerFeeP(_pairOpenFeeP, r.volumeReferredUsd)) /
            PRECISION /
            100;

        uint256 referrerRewardToken = (referrerRewardValueUsd * PRECISION) /
            _tokenPriceUsd;

        IERC20(AddressStoreUtils.getAddresses().tizz).mint(
            address(this),
            referrerRewardToken
        );

        IReferralsUtils.AllyDetails storage a = s.allyDetails[r.ally];

        uint256 allyRewardValueUsd;
        uint256 allyRewardToken;

        if (a.active) {
            uint256 allyFeeP = s.allyFeeP;

            allyRewardValueUsd = (referrerRewardValueUsd * allyFeeP) / 100;
            allyRewardToken = (referrerRewardToken * allyFeeP) / 100;

            a.volumeReferredUsd += _volumeUsd;
            a.pendingRewardsToken += allyRewardToken;
            a.totalRewardsToken += allyRewardToken;
            a.totalRewardsValueUsd += allyRewardValueUsd;

            referrerRewardValueUsd -= allyRewardValueUsd;
            referrerRewardToken -= allyRewardToken;

            emit AllyRewardDistributed(
                r.ally,
                _trader,
                _volumeUsd,
                allyRewardToken,
                allyRewardValueUsd
            );
        }

        r.volumeReferredUsd += _volumeUsd;
        r.pendingRewardsToken += referrerRewardToken;
        r.totalRewardsToken += referrerRewardToken;
        r.totalRewardsValueUsd += referrerRewardValueUsd;

        emit ReferrerRewardDistributed(
            referrer,
            _trader,
            _volumeUsd,
            referrerRewardToken,
            referrerRewardValueUsd
        );

        return referrerRewardValueUsd + allyRewardValueUsd;
    }

    // REWARDS CLAIMING
    function claimAllyRewards() external {
        IReferralsUtils.AllyDetails storage a = _getStorage().allyDetails[
            msg.sender
        ];
        uint256 rewardsToken = a.pendingRewardsToken;

        require(rewardsToken > 0, "NO_PENDING_REWARDS");

        a.pendingRewardsToken = 0;
        IERC20(AddressStoreUtils.getAddresses().tizz).safeTransfer(
            msg.sender,
            rewardsToken
        );

        emit AllyRewardsClaimed(msg.sender, rewardsToken);
    }

    function claimReferrerRewards() external {
        IReferralsUtils.ReferrerDetails storage r = _getStorage()
            .referrerDetails[msg.sender];
        uint256 rewardsToken = r.pendingRewardsToken;

        require(rewardsToken > 0, "NO_PENDING_REWARDS");

        r.pendingRewardsToken = 0;
        IERC20(AddressStoreUtils.getAddresses().tizz).safeTransfer(
            msg.sender,
            rewardsToken
        );

        emit ReferrerRewardsClaimed(msg.sender, rewardsToken);
    }

    function getReferrerFeeP(
        uint256 _pairOpenFeeP,
        uint256 _volumeReferredUsd
    ) public view returns (uint256) {
        IReferralsUtils.ReferralsStorage storage s = _getStorage();

        uint256 maxReferrerFeeP = (_pairOpenFeeP * 2 * s.openFeeP) / 100;
        uint256 minFeeP = (maxReferrerFeeP * s.startReferrerFeeP) / 100;

        uint256 feeP = minFeeP +
            ((maxReferrerFeeP - minFeeP) * _volumeReferredUsd) /
            1e18 /
            s.targetVolumeUsd;

        return feeP > maxReferrerFeeP ? maxReferrerFeeP : feeP;
    }

    function getPercentOfOpenFeeP_calc(
        uint256 _volumeReferredUsd
    ) public view returns (uint256 resultP) {
        IReferralsUtils.ReferralsStorage storage s = _getStorage();
        uint startReferrerFeeP = s.startReferrerFeeP;
        uint openFeeP = s.openFeeP;

        resultP =
            (openFeeP *
                (startReferrerFeeP *
                    PRECISION +
                    (_volumeReferredUsd *
                        PRECISION *
                        (100 - startReferrerFeeP)) /
                    1e18 /
                    s.targetVolumeUsd)) /
            100;

        resultP = resultP > openFeeP * PRECISION
            ? openFeeP * PRECISION
            : resultP;
    }
}
