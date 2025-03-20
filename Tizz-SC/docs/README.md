# Tizz Protocol Smart Contracts

The Tizz Protocol's smart contract system is designed to facilitate a variety of operations including trading, referrals, NFT design, and more. Below is an overview of the key components and functionalities within the codebase.

## Contracts Overview

### Trading and Storage

- `TizzTrading.sol`: Manages trading operations, ensuring trades adhere to system constraints like leverage limits and price impact.
- `TizzTradingStorage.sol`: Stores trade-related data, including open interest, order counts, and fee information.

### Referral System

- `ReferralsUtils.sol`: Handles the referral system logic, including fee calculations, reward distribution, and ally/referrer management.
- `TizzReferrals.sol`: Facade for interacting with the referral system, providing functions to claim rewards and get referral details.

### NFT Design

- `TTokenLockedDepositNftDesign.sol`: Generates token URIs for NFTs representing locked deposits, including SVG image encoding.
- `ITTokenLockedDepositNftDesign.sol`: Interface for the NFT design contract.

### Price Aggregation and Impact

- `PriceImpactUtils.sol`: Manages price impact calculations and open interest window settings.
- `TWAPPriceGetter.sol`: Retrieves time-weighted average prices (TWAP) from Uniswap V3 pools.

### Pairs and Fees Management

- `PairsStorageUtils.sol`: Manages trading pairs, groups, and fee structures within the system.
- `FeeTiersUtils.sol`: Handles fee tier calculations based on trader activity.

### Utilities and Libraries

- `StorageUtils.sol`: Provides constants for storage slots used by external libraries.
- `CollateralUtils.sol`: Contains utility functions related to collateral management.
- `PackingUtils.sol`: Offers functions for packing and unpacking data into storage-efficient formats.

### Interfaces

- `ITizzTradingStorage.sol`: Interface for the trading storage contract.
- `Imsw.sol`: Interface for interacting with external systems like NFTs.
- `ITToken.sol`: Interface for TToken operations.

### Miscellaneous

- `VotingDelegator.sol`: Allows delegation of voting power.
- `Delegatable.sol`: Abstract contract enabling delegation of contract calls.
- `ChainlinkClient.sol`: Facilitates interaction with Chainlink oracles.
- `IArbSys.sol`: Interface for interacting with Arbitrum-specific system functions.

## Key Functionalities

### Trade Execution and Management

- Trade validation against system constraints.
- Price impact calculation and management.
- Fee accrual and borrowing fee updates.

### Referral Rewards

- Calculation of referral fees based on trade volume.
- Distribution of rewards to allies and referrers.
- Management of active allies and referrers.

### NFT Metadata Generation

- Creation of token URIs for NFTs with locked deposits.
- SVG image generation for NFT visualization.

### Price Aggregation

- Fetching and calculating TWAP from Uniswap V3 pools.
- Adjusting price data based on predefined intervals.

### Pairs and Fees Configuration

- Addition and updating of trading pairs and groups.
- Fee tier adjustments based on trading activity.

### Data Packing

- Efficient storage of multiple values within a single storage slot.

### Delegation

- Delegation of contract calls and voting power to other addresses.

### Oracle Interaction

- Requesting and receiving data from Chainlink oracles.

### Arbitrum Integration

- Utilizing Arbitrum-specific features like block number retrieval.

## Security Considerations

The contracts employ various security measures such as role-based access control, input validation, and reentrancy guards. It is crucial to thoroughly test and audit all smart contracts before deploying them to a production environment to ensure the security and integrity of the system.

## Development and Deployment

The contracts are designed with upgradeability in mind, using proxies and the OpenZeppelin upgradeable contracts framework. This allows for future improvements and fixes to be deployed without disrupting the existing ecosystem.

## Conclusion

The Tizz Protocol's smart contract system provides a robust foundation for trading, referrals, NFTs, and price aggregation within the DeFi space. The modular design and comprehensive feature set enable a wide range of functionalities while maintaining security and upgradeability.
