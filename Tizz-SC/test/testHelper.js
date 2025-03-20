const { ethers } = require("hardhat");
const {
    deploy,
    deployProxy,
    deployProxyWithLibrary,
    bigNum,
} = require("hardhat-libutils");
const { getDeploymentParams } = require("../scripts/testParams");
const ERC20ABI = require("../external_abi/ERC20.abi.json");

const deployContracts = async (
    collateralType,
    deployer,
    admin,
    decimals = 18
) => {
    const deployParams = getDeploymentParams(collateralType);
    let collateralToken;
    if (collateralType == "Native") {
        collateralToken = new ethers.Contract(
            deployParams.Collateral,
            ERC20ABI,
            deployer
        );
    } else {
        collateralToken = await deploy(
            "MockToken",
            "MockUSDT",
            "MockToken",
            "MockUSDT",
            bigNum(10000, decimals),
            decimals
        );
    }

    const TizzFinanceToken = await deploy(
        "TizzFinanceToken",
        "TizzFinanceToken",
        deployer.address // admin
    );
    const LockedDepositNftDesign = await deploy(
        "TizzTokenLockedDepositNftDesign",
        "TizzTokenLockedDepositNftDesign"
    );

    const TizzTimelockManager = await deploy(
        "TizzTimelockManager",
        "TizzTimelockManager",
        deployParams.TizzTimelockManager.minDelay,
        [deployer.address], // proposers
        [deployer.address], // executors
        deployer.address // admin
    );

    const TizzTimelockOwner = await deploy(
        "TizzTimelockManager",
        "TizzTimelockOwner",
        deployParams.TizzTimelockOwner.minDelay,
        [deployer.address], // proposers
        [deployer.address], // executors
        deployer.address // admin
    );

    const FeeTiersUtils = await deploy("FeeTiersUtils", "FeeTiersUtils");
    const PairsStorageUtils = await deploy(
        "PairsStorageUtils",
        "PairsStorageUtils"
    );
    const PriceImpactUtils = await deploy(
        "PriceImpactUtils",
        "PriceImpactUtils"
    );
    const ReferralsUtils = await deploy("ReferralsUtils", "ReferralsUtils");

    const TizzMultiCollatDiamond = await deployProxyWithLibrary(
        "TizzMultiCollatDiamond",
        "TizzMultiCollatDiamond",
        {
            FeeTiersUtils: FeeTiersUtils.address,
            PairsStorageUtils: PairsStorageUtils.address,
            PriceImpactUtils: PriceImpactUtils.address,
            ReferralsUtils: ReferralsUtils.address,
        },
        [
            deployer.address, // _rolesManager
            TizzFinanceToken.address, // _tizz
        ]
    );
    const TizzStaking = await deployProxy("TizzStaking", "TizzStaking", [
        deployer.address, // _owner
        TizzFinanceToken.address, // _tz
        collateralToken.address, // _dai
        bigNum(100, 18),
    ]);

    const TizzTradingStorage = await deployProxy(
        "TizzTradingStorage",
        `TizzTradingStorage${collateralType}`,
        [
            collateralToken.address, // _dai
            TizzFinanceToken.address, // _token
            deployer.address, // _gov
            deployParams.TizzTradingStorage.tokenOracleId, // _tokenOracleId
            deployParams.TizzTradingStorage.isNative, // _isNative
        ]
    );
    const FundingFeesUtils = await deploy(
        "FundingFeesUtils",
        "FundingFeesUtils"
    );
    const TizzFundingFees = await deployProxyWithLibrary(
        "TizzFundingFees",
        `TizzFundingFees${collateralType}`,
        {
            FundingFeesUtils: FundingFeesUtils.address,
        },
        [TizzTradingStorage.address, deployParams.TizzFundingFees.baseRate]
    );

    const PackingUtils = await deploy("PackingUtils", "PackingUtils");
    const TizzPriceAggregator = await deployProxyWithLibrary(
        "TizzPriceAggregatorTest",
        `TizzPriceAggregator${collateralType}`,
        {
            PackingUtils: PackingUtils.address,
        },
        [
            TizzTradingStorage.address, // _storageT
            TizzMultiCollatDiamond.address, // _multiCollatDiamond
            deployParams.TizzPriceAggregator.collateralPairId, // _collateralPairId
            deployParams.TizzPriceAggregator.supraOraclePull, // _supraOraclePull
            deployParams.TizzPriceAggregator.supraOracleStorage, // _supraOracleStorage
        ]
    );
    const TizzTradingPriceFeedManager = await deploy(
        "TizzTradingPriceFeedManager",
        `TizzTradingPriceFeedManager${collateralType}`,
        deployParams.TizzTradingPriceFeedManager.supraPullOracle, // _oracle
        deployParams.TizzTradingPriceFeedManager.supraOracleStorage, // _storage
        deployParams.TizzTradingPriceFeedManager.supraOraclePairs // _oraclePairIds
    );
    const TradeUtils = await deploy("TradeUtils", "TradeUtils");
    const TizzTrading = await deployProxyWithLibrary(
        "TizzTrading",
        `TizzTrading${collateralType}`,
        {
            TradeUtils: TradeUtils.address,
            PackingUtils: PackingUtils.address,
        },
        [
            TizzTradingStorage.address, // _storageT
            TizzFundingFees.address, // _fundingFees
            deployParams.TizzTrading.maxPosBaseAsset, // _maxPosBaseAsset
            deployParams.TizzTrading.isNative, // isNative
        ]
    );
    const TizzEscrow = await deployProxy(
        "TizzEscrow",
        `TizzEscrow${collateralType}`
    );
    const TradingCallbackUtils = await deploy(
        "TradingCallbacksUtils",
        "TradingCallbacksUtils"
    );
    const TizzTradingCallbacks = await deployProxyWithLibrary(
        "TizzTradingCallbacks",
        `TizzTradingCallbacks${collateralType}`,
        {
            TradingCallbacksUtils: TradingCallbackUtils.address,
        },
        [
            TizzTradingStorage.address, // _storageT
            TizzStaking.address, // _staking
            TizzEscrow.address,
            deployParams.TizzTradingCallbacks.baseAssetVaultFeeP, // _baseAssetVaultFeeP
            deployParams.TizzTradingCallbacks.lpFeeP, // _lpFeeP
            deployParams.TizzTradingCallbacks.sssFeeP, // _sssFeeP
        ]
    );

    let contractAddresses = deployParams.TizzToken.contractAddresses;
    contractAddresses.asset = collateralToken.address;
    contractAddresses.owner = deployer.address;
    contractAddresses.manager = TizzTimelockManager.address;
    contractAddresses.admin = admin.address;
    contractAddresses.tizzProtocolToken = TizzFinanceToken.address;
    contractAddresses.pnlHandler = TizzTradingCallbacks.address;
    contractAddresses.openTradesPnlFeed = TizzTradingPriceFeedManager.address;
    contractAddresses.tizzPriceProvider.addr = TizzPriceAggregator.address;

    const TizzVaultToken = await deployProxy(
        "TizzVaultToken",
        `TizzVaultToken${collateralType}`,
        [
            {
                _name: deployParams.TizzToken.name,
                _symbol: deployParams.TizzToken.symbol,
                _MIN_LOCK_DURATION: deployParams.TizzToken.MIN_LOCK_DURATION,
                _maxAccOpenPnlDelta: deployParams.TizzToken.maxAccOpenPnlDelta,
                _maxDailyAccPnlDelta:
                    deployParams.TizzToken.maxDailyAccPnlDelta,
                _maxSupplyIncreaseDailyP:
                    deployParams.TizzToken.maxSupplyIncreaseDailyP,
                _lossesBurnP: deployParams.TizzToken.lossesBurnP,
                _maxTizzSupplyMintDailyP:
                    deployParams.TizzToken.maxTizzSupplyMintDailyP,
                _maxDiscountP: deployParams.TizzToken.maxDiscountP,
                _maxDiscountThresholdP:
                    deployParams.TizzToken.maxDiscountThresholdP,
            },
            contractAddresses,
            deployParams.TizzToken.withdrawLockThresholdsP,
        ]
    );

    const LockedDepositNft = await deploy(
        "TizzTokenLockedDepositNft",
        "TizzTokenLockedDepositNft",
        deployParams.TizzTokenLockedDepositNft.name, // name
        deployParams.TizzTokenLockedDepositNft.symbol, // symbol
        TizzVaultToken.address, // _tToken
        LockedDepositNftDesign.address, // _design
        deployParams.TizzTokenLockedDepositNft.designDecimals // _designDecimals
    );

    return [
        collateralToken,
        TizzFinanceToken,
        LockedDepositNftDesign,
        LockedDepositNft,
        TizzTimelockManager,
        TizzTimelockOwner,
        TizzMultiCollatDiamond,
        TizzStaking,
        TizzTradingStorage,
        TizzFundingFees,
        TizzPriceAggregator,
        TizzTradingPriceFeedManager,
        TizzTrading,
        TizzTradingCallbacks,
        TizzVaultToken,
        TizzEscrow,
        PackingUtils,
        FundingFeesUtils,
    ];
};

