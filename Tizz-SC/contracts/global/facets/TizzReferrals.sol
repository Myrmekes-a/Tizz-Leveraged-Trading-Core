// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TizzAddressStore.sol";

import "../../interfaces/interface-libs/IReferralsUtils.sol";

import "../../libraries/ReferralsUtils.sol";

/**
 * @custom:version 7
 * @custom:oz-upgrades-unsafe-allow external-library-linking
 */
abstract contract TizzReferrals is TizzAddressStore, IReferralsUtils {
    ReferralsStorage internal referralsStorage;

    function initializeReferrals(
        uint256 _allyFeeP,
        uint256 _startReferrerFeeP,
        uint256 _openFeeP,
        uint256 _targetVolumeUsd
    ) external reinitializer(3) {
        uint256 referralsSlot;

        assembly {
            referralsSlot := referralsStorage.slot
        }
        if (referralsSlot != ReferralsUtils.getSlot()) {
            revert WrongSlot();
        }

        ReferralsUtils.initialize(
            _allyFeeP,
            _startReferrerFeeP,
            _openFeeP,
            _targetVolumeUsd
        );
    }

    // Management Setters
    function updateAllyFeeP(uint256 _value) external onlyRole(Role.GOV) {
        ReferralsUtils.updateAllyFeeP(_value);
    }

    function updateStartReferrerFeeP(
        uint256 _value
    ) external onlyRole(Role.GOV) {
        ReferralsUtils.updateStartReferrerFeeP(_value);
    }

    function updateOpenFeeP(uint256 _value) external onlyRole(Role.GOV) {
        ReferralsUtils.updateOpenFeeP(_value);
    }

    function updateTargetVolumeUsd(uint256 _value) external onlyRole(Role.GOV) {
        ReferralsUtils.updateTargetVolumeUsd(_value);
    }

    function whitelistAllies(
        address[] calldata _allies
    ) external onlyRole(Role.GOV) {
        ReferralsUtils.whitelistAllies(_allies);
    }

    function unwhitelistAllies(
        address[] calldata _allies
    ) external onlyRole(Role.GOV) {
        ReferralsUtils.unwhitelistAllies(_allies);
    }

    function whitelistReferrers(
        address[] calldata _referrers,
        address[] calldata _allies
    ) external onlyRole(Role.GOV) {
        ReferralsUtils.whitelistReferrers(_referrers, _allies);
    }

    function unwhitelistReferrers(
        address[] calldata _referrers
    ) external onlyRole(Role.GOV) {
        ReferralsUtils.unwhitelistReferrers(_referrers);
    }

    // Interactions
    function registerPotentialReferrer(
        address _trader,
        address _referrer
    ) external onlyRole(Role.TRADING) {
        ReferralsUtils.registerPotentialReferrer(_trader, _referrer);
    }

    function distributeReferralReward(
        address _trader,
        uint256 _volumeUsd, // 1e18
        uint256 _pairOpenFeeP,
        uint256 _tokenPriceUsd // 1e10
    ) external onlyRole(Role.CALLBACKS) returns (uint256) {
        return
            ReferralsUtils.distributeReferralReward(
                _trader,
                _volumeUsd,
                _pairOpenFeeP,
                _tokenPriceUsd
            );
    }

    function claimAllyRewards() external {
        ReferralsUtils.claimAllyRewards();
    }

    function claimReferrerRewards() external {
        ReferralsUtils.claimReferrerRewards();
    }

    // Getters
    function getReferrerFeeP(
        uint256 _pairOpenFeeP,
        uint256 _volumeReferredUsd
    ) external view returns (uint256) {
        return
            ReferralsUtils.getReferrerFeeP(_pairOpenFeeP, _volumeReferredUsd);
    }

    function getReferralsPercentOfOpenFeeP(
        address _trader
    ) external view returns (uint256) {
        return
            ReferralsUtils.getPercentOfOpenFeeP_calc(
                referralsStorage
                    .referrerDetails[referralsStorage.referrerByTrader[_trader]]
                    .volumeReferredUsd
            );
    }

    function getReferralsPercentOfOpenFeeP_calc(
        uint256 _volumeReferredUsd
    ) external view returns (uint256 resultP) {
        return ReferralsUtils.getPercentOfOpenFeeP_calc(_volumeReferredUsd);
    }

    function getReferrerByTrader(
        address _trader
    ) external view returns (address) {
        return referralsStorage.referrerByTrader[_trader];
    }

    function getTraderReferrer(
        address _trader
    ) external view returns (address) {
        address referrer = referralsStorage.referrerByTrader[_trader];

        return
            referralsStorage.referrerDetails[referrer].active
                ? referrer
                : address(0);
    }

    function getReferrersReferred(
        address _ally
    ) external view returns (address[] memory) {
        return referralsStorage.allyDetails[_ally].referrersReferred;
    }

    function getTradersReferred(
        address _referred
    ) external view returns (address[] memory) {
        return referralsStorage.referrerDetails[_referred].tradersReferred;
    }

    function getReferralsAllyFeeP() external view returns (uint256) {
        return referralsStorage.allyFeeP;
    }

    function getReferralsStartReferrerFeeP() external view returns (uint256) {
        return referralsStorage.startReferrerFeeP;
    }

    function getReferralsOpenFeeP() external view returns (uint256) {
        return referralsStorage.openFeeP;
    }

    function getReferralsTargetVolumeUsd() external view returns (uint256) {
        return referralsStorage.targetVolumeUsd;
    }

    function getAllyDetails(
        address _ally
    ) external view returns (IReferralsUtils.AllyDetails memory) {
        return referralsStorage.allyDetails[_ally];
    }

    function getReferrerDetails(
        address _referrer
    ) external view returns (IReferralsUtils.ReferrerDetails memory) {
        return referralsStorage.referrerDetails[_referrer];
    }
}
