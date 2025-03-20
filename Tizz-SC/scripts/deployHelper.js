const { ethers, network } = require("hardhat");
const {
    deploy,
    deployProxyWithLibrary,
    getContract,
    deployProxy,
    getOrDeploy,
    bigNum,
    upgradeProxyWithLibrary,
} = require("hardhat-libutils");
const { getDeploymentParams } = require("./params");
const ERC20ABI = require("../external_abi/ERC20.abi.json");
const WETHABI = require("../external_abi/WETH.abi.json");

const deployTokens = async (collateralType) => {
    console.log("============> Deploy Tokens <============");
    let deployParams = getDeploymentParams(collateralType);
    const TizzFinanceToken = await deploy(
        "TizzFinanceToken",
        "TizzFinanceToken",
        deployParams.TizzFinanceToken.admin // admin
    );
    console.log("Done");
};

const deployAdmin = async (collateralType) => {
    console.log("============> Deploy Admin <============");
    let deployParams = getDeploymentParams(collateralType);
    await deploy(
        "TizzTimelockManager",
        "TizzTimelockManager",
        deployParams.TizzTimelockManager.minDelay,
        deployParams.TizzTimelockManager.proposers, // proposers
        deployParams.TizzTimelockManager.executors, // executors
        deployParams.TizzTimelockManager.admin // admin
    );

    await deploy(
        "TizzTimelockManager",
        "TizzTimelockOwner",
        deployParams.TizzTimelockOwner.minDelay,
        deployParams.TizzTimelockOwner.proposers, // proposers
        deployParams.TizzTimelockOwner.executors, // executors
        deployParams.TizzTimelockOwner.admin // admin
    );
    console.log("Done");
};

const deployCores = async (collateralType) => {
    console.log("============> Deploy Cores <============");
    const deployParams = getDeploymentParams(collateralType);
    const TizzFinanceToken = await getContract(
        "TizzFinanceToken",
        "TizzFinanceToken"
    );
    const FeeTiersUtils = await getOrDeploy("FeeTiersUtils", "FeeTiersUtils");
    const PairsStorageUtils = await getOrDeploy(
        "PairsStorageUtils",
        "PairsStorageUtils"
    );
    const PriceImpactUtils = await getOrDeploy(
        "PriceImpactUtils",
        "PriceImpactUtils"
    );
    const ReferralsUtils = await getOrDeploy(
        "ReferralsUtils",
        "ReferralsUtils"
    );

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
            deployParams.TizzMultiCollatDiamond.rolesManager, // _rolesManager
            TizzFinanceToken.address, // _tizz
        ]
    );
    const TizzStaking = await deployProxy("TizzStaking", "TizzStaking", [
        deployParams.TizzStaking.owner, // _owner
        TizzFinanceToken.address, // _tz
        deployParams.Collateral, // _dai
        BigInt(deployParams.TizzStaking.minAmount),
    ]);
    console.log("Done");
};

const getNecessaryCollateralContract = async (collateralType) => {
    const TizzTradingStorage = await getContract(
        "TizzTradingStorage",
        `TizzTradingStorage${collateralType}`
    );

    const TizzTradingCallbacks = await getContract(
        "TizzTradingCallbacks",
        `TizzTradingCallbacks${collateralType}`
    );
    const TizzTrading = await getContract(
        "TizzTrading",
        `TizzTrading${collateralType}`
    );
    const TizzPriceAggregator = await getContract(
        "TizzPriceAggregator",
        `TizzPriceAggregator${collateralType}`
    );
    const TizzCollateralToken = await getContract(
        "TizzVaultToken",
        `TizzVaultToken${collateralType}`
    );
    const TizzFundingFees = await getContract(
        "TizzFundingFees",
        `TizzFundingFees${collateralType}`
    );
    const TizzTradingPriceFeedManager = await getContract(
        "TizzTradingPriceFeedManager",
        `TizzTradingPriceFeedManager${collateralType}`
    );

    const TizzEscrow = await getContract(
        "TizzEscrow",
        `TizzEscrow${collateralType}`
    );

    return [
        TizzTradingStorage,
        TizzTradingCallbacks,
        TizzTrading,
        TizzPriceAggregator,
        TizzCollateralToken,
        TizzFundingFees,
        TizzTradingPriceFeedManager,
        TizzEscrow,
    ];
};

