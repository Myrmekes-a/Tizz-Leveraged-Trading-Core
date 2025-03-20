const { network } = require("hardhat");
const { bigNum } = require("hardhat-libutils");
const { readFileSync } = require("fs");

const SUPURA_ADDRESS = {
    botanix_test: {
        supraOraclePull: "0x6bf7b21145Cbd7BB0b9916E6eB24EDA8A675D7C0",
        supraOracleStorage: "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
    },
    arbitrum_sepolia: {
        supraOraclePull: "0xBf07a08042Bf7a61680527D06aC5F54278e0c8E5",
        supraOracleStorage: "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
    },
};

const DEPLOYMENT_PARAM = {
    botanix_test: {
        Global: {
            TizzFinanceToken: {
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
            TizzTimelockManager: {
                minDelay: 259200,
                proposers: ["0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877"],
                executors: ["0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877"],
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
            TizzTimelockOwner: {
                minDelay: 259200,
                proposers: ["0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877"],
                executors: ["0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877"],
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
            TizzMultiCollatDiamond: {
                currentOrderId: 38920900,
                allyFeeP: 10,
                startReferrerFeeP: 75,
                openFeeP: 33,
                targetVolumeUsd: 10000000,
                accounts: ["0x0bffb4b773dbfae2fd7bde75b9323c7f62b14877"],
                roles: [1],
                values: [true],
                rolesManager: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                fees: [
                    {
                        name: "crypto",
                        openFeeP: 300000000,
                        closeFeeP: 600000000,
                        oracleFeeP: 40000000,
                        nftLimitOrderFeeP: 200000000,
                        minLevPosUsd: bigNum(750, 18),
                    },
                ],
                feeTiers: {
                    groupIndices: [0],
                    groupVolumeMultipliers: [8000],
                    feeTiersIndicies: [0, 1, 2, 3, 4, 5, 6, 7],
                    feeTiers: [
                        { feeMultiplier: 975, pointsThreshold: 5000000 },
                        { feeMultiplier: 950, pointsThreshold: 15000000 },
                        { feeMultiplier: 925, pointsThreshold: 30000000 },
                        { feeMultiplier: 900, pointsThreshold: 50000000 },
                        { feeMultiplier: 850, pointsThreshold: 100000000 },
                        { feeMultiplier: 800, pointsThreshold: 150000000 },
                        { feeMultiplier: 725, pointsThreshold: 400000000 },
                        { feeMultiplier: 650, pointsThreshold: 1000000000 },
                    ],
                },
                priceImpact: {
                    windowsDuration: 7200,
                    windowsCount: 3,
                },
                groups: [
                    {
                        name: "crypto",
                        job: "0x3430623930323466393363393430326238353736633533636638643938653763",
                        minLeverage: 2,
                        maxLeverage: 150,
                    },
                ],
                pairs: [
                    {
                        from: "BTC",
                        to: "USDT",
                        feed: {
                            feed1: "0x6ce185860a4963106506C203335A2910413708e9",
                            feed2: "0x0000000000000000000000000000000000000000",
                            feedCalculation: 0,
                            maxDeviationP: 200000000000,
                        },
                        spreadP: 400000000,
                        groupIndex: 0,
                        feeIndex: 0,
                        pairId: 0,
                    },
                    {
                        from: "USDT",
                        to: "USD",
                        feed: {
                            feed1: "0x24ceA4b8ce57cdA5058b924B9B9987992450590c",
                            feed2: "0x0000000000000000000000000000000000000000",
                            feedCalculation: 0,
                            maxDeviationP: "200000000000",
                        },
                        spreadP: 0,
                        groupIndex: 0,
                        feeIndex: 0,
                        pairId: 48,
                    },
                ],
            },
            TizzStaking: {
                owner: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                minAmount: bigNum(100, 18),
            },
            Collateral: "0xF254a134Af9BA7Ed0A4a6a793B5A59669350FDcD",
        },
        USDT: {
            Collateral: "0xF254a134Af9BA7Ed0A4a6a793B5A59669350FDcD",
            TizzVaultToken: {
                name: "Tizz Finance USDT",
                symbol: "tUSDT",
                contractAddresses: {
                    asset: "",
                    owner: "",
                    manager: "",
                    admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                    tizzFinanceToken: "",
                    pnlHandler: "",
                    openTradesPnlFeed: "",
                    tizzPriceProvider: {
                        addr: "",
                        signature: 0x3c88e882, // function selector
                    },
                },
                MIN_LOCK_DURATION: 1209600,
                maxAccOpenPnlDelta: "250000000000000000",
                maxDailyAccPnlDelta: "1178860456449273236",
                maxSupplyIncreaseDailyP: "2000000000000000000",
                withdrawLockThresholdsP: [
                    "10000000000000000000",
                    "20000000000000000000",
                ],
                lossesBurnP: "25000000000000000000",
                maxTizzSupplyMintDailyP: "50000000000000000",
                maxDiscountP: "5000000000000000000",
                maxDiscountThresholdP: "150000000000000000000",
            },
            TizzTradingStorage: {
                gov: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                tokenOracleId: 48,
                isNative: false,
            },
            TizzPriceAggregator: {
                collateralPairId: 48, // USDT_USD
                supraOraclePull: "0x6bf7b21145Cbd7BB0b9916E6eB24EDA8A675D7C0",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
            },
            TizzTokenLockedDepositNft: {
                name: "tUSDT Locked Deposit",
                symbol: "tUSDTLD",
                designDecimals: 18,
            },
            TizzTradingPriceFeedManager: {
                supraPullOracle: "0x6bf7b21145Cbd7BB0b9916E6eB24EDA8A675D7C0",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
                supraOraclePairs: [0, 1, 2, 3, 4, 5, 6],
            },
            TizzTrading: {
                maxPosBaseAsset: "1000000000000000000000000",
                isNative: false,
            },
            TizzTradingCallbacks: {
                baseAssetVaultFeeP: 50,
                lpFeeP: 0,
                sssFeeP: 50,
            },
            TizzFundingFees: {
                baseRate: 100, // 0.01%
                groupParamsIndices: [1, 3, 4, 5, 6, 7, 8, 11, 12],
                groupParamsValues: [
                    {
                        feePerBlock: 1012,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1634,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1065,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 63,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    {
                        feePerBlock: 6033,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1387,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 57,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                ],
                pairParamsIndices: [0, 1],
                pairParamsValues: [
                    {
                        groupIndex: 1,
                        feePerBlock: 22293,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                    {
                        groupIndex: 3,
                        feePerBlock: 73202,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                ],
            },
            TizzTokenLockedDepositNftDesign: {
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
        },
        WBTC: {
            Collateral: "0xa04F3fAe0aD0B183351C5e3098B5f697697B2982",
            TizzVaultToken: {
                name: "Tizz Finance WBTC",
                symbol: "tWBTC",
                contractAddresses: {
                    asset: "",
                    owner: "",
                    manager: "",
                    admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                    tizzFinanceToken: "",
                    pnlHandler: "",
                    openTradesPnlFeed: "",
                    tizzPriceProvider: {
                        addr: "",
                        signature: 0x3c88e882, // function selector
                    },
                },
                MIN_LOCK_DURATION: 1209600,
                maxAccOpenPnlDelta: "250000000000000000",
                maxDailyAccPnlDelta: "1178860456449273236",
                maxSupplyIncreaseDailyP: "2000000000000000000",
                withdrawLockThresholdsP: [
                    "10000000000000000000",
                    "20000000000000000000",
                ],
                lossesBurnP: "25000000000000000000",
                maxTizzSupplyMintDailyP: "50000000000000000",
                maxDiscountP: "5000000000000000000",
                maxDiscountThresholdP: "150000000000000000000",
            },
            TizzTradingStorage: {
                gov: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                tokenOracleId: 0, // WBTC_USD
                isNative: false,
            },
            TizzPriceAggregator: {
                collateralPairId: 0, // BTC_USD
                supraOraclePull: "0x6bf7b21145Cbd7BB0b9916E6eB24EDA8A675D7C0",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
            },
            TizzTokenLockedDepositNft: {
                name: "tWBTC Locked Deposit",
                symbol: "tWBTCLD",
                designDecimals: 18,
            },
            TizzTradingPriceFeedManager: {
                supraPullOracle: "0x6bf7b21145Cbd7BB0b9916E6eB24EDA8A675D7C0",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
                supraOraclePairs: [0, 1, 2, 3, 4, 5, 6],
            },
            TizzTrading: {
                maxPosBaseAsset: "1000000000000000000000000",
                isNative: false,
            },
            TizzTradingCallbacks: {
                baseAssetVaultFeeP: 50,
                lpFeeP: 0,
                sssFeeP: 50,
            },
            TizzFundingFees: {
                baseRate: 100, // 0.01%
                groupParamsIndices: [1, 3, 4, 5, 6, 7, 8, 11, 12],
                groupParamsValues: [
                    {
                        feePerBlock: 1012,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1634,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1065,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 63,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    {
                        feePerBlock: 6033,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1387,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 57,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                ],
                pairParamsIndices: [0, 1],
                pairParamsValues: [
                    {
                        groupIndex: 1,
                        feePerBlock: 22293,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                    {
                        groupIndex: 3,
                        feePerBlock: 73202,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                ],
            },
            TizzTokenLockedDepositNftDesign: {
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
        },
        BTC: {
            Collateral: "0x23a62E7A0b8541b6C217A5a1E750CDb01E954807",
            TizzVaultToken: {
                name: "Tizz Finance BTC",
                symbol: "tBTC",
                contractAddresses: {
                    asset: "",
                    owner: "",
                    manager: "",
                    admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                    tizzFinanceToken: "",
                    pnlHandler: "",
                    openTradesPnlFeed: "",
                    tizzPriceProvider: {
                        addr: "",
                        signature: 0x3c88e882, // function selector
                    },
                },
                MIN_LOCK_DURATION: 1209600,
                maxAccOpenPnlDelta: "250000000000000000",
                maxDailyAccPnlDelta: "1178860456449273236",
                maxSupplyIncreaseDailyP: "2000000000000000000",
                withdrawLockThresholdsP: [
                    "10000000000000000000",
                    "20000000000000000000",
                ],
                lossesBurnP: "25000000000000000000",
                maxTizzSupplyMintDailyP: "50000000000000000",
                maxDiscountP: "5000000000000000000",
                maxDiscountThresholdP: "150000000000000000000",
            },
            TizzTradingStorage: {
                gov: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                tokenOracleId: 0, // BTC_USD
                isNative: true,
            },
            TizzPriceAggregator: {
                collateralPairId: 0, // BTC_USD
                supraOraclePull: "0x6bf7b21145Cbd7BB0b9916E6eB24EDA8A675D7C0",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
            },
            TizzTokenLockedDepositNft: {
                name: "tBTC Locked Deposit",
                symbol: "tBTCLD",
                designDecimals: 18,
            },
            TizzTradingPriceFeedManager: {
                supraPullOracle: "0x6bf7b21145Cbd7BB0b9916E6eB24EDA8A675D7C0",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
                supraOraclePairs: [0, 1, 2, 3, 4, 5, 6],
            },
            TizzTrading: {
                maxPosBaseAsset: "1000000000000000000000000",
                isNative: true,
            },
            TizzTradingCallbacks: {
                baseAssetVaultFeeP: 50,
                lpFeeP: 0,
                sssFeeP: 50,
            },
            TizzFundingFees: {
                baseRate: 100, // 0.01%
                groupParamsIndices: [1, 3, 4, 5, 6, 7, 8, 11, 12],
                groupParamsValues: [
                    {
                        feePerBlock: 1012,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1634,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1065,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 63,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    {
                        feePerBlock: 6033,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1387,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 57,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                ],
                pairParamsIndices: [0, 1],
                pairParamsValues: [
                    {
                        groupIndex: 1,
                        feePerBlock: 22293,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                    {
                        groupIndex: 3,
                        feePerBlock: 73202,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                ],
            },
            TizzTokenLockedDepositNftDesign: {
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
        },
    },
    arbitrum_sepolia: {
        Global: {
            TizzFinanceToken: {
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
            TizzTimelockManager: {
                minDelay: 259200,
                proposers: ["0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877"],
                executors: ["0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877"],
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
            TizzTimelockOwner: {
                minDelay: 259200,
                proposers: ["0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877"],
                executors: ["0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877"],
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
            TizzMultiCollatDiamond: {
                currentOrderId: 38920900,
                allyFeeP: 10,
                startReferrerFeeP: 75,
                openFeeP: 33,
                targetVolumeUsd: 10000000,
                accounts: ["0x0bffb4b773dbfae2fd7bde75b9323c7f62b14877"],
                roles: [1],
                values: [true],
                rolesManager: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                fees: [
                    {
                        name: "crypto",
                        openFeeP: 300000000,
                        closeFeeP: 600000000,
                        oracleFeeP: 40000000,
                        nftLimitOrderFeeP: 200000000,
                        minLevPosUsd: bigNum(750, 18),
                    },
                ],
                feeTiers: {
                    groupIndices: [0],
                    groupVolumeMultipliers: [8000],
                    feeTiersIndicies: [0, 1, 2, 3, 4, 5, 6, 7],
                    feeTiers: [
                        { feeMultiplier: 975, pointsThreshold: 5000000 },
                        { feeMultiplier: 950, pointsThreshold: 15000000 },
                        { feeMultiplier: 925, pointsThreshold: 30000000 },
                        { feeMultiplier: 900, pointsThreshold: 50000000 },
                        { feeMultiplier: 850, pointsThreshold: 100000000 },
                        { feeMultiplier: 800, pointsThreshold: 150000000 },
                        { feeMultiplier: 725, pointsThreshold: 400000000 },
                        { feeMultiplier: 650, pointsThreshold: 1000000000 },
                    ],
                },
                priceImpact: {
                    windowsDuration: 7200,
                    windowsCount: 3,
                },
                groups: [
                    {
                        name: "crypto",
                        job: "0x3430623930323466393363393430326238353736633533636638643938653763",
                        minLeverage: 2,
                        maxLeverage: 150,
                    },
                ],
                pairs: [
                    {
                        from: "BTC",
                        to: "USDT",
                        feed: {
                            feed1: "0x6ce185860a4963106506C203335A2910413708e9",
                            feed2: "0x0000000000000000000000000000000000000000",
                            feedCalculation: 0,
                            maxDeviationP: 200000000000,
                        },
                        spreadP: 400000000,
                        groupIndex: 0,
                        feeIndex: 0,
                        pairId: 0,
                    },
                    {
                        from: "USDT",
                        to: "USD",
                        feed: {
                            feed1: "0x24ceA4b8ce57cdA5058b924B9B9987992450590c",
                            feed2: "0x0000000000000000000000000000000000000000",
                            feedCalculation: 0,
                            maxDeviationP: "200000000000",
                        },
                        spreadP: 0,
                        groupIndex: 0,
                        feeIndex: 0,
                        pairId: 48,
                    },
                ],
            },
            TizzStaking: {
                owner: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                minAmount: bigNum(100, 18),
            },
            Collateral: "0x1CFEA7ecB518B3e4C5f72f11bc0F8E75A070A5C0",
        },
        USDT: {
            Collateral: "0x1CFEA7ecB518B3e4C5f72f11bc0F8E75A070A5C0",
            TizzVaultToken: {
                name: "Tizz Finance USDT",
                symbol: "tUSDT",
                contractAddresses: {
                    asset: "",
                    owner: "",
                    manager: "",
                    admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                    tizzFinanceToken: "",
                    pnlHandler: "",
                    openTradesPnlFeed: "",
                    tizzPriceProvider: {
                        addr: "",
                        signature: 0x3c88e882, // function selector
                    },
                },
                MIN_LOCK_DURATION: 1209600,
                maxAccOpenPnlDelta: "250000000000000000",
                maxDailyAccPnlDelta: "1178860456449273236",
                maxSupplyIncreaseDailyP: "2000000000000000000",
                withdrawLockThresholdsP: [
                    "10000000000000000000",
                    "20000000000000000000",
                ],
                lossesBurnP: "25000000000000000000",
                maxTizzSupplyMintDailyP: "50000000000000000",
                maxDiscountP: "5000000000000000000",
                maxDiscountThresholdP: "150000000000000000000",
            },
            TizzTradingStorage: {
                gov: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                tokenOracleId: 48,
                isNative: false,
            },
            TizzPriceAggregator: {
                collateralPairId: 48, // USDT_USD
                supraOraclePull: "0xBf07a08042Bf7a61680527D06aC5F54278e0c8E5",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
            },
            TizzTokenLockedDepositNft: {
                name: "tUSDT Locked Deposit",
                symbol: "tUSDTLD",
                designDecimals: 18,
            },
            TizzTradingPriceFeedManager: {
                supraPullOracle: "0xBf07a08042Bf7a61680527D06aC5F54278e0c8E5",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
                supraOraclePairs: [0, 1, 2, 3, 4, 5, 6],
            },
            TizzTrading: {
                maxPosBaseAsset: "1000000000000000000000000",
                isNative: false,
            },
            TizzTradingCallbacks: {
                baseAssetVaultFeeP: 50,
                lpFeeP: 0,
                sssFeeP: 50,
            },
            TizzFundingFees: {
                baseRate: 100, // 0.01%
                groupParamsIndices: [1, 3, 4, 5, 6, 7, 8, 11, 12],
                groupParamsValues: [
                    {
                        feePerBlock: 1012,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1634,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1065,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 63,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    {
                        feePerBlock: 6033,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1387,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 57,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                ],
                pairParamsIndices: [0, 1],
                pairParamsValues: [
                    {
                        groupIndex: 1,
                        feePerBlock: 22293,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                    {
                        groupIndex: 3,
                        feePerBlock: 73202,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                ],
            },
            TizzTokenLockedDepositNftDesign: {
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
        },
        WBTC: {
            Collateral: "0xD98A3871421c4daC2F6eea03536326f2279D0Bd2",
            TizzVaultToken: {
                name: "Tizz Finance WBTC",
                symbol: "tWBTC",
                contractAddresses: {
                    asset: "",
                    owner: "",
                    manager: "",
                    admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                    tizzFinanceToken: "",
                    pnlHandler: "",
                    openTradesPnlFeed: "",
                    tizzPriceProvider: {
                        addr: "",
                        signature: 0x3c88e882, // function selector
                    },
                },
                MIN_LOCK_DURATION: 1209600,
                maxAccOpenPnlDelta: "250000000000000000",
                maxDailyAccPnlDelta: "1178860456449273236",
                maxSupplyIncreaseDailyP: "2000000000000000000",
                withdrawLockThresholdsP: [
                    "10000000000000000000",
                    "20000000000000000000",
                ],
                lossesBurnP: "25000000000000000000",
                maxTizzSupplyMintDailyP: "50000000000000000",
                maxDiscountP: "5000000000000000000",
                maxDiscountThresholdP: "150000000000000000000",
            },
            TizzTradingStorage: {
                gov: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                tokenOracleId: 0, // WBTC_USD
                isNative: false,
            },
            TizzPriceAggregator: {
                collateralPairId: 0, // WBTC_USD
                supraOraclePull: "0xBf07a08042Bf7a61680527D06aC5F54278e0c8E5",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
            },
            TizzTokenLockedDepositNft: {
                name: "tWBTC Locked Deposit",
                symbol: "tWBTCLD",
                designDecimals: 18,
            },
            TizzTradingPriceFeedManager: {
                supraPullOracle: "0xBf07a08042Bf7a61680527D06aC5F54278e0c8E5",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
                supraOraclePairs: [0, 1, 2, 3, 4, 5, 6],
            },
            TizzTrading: {
                maxPosBaseAsset: "1000000000000000000000000",
                isNative: false,
            },
            TizzTradingCallbacks: {
                baseAssetVaultFeeP: 50,
                lpFeeP: 0,
                sssFeeP: 50,
            },
            TizzFundingFees: {
                baseRate: 100, // 0.01%
                groupParamsIndices: [1, 3, 4, 5, 6, 7, 8, 11, 12],
                groupParamsValues: [
                    {
                        feePerBlock: 1012,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1634,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1065,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 63,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    {
                        feePerBlock: 6033,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1387,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 57,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                ],
                pairParamsIndices: [0, 1],
                pairParamsValues: [
                    {
                        groupIndex: 1,
                        feePerBlock: 22293,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                    {
                        groupIndex: 3,
                        feePerBlock: 73202,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                ],
            },
            TizzTokenLockedDepositNftDesign: {
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
        },
        ETH: {
            Collateral: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73",
            TizzVaultToken: {
                name: "Tizz Finance ETH",
                symbol: "tETH",
                contractAddresses: {
                    asset: "",
                    owner: "",
                    manager: "",
                    admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                    tizzFinanceToken: "",
                    pnlHandler: "",
                    openTradesPnlFeed: "",
                    tizzPriceProvider: {
                        addr: "",
                        signature: 0x3c88e882, // function selector
                    },
                },
                MIN_LOCK_DURATION: 1209600,
                maxAccOpenPnlDelta: "250000000000000000",
                maxDailyAccPnlDelta: "1178860456449273236",
                maxSupplyIncreaseDailyP: "2000000000000000000",
                withdrawLockThresholdsP: [
                    "10000000000000000000",
                    "20000000000000000000",
                ],
                lossesBurnP: "25000000000000000000",
                maxTizzSupplyMintDailyP: "50000000000000000",
                maxDiscountP: "5000000000000000000",
                maxDiscountThresholdP: "150000000000000000000",
            },
            TizzTradingStorage: {
                gov: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                tokenOracleId: 19,
                isNative: true,
            },
            TizzPriceAggregator: {
                collateralPairId: 19, // ETH_USD
                supraOraclePull: "0xBf07a08042Bf7a61680527D06aC5F54278e0c8E5",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
            },
            TizzTokenLockedDepositNft: {
                name: "tETH Locked Deposit",
                symbol: "tETHLD",
                designDecimals: 18,
            },
            TizzTradingPriceFeedManager: {
                supraPullOracle: "0xBf07a08042Bf7a61680527D06aC5F54278e0c8E5",
                supraOracleStorage:
                    "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917",
                supraOraclePairs: [0, 1, 2, 3, 4, 5, 6],
            },
            TizzTrading: {
                maxPosBaseAsset: "1000000000000000000000000",
                isNative: true,
            },
            TizzTradingCallbacks: {
                baseAssetVaultFeeP: 50,
                lpFeeP: 0,
                sssFeeP: 50,
            },
            TizzFundingFees: {
                baseRate: 100, // 0.01%
                groupParamsIndices: [1, 3, 4, 5, 6, 7, 8, 11, 12],
                groupParamsValues: [
                    {
                        feePerBlock: 1012,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1634,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1065,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 63,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    { feePerBlock: 0, maxOi: 0, feeExponent: 1 },
                    {
                        feePerBlock: 6033,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 1387,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                    {
                        feePerBlock: 57,
                        maxOi: bigNum(6000000000, 10),
                        feeExponent: 1,
                    },
                ],
                pairParamsIndices: [0, 1],
                pairParamsValues: [
                    {
                        groupIndex: 1,
                        feePerBlock: 22293,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                    {
                        groupIndex: 3,
                        feePerBlock: 73202,
                        feeExponent: 1,
                        maxOi: bigNum(6000000000, 10),
                    },
                ],
            },
            TizzTokenLockedDepositNftDesign: {
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
            },
        },
    },
};

const getDeploymentParams = (collateral, network_name = network.name) => {
    if (network_name == "botanix_test") {
        if (collateral == "USDT") {
            return DEPLOYMENT_PARAM.botanix_test.USDT;
        } else if (collateral == "WBTC") {
            return DEPLOYMENT_PARAM.botanix_test.WBTC;
        } else if (collateral == "BTC") {
            return DEPLOYMENT_PARAM.botanix_test.BTC;
        } else if (collateral == "Global") {
            return DEPLOYMENT_PARAM.botanix_test.Global;
        } else {
            return {};
        }
    } else if (network_name == "arbitrum_sepolia") {
        if (collateral == "USDT") {
            return DEPLOYMENT_PARAM.arbitrum_sepolia.USDT;
        } else if (collateral == "WBTC") {
            return DEPLOYMENT_PARAM.arbitrum_sepolia.WBTC;
        } else if (collateral == "Global") {
            return DEPLOYMENT_PARAM.arbitrum_sepolia.Global;
        } else if (collateral == "Native") {
            return DEPLOYMENT_PARAM.arbitrum_sepolia.ETH;
        } else {
            return {};
        }
    } else {
        return {};
    }
};

const getSupraOracleAddrs = (network_name = network.name) => {
    if (network_name == "botanix_test") {
        return SUPURA_ADDRESS.botanix_test;
    } else if (network_name == "arbitrum_sepolia") {
        return SUPURA_ADDRESS.arbitrum_sepolia;
    } else {
        return {};
    }
};

const getProofBytes = (network_name = network.name) => {
    let jsonData;
    if (network_name == "botanix_test" || network_name == "arbitrum_sepolia") {
        jsonData = readFileSync(`${__dirname}/proofbytes_test.txt`);
    } else {
        jsonData = readFileSync(`${__dirname}/proofbytes_main.txt`);
    }

    jsonData = JSON.parse(jsonData, null, 2);
    return ethers.utils.hexlify(jsonData.data);
};

const getNewProofBytes = (network_name = network.name) => {
    let jsonData;
    if (network_name == "botanix_test" || network_name == "arbitrum_sepolia") {
        jsonData = readFileSync(`${__dirname}/new_proofbytes_test.txt`);
    } else {
        jsonData = readFileSync(`${__dirname}/new_proofbytes_main.txt`);
    }

    jsonData = JSON.parse(jsonData, null, 2);
    return ethers.utils.hexlify(jsonData.data);
};

module.exports = {
    getDeploymentParams,
    getSupraOracleAddrs,
    getProofBytes,
    getNewProofBytes,
};
