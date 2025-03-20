// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../external/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../external/@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "../external/@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "../external/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../interfaces/IVaultToken.sol";
import "../interfaces/ITzToken.sol";
import "../interfaces/INft.sol";
import "../interfaces/IOpenTradesPnlFeed.sol";

import "../libraries/ChainUtils.sol";
import {Utils} from "../commonLib/Utils.sol";

contract TizzVaultToken is
    ERC20Upgradeable,
    ERC4626Upgradeable,
    OwnableUpgradeable,
    IVaultToken
{
    using MathUpgradeable for uint;

    // Contracts & Addresses (constant)
    address public tizzProtocolToken;
    INft public lockedDepositNft;

    // Contracts & Addresses (adjustable)
    address public manager; // 3-day timelock contract
    address public admin; // bypasses timelock, access to emergency functions

    address public pnlHandler;
    IOpenTradesPnlFeed public openTradesPnlFeed;
    TizzPriceProvider public tizzPriceProvider;

    // Parameters (constant)
    uint constant PRECISION = 1e18; // 18 decimals (acc values & price)
    uint constant PRECISION_2 = 1e40; // 40 decimals (acc block weighted market cap)
    uint constant TIZZ_PRECISION = 1e10; // 10 decimals (tizz/asset oracle)
    uint constant MIN_DAILY_ACC_PNL_DELTA = PRECISION / 10; // 0.1 (price delta)
    uint constant MAX_SUPPLY_INCREASE_DAILY_P = 50 * PRECISION; // 50% / day (when under collat)
    uint constant MAX_LOSSES_BURN_P = 25 * PRECISION; // 25% of all losses
    uint constant MAX_TIZZ_SUPPLY_MINT_DAILY_P = PRECISION / 20; // 0.05% / day (18.25% / yr max)
    uint constant MAX_DISCOUNT_P = 10 * PRECISION; // 10%
    uint public MIN_LOCK_DURATION; // min locked asset deposit duration
    uint constant MAX_LOCK_DURATION = 365 days; // max locked asset deposit duration
    uint[] WITHDRAW_EPOCHS_LOCKS; // epochs withdraw locks at over collat thresholds

    // Parameters (adjustable)
    uint public maxAccOpenPnlDelta; // PRECISION (max price delta on new epochs from open pnl)
    uint public maxDailyAccPnlDelta; // PRECISION (max daily price delta from closed pnl)
    uint[2] public withdrawLockThresholdsP; // PRECISION (% of over collat, used with WITHDRAW_EPOCHS_LOCKS)
    uint public maxSupplyIncreaseDailyP; // PRECISION (% per day, when under collat)
    uint public lossesBurnP; // PRECISION (% of all losses)
    uint public maxTizzSupplyMintDailyP; // PRECISION (% of tizz supply)
    uint public maxDiscountP; // PRECISION (%, maximum discount for locked deposits)
    uint public maxDiscountThresholdP; // PRECISION (maximum collat %, for locked deposits)

    // Price state
    uint public shareToAssetsPrice; // PRECISION
    int public accPnlPerTokenUsed; // PRECISION (snapshot of accPnlPerToken)
    int public accPnlPerToken; // PRECISION (updated in real-time)
    uint public accRewardsPerToken; // PRECISION

    // Closed Pnl state
    int public dailyAccPnlDelta; // PRECISION
    uint public lastDailyAccPnlDeltaReset; // timestamp

    // Epochs state (withdrawals)
    uint public currentEpoch; // global id
    uint public currentEpochStart; // timestamp
    uint public currentEpochPositiveOpenPnl; // 1e18

    // Deposit / Withdraw state
    uint public currentMaxSupply; // 1e18
    uint public lastMaxSupplyUpdate; // timestamp
    mapping(address => mapping(uint => uint)) public withdrawRequests; // owner => unlock epoch => shares

    // Locked deposits state
    uint public lockedDepositsCount; // global id
    mapping(uint => LockedDeposit) public lockedDeposits;

    // Deplete / Refill state
    uint public assetsToDeplete; // 1e18
    uint public dailyMintedTizz; // 1e18
    uint public lastDailyMintedTizzReset; // timestamp

    // Statistics (not used for contract logic)
    uint public totalDeposited; // 1e18 (assets)
    int public totalClosedPnl; // 1e18 (assets)
    uint public totalRewards; // 1e18 (assets)
    int public totalLiability; // 1e18 (assets)
    uint public totalLockedDiscounts; // 1e18 (assets)
    uint public totalDiscounts; // 1e18 (assets)
    uint public totalDepleted; // 1e18 (assets)
    uint public totalDepletedTizz; // 1e18 (tizz)
    uint public totalRefilled; // 1e18 (assets)
    uint public totalRefilledTizz; // 1e18 (tizz)

    // Useful acc values
    uint public accBlockWeightedMarketCap; // 1e40, acc sum of (blocks elapsed / market cap)
    uint public accBlockWeightedMarketCapLastStored; // block

    // Initializer function called when this contract is deployed
    function initialize(
        DeployParam memory _deployParam,
        ContractAddresses memory _contractAddresses,
        uint[2] memory _withdrawLockThresholdsP
    ) external initializer {
        require(
            _contractAddresses.asset != address(0) &&
                _contractAddresses.owner != address(0) &&
                _contractAddresses.manager != address(0) &&
                _contractAddresses.admin != address(0) &&
                _contractAddresses.owner != _contractAddresses.manager &&
                _contractAddresses.manager != _contractAddresses.admin &&
                _contractAddresses.tizzProtocolToken != address(0) &&
                _contractAddresses.pnlHandler != address(0) &&
                _contractAddresses.openTradesPnlFeed != address(0) &&
                _contractAddresses.tizzPriceProvider.addr != address(0) &&
                _contractAddresses.tizzPriceProvider.signature.length > 0 &&
                _deployParam._maxDailyAccPnlDelta >= MIN_DAILY_ACC_PNL_DELTA &&
                _withdrawLockThresholdsP[1] > _withdrawLockThresholdsP[0] &&
                _deployParam._maxSupplyIncreaseDailyP <=
                MAX_SUPPLY_INCREASE_DAILY_P &&
                _deployParam._lossesBurnP <= MAX_LOSSES_BURN_P &&
                _deployParam._maxTizzSupplyMintDailyP <=
                MAX_TIZZ_SUPPLY_MINT_DAILY_P &&
                _deployParam._maxDiscountP <= MAX_DISCOUNT_P &&
                _deployParam._maxDiscountThresholdP >= 100 * PRECISION,
            "WRONG_PARAMS"
        );

        __ERC20_init(_deployParam._name, _deployParam._symbol);
        __ERC4626_init(IERC20MetadataUpgradeable(_contractAddresses.asset));
        _transferOwnership(_contractAddresses.owner);

        tizzProtocolToken = _contractAddresses.tizzProtocolToken;
        manager = _contractAddresses.manager;
        admin = _contractAddresses.admin;
        pnlHandler = _contractAddresses.pnlHandler;
        openTradesPnlFeed = IOpenTradesPnlFeed(
            _contractAddresses.openTradesPnlFeed
        );
        tizzPriceProvider = _contractAddresses.tizzPriceProvider;

        MIN_LOCK_DURATION = _deployParam._MIN_LOCK_DURATION;

        maxAccOpenPnlDelta = _deployParam._maxAccOpenPnlDelta;
        maxDailyAccPnlDelta = _deployParam._maxDailyAccPnlDelta;
        withdrawLockThresholdsP = _withdrawLockThresholdsP;
        maxSupplyIncreaseDailyP = _deployParam._maxSupplyIncreaseDailyP;
        lossesBurnP = _deployParam._lossesBurnP;
        maxTizzSupplyMintDailyP = _deployParam._maxTizzSupplyMintDailyP;
        maxDiscountP = _deployParam._maxDiscountP;
        maxDiscountThresholdP = _deployParam._maxDiscountThresholdP;

        shareToAssetsPrice = PRECISION;
        currentEpoch = 1;
        currentEpochStart = block.timestamp;
        WITHDRAW_EPOCHS_LOCKS = [3, 2, 1];
    }

    function initializeV2() external reinitializer(2) {
        storeAccBlockWeightedMarketCap();
        totalDeposited += totalRewards; // include all already distributed rewards in totalDeposited
    }

    // Modifiers

    modifier validDiscount(uint lockDuration) {
        require(maxDiscountP > 0, "NO_ACTIVE_DISCOUNT");
        require(lockDuration >= MIN_LOCK_DURATION, "BELOW_MIN_LOCK_DURATION");
        require(lockDuration <= MAX_LOCK_DURATION, "ABOVE_MAX_LOCK_DURATION");
        _;
    }

    // Manage addresses
    function transferOwnership(address newOwner) public override onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        require(newOwner != manager && newOwner != admin, "WRONG_VALUE");
        _transferOwnership(newOwner);
    }

    function updateManager(address newValue) external onlyOwner {
        require(newValue != address(0), "ADDRESS_0");
        require(newValue != owner() && newValue != admin, "WRONG_VALUE");
        manager = newValue;
        emit AddressParamUpdated("manager", newValue);
    }

    function updateAdmin(address newValue) external {
        onlyManager();
        require(newValue != address(0), "ADDRESS_0");
        require(newValue != owner() && newValue != manager, "WRONG_VALUE");
        admin = newValue;
        emit AddressParamUpdated("admin", newValue);
    }

    function updatePnlHandler(address newValue) external onlyOwner {
        require(newValue != address(0), "ADDRESS_0");
        pnlHandler = newValue;
        emit AddressParamUpdated("pnlHandler", newValue);
    }

    function updateTizzPriceProvider(
        TizzPriceProvider memory newValue
    ) external {
        onlyManager();
        require(newValue.addr != address(0), "ADDRESS_0");
        require(newValue.signature.length > 0, "BYTES_0");
        tizzPriceProvider = newValue;
        emit TizzPriceProviderUpdated(newValue);
    }

    function updateOpenTradesPnlFeed(address newValue) external onlyOwner {
        require(newValue != address(0), "ADDRESS_0");
        openTradesPnlFeed = IOpenTradesPnlFeed(newValue);
        emit AddressParamUpdated("openTradesPnlFeed", newValue);
    }

    function setLockedDepositNft(address newValue) external onlyOwner {
        require(newValue != address(0), "ADDRESS_0");
        lockedDepositNft = INft(newValue);
        emit AddressParamUpdated("lockedDepositNft", newValue);
    }

    // Manage parameters
    function updateMaxAccOpenPnlDelta(uint newValue) external onlyOwner {
        maxAccOpenPnlDelta = newValue;
        emit NumberParamUpdated("maxAccOpenPnlDelta", newValue);
    }

    function updateMaxDailyAccPnlDelta(uint newValue) external {
        onlyManager();
        require(newValue >= MIN_DAILY_ACC_PNL_DELTA, "BELOW_MIN");
        maxDailyAccPnlDelta = newValue;
        emit NumberParamUpdated("maxDailyAccPnlDelta", newValue);
    }

    function updateWithdrawLockThresholdsP(
        uint[2] memory newValue
    ) external onlyOwner {
        require(newValue[1] > newValue[0], "WRONG_VALUES");
        withdrawLockThresholdsP = newValue;
        emit WithdrawLockThresholdsPUpdated(newValue);
    }

    function updateMaxSupplyIncreaseDailyP(uint newValue) external {
        onlyManager();
        require(newValue <= MAX_SUPPLY_INCREASE_DAILY_P, "ABOVE_MAX");
        maxSupplyIncreaseDailyP = newValue;
        emit NumberParamUpdated("maxSupplyIncreaseDailyP", newValue);
    }

    function updateLossesBurnP(uint newValue) external {
        onlyManager();
        require(newValue <= MAX_LOSSES_BURN_P, "ABOVE_MAX");
        lossesBurnP = newValue;
        emit NumberParamUpdated("lossesBurnP", newValue);
    }

    function updateMaxTizzSupplyMintDailyP(uint newValue) external {
        onlyManager();
        require(newValue <= MAX_TIZZ_SUPPLY_MINT_DAILY_P, "ABOVE_MAX");
        maxTizzSupplyMintDailyP = newValue;
        emit NumberParamUpdated("maxTizzSupplyMintDailyP", newValue);
    }

    function updateMaxDiscountP(uint newValue) external {
        onlyManager();
        require(newValue <= MAX_DISCOUNT_P, "ABOVE_MAX_DISCOUNT");
        maxDiscountP = newValue;
        emit NumberParamUpdated("maxDiscountP", newValue);
    }

    function updateMaxDiscountThresholdP(uint newValue) external {
        onlyManager();
        require(newValue >= 100 * PRECISION, "BELOW_MIN");
        maxDiscountThresholdP = newValue;
        emit NumberParamUpdated("maxDiscountThresholdP", newValue);
    }

    // View helper functions
    function maxAccPnlPerToken() public view returns (uint) {
        // PRECISION
        return PRECISION + accRewardsPerToken;
    }

    function collateralizationP() public view returns (uint) {
        // PRECISION (%)
        uint _maxAccPnlPerToken = maxAccPnlPerToken();
        return
            ((
                accPnlPerTokenUsed > 0
                    ? (_maxAccPnlPerToken - uint(accPnlPerTokenUsed))
                    : (_maxAccPnlPerToken + uint(accPnlPerTokenUsed * (-1)))
            ) *
                100 *
                PRECISION) / _maxAccPnlPerToken;
    }

    function tizzProtocolTokenToAssetsPrice() public view returns (uint price) {
        // TIZZ_PRECISION
        (bool success, bytes memory result) = tizzPriceProvider.addr.staticcall(
            tizzPriceProvider.signature
        );

        require(success == true, "TIZZ_PRICE_CALL_FAILED");
        (price) = abi.decode(result, (uint));

        require(price > 0, "TIZZ_TOKEN_PRICE_0");
    }

    function withdrawEpochsTimelock() public view returns (uint) {
        uint collatP = collateralizationP();
        uint overCollatP = (collatP -
            MathUpgradeable.min(collatP, 100 * PRECISION));

        return
            overCollatP > withdrawLockThresholdsP[1]
                ? WITHDRAW_EPOCHS_LOCKS[2]
                : (
                    overCollatP > withdrawLockThresholdsP[0]
                        ? WITHDRAW_EPOCHS_LOCKS[1]
                        : WITHDRAW_EPOCHS_LOCKS[0]
                );
    }

    function lockDiscountP(
        uint collatP,
        uint lockDuration
    ) public view returns (uint) {
        return
            ((
                collatP <= 100 * PRECISION
                    ? maxDiscountP
                    : (
                        collatP <= maxDiscountThresholdP
                            ? (maxDiscountP *
                                (maxDiscountThresholdP - collatP)) /
                                (maxDiscountThresholdP - 100 * PRECISION)
                            : 0
                    )
            ) * lockDuration) / MAX_LOCK_DURATION;
    }

    function totalSharesBeingWithdrawn(
        address _owner
    ) public view returns (uint shares) {
        for (
            uint i = currentEpoch;
            i <= currentEpoch + WITHDRAW_EPOCHS_LOCKS[0];
            i++
        ) {
            shares += withdrawRequests[_owner][i];
        }
    }

    function getPendingAccBlockWeightedMarketCap(
        uint currentBlock
    ) public view returns (uint) {
        return
            accBlockWeightedMarketCap +
            ((currentBlock - accBlockWeightedMarketCapLastStored) *
                PRECISION_2) /
            MathUpgradeable.max(marketCap(), 1);
    }

    // Public helper functions
    function tryUpdateCurrentMaxSupply() public {
        if (block.timestamp - lastMaxSupplyUpdate >= 24 hours) {
            currentMaxSupply =
                (totalSupply() * (PRECISION * 100 + maxSupplyIncreaseDailyP)) /
                (PRECISION * 100);
            lastMaxSupplyUpdate = block.timestamp;

            emit CurrentMaxSupplyUpdated(currentMaxSupply);
        }
    }

    function tryResetDailyAccPnlDelta() public {
        if (block.timestamp - lastDailyAccPnlDeltaReset >= 24 hours) {
            dailyAccPnlDelta = 0;
            lastDailyAccPnlDeltaReset = block.timestamp;

            emit DailyAccPnlDeltaReset();
        }
    }

    function tryNewOpenPnlRequestOrEpoch() public {
        // Fault tolerance so that activity can continue anyway
        (bool success, ) = address(openTradesPnlFeed).call(
            abi.encodeWithSignature("newOpenPnlRequestOrEpoch()")
        );
        if (!success) {
            emit OpenTradesPnlFeedCallFailed();
        }
    }

    function storeAccBlockWeightedMarketCap() public {
        uint currentBlock = ChainUtils.getBlockNumber();
        accBlockWeightedMarketCap = getPendingAccBlockWeightedMarketCap(
            currentBlock
        );
        accBlockWeightedMarketCapLastStored = currentBlock;

        emit AccBlockWeightedMarketCapStored(accBlockWeightedMarketCap);
    }

    // Private helper functions
    function updateShareToAssetsPrice() private {
        storeAccBlockWeightedMarketCap();

        shareToAssetsPrice =
            maxAccPnlPerToken() -
            (accPnlPerTokenUsed > 0 ? uint(accPnlPerTokenUsed) : uint(0)); // PRECISION
        emit ShareToAssetsPriceUpdated(shareToAssetsPrice);
    }

    function baseAsset() external view returns (address) {
        return asset();
    }

    function _assetIERC20() private view returns (IERC20Upgradeable) {
        return IERC20Upgradeable(asset());
    }

    // Override ERC-20 functions (prevent sending to address that is withdrawing)
    function transfer(
        address to,
        uint amount
    ) public override(ERC20Upgradeable, IERC20Upgradeable) returns (bool) {
        address sender = _msgSender();
        _transfer(sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint amount
    ) public override(ERC20Upgradeable, IERC20Upgradeable) returns (bool) {
        _spendAllowance(from, _msgSender(), amount);
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(balanceOf(from) >= amount, "OVER_BALANCE");
        require(
            totalSharesBeingWithdrawn(from) <= balanceOf(from) - amount,
            "PENDING_WITHDRAWAL"
        );
        super._transfer(from, to, amount);
    }

    // Override ERC-4626 view functions
    function decimals()
        public
        view
        override(ERC20Upgradeable, ERC4626Upgradeable)
        returns (uint8)
    {
        return ERC4626Upgradeable.decimals();
    }

    function _convertToShares(
        uint assets,
        MathUpgradeable.Rounding rounding
    ) internal view override returns (uint shares) {
        return assets.mulDiv(PRECISION, shareToAssetsPrice, rounding);
    }

    function _convertToAssets(
        uint shares,
        MathUpgradeable.Rounding rounding
    ) internal view override returns (uint assets) {
        // Prevent overflow when called from maxDeposit with maxMint = uint.max
        if (shares == type(uint).max && shareToAssetsPrice >= PRECISION) {
            return shares;
        }
        return shares.mulDiv(shareToAssetsPrice, PRECISION, rounding);
    }

    function maxMint(address) public view override returns (uint) {
        return
            accPnlPerTokenUsed > 0
                ? currentMaxSupply -
                    MathUpgradeable.min(currentMaxSupply, totalSupply())
                : type(uint).max;
    }

    function maxDeposit(address _owner) public view override returns (uint) {
        return _convertToAssets(maxMint(_owner), MathUpgradeable.Rounding.Down);
    }

    function maxRedeem(address _owner) public view override returns (uint) {
        return
            openTradesPnlFeed.nextEpochValuesRequestCount() == 0
                ? MathUpgradeable.min(
                    withdrawRequests[_owner][currentEpoch],
                    totalSupply() - 1
                )
                : 0;
    }

    function maxWithdraw(address _owner) public view override returns (uint) {
        return
            _convertToAssets(maxRedeem(_owner), MathUpgradeable.Rounding.Down);
    }

    // Override ERC-4626 interactions (call scaleVariables on every deposit / withdrawal)
    function deposit(
        uint assets,
        address receiver
    ) public override returns (uint) {
        checks(assets);
        require(
            assets <= maxDeposit(receiver),
            "ERC4626: deposit more than max"
        );

        uint shares = previewDeposit(assets);
        scaleVariables(shares, assets, true);

        _deposit(_msgSender(), receiver, assets, shares);
        return shares;
    }

    function mint(
        uint shares,
        address receiver
    ) public override returns (uint) {
        checks(shares);
        require(shares <= maxMint(receiver), "ERC4626: mint more than max");

        uint assets = previewMint(shares);
        scaleVariables(shares, assets, true);

        _deposit(_msgSender(), receiver, assets, shares);
        return assets;
    }

    function withdraw(
        uint assets,
        address receiver,
        address _owner
    ) public override returns (uint) {
        checks(assets);
        require(
            assets <= maxWithdraw(_owner),
            "ERC4626: withdraw more than max"
        );

        uint shares = previewWithdraw(assets);
        withdrawRequests[_owner][currentEpoch] -= shares;

        scaleVariables(shares, assets, false);

        _withdraw(_msgSender(), receiver, _owner, assets, shares);
        return shares;
    }

    function redeem(
        uint shares,
        address receiver,
        address _owner
    ) public override returns (uint) {
        checks(shares);
        require(shares <= maxRedeem(_owner), "ERC4626: redeem more than max");

        withdrawRequests[_owner][currentEpoch] -= shares;

        uint assets = previewRedeem(shares);
        scaleVariables(shares, assets, false);

        _withdraw(_msgSender(), receiver, _owner, assets, shares);
        return assets;
    }

    function scaleVariables(uint shares, uint assets, bool isDeposit) private {
        uint supply = totalSupply();

        if (accPnlPerToken < 0) {
            accPnlPerToken =
                (accPnlPerToken * int(supply)) /
                (isDeposit ? int(supply + shares) : int(supply - shares));
        } else if (accPnlPerToken > 0) {
            totalLiability +=
                ((int(shares) * totalLiability) / int(supply)) *
                (isDeposit ? int(1) : int(-1));
        }

        totalDeposited = isDeposit
            ? totalDeposited + assets
            : totalDeposited - assets;

        storeAccBlockWeightedMarketCap();
    }

    // Withdraw requests (need to be done before calling 'withdraw' / 'redeem')
    function makeWithdrawRequest(uint shares, address _owner) external {
        require(
            openTradesPnlFeed.nextEpochValuesRequestCount() == 0,
            "END_OF_EPOCH"
        );

        address sender = _msgSender();
        uint _allowance = allowance(_owner, sender);
        require(
            sender == _owner || (_allowance > 0 && _allowance >= shares),
            "NOT_ALLOWED"
        );

        require(
            totalSharesBeingWithdrawn(_owner) + shares <= balanceOf(_owner),
            "MORE_THAN_BALANCE"
        );

        uint unlockEpoch = currentEpoch + withdrawEpochsTimelock();
        withdrawRequests[_owner][unlockEpoch] += shares;

        emit WithdrawRequested(
            sender,
            _owner,
            shares,
            currentEpoch,
            unlockEpoch
        );
    }

    function cancelWithdrawRequest(
        uint shares,
        address _owner,
        uint unlockEpoch
    ) external {
        require(
            shares <= withdrawRequests[_owner][unlockEpoch],
            "MORE_THAN_WITHDRAW_AMOUNT"
        );

        address sender = _msgSender();
        uint _allowance = allowance(_owner, sender);
        require(
            sender == _owner || (_allowance > 0 && _allowance >= shares),
            "NOT_ALLOWED"
        );

        withdrawRequests[_owner][unlockEpoch] -= shares;

        emit WithdrawCanceled(
            sender,
            _owner,
            shares,
            currentEpoch,
            unlockEpoch
        );
    }

    // Locked and discounted deposits
    function depositWithDiscountAndLock(
        uint assets,
        uint lockDuration,
        address receiver
    ) external validDiscount(lockDuration) returns (uint) {
        checks(assets);
        uint simulatedAssets = (assets *
            (PRECISION *
                100 +
                lockDiscountP(collateralizationP(), lockDuration))) /
            (PRECISION * 100);

        require(
            simulatedAssets <= maxDeposit(receiver),
            "DEPOSIT_MORE_THAN_MAX"
        );

        return
            _executeDiscountAndLock(
                simulatedAssets,
                assets,
                previewDeposit(simulatedAssets),
                lockDuration,
                receiver
            );
    }

    function mintWithDiscountAndLock(
        uint shares,
        uint lockDuration,
        address receiver
    ) external validDiscount(lockDuration) returns (uint) {
        checks(shares);
        require(shares <= maxMint(receiver), "MINT_MORE_THAN_MAX");
        uint assets = previewMint(shares);

        return
            _executeDiscountAndLock(
                assets,
                (assets * (PRECISION * 100)) /
                    (PRECISION *
                        100 +
                        lockDiscountP(collateralizationP(), lockDuration)),
                shares,
                lockDuration,
                receiver
            );
    }

    function _executeDiscountAndLock(
        uint assets,
        uint assetsDeposited,
        uint shares,
        uint lockDuration,
        address receiver
    ) private returns (uint) {
        require(assets > assetsDeposited, "NO_DISCOUNT");

        uint depositId = ++lockedDepositsCount;
        uint assetsDiscount = assets - assetsDeposited;

        LockedDeposit storage d = lockedDeposits[depositId];
        d.owner = receiver;
        d.shares = shares;
        d.assetsDeposited = assetsDeposited;
        d.assetsDiscount = assetsDiscount;
        d.atTimestamp = block.timestamp;
        d.lockDuration = lockDuration;

        scaleVariables(shares, assetsDeposited, true);
        address sender = _msgSender();
        _deposit(sender, address(this), assetsDeposited, shares);

        totalDiscounts += assetsDiscount;
        totalLockedDiscounts += assetsDiscount;

        lockedDepositNft.mint(receiver, depositId);

        emit DepositLocked(sender, d.owner, depositId, d);
        return depositId;
    }

    function unlockDeposit(uint depositId, address receiver) external {
        LockedDeposit storage d = lockedDeposits[depositId];

        address sender = _msgSender();
        address _owner = lockedDepositNft.ownerOf(depositId);

        require(
            _owner == sender ||
                lockedDepositNft.getApproved(depositId) == sender ||
                lockedDepositNft.isApprovedForAll(_owner, sender),
            "NOT_ALLOWED"
        );
        require(
            block.timestamp >= d.atTimestamp + d.lockDuration,
            "NOT_UNLOCKED"
        );

        int accPnlDelta = int(
            d.assetsDiscount.mulDiv(
                PRECISION,
                totalSupply(),
                MathUpgradeable.Rounding.Up
            )
        );

        accPnlPerToken += accPnlDelta;
        require(
            accPnlPerToken <= int(maxAccPnlPerToken()),
            "NOT_ENOUGH_ASSETS"
        );

        lockedDepositNft.burn(depositId);

        accPnlPerTokenUsed += accPnlDelta;
        updateShareToAssetsPrice();

        totalLiability += int(d.assetsDiscount);
        totalLockedDiscounts -= d.assetsDiscount;

        _transfer(address(this), receiver, d.shares);

        emit DepositUnlocked(sender, receiver, _owner, depositId, d);
    }

    // Distributes a reward evenly to all stakers of the vault
    function distributeReward(uint assets) external {
        address sender = _msgSender();
        assets = Utils.transferFrom(asset(), sender, address(this), assets);

        accRewardsPerToken += (assets * PRECISION) / totalSupply();
        updateShareToAssetsPrice();

        totalRewards += assets;
        totalDeposited += assets;

        emit RewardDistributed(sender, assets);
    }

    // PnL interactions (happens often, so also used to trigger other actions)
    function sendAssets(uint assets, address receiver) external {
        address sender = _msgSender();
        require(sender == pnlHandler, "ONLY_TRADING_PNL_HANDLER");

        int accPnlDelta = int(
            assets.mulDiv(PRECISION, totalSupply(), MathUpgradeable.Rounding.Up)
        );

        accPnlPerToken += accPnlDelta;
        require(
            accPnlPerToken <= int(maxAccPnlPerToken()),
            "NOT_ENOUGH_ASSETS"
        );

        tryResetDailyAccPnlDelta();
        dailyAccPnlDelta += accPnlDelta;
        require(dailyAccPnlDelta <= int(maxDailyAccPnlDelta), "MAX_DAILY_PNL");

        totalLiability += int(assets);
        totalClosedPnl += int(assets);

        tryNewOpenPnlRequestOrEpoch();
        tryUpdateCurrentMaxSupply();

        SafeERC20Upgradeable.safeTransfer(_assetIERC20(), receiver, assets);

        emit AssetsSent(sender, receiver, assets);
    }

    function receiveAssets(uint assets, address user) external {
        address sender = _msgSender();
        uint assetsLessDeplete = Utils.transferFrom(
            asset(),
            sender,
            address(this),
            assets
        );

        if (accPnlPerTokenUsed < 0 && accPnlPerToken < 0) {
            uint depleteAmount = (assets * lossesBurnP) / PRECISION / 100;
            assetsToDeplete += depleteAmount;
            assetsLessDeplete -= depleteAmount;
        }

        int accPnlDelta = int((assetsLessDeplete * PRECISION) / totalSupply());
        accPnlPerToken -= accPnlDelta;

        tryResetDailyAccPnlDelta();
        dailyAccPnlDelta -= accPnlDelta;

        totalLiability -= int(assetsLessDeplete);
        totalClosedPnl -= int(assetsLessDeplete);

        tryNewOpenPnlRequestOrEpoch();
        tryUpdateCurrentMaxSupply();

        emit AssetsReceived(sender, user, assets, assetsLessDeplete);
    }

    // TIZZ mint / burn mechanism
    function deplete(uint assets) external {
        require(assets <= assetsToDeplete, "AMOUNT_TOO_BIG");
        assetsToDeplete -= assets;

        uint amountTizz = assets.mulDiv(
            TIZZ_PRECISION,
            tizzProtocolTokenToAssetsPrice(),
            MathUpgradeable.Rounding.Up
        );

        address sender = _msgSender();
        ITzToken(tizzProtocolToken).burn(sender, amountTizz);

        totalDepleted += assets;
        totalDepletedTizz += amountTizz;

        SafeERC20Upgradeable.safeTransfer(_assetIERC20(), sender, assets);

        emit Depleted(sender, assets, amountTizz);
    }

    function refill(uint assets) external {
        require(accPnlPerTokenUsed > 0, "NOT_UNDER_COLLATERALIZED");

        uint supply = totalSupply();
        require(
            assets <= (uint(accPnlPerTokenUsed) * supply) / PRECISION,
            "AMOUNT_TOO_BIG"
        );

        if (block.timestamp - lastDailyMintedTizzReset >= 24 hours) {
            dailyMintedTizz = 0;
            lastDailyMintedTizzReset = block.timestamp;
        }

        uint amountTizz = (assets * TIZZ_PRECISION) /
            tizzProtocolTokenToAssetsPrice();
        dailyMintedTizz += amountTizz;

        require(
            dailyMintedTizz <=
                (maxTizzSupplyMintDailyP *
                    IERC20Upgradeable(tizzProtocolToken).totalSupply()) /
                    PRECISION /
                    100,
            "ABOVE_INFLATION_LIMIT"
        );

        address sender = _msgSender();
        assets = Utils.transferFrom(asset(), sender, address(this), assets);

        int accPnlDelta = int((assets * PRECISION) / supply);
        accPnlPerToken -= accPnlDelta;
        accPnlPerTokenUsed -= accPnlDelta;
        updateShareToAssetsPrice();

        totalRefilled += assets;
        totalRefilledTizz += amountTizz;

        ITzToken(tizzProtocolToken).mint(sender, amountTizz);

        emit Refilled(sender, assets, amountTizz);
    }

    // Updates shareToAssetsPrice based on the new PnL and starts a new epoch
    function updateAccPnlPerTokenUsed(
        uint prevPositiveOpenPnl, // 1e18
        uint newPositiveOpenPnl // 1e18
    ) external returns (uint) {
        address sender = _msgSender();
        require(sender == address(openTradesPnlFeed), "ONLY_PNL_FEED");

        int delta = int(newPositiveOpenPnl) - int(prevPositiveOpenPnl); // 1e18
        uint supply = totalSupply();

        int maxDelta = int(
            MathUpgradeable.min(
                (uint(int(maxAccPnlPerToken()) - accPnlPerToken) * supply) /
                    PRECISION,
                (maxAccOpenPnlDelta * supply) / PRECISION
            )
        ); // 1e18

        delta = delta > maxDelta ? maxDelta : delta;

        accPnlPerToken += (delta * int(PRECISION)) / int(supply);
        totalLiability += delta;

        accPnlPerTokenUsed = accPnlPerToken;
        updateShareToAssetsPrice();

        currentEpoch++;
        currentEpochStart = block.timestamp;
        currentEpochPositiveOpenPnl = uint(int(prevPositiveOpenPnl) + delta);

        tryUpdateCurrentMaxSupply();

        emit AccPnlPerTokenUsedUpdated(
            sender,
            currentEpoch,
            prevPositiveOpenPnl,
            newPositiveOpenPnl,
            currentEpochPositiveOpenPnl,
            accPnlPerTokenUsed
        );

        return currentEpochPositiveOpenPnl;
    }

    // Getters
    function getLockedDeposit(
        uint depositId
    ) external view returns (LockedDeposit memory) {
        return lockedDeposits[depositId];
    }

    function tvl() public view returns (uint) {
        return (maxAccPnlPerToken() * totalSupply()) / PRECISION; // 1e18
    }

    function availableAssets() public view returns (uint) {
        return
            (uint(int(maxAccPnlPerToken()) - accPnlPerTokenUsed) *
                totalSupply()) / PRECISION; // 1e18
    }

    // To be compatible with old pairs storage contract v6 (to be used only with tBaseAsset vault)
    function currentBalanceBaseAsset() external view returns (uint) {
        return availableAssets(); // 1e18
    }

    function marketCap() public view returns (uint) {
        return (totalSupply() * shareToAssetsPrice) / PRECISION; // 1e18
    }

    function onlyManager() internal view {
        require(_msgSender() == manager, "ONLY_MANAGER");
    }

    function checks(uint assetsOrShares) internal view {
        require(shareToAssetsPrice > 0, "PRICE_0");
        require(assetsOrShares > 0, "VALUE_0");
    }
}