const getNecessaryContracts = async () => {
    const TizzFinanceToken = await getContract(
        "TizzFinanceToken",
        "TizzFinanceToken"
    );
    const TizzMultiCollatDiamond = await getContract(
        "TizzMultiCollatDiamond",
        "TizzMultiCollatDiamond"
    );
    const TizzStaking = await getContract("TizzStaking", "TizzStaking");
    const TizzTimelockManager = await getContract(
        "TizzTimelockManager",
        "TizzTimelockManager"
    );
    const TizzTimelockOwner = await getContract(
        "TizzTimelockManager",
        "TizzTimelockOwner"
    );

    return [
        TizzFinanceToken,
        TizzMultiCollatDiamond,
        TizzStaking,
        TizzTimelockManager,
        TizzTimelockOwner,
    ];
};

const deployCollaterals = async (collateralType, deployer) => {
    console.log(`============> Deploy ${collateralType} <============`);
    const deployParams = getDeploymentParams(collateralType);
    const [
        TizzFinanceToken,
        TizzMultiCollatDiamond,
        TizzStaking,
        TizzTimelockManager,
        TizzTimelockOwner,
    ] = await getNecessaryContracts();

    const TizzTradingStorage = await deployProxy(
        "TizzTradingStorage",
        `TizzTradingStorage${collateralType}`,
        [
            deployParams.Collateral, // _dai
            TizzFinanceToken.address, // _token
            deployer.address, // _gov
            deployParams.TizzTradingStorage.tokenOracleId, // _tokenOracleId
            deployParams.TizzTradingStorage.isNative, // _isNative
        ]
    );
    const FundingFeesUtils = await getOrDeploy(
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

    const PackingUtils = await getOrDeploy("PackingUtils", "PackingUtils");
    const TizzPriceAggregator = await deployProxyWithLibrary(
        "TizzPriceAggregator",
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
    const TradeUtils = await getOrDeploy("TradeUtils", "TradeUtils");
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
    const TradingCallbackUtils = await getOrDeploy(
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
            TizzEscrow.address, // _escrow
            deployParams.TizzTradingCallbacks.baseAssetVaultFeeP, // _baseAssetVaultFeeP
            deployParams.TizzTradingCallbacks.lpFeeP, // _lpFeeP
            deployParams.TizzTradingCallbacks.sssFeeP, // _sssFeeP
        ]
    );

    let contractAddresses = deployParams.TizzVaultToken.contractAddresses;
    contractAddresses.asset = deployParams.Collateral;
    contractAddresses.owner = deployer.address;
    // contractAddresses.owner = TizzTimelockOwner.address;
    contractAddresses.manager = TizzTimelockManager.address;
    contractAddresses.tizzProtocolToken = TizzFinanceToken.address;
    contractAddresses.pnlHandler = TizzTradingCallbacks.address;
    contractAddresses.openTradesPnlFeed = TizzTradingPriceFeedManager.address;
    contractAddresses.tizzPriceProvider.addr = TizzPriceAggregator.address;

    const TizzVaultToken = await deployProxy(
        "TizzVaultToken",
        `TizzVaultToken${collateralType}`,
        [
            {
                _name: deployParams.TizzVaultToken.name,
                _symbol: deployParams.TizzVaultToken.symbol,
                _MIN_LOCK_DURATION:
                    deployParams.TizzVaultToken.MIN_LOCK_DURATION,
                _maxAccOpenPnlDelta:
                    deployParams.TizzVaultToken.maxAccOpenPnlDelta,
                _maxDailyAccPnlDelta:
                    deployParams.TizzVaultToken.maxDailyAccPnlDelta,
                _maxSupplyIncreaseDailyP:
                    deployParams.TizzVaultToken.maxSupplyIncreaseDailyP,
                _lossesBurnP: deployParams.TizzVaultToken.lossesBurnP,
                _maxTizzSupplyMintDailyP:
                    deployParams.TizzVaultToken.maxTizzSupplyMintDailyP,
                _maxDiscountP: deployParams.TizzVaultToken.maxDiscountP,
                _maxDiscountThresholdP:
                    deployParams.TizzVaultToken.maxDiscountThresholdP,
            },
            contractAddresses,
            deployParams.TizzVaultToken.withdrawLockThresholdsP,
        ]
    );

    const LockedDepositNftDesign = await deploy(
        "TizzTokenLockedDepositNftDesign",
        `TizzTokenLockedDepositNftDesign${collateralType}`
    );
    const LockedDepositNft = await deploy(
        "TizzTokenLockedDepositNft",
        `TizzTokenLockedDepositNft${collateralType}`,
        deployParams.TizzTokenLockedDepositNft.name, // name
        deployParams.TizzTokenLockedDepositNft.symbol, // symbol
        TizzVaultToken.address, // _tToken
        LockedDepositNftDesign.address, // _design
        deployParams.TizzTokenLockedDepositNft.designDecimals // _designDecimals
    );

    if (collateralType == "Native") {
        const TizzVaultTokenNativeGateway = await deployProxy(
            "TizzVaultTokenNativeGateway",
            "TizzVaultTokenNativeGateway",
            [TizzVaultToken.address, deployParams.Collateral]
        );
    }
    console.log("Done");
};

const deployFrontEndInfoAggregator = async (collateralType) => {
    console.log(
        `============> deployFrontEndInfoAggregator ${collateralType} <============`
    );
    let TizzFundingFees = await getContract(
        "TizzFundingFees",
        `TizzFundingFees${collateralType}`
    );
    let TizzMultiCollatDiamond = await getContract(
        "TizzMultiCollatDiamond",
        "TizzMultiCollatDiamond"
    );
    let TizzTradingStorage = await getContract(
        "TizzTradingStorage",
        `TizzTradingStorage${collateralType}`
    );
    let TizzTradingCallbacks = await getContract(
        "TizzTradingCallbacks",
        `TizzTradingCallbacks${collateralType}`
    );

    await deploy(
        "TizzFrontEndInfoAggregator",
        `TizzFrontEndInfoAggregator${collateralType}`,
        TizzFundingFees.address,
        TizzMultiCollatDiamond.address,
        TizzTradingStorage.address,
        TizzTradingCallbacks.address
    );

    console.log("Done!");
};

const deployMockToken = async (collateralType, decimals) => {
    console.log(
        `============> deployMockToken ${collateralType} <============`
    );
    await deploy(
        "MockToken",
        `Mock${collateralType}`,
        `Mock${collateralType}`,
        `M${collateralType}`,
        bigNum(10000, decimals),
        decimals
    );
    console.log("Done");
};

const initialCoresFirst = async (collateralType, deployer) => {
    console.log(`============> initialCores ${collateralType} <============`);
    const deployParams = getDeploymentParams(collateralType);

    let tx;
    const [
        TizzTradingStorage,
        TizzTradingCallbacks,
        TizzTrading,
        TizzPriceAggregator,
        TizzCollateralToken,
        ,
        ,
    ] = await getNecessaryCollateralContract(collateralType);

    const collateralToken = new ethers.Contract(
        deployParams.Collateral,
        ERC20ABI,
        deployer
    );
    const TizzFinanceToken = await getContract(
        "TizzFinanceToken",
        "TizzFinanceToken"
    );
    const TizzMultiCollatDiamond = await getContract(
        "TizzMultiCollatDiamond",
        "TizzMultiCollatDiamond"
    );
    const TizzStaking = await getContract("TizzStaking", "TizzStaking");
    const globalParams = getDeploymentParams("Global");

    console.log("TizzFinanceToken.setupRoles");
    tx = await TizzFinanceToken.setupRoles(
        TizzTradingStorage.address,
        TizzMultiCollatDiamond.address,
        TizzTrading.address,
        TizzTradingCallbacks.address,
        deployer.address
    );
    await tx.wait();

    console.log("TizzMultiCollatDiamond.setRoles");
    tx = await TizzMultiCollatDiamond.setRoles(
        globalParams.TizzMultiCollatDiamond.accounts,
        globalParams.TizzMultiCollatDiamond.roles,
        globalParams.TizzMultiCollatDiamond.values
    );
    await tx.wait();

    tx = await TizzMultiCollatDiamond.setRoles(
        [
            deployer.address,
            TizzTrading.address,
            TizzPriceAggregator.address,
            TizzTradingCallbacks.address,
        ],
        [2, 3, 5, 4],
        [true, true, true, true]
    );
    await tx.wait();

    console.log("TizzMultiCollatDiamond.initializePairsStorage");
    tx = await TizzMultiCollatDiamond.initializePairsStorage(
        globalParams.TizzMultiCollatDiamond.currentOrderId
    );
    await tx.wait();

    console.log("TizzMultiCollatDiamond.initializeReferrals");
    tx = await TizzMultiCollatDiamond.initializeReferrals(
        globalParams.TizzMultiCollatDiamond.allyFeeP,
        globalParams.TizzMultiCollatDiamond.startReferrerFeeP,
        globalParams.TizzMultiCollatDiamond.openFeeP,
        globalParams.TizzMultiCollatDiamond.targetVolumeUsd
    );
    await tx.wait();

    console.log("TizzMultiCollatDiamond.initializeFeeTiers");
    tx = await TizzMultiCollatDiamond.initializeFeeTiers(
        globalParams.TizzMultiCollatDiamond.feeTiers.groupIndices,
        globalParams.TizzMultiCollatDiamond.feeTiers.groupVolumeMultipliers,
        globalParams.TizzMultiCollatDiamond.feeTiers.feeTiersIndicies,
        globalParams.TizzMultiCollatDiamond.feeTiers.feeTiers
    );
    await tx.wait();

    console.log("TizzMultiCollatDiamond.initializePriceImpact");
    tx = await TizzMultiCollatDiamond.initializePriceImpact(
        globalParams.TizzMultiCollatDiamond.priceImpact.windowsDuration,
        globalParams.TizzMultiCollatDiamond.priceImpact.windowsCount
    );
    await tx.wait();

    console.log("TizzMultiCollatDiamond.addFees");
    tx = await TizzMultiCollatDiamond.addFees(
        globalParams.TizzMultiCollatDiamond.fees
    );
    await tx.wait();

    console.log("TizzMultiCollatDiamond.addGroups");
    tx = await TizzMultiCollatDiamond.addGroups(
        globalParams.TizzMultiCollatDiamond.groups
    );
    await tx.wait();

    console.log("TizzMultiCollatDiamond.addPairs");
    tx = await TizzMultiCollatDiamond.addPairs(
        globalParams.TizzMultiCollatDiamond.pairs
    );
    await tx.wait();

    console.log("TizzStaking.addRewardToken");
    tx = await TizzStaking.addRewardToken(deployParams.Collateral);
    await tx.wait();

    console.log(`Deposit ${collateralType}`);
    let depositAmount = 0;
    if (network.name == "botanix_test" || network.name == "arbitrum_sepolia") {
        depositAmount = bigNum(10000, 18);
        tx = await collateralToken.mint(
            deployer.address,
            BigInt(depositAmount)
        );
        await tx.wait();
    } else {
        depositAmount = await collateralToken.balanceOf(deployer.address);
    }
    tx = await collateralToken.approve(
        TizzCollateralToken.address,
        BigInt(depositAmount)
    );
    await tx.wait();

    tx = await TizzCollateralToken.deposit(
        BigInt(depositAmount),
        deployer.address
    );
    await tx.wait();

    // TODO check more.
    const tizzMintAmount = bigNum(3000, 18);
    tx = await TizzFinanceToken.mint(deployer.address, BigInt(tizzMintAmount));
    await tx.wait();

    tx = await TizzFinanceToken.approve(
        TizzStaking.address,
        BigInt(tizzMintAmount)
    );
    await tx.wait();

    tx = await TizzStaking.stakeTizz(BigInt(tizzMintAmount));
    await tx.wait();
    console.log("Done");
};

const initialCoresSecond = async (collateralType, deployer) => {
    console.log(`============> initicalCores ${collateralType} <============`);
    const deployParams = getDeploymentParams(collateralType);

    let tx;
    const [
        TizzTradingStorage,
        TizzTradingCallbacks,
        TizzTrading,
        TizzPriceAggregator,
        TizzCollateralToken,
        ,
        ,
    ] = await getNecessaryCollateralContract(collateralType);

    let collateralToken;
    if (collateralType == "Native") {
        collateralToken = new ethers.Contract(
            deployParams.Collateral,
            WETHABI,
            deployer
        );
    } else {
        collateralToken = new ethers.Contract(
            deployParams.Collateral,
            ERC20ABI,
            deployer
        );
    }
    const TizzFinanceToken = await getContract(
        "TizzFinanceToken",
        "TizzFinanceToken"
    );
    const TizzMultiCollatDiamond = await getContract(
        "TizzMultiCollatDiamond",
        "TizzMultiCollatDiamond"
    );
    const TizzStaking = await getContract("TizzStaking", "TizzStaking");

    console.log("TizzFinanceToken.setupRoles");
    const role = await TizzFinanceToken.MINTER_ROLE();
    console.log("grantRole TizzTradingStorage");
    tx = await TizzFinanceToken.grantRole(role, TizzTradingStorage.address);
    await tx.wait();
    console.log("grantRole TizzTrading");
    tx = await TizzFinanceToken.grantRole(role, TizzTrading.address);
    await tx.wait();
    console.log("grantRole TizzTradingCallbacks");
    tx = await TizzFinanceToken.grantRole(role, TizzTradingCallbacks.address);
    await tx.wait();
    console.log("grantRole deployer");
    tx = await TizzFinanceToken.grantRole(role, deployer.address);
    await tx.wait();

    console.log("TizzMultiCollatDiamond.setRoles");
    tx = await TizzMultiCollatDiamond.setRoles(
        [
            deployer.address,
            TizzTrading.address,
            TizzPriceAggregator.address,
            TizzTradingCallbacks.address,
        ],
        [2, 3, 5, 4],
        [true, true, true, true]
    );
    await tx.wait();

    console.log("TizzStaking.addRewardToken");
    tx = await TizzStaking.addRewardToken(deployParams.Collateral);
    await tx.wait();

    console.log(`Deposit ${collateralType}`);
    let depositAmount = 0;
    if (network.name == "botanix_test" || network.name == "arbitrum_sepolia") {
        if (collateralType == "Native") {
            depositAmount = bigNum(1, 15);
            tx = await collateralToken.deposit({
                value: BigInt(depositAmount),
            });
            await tx.wait();
            collateralToken = new ethers.Contract(
                deployParams.Collateral,
                ERC20ABI,
                deployer
            );
        } else {
            depositAmount = bigNum(10000, 18);
            tx = await collateralToken.mint(
                deployer.address,
                BigInt(depositAmount)
            );
            await tx.wait();
        }
    } else {
        depositAmount = await collateralToken.balanceOf(deployer.address);
    }
    tx = await collateralToken.approve(
        TizzCollateralToken.address,
        BigInt(depositAmount)
    );
    await tx.wait();

    tx = await TizzCollateralToken.deposit(
        BigInt(depositAmount),
        deployer.address
    );
    await tx.wait();
    console.log("Done");
};

const initialCollateral_1 = async (collateralType) => {
    console.log(
        `============> initialCollateral_1 ${collateralType} <============`
    );
    const deployParams = getDeploymentParams(collateralType);
    let tx;

    const [
        TizzTradingStorage,
        TizzTradingCallbacks,
        TizzTrading,
        TizzPriceAggregator,
        TizzCollateralToken,
        TizzFundingFees,
        TizzTradingPriceFeedManager,
        TizzEscrow,
    ] = await getNecessaryCollateralContract(collateralType);
    const LockedDepositNft = await getContract(
        "TizzTokenLockedDepositNft",
        `TizzTokenLockedDepositNft${collateralType}`
    );
    const TizzFinanceToken = await getContract(
        "TizzFinanceToken",
        "TizzFinanceToken"
    );
    const TizzMultiCollatDiamond = await getContract(
        "TizzMultiCollatDiamond",
        "TizzMultiCollatDiamond"
    );
    const TizzStaking = await getContract("TizzStaking", "TizzStaking");

    console.log("TizzEscrow.initializeV2");
    tx = await TizzEscrow.initializeV2(TizzTradingCallbacks.address);
    await tx.wait();

    console.log("TizzCollateralToken.setLockedDepositNft");
    tx = await TizzCollateralToken.setLockedDepositNft(
        LockedDepositNft.address
    );
    await tx.wait();

    console.log("TizzCollateralToken.initializeV2");
    tx = await TizzCollateralToken.initializeV2();
    await tx.wait();

    console.log("TizzTradingPriceFeedManager.setTizzVaultToken");
    tx = await TizzTradingPriceFeedManager.setTizzVaultToken(
        TizzCollateralToken.address
    );
    await tx.wait();

    console.log("TizzTradingStorage.setPriceAggregator");
    tx = await TizzTradingStorage.setPriceAggregator(
        TizzPriceAggregator.address
    );
    await tx.wait();

    console.log("TizzTradingStorage.setCallbacks");
    tx = await TizzTradingStorage.setCallbacks(TizzTradingCallbacks.address);
    await tx.wait();

    console.log("TizzTradingStorage.addTradingContract");
    tx = await TizzTradingStorage.addTradingContract(TizzTrading.address);
    await tx.wait();
    tx = await TizzTradingStorage.addTradingContract(
        TizzTradingCallbacks.address
    );
    await tx.wait();

    console.log("TizzTradingStorage.setVault");
    tx = await TizzTradingStorage.setVault(TizzCollateralToken.address);
    await tx.wait();

    console.log("TizzFundingFees.initializeV3");
    tx = await TizzFundingFees.initializeV3(
        TizzMultiCollatDiamond.address,
        TizzPriceAggregator.address
    );
    await tx.wait();

    console.log("TizzFundingFees.setGroupParamsArray");
    tx = await TizzFundingFees.setGroupParamsArray(
        deployParams.TizzFundingFees.groupParamsIndices,
        deployParams.TizzFundingFees.groupParamsValues
    );
    await tx.wait();
    console.log("Done");
};

const initialCollateral_2 = async (collateralType) => {
    console.log(
        `============> initialCollateral_2 ${collateralType} <============`
    );
    const deployParams = getDeploymentParams(collateralType);
    let tx;

    const [
        TizzTradingStorage,
        TizzTradingCallbacks,
        TizzTrading,
        TizzPriceAggregator,
        TizzCollateralToken,
        TizzFundingFees,
        TizzTradingPriceFeedManager,
    ] = await getNecessaryCollateralContract(collateralType);
    const TizzFinanceToken = await getContract(
        "TizzFinanceToken",
        "TizzFinanceToken"
    );
    const TizzMultiCollatDiamond = await getContract(
        "TizzMultiCollatDiamond",
        "TizzMultiCollatDiamond"
    );
    const TizzStaking = await getContract("TizzStaking", "TizzStaking");

    console.log("TizzFundingFees.setPairParamsArray");
    tx = await TizzFundingFees.setPairParamsArray(
        deployParams.TizzFundingFees.pairParamsIndices,
        deployParams.TizzFundingFees.pairParamsValues
    );
    await tx.wait();

    console.log("TizzTradingCallbacks.initializeV2");
    tx = await TizzTradingCallbacks.initializeV2(
        TizzFundingFees.address,
        TizzCollateralToken.address
    );
    await tx.wait();

    console.log("TizzTradingCallbacks.initializeV4");
    tx = await TizzTradingCallbacks.initializeV4(TizzStaking.address);
    await tx.wait();

    console.log("TizzTradingCallbacks.initializeV6");
    tx = await TizzTradingCallbacks.initializeV6(
        TizzMultiCollatDiamond.address
    );
    await tx.wait();

    console.log("TizzTrading.initializeV2");
    tx = await TizzTrading.initializeV2(TizzMultiCollatDiamond.address);
    await tx.wait();
    console.log("Done");
};

const setFeeUpdator = async (feeUpdaterAddress) => {
    console.log("set fee updator");
    const TizzMultiCollatDiamond = await getContract(
        "TizzMultiCollatDiamond",
        "TizzMultiCollatDiamond"
    );

    let tx = await TizzMultiCollatDiamond.setRoles(
        [feeUpdaterAddress],
        [6],
        [true]
    );
    await tx.wait();
    console.log("done");
};

const getAddress = async (collateralTypes, deployer) => {
    const TizzFinanceToken = await getContract(
        "TizzFinanceToken",
        "TizzFinanceToken"
    );
    const TizzTimelockManager = await getContract(
        "TizzTimelockManager",
        "TizzTimelockManager"
    );
    const TizzTimelockOwner = await getContract(
        "TizzTimelockManager",
        "TizzTimelockOwner"
    );
    const MultiCollatDiamond = await getContract(
        "TizzMultiCollatDiamond",
        "TizzMultiCollatDiamond"
    );
    const TizzStaking = await getContract("TizzStaking", "TizzStaking");
    console.log("TizzFinanceToken: ", TizzFinanceToken.address);
    console.log("TizzTimelockManager: ", TizzTimelockManager.address);
    console.log("TizzTimelockOwner: ", TizzTimelockOwner.address);
    console.log("MultiCollatDiamond: ", MultiCollatDiamond.address);
    console.log("TizzStaking: ", TizzStaking.address);

    for (let i = 0; i < collateralTypes.length; i++) {
        const collateralType = collateralTypes[i];
        console.log(`---------------- ${collateralType} ----------------`);
        let Collateral;
        if (collateralType == "Native") {
            const deployParams = getDeploymentParams(collateralType);
            Collateral = new ethers.Contract(
                deployParams.Collateral,
                ERC20ABI,
                deployer
            );
        } else {
            Collateral = await getContract(
                "MockToken",
                `Mock${collateralType}`
            );
        }
        const LockedDepositNft = await getContract(
            "TizzTokenLockedDepositNft",
            `TizzTokenLockedDepositNft${collateralType}`
        );
        const LockedDepositNftDesign = await getContract(
            "TizzTokenLockedDepositNftDesign",
            `TizzTokenLockedDepositNftDesign${collateralType}`
        );
        const FundingFees = await getContract(
            "TizzFundingFees",
            `TizzFundingFees${collateralType}`
        );
        const TradingCallbacks = await getContract(
            "TizzTradingCallbacks",
            `TizzTradingCallbacks${collateralType}`
        );
        const Trading = await getContract(
            "TizzTrading",
            `TizzTrading${collateralType}`
        );
        const PriceAggregator = await getContract(
            "TizzPriceAggregator",
            `TizzPriceAggregator${collateralType}`
        );
        const TizzVaultToken = await getContract(
            "TizzVaultToken",
            `TizzVaultToken${collateralType}`
        );
        const OpenPnlFeed = await getContract(
            "TizzTradingPriceFeedManager",
            `TizzTradingPriceFeedManager${collateralType}`
        );
        const TradingStorage = await getContract(
            "TizzTradingStorage",
            `TizzTradingStorage${collateralType}`
        );
        const TizzFrontEndInfoAggregator = await getContract(
            "TizzFrontEndInfoAggregator",
            `TizzFrontEndInfoAggregator${collateralType}`
        );
        const TizzEscrow = await getContract(
            "TizzEscrow",
            `TizzEscrow${collateralType}`
        );

        console.log("Collateral: ", Collateral.address);
        console.log(
            `LockedDepositNft${collateralType}: `,
            LockedDepositNft.address
        );
        console.log(
            `LockedDepositNftDesign${collateralType}: `,
            LockedDepositNftDesign.address
        );
        console.log(`FundingFees${collateralType}: `, FundingFees.address);
        console.log(
            `TradingCallbacks${collateralType}: `,
            TradingCallbacks.address
        );
        console.log(`Trading${collateralType}: `, Trading.address);
        console.log(
            `PriceAggregator${collateralType}: `,
            PriceAggregator.address
        );
        console.log(`t${collateralType}: `, TizzVaultToken.address);
        console.log(`OpenPnlFeed${collateralType}: `, OpenPnlFeed.address);
        console.log(
            `TradingStorage${collateralType}: `,
            TradingStorage.address
        );
        console.log(
            `TizzFrontEndInfoAggregator${collateralType}: `,
            TizzFrontEndInfoAggregator.address
        );
        console.log(`TizzEscrow${collateralType}: `, TizzEscrow.address);

        if (collateralType == "Native") {
            const TizzVaultTokenNativeGateway = await getContract(
                "TizzVaultTokenNativeGateway",
                "TizzVaultTokenNativeGateway"
            );
            console.log(
                `TizzVaultTokenNativeGateway: ${TizzVaultTokenNativeGateway.address}`
            );
        }
    }
};

const upgradeTizzFundingFees = async (collateralType) => {
    const FundingFeesUtils = await getContract(
        "FundingFeesUtils",
        "FundingFeesUtils"
    );
    await upgradeProxyWithLibrary(
        "TizzFundingFees",
        `TizzFundingFees${collateralType}`,
        {
            FundingFeesUtils: FundingFeesUtils.address,
        }
    );
};

module.exports = {
    deployTokens,
    deployAdmin,
    deployCores,
    deployCollaterals,
    deployFrontEndInfoAggregator,
    deployMockToken,
    initialCoresFirst,
    initialCoresSecond,
    initialCollateral_1,
    initialCollateral_2,
    setFeeUpdator,
    getAddress,
    upgradeTizzFundingFees,
};
