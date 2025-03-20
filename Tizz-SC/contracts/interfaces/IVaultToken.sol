// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IVaultToken {
    struct TizzPriceProvider {
        address addr;
        bytes signature;
    }

    struct LockedDeposit {
        address owner;
        uint shares; // 1e18
        uint assetsDeposited; // 1e18
        uint assetsDiscount; // 1e18
        uint atTimestamp; // timestamp
        uint lockDuration; // timestamp
    }

    // Prevent stack too deep error
    struct ContractAddresses {
        address asset;
        address owner; // 2-week timelock contract
        address manager; // 3-day timelock contract
        address admin; // bypasses timelock, access to emergency functions
        address tizzProtocolToken;
        address pnlHandler;
        address openTradesPnlFeed;
        TizzPriceProvider tizzPriceProvider;
    }

    struct DeployParam {
        string _name;
        string _symbol;
        uint _MIN_LOCK_DURATION;
        uint _maxAccOpenPnlDelta;
        uint _maxDailyAccPnlDelta;
        uint _maxSupplyIncreaseDailyP;
        uint _lossesBurnP;
        uint _maxTizzSupplyMintDailyP;
        uint _maxDiscountP;
        uint _maxDiscountThresholdP;
    }

    function manager() external view returns (address);
    function admin() external view returns (address);
    function currentEpoch() external view returns (uint);
    function baseAsset() external view returns (address);
    function currentEpochStart() external view returns (uint);
    function currentEpochPositiveOpenPnl() external view returns (uint);
    function updateAccPnlPerTokenUsed(
        uint prevPositiveOpenPnl,
        uint newPositiveOpenPnl
    ) external returns (uint);

    function getLockedDeposit(
        uint depositId
    ) external view returns (LockedDeposit memory);

    function sendAssets(uint assets, address receiver) external;
    function receiveAssets(uint assets, address user) external;
    function distributeReward(uint assets) external;

    function currentBalanceBaseAsset() external view returns (uint);

    function tvl() external view returns (uint);

    function marketCap() external view returns (uint);

    function getPendingAccBlockWeightedMarketCap(
        uint currentBlock
    ) external view returns (uint);

    // Events
    event AddressParamUpdated(string name, address newValue);
    event TizzPriceProviderUpdated(TizzPriceProvider newValue);
    event NumberParamUpdated(string name, uint newValue);
    event WithdrawLockThresholdsPUpdated(uint[2] newValue);

    event CurrentMaxSupplyUpdated(uint newValue);
    event DailyAccPnlDeltaReset();
    event ShareToAssetsPriceUpdated(uint newValue);
    event OpenTradesPnlFeedCallFailed();

    event WithdrawRequested(
        address indexed sender,
        address indexed owner,
        uint shares,
        uint currEpoch,
        uint indexed unlockEpoch
    );
    event WithdrawCanceled(
        address indexed sender,
        address indexed owner,
        uint shares,
        uint currEpoch,
        uint indexed unlockEpoch
    );

    event DepositLocked(
        address indexed sender,
        address indexed owner,
        uint depositId,
        LockedDeposit d
    );
    event DepositUnlocked(
        address indexed sender,
        address indexed receiver,
        address indexed owner,
        uint depositId,
        LockedDeposit d
    );

    event RewardDistributed(address indexed sender, uint assets);

    event AssetsSent(
        address indexed sender,
        address indexed receiver,
        uint assets
    );
    event AssetsReceived(
        address indexed sender,
        address indexed user,
        uint assets,
        uint assetsLessDeplete
    );

    event Depleted(address indexed sender, uint assets, uint amountTizz);
    event Refilled(address indexed sender, uint assets, uint amountTizz);

    event AccPnlPerTokenUsedUpdated(
        address indexed sender,
        uint indexed newEpoch,
        uint prevPositiveOpenPnl,
        uint newPositiveOpenPnl,
        uint newEpochPositiveOpenPnl,
        int newAccPnlPerTokenUsed
    );

    event AccBlockWeightedMarketCapStored(uint newAccValue);
}
