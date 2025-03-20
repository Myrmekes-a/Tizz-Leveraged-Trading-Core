// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @custom:version 7
 */
interface ITizzStaking {
    struct Staker {
        uint128 stakedTizz; // 1e18
        uint128 debtBaseAsset; // 1e18
    }

    struct RewardState {
        uint128 accRewardPerTizz; // 1e18
        uint128 precisionDelta;
    }

    struct RewardInfo {
        uint128 debtToken; // 1e18
        uint128 __placeholder;
    }

    struct UnlockSchedule {
        uint128 totalTizz; // 1e18
        uint128 claimedTizz; // 1e18
        uint128 debtBaseAsset; // 1e18
        uint48 start; // block.timestamp (seconds)
        uint48 duration; // in seconds
        bool revocable;
        UnlockType unlockType;
        uint16 __placeholder;
    }

    struct UnlockScheduleInput {
        uint128 totalTizz; // 1e18
        uint48 start; // block.timestamp (seconds)
        uint48 duration; // in seconds
        bool revocable;
        UnlockType unlockType;
    }

    enum UnlockType {
        LINEAR,
        CLIFF
    }

    function owner() external view returns (address);

    function distributeReward(
        address _rewardToken,
        uint256 _amountToken
    ) external;

    function createUnlockSchedule(
        UnlockScheduleInput calldata _schedule,
        address _staker
    ) external;

    event UnlockManagerUpdated(address indexed manager, bool authorized);

    event RewardHarvested(
        address indexed staker,
        address indexed token,
        uint128 amountToken
    );
    event RewardHarvestedFromUnlock(
        address indexed staker,
        address indexed token,
        bool isOldBaseAsset,
        uint256[] ids,
        uint128 amountToken
    );
    event RewardDistributed(address indexed token, uint256 amount);

    event TizzStaked(address indexed staker, uint128 amountTizz);
    event TizzUnstaked(address indexed staker, uint128 amountTizz);
    event TizzClaimed(
        address indexed staker,
        uint256[] ids,
        uint128 amountTizz
    );

    event UnlockScheduled(
        address indexed staker,
        uint256 indexed index,
        UnlockSchedule schedule
    );
    event UnlockScheduleRevoked(address indexed staker, uint256 indexed index);

    event RewardTokenAdded(
        address token,
        uint256 index,
        uint128 precisionDelta
    );
}
