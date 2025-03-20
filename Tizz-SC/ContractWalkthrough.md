# Tizz Smart Contracts Walkthrough

This repository contains the core smart contracts that power the Tizz decentralized trading platform. The contracts are designed to provide a secure and efficient trading experience for users, while also offering flexibility for platform administrators to manage and configure the system.

## Table of Contents

1. [commonLib/Utils.sol](#commonlibutilssol)
2. [core/NFTMarket.sol](#corenftmarketsol)
3. [core/TizzBorrowingFees.sol](#coretizzborrowingfeessol)
4. [core/TizzChainlinkPriceAggregator.sol](#coretizzchainlinkpriceaggregatorsol)
5. [core/TizzOracleRewards.sol](#coretizzoraclerewardssol)
6. [core/TizzOracleRewardsTest.sol](#coretizzoraclerewardstestsol)
7. [core/TizzPriceAggregator.sol](#coretizzpriceaggregatorsol)
8. [core/TizzPriceAggregatorTest.sol](#coretizzpriceaggregatortestsol)
9. [core/TizzTrading.sol](#coretizztradingsol)
10. [core/TizzTradingCallbacks.sol](#coretizztradingcallbackssol)
11. [core/TizzTradingCallbacksTest.sol](#coretizztradingcallbackstestsol)
12. [core/TizzTradingStorage.sol](#coretizztradingstoragesol)
13. [tokens/TTokenChainlinkOpenPnlFeed.sol](#tokensttokenchainlinkopenpnlfeedsol)
14. [tokens/TTokenOpenPnlFeed.sol](#tokensttokenopenpnlfeedsol)
15. [tokens/TTokenSupraOpenPnlFeed.sol](#tokensttokensupraopenpnlfeedsol)
16. [tokens/TTokenLockedDepositNft.sol](#tokensttokenlockeddepositnftsol)
17. [tokens/TTokenLockedDepositNftDesign.sol](#tokensttokenlockeddepositnftdesignsol)

## commonLib/Utils.sol

This contract provides a set of utility functions that are used across the Tizz platform. The main functionalities include:

1. **Median function**: Calculates the median value of an array of integers or unsigned integers.
2. **Sort function**: Sorts an array of integers or unsigned integers in ascending order.
3. **Average function**: Calculates the average value of an array of integers.

These utility functions are used throughout the Tizz contracts to perform common mathematical operations.

## core/NFTMarket.sol

The `NFTMarket` contract is responsible for managing the minting and purchasing of NFTs on the Tizz platform. It allows users to buy NFTs using USDT tokens and tracks the NFTs owned by each user.

**Key Functions:**

1. `init()`: Initializes the contract by setting the WALLET, USDT, and unionsAddress (MSW721 contract) addresses.
2. `setWallet(address wallet_)`: Updates the WALLET address.
3. `setMsw721(address msw721_)`: Updates the unionsAddress (MSW721 contract) address.
4. `setUSDT(address usdt_)`: Updates the USDT address.
5. `nftPrice(uint cardId_)`: Returns the price of a specific NFT.
6. `buyNFTWithUSDT(uint cardId_)`: Allows a user to purchase an NFT using USDT tokens.

## core/TizzBorrowingFees.sol

The `TizzBorrowingFees` contract is responsible for managing the borrowing fees associated with trades on the Tizz platform. It calculates the fees based on the open interest and the current market conditions.

**Key Functions:**

1. `initialize(ITizzTradingStorage _storageT)`: Initializes the contract by setting the `storageT` address.
2. `initializeV3(ITizzMultiCollatDiamond _multiCollatDiamond)`: Initializes the contract with the `multiCollatDiamond` address.
3. `setPairParams(uint256 pairIndex, PairParams calldata value)`: Updates the parameters for a specific trading pair.
4. `setGroupParams(uint16 groupIndex, GroupParams calldata value)`: Updates the parameters for a specific group of trading pairs.
5. `getPendingAccFees(PendingAccFeesInput memory input)`: Calculates the pending accumulated fees for a given input.
6. `handleTradeAction(address trader, uint256 pairIndex, uint256 index, uint256 positionSizeDai, bool open, bool long)`: Updates the borrowing fees when a trade is executed.
7. `getTradeLiquidationPrice(LiqPriceInput calldata input)`: Calculates the liquidation price for a given trade.
8. `getTradeBorrowingFee(BorrowingFeeInput memory input)`: Calculates the borrowing fee for a given trade.

## core/TizzChainlinkPriceAggregator.sol

The `TizzChainlinkPriceAggregator` contract is responsible for fetching and aggregating prices from the Chainlink oracle network. It handles the communication with the Chainlink oracles and provides price data to the Tizz platform.

**Key Functions:**

1. `initialize(uint256 _LINK_FEE_BALANCE_DIVIDER, address _linkToken, ITToken _tToken, address[] memory _oracles, bytes32 _job, uint256 _minAnswers)`: Initializes the contract with the necessary parameters.
2. `updateRequestsStart(uint256 newValue)`, `updateRequestsEvery(uint256 newValue)`, `updateRequestsCount(uint256 newValue)`: Updates the parameters for the price request schedule.
3. `updateMinAnswers(uint256 newValue)`: Updates the minimum number of oracle responses required.
4. `addNode(address a)`, `replaceNode(uint256 index, address a)`, `removeNode(uint256 index)`: Manages the list of oracle nodes.
5. `setMarketJobId(bytes32 jobId)`, `setLimitJobId(bytes32 jobId)`: Updates the job IDs for market and limit orders.
6. `getPrice(uint256 pairIndex, OrderType orderType, uint256 leveragedPosDai, uint256 fromBlock)`: Requests a price from the Chainlink oracles for a specific trading pair and order type.
7. `getCollateralPriceUsd()`, `getUsdNormalizedValue(uint256 collateralValue)`, `getTokenPriceUsd()`, `getTokenPriceUsd(uint256 tokenPriceCollateral)`, `getCollateralFromUsdNormalizedValue(uint256 normalizedValue)`: Provides various price-related utility functions.
8. `claimBackLink()`: Allows the contract owner to claim any remaining LINK tokens.

## core/TizzOracleRewards.sol

The `TizzOracleRewards` contract is responsible for managing the rewards distribution to the Chainlink oracle nodes that provide price data to the Tizz platform.

**Key Functions:**

1. `initialize(ITizzTradingStorage _storageT, uint256 _triggerTimeout, uint256 _oraclesCount)`: Initializes the contract with the necessary parameters.
2. `initializeV2(ITizzMultiCollatDiamond _multiCollatDiamond)`: Initializes the contract with the `multiCollatDiamond` address.
3. `updateTriggerTimeout(uint256 _triggerTimeout)`: Updates the trigger timeout parameter.
4. `updateOracles(uint256 _oraclesCount)`: Updates the list of oracle nodes.
5. `storeTrigger(TriggeredLimitId calldata _id)`: Stores a trigger for a limit order.
6. `unregisterTrigger(TriggeredLimitId calldata _id)`: Unregisters a trigger for a limit order.
7. `distributeOracleReward(TriggeredLimitId calldata _id, uint256 _reward)`: Distributes the oracle reward for a triggered limit order.
8. `claimRewards(address _oracle)`: Allows an oracle node to claim their pending rewards.
9. `setOpenLimitOrderType(address _trader, uint256 _pairIndex, uint256 _index, OpenLimitOrderType _type)`: Sets the open limit order type for a specific trade.
10. `triggered(TriggeredLimitId calldata _id)`, `timedOut(TriggeredLimitId calldata _id)`, `getOracles()`: Provide various getter functions.

## core/TizzOracleRewardsTest.sol

This contract is a test version of the `TizzOracleRewards` contract, with the same functionality as the original contract.

## core/TizzPriceAggregator.sol

The `TizzPriceAggregator` contract is responsible for managing the price aggregation for the Tizz platform. It acts as a proxy, allowing the platform to switch between the Chainlink-based and Supra-based price aggregation systems.

**Key Functions:**

1. `initialize(ITizzTradingStorage _storageT, ITizzMultiCollatDiamond _multiCollatDiamond, ITizzSupraPriceAggregator _supraAggregator, ITizzChainlinkPriceAggregator _chainlinkAggregator, bool _useChainlinkFeed)`: Initializes the contract with the necessary parameters.
2. `updateLinkPriceFeed(IChainlinkFeed _value)`, `updateCollateralPriceFeed(IChainlinkFeed _value)`: Updates the Chainlink price feeds.
3. `updateUniV3Pool(IUniswapV3Pool _uniV3Pool)`, `updateTwapInterval(uint32 _twapInterval)`: Updates the Uniswap V3 pool and TWAP interval parameters.
4. `updateMinAnswers(uint256 _value)`: Updates the minimum number of oracle responses required for the Chainlink-based price aggregation.
5. `addNode(address _node)`, `replaceNode(uint256 _index, address _node)`, `removeNode(uint256 _index)`: Manages the list of Chainlink oracle nodes.
6. `setMarketJobId(bytes32 _jobId)`, `setLimitJobId(bytes32 _jobId)`: Updates the job IDs for market and limit orders in the Chainlink-based price aggregation.
7. `getPrice(uint256 _pairIndex, ITizzChainlinkPriceAggregator.OrderType _orderType, uint256 _leveragedPosDai, uint256 _fromBlock)`: Requests a price from the Chainlink-based price aggregation.
8. `calculateLinkFeePerNode(uint256 _pairIndex, uint256 _leveragedPosDai, uint256 _length)`, `linkFee(uint256 _pairIndex, uint256 _leveragedPosDai)`: Calculates the LINK fee for the Chainlink-based price aggregation.
9. `getCollateralPriceUsd()`, `getUsdNormalizedValue(uint256 _collateralValue)`, `getCollateralFromUsdNormalizedValue(uint256 _normalizedValue)`, `getTokenPriceUsd()`, `getTokenPriceUsd(uint256 _tokenPriceCollateral)`: Provides various price-related utility functions.
10. `claimBackLink()`: Allows the contract owner to claim any remaining LINK tokens.
11. `nodes(uint256 _index)`: Returns the address of a specific Chainlink oracle node.
12. `tokenPriceDai()`: Returns the Tizz token price in DAI.

## core/TizzPriceAggregatorTest.sol

This contract is a test version of the `TizzPriceAggregator` contract, with the same functionality as the original contract.

## core/TizzTrading.sol

The `TizzTrading` contract is the main entry point for users to interact with the Tizz trading platform. It handles the opening and closing of trades, as well as the management of limit orders.

**Key Functions:**

1. `initialize(ITizzTradingStorage _storageT, ITizzOracleRewards _oracleRewards, ITizzBorrowingFees _borrowingFees, uint256 _maxPosDai, uint256 _marketOrdersTimeout)`: Initializes the contract with the necessary parameters.
2. `initializeV2(ITizzMultiCollatDiamond _multiCollatDiamond)`: Initializes the contract with the `multiCollatDiamond` address.
3. `setMaxPosDai(uint256 value)`, `setMarketOrdersTimeout(uint256 value)`, `setBypassTriggerLink(address user, bool bypass)`: Updates various trading parameters.
4. `pause()`, `done()`: Pauses or completes the trading functionality.
5. `openTrade(ITizzTradingStorage.Trade memory t, ITizzOracleRewards.OpenLimitOrderType orderType, uint256 slippageP, address referrer, bytes memory bytesproof)`: Allows a user to open a new trade.
6. `closeTradeMarket(uint256 pairIndex, uint256 index, bytes memory bytesproof)`: Allows a user to close an open trade using a market order.
7. `updateOpenLimitOrder(uint256 pairIndex, uint256 index, uint256 price, uint256 tp, uint256 sl, uint256 maxSlippageP)`: Allows a user to update an open limit order.
8. `cancelOpenLimitOrder(uint256 pairIndex, uint256 index)`: Allows a user to cancel an open limit order.
9. `updateTp(uint256 pairIndex, uint256 index, uint256 newTp)`: Allows a user to update the take profit price of an open trade.
10. `updateSl(uint256 pairIndex, uint256 index, uint256 newSl)`: Allows a user to update the stop loss price of an open trade.
11. `executeNftOrder(uint256 packed, bytes memory bytesproof)`: Executes a limit order for an NFT.
12. `openTradeMarketTimeout(uint256 _order)`, `closeTradeMarketTimeout(uint256 _order)`: Allows users to execute market orders that have timed out.

## core/TizzTradingCallbacks.sol

The `TizzTradingCallbacks` contract is responsible for handling the callbacks from the price aggregation systems when trades are executed. It manages the distribution of fees and rewards, as well as the updating of trade metadata.

**Key Functions:**

1. `initialize(ITizzTradingStorage _storageT, ITizzOracleRewards _nftRewards, ITizzStaking _staking, address vaultToApprove, uint256 _daiVaultFeeP, uint256 _lpFeeP, uint256 _sssFeeP, uint256 _canExecuteTimeout)`: Initializes the contract with the necessary parameters.
2. `initializeV2(ITizzBorrowingFees _borrowingFees)`: Initializes the contract with the `borrowingFees` address.
3. `initializeV4(ITizzStaking _staking, ITizzOracleRewards _oracleRewards)`: Initializes the contract with the `staking` and `oracleRewards` addresses.
4. `initializeV6(ITizzMultiCollatDiamond _multiCollatDiamond)`: Initializes the contract with the `multiCollatDiamond` address.
5. `setClosingFeeSharesP(uint256 _daiVaultFeeP, uint256 _lpFeeP, uint256 _sssFeeP)`: Updates the fee distribution percentages.
6. `pause()`, `done()`: Pauses or completes the trading functionality.
7. `claimGovFees()`: Allows the contract owner to claim the accumulated government fees.
8. `openTradeMarketCallback(AggregatorAnswer memory a)`, `closeTradeMarketCallback(AggregatorAnswer memory a)`: Handles the callbacks for market orders.
9. `executeNftOpenOrderCallback(AggregatorAnswer memory a)`, `executeNftCloseOrderCallback(AggregatorAnswer memory a)`: Handles the callbacks for limit orders.
10. `setTradeLastUpdated(SimplifiedTradeId calldata _id, LastUpdated memory _lastUpdated)`, `setTradeData(SimplifiedTradeId calldata _id, TradeData memory _tradeData)`: Allows updating of trade metadata.

## core/TizzTradingCallbacksTest.sol

This contract is a test version of the `TizzTradingCallbacks` contract, with the same functionality as the original contract.

## core/TizzTradingStorage.sol

The `TizzTradingStorage` contract is responsible for managing the storage of all the trading-related data for the Tizz platform. It provides functions for storing, retrieving, and updating the various trade-related structures.

**Key Functions:**

1. `initialize(IERC20 _dai, IERC20 _linkErc677, IERC20 _token, address _gov)`: Initializes the contract with the necessary parameters.
2. `setGov(address _gov)`, `setDelegatee(address _delegatee)`: Updates the contract owner and delegatee addresses.
3. `addTradingContract(address _trading)`, `removeTradingContract(address _trading)`: Manages the list of trading contracts.
4. `setPriceAggregator(address _aggregator)`, `setVault(address _vault)`, `setCallbacks(address _callbacks)`: Updates the addresses of various Tizz contracts.
5. `setMaxTradesPerPair(uint256 _maxTradesPerPair)`, `setMaxPendingMarketOrders(uint256 _maxPendingMarketOrders)`: Updates the maximum number of trades and pending market orders.
6. `storeTrade(Trade memory _trade, TradeInfo memory _tradeInfo)`, `unregisterTrade(address trader, uint256 pairIndex, uint256 index)`: Stores and unregisters trades.
7. `storePendingMarketOrder(PendingMarketOrder memory _order, uint256 _id, bool _open)`, `unregisterPendingMarketOrder(uint256 _id, bool _open)`: Stores and unregisters pending market orders.
8. `storeOpenLimitOrder(OpenLimitOrder memory o)`, `updateOpenLimitOrder(OpenLimitOrder calldata _o)`, `unregisterOpenLimitOrder(address _trader, uint256 _pairIndex, uint256 _index)`: Manages open limit orders.
9. `storePendingNftOrder(PendingNftOrder memory _nftOrder, uint256 _orderId)`, `unregisterPendingNftOrder(uint256 _order)`: Stores and unregisters pending NFT orders.
10. `updateSl(address _trader, uint256 _pairIndex, uint256 _index, uint256 _newSl)`, `updateTp(address _trader, uint256 _pairIndex, uint256 _index, uint256 _newTp)`, `updateTrade(Trade memory _t)`: Updates various trade parameters.
11. `transferDai(address _from, address _to, uint256 _amount)`, `transferLinkToAggregator(address _from, uint256 _pairIndex, uint256 _leveragedPosDai)`: Handles token transfers.
12. `firstEmptyTradeIndex(address trader, uint256 pairIndex)`, `firstEmptyOpenLimitIndex(address trader, uint256 pairIndex)`, `hasOpenLimitOrder(address trader, uint256 pairIndex, uint256 index)`: Provide various utility functions.

## tokens/TTokenChainlinkOpenPnlFeed.sol

The `TTokenChainlinkOpenPnlFeed` contract is responsible for managing the open PnL (Profit and Loss) feed for the Tizz token using the Chainlink oracle network.

**Key Functions:**

1. `setOpenPnlFeed(address _openPnlFeed)`: Updates the address of the open PnL feed contract.
2. `updateRequestsStart(uint256 _newValue)`, `updateRequestsEvery(uint256 _newValue)`, `updateRequestsCount(uint256 _newValue)`, `updateRequestsInfoBatch(uint256 _newRequestsStart, uint256 _newRequestsEvery, uint256 _newRequestsCount)`: Updates the parameters for the price request schedule.
3. `updateMinAnswers(uint256 _newValue)`: Updates the minimum number of oracle responses required.
4. `updateOracle(uint256 _index, address _newValue)`, `updateOracles(address[] memory _newValues)`: Manages the list of oracle nodes.
5. `updateJob(bytes32 _newValue)`: Updates the job ID for the Chainlink oracle requests.
6. `resetNextEpochValueRequests()`, `forceNewEpoch()`: Resets the next epoch value requests or forces a new epoch.
7. `newOpenPnlRequestOrEpoch()`: Triggers a new open PnL request or a new epoch.
8. `nextEpochValuesRequestCount()`: Returns the number of pending next epoch value requests.

## tokens/TTokenOpenPnlFeed.sol

The `TTokenOpenPnlFeed` contract is a proxy contract that allows the Tizz token to switch between the Chainlink-based and Supra-based open PnL feed implementations.

**Key Functions:**

1. `updateRequestsStart(uint256 _newValue)`, `updateRequestsEvery(uint256 _newValue)`, `updateRequestsCount(uint256 _newValue)`, `updateRequestsInfoBatch(uint256 _newRequestsStart, uint256 _newRequestsEvery, uint256 _newRequestsCount)`: Updates the parameters for the price request schedule.
2. `updateMinAnswers(uint256 _newValue)`: Updates the minimum number of oracle responses required for the Chainlink-based feed.
3. `updateOracle(uint256 _index, address _newValue)`, `updateOracle(address _newValue)`, `updateOracleStorage(address _newValue)`, `updateOracles(address[] memory _newValues)`: Manages the list of oracle nodes for the Chainlink-based and Supra-based feeds.
4. `updateJob(bytes32 _newValue)`: Updates the job ID for the Chainlink-based feed.
5. `resetNextEpochValueRequests()`, `forceNewEpoch()`: Resets the next epoch value requests or forces a new epoch for the Chainlink-based and Supra-based feeds.
6. `newOpenPnlRequestOrEpoch()`, `newOpenPnlRequestOrEpoch(bytes calldata _bytesProof)`: Triggers a new open PnL request or a new epoch for the Chainlink-based and Supra-based feeds.
7. `nextEpochValuesRequestCount()`: Returns the number of pending next epoch value requests for the Chainlink-based and Supra-based feeds.

## tokens/TTokenSupraOpenPnlFeed.sol

The `TTokenSupraOpenPnlFeed` contract is responsible for managing the open PnL (Profit and Loss) feed for the Tizz token using the Supra oracle network.

**Key Functions:**

1. `setOpenPnlFeed(address _openPnlFeed)`: Updates the address of the open PnL feed contract.
2. `updateRequestsStart(uint256 _newValue)`, `updateRequestsEvery(uint256 _newValue)`, `updateRequestsCount(uint256 _newValue)`, `updateRequestsInfoBatch(uint256 newRequestsStart, uint256 newRequestsEvery, uint256 newRequestsCount)`: Updates the parameters for the price request schedule.
3. `updateOracle(address _newValue)`, `updateOracleStorage(address _newValue)`: Updates the addresses of the Supra oracle and storage contracts.
4. `resetNextEpochValueRequests()`, `forceNewEpoch()`: Resets the next epoch value requests or forces a new epoch.
5. `newOpenPnlRequestOrEpoch(bytes calldata _bytesProof)`: Triggers a new open PnL request or a new epoch.
6. `nextEpochValuesRequestCount()`: Returns the number of pending next epoch value requests.

## tokens/TTokenLockedDepositNft.sol

The `TTokenLockedDepositNft` contract is responsible for managing the NFTs that represent locked deposits in the Tizz token.

**Key Functions:**

1. `updateDesign(ITTokenLockedDepositNftDesign newValue)`: Updates the NFT design contract.
2. `updateDesignDecimals(uint8 newValue)`: Updates the NFT design decimal precision.
3. `mint(address to, uint256 tokenId)`: Mints a new NFT.
4. `burn(uint256 tokenId)`: Burns an existing NFT.
5. `tokenURI(uint256 tokenId)`: Returns the URI for a specific NFT.

## tokens/TTokenLockedDepositNftDesign.sol

The `TTokenLockedDepositNftDesign` contract is responsible for generating the SVG image and metadata for the locked deposit NFTs.

**Key Functions:**

1. `buildTokenURI(uint256 tokenId, ITToken.LockedDeposit memory lockedDeposit, string memory tTokenSymbol, string memory assetSymbol, uint8 numberInputDecimals, uint8 numberOutputDecimals)`: Generates the token URI for a specific locked deposit NFT.
2. `numberToRoundedString(uint256 number, uint8 inputDecimals, uint8 outputDecimals)`: Converts a number to a rounded string representation.
