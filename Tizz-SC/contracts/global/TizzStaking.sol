// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Initializable} from "../external/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable, Ownable2StepUpgradeable} from "../external/@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {SafeERC20} from "../external/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/ITizzStaking.sol";
import "../interfaces/IERC20.sol";

import "../libraries/CollateralUtils.sol";
import {Utils} from "../commonLib/Utils.sol";

import "../misc/VotingDelegator.sol";

/**
 * @custom:version 7
 */
contract TizzStaking is
    Initializable,
    Ownable2StepUpgradeable,
    ITizzStaking,
    VotingDelegator
{
    using SafeERC20 for IERC20;

    uint48 private constant MAX_UNLOCK_DURATION = 730 days; // 2 years in seconds
    uint128 private constant MIN_UNLOCK_TIZZ_AMOUNT = 1e18;

    IERC20 public tizzFinanceToken;
    IERC20 public baseAsset;

    uint128 public accBaseAssetPerToken; // deprecated (old rewards)
    uint128 public tizzFinanceTokenBalance;
    uint128 public minStakeAmount;

    mapping(address => Staker) public stakers; // stakers.debtBaseAsset is deprecated (old BaseAsset rewards)
    mapping(address => UnlockSchedule[]) private unlockSchedules; // unlockSchedules.debtBaseAsset is deprecated (old BaseAsset rewards)
    mapping(address => bool) public unlockManagers; // addresses allowed to create vests for others

    address[] public rewardTokens;
    mapping(address => RewardState) public rewardTokenState;

    mapping(address => mapping(address => RewardInfo)) public userTokenRewards; // user => token => info
    mapping(address => mapping(address => mapping(uint256 => RewardInfo)))
        public userTokenUnlockRewards; // user => token => unlock ID => info

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Sets `owner` and initializes `BaseAsset` and `tizzFinanceToken` state variables
     */
    function initialize(
        address _owner,
        IERC20 _tizzFinanceToken,
        IERC20 _baseAsset,
        uint128 _minStakeAmount
    ) external initializer {
        require(
            address(_owner) != address(0) &&
                address(_tizzFinanceToken) != address(0) &&
                _minStakeAmount > 0 &&
                address(_baseAsset) != address(0),
            "WRONG_PARAMS"
        );

        _transferOwnership(_owner);
        tizzFinanceToken = _tizzFinanceToken;
        baseAsset = _baseAsset;
        minStakeAmount = _minStakeAmount;
    }

    /**
     * @dev Add `baseAsset` as a reward token (old stakers.debtBaseAsset, unlockSchedules.debtBaseAsset and accBaseAssetPerToken are deprecacted now)
     * Necessary to call right after contract is updated because otherwise distributeRewardBaseAsset() reverts.
     */
    function initializeV2() external reinitializer(2) {
        _addRewardToken(address(baseAsset));
    }

    /**
     * @dev Modifier used for vest creation access control.
     * Users can create non-revocable vests for themselves only, `owner` and `unlockManagers` can create both types for anyone.
     */
    modifier onlyAuthorizedUnlockManager(address _staker, bool _revocable) {
        require(
            (_staker == msg.sender && !_revocable) ||
                msg.sender == owner() ||
                unlockManagers[msg.sender],
            "NO_AUTH"
        );
        _;
    }

    /**
     * @dev Modifier to reject any `_token` not configured as a reward token
     */
    modifier onlyRewardToken(address _token) {
        require(isRewardToken(_token), "INVALID_TOKEN");
        _;
    }

    /**
     * @dev Sets whether `_manager` is `_authorized` to create vests for other users.
     *
     * Emits {UnlockManagerUpdated}
     */
    function setUnlockManager(
        address _manager,
        bool _authorized
    ) external onlyOwner {
        unlockManagers[_manager] = _authorized;

        emit UnlockManagerUpdated(_manager, _authorized);
    }

    /**
     * @dev Adds `_token` as a reward token, configures its precision delta.
     *
     * precisionDelta = 10^(18-decimals), eg. USDC 6 decimals => precisionDelta = 1e12
     * It is used to scale up from token amounts to 1e18 normalized accRewardPerTizz/debtToken
     * and to scale down from accRewardPerTizz/debtToken back to 'real' pending token amounts.
     *
     * Emits {RewardTokenAdded}
     */
    function _addRewardToken(address _token) private {
        require(_token != address(0), "ZERO_ADDRESS");
        require(!isRewardToken(_token), "DUPLICATE");

        rewardTokens.push(_token);

        uint128 precisionDelta = CollateralUtils
            .getCollateralConfig(_token)
            .precisionDelta;
        rewardTokenState[_token].precisionDelta = precisionDelta;

        emit RewardTokenAdded(_token, rewardTokens.length - 1, precisionDelta);
    }

    /**
     * @dev Forwards call to {_addRewardToken}. Only callable by `owner`.
     */
    function addRewardToken(address _token) external onlyOwner {
        _addRewardToken(_token);
    }

    /**
     * @dev Attempts to set the delegatee of `_token` to `_delegatee`. `_token` must be a valid reward token.
     */
    function setDelegatee(
        address _token,
        address _delegatee
    ) external onlyRewardToken(_token) onlyOwner {
        require(_delegatee != address(0), "ADDRESS_0");

        _tryDelegate(_token, _delegatee);
    }

    /**
     * @dev Returns the current debt (1e18 precision) for a token given `_stakedTizz` and `_accRewardPerTizz`
     */
    function _currentDebtToken(
        uint128 _stakedTizz,
        uint128 _accRewardPerTizz
    ) private pure returns (uint128) {
        return uint128((uint256(_stakedTizz) * _accRewardPerTizz) / 1e18);
    }

    /**
     * @dev Returns the amount of pending token rewards (precision depends on token) given `_currDebtToken`, `_lastDebtToken` and `_precisionDelta`
     */
    function _pendingTokens(
        uint128 _currDebtToken,
        uint128 _lastDebtToken,
        uint128 _precisionDelta
    ) private pure returns (uint128) {
        return (_currDebtToken - _lastDebtToken) / _precisionDelta;
    }

    /**
     * @dev Returns the amount of pending token rewards (precision depends on token) given `_stakedTizz`, `_lastDebtToken` and `_rewardState` for a token
     */
    function _pendingTokens(
        uint128 _stakedTizz,
        uint128 _lastDebtToken,
        RewardState memory _rewardState
    ) private pure returns (uint128) {
        return
            _pendingTokens(
                _currentDebtToken(_stakedTizz, _rewardState.accRewardPerTizz),
                _lastDebtToken,
                _rewardState.precisionDelta
            );
    }

    /**
     * @dev returns pending old baseAsset (1e18 precision) given `_currDebtBaseAsset` and `_lastDebtBaseAsset`
     * @custom:deprecated to be removed in version after v7
     */
    function _pendingBaseAssetPure(
        uint128 _currDebtBaseAsset,
        uint128 _lastDebtBaseAsset
    ) private pure returns (uint128) {
        return _pendingTokens(_currDebtBaseAsset, _lastDebtBaseAsset, 1);
    }

    /**
     * @dev returns pending old baseAsset (1e18 precision) given `_stakedTizz` amount and `_lastDebtBaseAsset`
     * @custom:deprecated to be removed in version after v7
     */
    function _pendingBaseAsset(
        uint128 _stakedTizz,
        uint128 _lastDebtBaseAsset
    ) private view returns (uint128) {
        return
            _pendingBaseAssetPure(
                _currentDebtToken(_stakedTizz, accBaseAssetPerToken),
                _lastDebtBaseAsset
            );
    }

    /**
     * @dev returns pending old baseAsset (1e18 precision) given `_schedule`
     * @custom:deprecated to be removed in version after v7
     */
    function _pendingBaseAsset(
        UnlockSchedule memory _schedule
    ) private view returns (uint128) {
        return
            _pendingBaseAssetPure(
                _currentDebtToken(
                    _scheduleStakedTizz(
                        _schedule.totalTizz,
                        _schedule.claimedTizz
                    ),
                    accBaseAssetPerToken
                ),
                _schedule.debtBaseAsset
            );
    }

    /**
     * @dev returns staked tizzFinanceToken (1e18 precision) given `_totalTizz` and `_claimedTizz`
     */
    function _scheduleStakedTizz(
        uint128 _totalTizz,
        uint128 _claimedTizz
    ) private pure returns (uint128) {
        return _totalTizz - _claimedTizz;
    }

    /**
     * @dev Returns the unlocked TIZZ tokens amount of `_schedule` at `_timestamp`.
     * Includes already claimed TIZZ tokens.
     */
    function unlockedTizz(
        UnlockSchedule memory _schedule,
        uint48 _timestamp
    ) public pure returns (uint128) {
        // if vest has ended return totalTizz
        if (_timestamp >= _schedule.start + _schedule.duration)
            return _schedule.totalTizz;

        // if unlock hasn't started or it's a cliff unlock return 0
        if (
            _timestamp < _schedule.start ||
            _schedule.unlockType == UnlockType.CLIFF
        ) return 0;

        return
            uint128(
                (uint256(_schedule.totalTizz) *
                    (_timestamp - _schedule.start)) / _schedule.duration
            );
    }

    /**
     * @dev Returns the releasable TIZZ tokens amount (1e18 precision) of `_schedule` at `_timestamp`.
     * Doesn't include already claimed TIZZ tokens.
     */
    function releasableTizz(
        UnlockSchedule memory _schedule,
        uint48 _timestamp
    ) public pure returns (uint128) {
        return unlockedTizz(_schedule, _timestamp) - _schedule.claimedTizz;
    }

    /**
     * @dev Returns the owner of the contract.
     */
    function owner()
        public
        view
        override(ITizzStaking, OwnableUpgradeable)
        returns (address)
    {
        return super.owner();
    }

    /**
     * @dev Returns whether `_token` is a listed reward token.
     */
    function isRewardToken(address _token) public view returns (bool) {
        return rewardTokenState[_token].precisionDelta > 0;
    }

    /**
     * @dev Harvests `msg.sender`'s `_token` pending rewards for non-vested TIZZ.
     *
     * Handles updating `stake.debtToken` with new debt given `_stakedTizz`.
     * Transfers pending `_token` rewards to `msg.sender`.
     *
     * Emits {RewardHarvested}
     */
    function _harvestToken(address _token, uint128 _stakedTizz) private {
        RewardInfo storage userInfo = userTokenRewards[msg.sender][_token];
        RewardState memory rewardState = rewardTokenState[_token];

        uint128 newDebtToken = _currentDebtToken(
            _stakedTizz,
            rewardState.accRewardPerTizz
        );
        uint128 pendingTokens = _pendingTokens(
            newDebtToken,
            userInfo.debtToken,
            rewardState.precisionDelta
        );

        userInfo.debtToken = newDebtToken;

        IERC20(_token).safeTransfer(msg.sender, uint256(pendingTokens));

        emit RewardHarvested(msg.sender, _token, pendingTokens);
    }

    /**
     * @dev Harvest pending `_token` rewards of `_staker` for vests `_ids`.
     * `_isOldBaseAsset` allows to differentiate between the old baseAsset rewards before v7 and the new ones.
     *
     * Emits {RewardHarvestedFromUnlock}
     */
    function _harvestFromUnlock(
        address _staker,
        address _token,
        uint256[] memory _ids,
        bool _isOldBaseAsset
    ) private {
        require(_staker != address(0), "USER_EMPTY");

        uint256 length = _ids.length;
        if (length == 0) return;

        uint128 precisionDelta; // only used when _isOldBaseAsset == false
        uint128 accRewardPerTizz;

        /// @custom:deprecated to be removed in version after v7 (only keep else part)
        if (_isOldBaseAsset) {
            accRewardPerTizz = accBaseAssetPerToken;
        } else {
            RewardState memory rewardState = rewardTokenState[_token];
            precisionDelta = rewardState.precisionDelta;
            accRewardPerTizz = rewardState.accRewardPerTizz;
        }

        uint128 pendingTokens;

        if (length > 0) {
            for (uint256 i; i < length; ) {
                uint256 unlockId = _ids[i];
                UnlockSchedule storage schedule = unlockSchedules[_staker][
                    unlockId
                ];

                uint128 newDebtToken = _currentDebtToken(
                    _scheduleStakedTizz(
                        schedule.totalTizz,
                        schedule.claimedTizz
                    ),
                    accRewardPerTizz
                );

                /// @custom:deprecated to be removed in version after v7 (only keep else part)
                if (_isOldBaseAsset) {
                    pendingTokens += _pendingBaseAssetPure(
                        newDebtToken,
                        schedule.debtBaseAsset
                    );
                    schedule.debtBaseAsset = newDebtToken;
                } else {
                    RewardInfo storage unlockInfo = userTokenUnlockRewards[
                        _staker
                    ][_token][unlockId];
                    pendingTokens += _pendingTokens(
                        newDebtToken,
                        unlockInfo.debtToken,
                        precisionDelta
                    );
                    unlockInfo.debtToken = newDebtToken;
                }

                unchecked {
                    ++i;
                }
            }
        }

        IERC20(_token).safeTransfer(_staker, uint256(pendingTokens));

        emit RewardHarvestedFromUnlock(
            _staker,
            _token,
            _isOldBaseAsset,
            _ids,
            pendingTokens
        );
    }

    /**
     * @dev Harvests the `_staker`'s vests `_ids` pending rewards for '_token'
     */
    function _harvestTokenFromUnlock(
        address _staker,
        address _token,
        uint256[] memory _ids
    ) private {
        _harvestFromUnlock(_staker, _token, _ids, false);
    }

    /**
     * @dev Harvests the `_staker`'s vests `_ids` pending rewards for all supported reward tokens
     */
    function _harvestTokensFromUnlock(
        address _staker,
        address[] memory _rewardTokens,
        uint256[] memory _ids
    ) private {
        uint256 length = _rewardTokens.length;
        if (length == 0) {
            return;
        }
        for (uint256 i; i < length; ) {
            _harvestTokenFromUnlock(_staker, _rewardTokens[i], _ids);

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Harvests the `_staker`'s vests `_ids` old baseAsset pending rewards
     */
    function _harvestBaseAssetFromUnlock(
        address _staker,
        uint256[] memory _ids
    ) private {
        _harvestFromUnlock(_staker, address(baseAsset), _ids, true);
    }

    /**
     * @dev Loops through all `rewardTokens` and syncs `debtToken`.
     * Used when staking or unstaking tizzFinanceToken and only after claiming pending rewards.
     * If called before harvesting, all pending rewards will be lost.
     */
    function _syncRewardTokensDebt(
        address _staker,
        uint128 _stakedTizz
    ) private {
        uint256 len = rewardTokens.length;
        for (uint256 i; i < len; ) {
            address rewardToken = rewardTokens[i];

            userTokenRewards[_staker][rewardToken]
                .debtToken = _currentDebtToken(
                _stakedTizz,
                rewardTokenState[rewardToken].accRewardPerTizz
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Loops through all `_rewardTokens` and syncs `debtToken`.
     * Used when creating a vest or when claiming unlocked TIZZ from a vest, after claiming pending rewards.
     * If called before harvesting, all pending rewards will be lost.
     */
    function _syncUnlockRewardTokensDebt(
        address _staker,
        address[] memory _rewardTokens,
        uint256 _unlockId,
        uint128 _stakedTizz
    ) private {
        uint256 length = _rewardTokens.length;
        if (length == 0) {
            return;
        }
        for (uint256 i; i < length; ) {
            address rewardToken = _rewardTokens[i];

            userTokenUnlockRewards[_staker][rewardToken][_unlockId]
                .debtToken = _currentDebtToken(
                _stakedTizz,
                rewardTokenState[rewardToken].accRewardPerTizz
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Harvests old baseAsset and all supported tokens pending rewards for vests `_ids` of `_staker`.
     *
     * Then calculates each vest's releasable `amountTizz` given `_timestamp`, increases their 'claimedTizz' by this amount,
     * and syncs old `debtBaseAsset` and all supported tokens debts.
     *
     * Finally transfers the total claimable TIZZ of all vests to `_staker`.
     *
     * Emits {TizzClaimed}
     */
    function _claimUnlockedTizz(
        address _staker,
        uint256[] memory _ids,
        uint48 _timestamp
    ) private {
        uint256 length = _ids.length;
        if (length == 0) {
            return;
        }
        uint128 claimedTizz;
        address[] memory rewardTokensArray = rewardTokens;

        _harvestBaseAssetFromUnlock(_staker, _ids);
        _harvestTokensFromUnlock(_staker, rewardTokensArray, _ids);

        for (uint256 i; i < length; ) {
            uint256 unlockId = _ids[i];
            UnlockSchedule storage schedule = unlockSchedules[_staker][
                unlockId
            ];

            // get tizzFinanceToken amount being claimed for current vest
            uint128 amountTizz = releasableTizz(schedule, _timestamp);

            // make sure new vest total claimed amount is not more than total tizzFinanceToken for vest
            uint128 scheduleNewClaimedTizz = schedule.claimedTizz + amountTizz;
            uint128 scheduleTotalTizz = schedule.totalTizz;
            assert(scheduleNewClaimedTizz <= scheduleTotalTizz);

            // update vest claimed tizzFinanceToken
            schedule.claimedTizz = scheduleNewClaimedTizz;

            // sync debts for all tokens
            uint128 newStakedTizz = _scheduleStakedTizz(
                scheduleTotalTizz,
                scheduleNewClaimedTizz
            );
            schedule.debtBaseAsset = _currentDebtToken(
                newStakedTizz,
                accBaseAssetPerToken
            ); /// @custom:deprecated to be removed in version after v7
            _syncUnlockRewardTokensDebt(
                _staker,
                rewardTokensArray,
                unlockId,
                newStakedTizz
            );

            claimedTizz += amountTizz;

            unchecked {
                ++i;
            }
        }

        tizzFinanceTokenBalance -= claimedTizz;
        tizzFinanceToken.safeTransfer(_staker, uint256(claimedTizz));

        emit TizzClaimed(_staker, _ids, claimedTizz);
    }

    /**
     * @dev Transfers `_amountToken` of `_token` (valid reward token) from caller to this contract and updates `accRewardPerTizz`.
     *
     * @dev Note: `accRewardPerTizz` is normalized to 1e18 for all reward tokens (even those with less than 18 decimals)
     *
     * Emits {RewardDistributed}
     */
    function distributeReward(
        address _token,
        uint256 _amountToken
    ) external override onlyRewardToken(_token) {
        require(tizzFinanceTokenBalance > 0, "NO_TIZZ_STAKED");

        _amountToken = Utils.transferFrom(
            _token,
            msg.sender,
            address(this),
            _amountToken
        );

        RewardState storage rewardState = rewardTokenState[_token];
        rewardState.accRewardPerTizz += uint128(
            (_amountToken * rewardState.precisionDelta * 1e18) /
                tizzFinanceTokenBalance
        );

        emit RewardDistributed(_token, _amountToken);
    }

    /**
     * @dev Harvests the caller's regular pending `_token` rewards. `_token` must be a valid reward token.
     */
    function harvestToken(address _token) public onlyRewardToken(_token) {
        _harvestToken(_token, stakers[msg.sender].stakedTizz);
    }

    /**
     * @dev Harvests the caller's pending `_token` rewards for vests `_ids`. `_token` must be a valid reward token.
     */
    function harvestTokenFromUnlock(
        address _token,
        uint[] calldata _ids
    ) public onlyRewardToken(_token) {
        _harvestTokenFromUnlock(msg.sender, _token, _ids);
    }

    /**
     * @dev Harvests the caller's regular pending `_token` rewards and pending rewards for vests `_ids`.
     */
    function harvestTokenAll(address _token, uint[] calldata _ids) external {
        harvestToken(_token);
        harvestTokenFromUnlock(_token, _ids);
    }

    /**
     * @dev Harvests the caller's regular pending rewards for all supported reward tokens.
     */
    function harvestTokens() public {
        uint128 stakedTizz = stakers[msg.sender].stakedTizz;

        uint256 len = rewardTokens.length;
        for (uint256 i; i < len; ) {
            _harvestToken(rewardTokens[i], stakedTizz);

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Harvests the caller's pending rewards of vests `_ids` for all supported reward tokens.
     */
    function harvestTokensFromUnlock(uint[] calldata _ids) public {
        _harvestTokensFromUnlock(msg.sender, rewardTokens, _ids);
    }

    /**
     * @dev Harvests the caller's regular pending rewards and pending rewards of vests `_ids` for all supported reward tokens.
     */
    function harvestTokensAll(uint[] calldata _ids) public {
        harvestTokens();
        harvestTokensFromUnlock(_ids);
    }

    /**
     * @dev Harvests caller's old baseAsset rewards for vests `_ids`.
     * @custom:deprecated to be removed in version after v7
     */
    function harvestBaseAssetFromUnlock(uint256[] calldata _ids) public {
        _harvestBaseAssetFromUnlock(msg.sender, _ids);
    }

    /**
     * @dev Harvests the caller's regular pending rewards and pending rewards for vests `_ids` for all supported reward tokens (+ old BaseAsset rewards).
     * @custom:deprecated to be removed in version after v7, can just use {harvestTokensAll}
     */
    function harvestAll(uint[] calldata _ids) external {
        harvestTokensAll(_ids);
    }

    /// @notice Stakes non-vested `_amountTizz` from caller.
    /// @dev Stake TizzFinanceToken
    /// @dev Emits {TizzStaked}
    function stakeTizz(uint128 _amountTizz) external {
        require(_amountTizz >= minStakeAmount, "LESS_THAN_MIN_AMOUNT");

        _amountTizz = uint128(
            Utils.transferFrom(
                address(tizzFinanceToken),
                msg.sender,
                address(this),
                _amountTizz
            )
        );

        harvestTokens();

        Staker storage staker = stakers[msg.sender];
        uint128 newStakedTizz = staker.stakedTizz + _amountTizz;

        staker.stakedTizz = newStakedTizz;

        /// @custom:deprecated to be removed in version after v7
        staker.debtBaseAsset = _currentDebtToken(
            newStakedTizz,
            accBaseAssetPerToken
        );

        // Update `.debtToken` for all reward tokens using newStakedTizz
        _syncRewardTokensDebt(msg.sender, newStakedTizz);

        tizzFinanceTokenBalance += _amountTizz;

        emit TizzStaked(msg.sender, _amountTizz);
    }

    /**
     * @dev Unstakes non-vested `_amountTizz` from caller.
     *
     * Emits {TizzUnstaked}
     */
    function unstakeTizz(uint128 _amountTizz) external {
        require(_amountTizz > 0, "AMOUNT_ZERO");

        harvestTokens();

        Staker storage staker = stakers[msg.sender];
        uint128 newStakedTizz = staker.stakedTizz - _amountTizz; // reverts if _amountTizz > staker.stakedTizz (underflow)

        staker.stakedTizz = newStakedTizz;

        /// @custom:deprecated to be removed in version after v7
        staker.debtBaseAsset = _currentDebtToken(
            newStakedTizz,
            accBaseAssetPerToken
        );

        // Update `.debtToken` for all reward tokens with current newStakedTizz
        _syncRewardTokensDebt(msg.sender, newStakedTizz);

        tizzFinanceTokenBalance -= _amountTizz;
        tizzFinanceToken.safeTransfer(msg.sender, uint256(_amountTizz));

        emit TizzUnstaked(msg.sender, _amountTizz);
    }

    /**
     * @dev Claims caller's unlocked TIZZ from vests `_ids`.
     */
    function claimUnlockedTizz(uint256[] memory _ids) external {
        _claimUnlockedTizz(msg.sender, _ids, uint48(block.timestamp));
    }

    /**
     * @dev Creates vest for `_staker` given `_schedule` input parameters.
     * Restricted with onlyAuthorizedUnlockManager access control.
     *
     * Emits {UnlockScheduled}
     */
    function createUnlockSchedule(
        UnlockScheduleInput calldata _schedule,
        address _staker
    )
        external
        override
        onlyAuthorizedUnlockManager(_staker, _schedule.revocable)
    {
        uint48 timestamp = uint48(block.timestamp);

        require(
            _schedule.start < timestamp + MAX_UNLOCK_DURATION,
            "TOO_FAR_IN_FUTURE"
        );
        require(
            _schedule.duration > 0 && _schedule.duration <= MAX_UNLOCK_DURATION,
            "INCORRECT_DURATION"
        );
        require(
            _schedule.totalTizz >= MIN_UNLOCK_TIZZ_AMOUNT,
            "INCORRECT_AMOUNT"
        );
        require(_staker != address(0), "ADDRESS_0");

        uint128 totalTizz = uint128(
            Utils.transferFrom(
                address(tizzFinanceToken),
                msg.sender,
                address(this),
                _schedule.totalTizz
            )
        );

        // Requester has to pay the tizzFinanceToken amount

        UnlockSchedule memory schedule = UnlockSchedule({
            totalTizz: totalTizz,
            claimedTizz: 0,
            debtBaseAsset: _currentDebtToken(totalTizz, accBaseAssetPerToken), /// @custom:deprecated to be removed in version after v7
            start: _schedule.start >= timestamp ? _schedule.start : timestamp, // accept time in the future
            duration: _schedule.duration,
            unlockType: _schedule.unlockType,
            revocable: _schedule.revocable,
            __placeholder: 0
        });

        unlockSchedules[_staker].push(schedule);
        tizzFinanceTokenBalance += totalTizz;

        uint256 unlockId = unlockSchedules[_staker].length - 1;

        // Set `.debtToken` for all available rewardTokens
        _syncUnlockRewardTokensDebt(_staker, rewardTokens, unlockId, totalTizz);

        emit UnlockScheduled(_staker, unlockId, schedule);
    }

    /**
     * @dev Revokes vest `_id` for `_staker`. Sends the unlocked TIZZ to `_staker` and sends the remaining locked TIZZ to `owner`.
     * Only callable by `owner`.
     *
     * Emits {UnlockScheduleRevoked}
     */
    function revokeUnlockSchedule(
        address _staker,
        uint256 _id
    ) external onlyOwner {
        UnlockSchedule storage schedule = unlockSchedules[_staker][_id];
        require(schedule.revocable, "NOT_REVOCABLE");

        uint256[] memory ids = new uint256[](1);
        ids[0] = _id;

        // claims unlocked tizzFinanceToken and harvests pending rewards
        _claimUnlockedTizz(_staker, ids, uint48(block.timestamp));

        // store remaining tizzFinanceToken staked before resetting schedule
        uint128 lockedAmountTizz = _scheduleStakedTizz(
            schedule.totalTizz,
            schedule.claimedTizz
        );

        // resets vest so no more claims or harvests are possible
        schedule.totalTizz = schedule.claimedTizz;
        schedule.duration = 0;
        schedule.start = 0;
        schedule.debtBaseAsset = 0; /// @custom:deprecated to be removed in version after v7

        // reset all other reward tokens `debtToken` to 0 (by passing _stakedTizz = 0)
        _syncUnlockRewardTokensDebt(_staker, rewardTokens, _id, 0);

        tizzFinanceTokenBalance -= lockedAmountTizz;
        tizzFinanceToken.safeTransfer(owner(), uint256(lockedAmountTizz));

        emit UnlockScheduleRevoked(_staker, _id);
    }

    /**
     * @dev Returns the pending `_token` rewards (precision depends on token) for `_staker`.
     */
    function pendingRewardToken(
        address _staker,
        address _token
    ) public view returns (uint128) {
        if (!isRewardToken(_token)) return 0;

        return
            _pendingTokens(
                stakers[_staker].stakedTizz,
                userTokenRewards[_staker][_token].debtToken,
                rewardTokenState[_token]
            );
    }

    /**
     * @dev Returns an array of `_staker`'s pending rewards (precision depends on token) for all supported tokens.
     */
    function pendingRewardTokens(
        address _staker
    ) external view returns (uint128[] memory pendingTokens) {
        uint256 len = rewardTokens.length;
        pendingTokens = new uint128[](len);
        if (len == 0) {
            return pendingTokens;
        }

        for (uint256 i; i < len; ++i) {
            pendingTokens[i] = pendingRewardToken(_staker, rewardTokens[i]);
        }

        return pendingTokens;
    }

    /**
     * @dev Returns an array of `_staker`'s pending rewards (precision depends on token) from vests `_ids` for all supported tokens.
     */
    function pendingRewardTokensFromUnlocks(
        address _staker,
        uint256[] calldata _ids
    ) external view returns (uint128[] memory pendingTokens) {
        address[] memory rewardTokensArray = rewardTokens;
        pendingTokens = new uint128[](rewardTokensArray.length);
        uint256 length = _ids.length;
        uint256 rewardTokenLength = rewardTokensArray.length;
        if (length == 0 || pendingTokens.length == 0) {
            return pendingTokens;
        }

        for (uint256 i; i < length; ++i) {
            UnlockSchedule storage schedule = unlockSchedules[_staker][_ids[i]];
            uint128 stakedTizz = _scheduleStakedTizz(
                schedule.totalTizz,
                schedule.claimedTizz
            );

            for (uint256 j; j < rewardTokenLength; ++j) {
                address rewardToken = rewardTokensArray[j];

                pendingTokens[j] += _pendingTokens(
                    stakedTizz,
                    userTokenUnlockRewards[_staker][rewardToken][_ids[i]]
                        .debtToken,
                    rewardTokenState[rewardToken]
                );
            }
        }
    }

    /**
     * @dev Returns `_staker`'s pending old baseAsset rewards (1e18 precision).
     * @custom:deprecated to be removed in version after v7
     */
    function pendingRewardBaseAsset(
        address _staker
    ) external view returns (uint128) {
        Staker memory staker = stakers[_staker];
        return _pendingBaseAsset(staker.stakedTizz, staker.debtBaseAsset);
    }

    /**
     * @dev Returns `_staker`'s pending old baseAsset rewards (1e18 precision) from vests `_ids`.
     * @custom:deprecated to be removed in version after v7
     */
    function pendingRewardBaseAssetFromUnlocks(
        address _staker,
        uint256[] calldata _ids
    ) external view returns (uint128 pending) {
        uint256 length = _ids.length;
        if (length == 0) {
            return 0;
        }
        for (uint256 i; i < length; ++i) {
            pending += _pendingBaseAsset(unlockSchedules[_staker][_ids[i]]);
        }
    }

    /**
     * @dev Returns `_staker's` total non-vested and vested TIZZ staked (1e18 precision)
     */
    function totalTizzStaked(address _staker) external view returns (uint128) {
        uint128 totalTizz = stakers[_staker].stakedTizz;
        UnlockSchedule[] memory stakerUnlocks = unlockSchedules[_staker];
        uint256 length = stakerUnlocks.length;

        for (uint256 i; i < length; ++i) {
            UnlockSchedule memory schedule = stakerUnlocks[i];
            totalTizz += _scheduleStakedTizz(
                schedule.totalTizz,
                schedule.claimedTizz
            );
        }

        return totalTizz;
    }

    /**
     * @dev Returns all `_staker's` vests.
     */
    function getUnlockSchedules(
        address _staker
    ) external view returns (UnlockSchedule[] memory) {
        return unlockSchedules[_staker];
    }

    /**
     * @dev Returns `_staker's` vest at `_index'`
     */
    function getUnlockSchedules(
        address _staker,
        uint256 _index
    ) external view returns (UnlockSchedule memory) {
        return unlockSchedules[_staker][_index];
    }

    /**
     * @dev Returns the address of all supported reward tokens
     */
    function getRewardTokens() external view returns (address[] memory) {
        return rewardTokens;
    }
}
