const { network } = require("hardhat");
const { bigNum } = require("hardhat-libutils");

const DEPLOYMENT_PARAM = {
    DAI: {
        TizzTimelockManager: {
            minDelay: 259200,
        },
        TizzToken: {
            name: "Tizz Finance DAI",
            symbol: "tDAI",
            contractAddresses: {
                asset: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
                owner: "",
                manager: "", // TimelockManager
                admin: "0x80fd0accC8Da81b0852d2Dca17b5DDab68f22253",
                tizzToken: "", // gnsToken
                pnlHandler: "", // GNSTradingCallbacks
                openTradesPnlFeed: "", // GTokenOpenPnlFeed
                tizzPriceProvider: {
                    addr: "", // GNSPriceAggregator
                    signature: 0x3c88e882, // function selector
                },
            },
            MIN_LOCK_DURATION: 1209600,
            maxAccOpenPnlDelta: "250000000000000000",
            maxDailyAccPnlDelta: "1178860456449273236",
            withdrawLockThresholdsP: [
                "10000000000000000000",
                "20000000000000000000",
            ],
            maxSupplyIncreaseDailyP: "2000000000000000000",
            lossesBurnP: "25000000000000000000",
            maxTizzSupplyMintDailyP: "50000000000000000",
            maxDiscountP: "5000000000000000000",
            maxDiscountThresholdP: "150000000000000000000",
        },
        TizzTradingStorage: {
            baseAsset: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
            linkERC677: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
            token: "0x18c11FD286C5EC11c3b683Caa813B77f5163A122",
            gov: "0x80fd0accC8Da81b0852d2Dca17b5DDab68f22253", // this is wallet address
            tokenOracleId: 8,
        },
        TizzMultiCollatDiamond: {
            currentOrderId: 38920900,
            allyFeeP: 10,
            startReferrerFeeP: 75,
            openFeeP: 33,
            targetVolumeUsd: 10000000,
            roles: [1],
            values: [true],
            rolesManager: "0xec9581354f7750Bc8194E3e801f8eE1D91e2a8Ac",
            tizz: "0x18c11FD286C5EC11c3b683Caa813B77f5163A122", // GNS token
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
                    to: "USD",
                    feed: {
                        feed1: "0x6ce185860a4963106506C203335A2910413708e9",
                        feed2: "0x0000000000000000000000000000000000000000",
                        feedCalculation: 0,
                        maxDeviationP: 200000000000,
                    },
                    spreadP: 400000000,
                    groupIndex: 0,
                    feeIndex: 0,
                    pairId: 0, // BTC_USDT
                },
                {
                    from: "SOL",
                    to: "USD",
                    feed: {
                        feed1: "0x24ceA4b8ce57cdA5058b924B9B9987992450590c",
                        feed2: "0x0000000000000000000000000000000000000000",
                        feedCalculation: 0,
                        maxDeviationP: "200000000000",
                    },
                    spreadP: 400000000,
                    groupIndex: 0,
                    feeIndex: 0,
                    pairId: 65,
                },
            ],
        },
        TizzPriceAggregator: {
            linkToken: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
            tokenBaseAssetLp: "0x0000000000000000000000000000000000000000",
            twapInterval: 3600,
            linkPriceFeed: "0x86E53CF1B870786351Da77A57575e79CB55812CB",
            collateralPriceFeed: "0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB",
            minAnswers: 3,
            linkPairId: 31, // LINK_USD
            // collateralPairId: 54, // DAI_USD
            collateralPairId: 0, // BTC_USD
            nodes: [
                "0x854D6022836b60c1758ea661A1B6f646d3e8A4E0",
                "0x637025a9F5e2380E3BBe744Ed4Ffb3191cf5EF4D",
                "0xd276E9110bb87EDc9124C754552317eaAB986aD4",
                "0x98e6262EaF8956639a6b689360A0dc0a656e0229",
                "0x2d8f8B3B04849b1ee0AfF0263b1e4D7F7980352a",
                "0x1002CEB663d0e02e4945051555d6fD31CcD618E9",
                "0xa5D07528A456a92A40091A4DBE42A898E3314daD",
                "0x9782d250657b0785C14c0ED56A2E30f971B13CA1",
            ],
            jobIds: [
                "0x6461383264313534663663613464623161643631343765653531616233343231",
                "0x3637666266393336323639613465313139353264346465383563303030396334",
            ],
            supraOraclePull: "0x41AB2059bAA4b73E9A3f55D30Dff27179e0eA181",
            supraOracleStorage: "0x6562fB484C57d1Cba9E89A59C9Ad3F1b6fc79a65",
        },

        TizzTokenLockedDepositNft: {
            name: "TIZZNFT",
            symbol: "TNFT",
            tToken: "0x5977A9682D7AF81D347CFc338c61692163a2784C", // gToken
            designDecimals: 18,
        },
        TizzTradingPriceFeedManager: {
            balanceDivider: 100,
            linkToken: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
            tToken: "0x5977A9682D7AF81D347CFc338c61692163a2784C",
            oracles: [
                "0xe1cdfA96b7FdF704f8F366B6Ec5e11fA74349893",
                "0x88B9047a813e9Df0b20eEfDC5caA3bF95B22D7d9",
                "0x76340EAD9E3074cC0948550F128baad21a9b979a",
                "0xf2e2E42721c474A7B636df47613A0A468ce1d811",
                "0xbCFaA3c72E14448a89a74bB30dD43829D9A58D7C",
                "0xde6D09B81417Ce14941d71E1e544e816B8AA0b4a",
                "0x128889a9b82E5574012177055A35310D50C31a7d",
                "0x8A46A161fB85B26e383716e92Da9B7a78B05514b",
            ],
            job: "0x3534343662356333633630333433376161623832356561383362316164623138",
            minAnswers: 3,
            supraPullOracle: "0x41AB2059bAA4b73E9A3f55D30Dff27179e0eA181",
            supraOracleStorage: "0x6562fB484C57d1Cba9E89A59C9Ad3F1b6fc79a65",
            supraOraclePairs: [0, 1, 2, 3, 4, 5, 6],
        },
        TizzTrading: {
            maxPosBaseAsset: "1000000000000000000000000",
        },
        TizzTradingCallbacks: {
            TizzStaking: "0x7edDE7e5900633F698EaB0Dbc97DE640fC5dC015",
            vaultToApprove: "0x000000000000000000000000000000000000dEaD",
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
    },
    Native: {
        Collateral: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
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
        TizzTimelockOwner: {
            minDelay: 259200,
        },
        TizzToken: {
            name: "Tizz Finance ETH",
            symbol: "tETH",
            contractAddresses: {
                asset: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
                owner: "",
                manager: "",
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                tizzToken: "",
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
                    to: "USD",
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
                    from: "SOL",
                    to: "USD",
                    feed: {
                        feed1: "0x24ceA4b8ce57cdA5058b924B9B9987992450590c",
                        feed2: "0x0000000000000000000000000000000000000000",
                        feedCalculation: 0,
                        maxDeviationP: "200000000000",
                    },
                    spreadP: 400000000,
                    groupIndex: 0,
                    feeIndex: 0,
                    pairId: 65,
                },
            ],
        },
        TizzPriceAggregator: {
            collateralPairId: 1, // ETH_USDT
            supraOraclePull: "0x41AB2059bAA4b73E9A3f55D30Dff27179e0eA181",
            supraOracleStorage: "0x6562fB484C57d1Cba9E89A59C9Ad3F1b6fc79a65",
        },

        TizzTokenLockedDepositNft: {
            name: "tETH Locked Deposit",
            symbol: "tETHLD",
            designDecimals: 18,
        },
        TizzTradingPriceFeedManager: {
            supraPullOracle: "0x41AB2059bAA4b73E9A3f55D30Dff27179e0eA181",
            supraOracleStorage: "0x6562fB484C57d1Cba9E89A59C9Ad3F1b6fc79a65",
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
        TizzStaking: {
            owner: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
        },
        TizzTokenLockedDepositNftDesign: {
            admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
        },
        TizzFinanceToken: {
            admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
        },
    },
    USDT: {
        Collateral: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
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
        TizzToken: {
            name: "Tizz Finance USDT",
            symbol: "tUSDT",
            contractAddresses: {
                asset: "",
                owner: "",
                manager: "",
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                tizzToken: "",
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
                    to: "USD",
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
                    from: "SOL",
                    to: "USD",
                    feed: {
                        feed1: "0x24ceA4b8ce57cdA5058b924B9B9987992450590c",
                        feed2: "0x0000000000000000000000000000000000000000",
                        feedCalculation: 0,
                        maxDeviationP: "200000000000",
                    },
                    spreadP: 400000000,
                    groupIndex: 0,
                    feeIndex: 0,
                    pairId: 65,
                },
            ],
        },
        TizzPriceAggregator: {
            collateralPairId: 48, // USDT_USD
            supraOraclePull: "0x41AB2059bAA4b73E9A3f55D30Dff27179e0eA181",
            supraOracleStorage: "0x6562fB484C57d1Cba9E89A59C9Ad3F1b6fc79a65",
        },

        TizzTokenLockedDepositNft: {
            name: "tUSDT Locked Deposit",
            symbol: "tUSDTLD",
            designDecimals: 18,
        },
        TizzTradingPriceFeedManager: {
            supraPullOracle: "0x41AB2059bAA4b73E9A3f55D30Dff27179e0eA181",
            supraOracleStorage: "0x6562fB484C57d1Cba9E89A59C9Ad3F1b6fc79a65",
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
        TizzStaking: {
            owner: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
        },
        TizzTokenLockedDepositNftDesign: {
            admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
        },
        TizzFinanceToken: {
            admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
        },
    },
    WBTC: {
        Collateral: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
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
        TizzToken: {
            name: "Tizz Finance WBTC",
            symbol: "tWBTC",
            contractAddresses: {
                asset: "",
                owner: "",
                manager: "",
                admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
                tizzToken: "",
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
            tokenOracleId: 166,
            isNative: false,
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
                    to: "USD",
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
        TizzPriceAggregator: {
            collateralPairId: 166, // WBTC_USD
            supraOraclePull: "0x41AB2059bAA4b73E9A3f55D30Dff27179e0eA181",
            supraOracleStorage: "0x6562fB484C57d1Cba9E89A59C9Ad3F1b6fc79a65",
        },

        TizzTokenLockedDepositNft: {
            name: "tWBTC Locked Deposit",
            symbol: "tWBTCLD",
            designDecimals: 18,
        },
        TizzTradingPriceFeedManager: {
            supraPullOracle: "0x41AB2059bAA4b73E9A3f55D30Dff27179e0eA181",
            supraOracleStorage: "0x6562fB484C57d1Cba9E89A59C9Ad3F1b6fc79a65",
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
        TizzStaking: {
            owner: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
        },
        TizzTokenLockedDepositNftDesign: {
            admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
        },
        TizzFinanceToken: {
            admin: "0x0bfFb4b773DbfAe2fD7bDe75B9323c7F62B14877",
        },
    },
};

const getDeploymentParams = (collateral, network_name = network.name) => {
    if (network_name == "arbitrum" || network_name == "hardhat") {
        if (collateral == "DAI") {
            return DEPLOYMENT_PARAM.DAI;
        } else if (collateral == "Native") {
            return DEPLOYMENT_PARAM.Native;
        } else if (collateral == "USDT") {
            return DEPLOYMENT_PARAM.USDT;
        } else if (collateral == "WBTC") {
            return DEPLOYMENT_PARAM.WBTC;
        } else {
            return {};
        }
    } else {
        return {};
    }
};

module.exports = {
    getDeploymentParams,
};