const initialCores = async (
    deployer,
    collateralType,
    TizzFinanceToken,
    TizzTrading,
    TizzTradingStorage,
    TizzMultiCollatDiamond,
    TizzTradingCallbacks,
    TizzPriceAggregator,
    TizzStaking,
    collateralToken,
    TizzVaultToken,
    lockedDepositNft,
    isDeposit = true
) => {
    const deployParams = getDeploymentParams(collateralType);

    console.log("TizzVaultToken.setLockedDepositNft");
    await TizzVaultToken.setLockedDepositNft(lockedDepositNft.address);

    console.log("TizzFinanceToken.setupRoles");
    await TizzFinanceToken.setupRoles(
        TizzTradingStorage.address,
        TizzMultiCollatDiamond.address,
        TizzTrading.address,
        TizzTradingCallbacks.address,
        deployer.address
    );

    console.log("TizzMultiCollatDiamond.setRoles");
    await TizzMultiCollatDiamond.setRoles(
        [deployer.address],
        deployParams.TizzMultiCollatDiamond.roles,
        deployParams.TizzMultiCollatDiamond.values
    );

    await TizzMultiCollatDiamond.setRoles(
        [
            deployer.address,
            TizzTrading.address,
            TizzPriceAggregator.address,
            TizzTradingCallbacks.address,
        ],
        [2, 3, 5, 4],
        [true, true, true, true]
    );

    console.log("TizzMultiCollatDiamond.initializePairsStorage");
    await TizzMultiCollatDiamond.initializePairsStorage(
        deployParams.TizzMultiCollatDiamond.currentOrderId
    );

    console.log("TizzMultiCollatDiamond.initializeReferrals");
    await TizzMultiCollatDiamond.initializeReferrals(
        deployParams.TizzMultiCollatDiamond.allyFeeP,
        deployParams.TizzMultiCollatDiamond.startReferrerFeeP,
        deployParams.TizzMultiCollatDiamond.openFeeP,
        deployParams.TizzMultiCollatDiamond.targetVolumeUsd
    );

    console.log("TizzMultiCollatDiamond.initializeFeeTiers");
    await TizzMultiCollatDiamond.initializeFeeTiers(
        deployParams.TizzMultiCollatDiamond.feeTiers.groupIndices,
        deployParams.TizzMultiCollatDiamond.feeTiers.groupVolumeMultipliers,
        deployParams.TizzMultiCollatDiamond.feeTiers.feeTiersIndicies,
        deployParams.TizzMultiCollatDiamond.feeTiers.feeTiers
    );

    console.log("TizzMultiCollatDiamond.initializePriceImpact");
    await TizzMultiCollatDiamond.initializePriceImpact(
        deployParams.TizzMultiCollatDiamond.priceImpact.windowsDuration,
        deployParams.TizzMultiCollatDiamond.priceImpact.windowsCount
    );

    console.log("TizzMultiCollatDiamond.addFees");
    await TizzMultiCollatDiamond.addFees(
        deployParams.TizzMultiCollatDiamond.fees
    );

    console.log("TizzMultiCollatDiamond.addGroups");
    await TizzMultiCollatDiamond.addGroups(
        deployParams.TizzMultiCollatDiamond.groups
    );

    console.log("TizzMultiCollatDiamond.addPairs");
    await TizzMultiCollatDiamond.addPairs(
        deployParams.TizzMultiCollatDiamond.pairs
    );

    console.log("TizzStaking.addRewardToken");
    await TizzStaking.addRewardToken(collateralToken.address);

    if (isDeposit) {
        console.log(`Deposit ${collateralType}`);
        let depositAmount;
        if (collateralType == "Native") {
            depositAmount = bigNum(10, 18);
            await collateralToken.deposit({ value: BigInt(depositAmount) });
        } else {
            let decimals = await collateralToken.decimals();
            depositAmount = bigNum(100, decimals);
            await collateralToken.mint(deployer.address, BigInt(depositAmount));
        }
        await collateralToken.approve(
            TizzVaultToken.address,
            BigInt(depositAmount)
        );

        await TizzVaultToken.deposit(BigInt(depositAmount), deployer.address);

        const tizzAmount = bigNum(30000, 18);
        await TizzFinanceToken.mint(deployer.address, BigInt(tizzAmount));
        await TizzFinanceToken.approve(TizzStaking.address, BigInt(tizzAmount));
        await TizzStaking.stakeTizz(BigInt(tizzAmount));
    }
};

