// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

// import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISupraOraclePull.sol";
import "./interfaces/ISupraSValueFeed.sol";
import "./SupraStructs.sol";

// Mock contract which can consume oracle pull data
contract SupraOracleClient {
    /// @notice The oracle contract
    ISupraOraclePull public supra_pull;
    ISupraSValueFeed public supra_storage;
    uint256 public dPrice;
    uint256 public dDecimal;
    int256 public dRound;
    uint256 public PRICE_PRECISION;

    // Event emitted when a pair price is received
    event PairPrice(uint256 pair, uint256 price, uint256 decimals);

    constructor() {}

    function __initSupraOracle(
        ISupraOraclePull oracle_,
        ISupraSValueFeed storage_
    ) internal {
        supra_pull = oracle_;
        supra_storage = storage_;
        PRICE_PRECISION = 10;
    }

    function GetPairPrices(
        bytes calldata _bytesProof,
        uint256[] memory _pairs
    ) public returns (int256[] memory) {
        uint256 length = _pairs.length;
        uint256 pairId = 0;
        int256[] memory pairPrices = new int256[](length);
        SupraStructs.PriceData memory prices = supra_pull.verifyOracleProof(
            _bytesProof
        );

        for (pairId = 0; pairId < length; ) {
            for (uint256 i = 0; i < length; i++) {
                if (prices.pairs[i] == pairId) {
                    pairPrices[pairId++] = int256(prices.prices[i]);
                    break;
                }
            }
        }

        return pairPrices;
    }

    // Verify price updates recieved with Supra pull contract
    function GetPairPrice(
        bytes calldata _bytesProof,
        uint256 pair
    ) public virtual returns (uint256) {
        SupraStructs.PriceData memory prices = supra_pull.verifyOracleProof(
            _bytesProof
        );
        uint256 price = 0;
        uint256 decimals = 0;
        uint256 length = prices.pairs.length;
        for (uint256 i = 0; i < length; i++) {
            if (prices.pairs[i] == pair) {
                price = prices.prices[i];
                decimals = prices.decimals[i];
                break;
            }
        }
        if (price == 0) {
            return 0;
        } else {
            return _getPairPriceUsd(price, decimals);
        }
    }

    //  Get the Derived Pair Price using two pair from oracle data
    // Input parameter for "Operation" would be,  Multiplication=0 and Division=1

    function GetDerivedPairPrice(
        bytes calldata _bytesProof,
        uint256 pair_id_1,
        uint256 pair_id_2,
        uint256 operation
    ) external {
        supra_pull.verifyOracleProof(_bytesProof);
        SupraStructs.derivedData memory dp = ISupraSValueFeed(supra_storage)
            .getDerivedSvalue(pair_id_1, pair_id_2, operation);
        dPrice = dp.derivedPrice;
        dDecimal = dp.decimals;
        dRound = dp.roundDifference;
    }

    /// @notice Requesting s-value for a single pair.
    function getPrice(
        uint256 _pairId
    ) public view returns (SupraStructs.priceFeed memory) {
        return ISupraSValueFeed(supra_storage).getSvalue(_pairId);
    }

    // Returns usd price. (1e10)
    function getPriceUsd(uint256 _pairId) public view returns (uint256) {
        SupraStructs.priceFeed memory priceFeed = ISupraSValueFeed(
            supra_storage
        ).getSvalue(_pairId);
        return _getPairPriceUsd(priceFeed.price, priceFeed.decimals);
    }

    /// @notice Requesting s-values for multiple pairs.
    function getPriceForMultiplePair(
        uint256[] memory _pairIds
    ) external view returns (SupraStructs.priceFeed[] memory) {
        return ISupraSValueFeed(supra_storage).getSvalues(_pairIds);
    }

    function updatePullAddress(ISupraOraclePull oracle_) external virtual {
        supra_pull = oracle_;
    }

    function updateStorageAddress(ISupraSValueFeed storage_) external virtual {
        supra_storage = storage_;
    }

    // Normalize price value to 10 decimals. (1e10)
    function _getPairPriceUsd(
        uint256 _price,
        uint256 _decimals
    ) internal view returns (uint256 priceUsd) {
        if (PRICE_PRECISION < _decimals) {
            priceUsd = _price / 10 ** (_decimals - PRICE_PRECISION);
        } else {
            priceUsd = _price * 10 ** (PRICE_PRECISION - _decimals);
        }
    }

    function _checkZero(address _value) internal pure {
        require(_value != address(0), "VALUE_0");
    }
}