const initialCollaterals = async (
    collateralType,
    TizzTradingPriceFeedManager,
    TizzTradingStorage,
    TizzVaultToken,
    TizzPriceAggregator,
    TizzTradingCallbacks,
    TizzTrading,
    TizzFundingFees,
    TizzMultiCollatDiamond,
    TizzStaking,
    TizzEscrow
) => {
    const deployParams = getDeploymentParams(collateralType);
    console.log("TizzTradingPriceFeedManager.setTizzVaultToken");
    await TizzTradingPriceFeedManager.setTizzVaultToken(TizzVaultToken.address);

    console.log("TizzTradingStorage.setPriceAggregator");
    await TizzTradingStorage.setPriceAggregator(TizzPriceAggregator.address);

    console.log("TizzTradingStorage.setCallbacks");
    await TizzTradingStorage.setCallbacks(TizzTradingCallbacks.address);

    console.log("TizzTradingStorage.addTradingContract");
    await TizzTradingStorage.addTradingContract(TizzTrading.address);

    await TizzTradingStorage.addTradingContract(TizzTradingCallbacks.address);

    console.log("TizzTradingStorage.setVault");
    await TizzTradingStorage.setVault(TizzVaultToken.address);

    console.log("TizzFundingFees.initializeV3");
    await TizzFundingFees.initializeV3(
        TizzMultiCollatDiamond.address,
        TizzPriceAggregator.address
    );

    console.log("TizzFundingFees.setGroupParamsArray");
    await TizzFundingFees.setGroupParamsArray(
        deployParams.TizzFundingFees.groupParamsIndices,
        deployParams.TizzFundingFees.groupParamsValues
    );

    console.log("TizzFundingFees.setPairParamsArray");
    await TizzFundingFees.setPairParamsArray(
        deployParams.TizzFundingFees.pairParamsIndices,
        deployParams.TizzFundingFees.pairParamsValues
    );

    console.log("TizzTradingCallbacks.initializeV2");
    await TizzTradingCallbacks.initializeV2(
        TizzFundingFees.address,
        TizzVaultToken.address
    );

    console.log("TizzTradingCallbacks.initializeV4");
    await TizzTradingCallbacks.initializeV4(TizzStaking.address);

    console.log("TizzTradingCallbacks.initializeV6");
    await TizzTradingCallbacks.initializeV6(TizzMultiCollatDiamond.address);

    console.log("TizzTrading.initializeV2");
    await TizzTrading.initializeV2(TizzMultiCollatDiamond.address);

    console.log("TizzVaultToken.initializeV2");
    await TizzVaultToken.initializeV2();

    console.log("TizzEscrow.initializeV2");
    await TizzEscrow.initializeV2(TizzTradingCallbacks.address);
};

module.exports = {
    deployContracts,
    initialCores,
    initialCollaterals,
};
