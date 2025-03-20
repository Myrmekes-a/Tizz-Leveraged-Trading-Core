// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Initializable} from "../external/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeERC20} from "../external/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/ITizzTradingStorage.sol";
import "../interfaces/IWBTC.sol";
import "../interfaces/IPausable.sol";
import {Utils} from "../commonLib/Utils.sol";
import "../libraries/ChainUtils.sol";

import "../libraries/ChainUtils.sol";
import "../misc/VotingDelegator.sol";

/**
 * @custom:version 7
 */
contract TizzTradingStorage is Initializable, VotingDelegator {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant PRECISION = 1e10;
    bytes32 public constant MINTER_ROLE =
        0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6;
    /// @notice Collateral that users use for trading. BTC(native), WBTC, USDT (pUSD, FRAX later)
    address public baseAsset;

    // Contracts (updatable)
    ITizzPriceAggregator public priceAggregator;
    address public callbacks;
    address public token;
    address public vault;

    mapping(uint256 => ITizzTradingStorage.PerpsTrade) public perpsTrades;

    // Trading variables
    uint256 public tokenOracleId;
    uint256 public maxTradesPerPair;

    // Gov & dev addresses (updatable)
    address public gov;
    bool public isNative;

    // Trades mappings
    mapping(address => mapping(uint256 => mapping(uint256 => Trade)))
        public openTrades;
    mapping(address => mapping(uint256 => mapping(uint256 => TradeInfo)))
        public openTradesInfo;
    mapping(address => mapping(uint256 => uint256)) public openTradesCount;

    // Limit orders mappings
    mapping(address => mapping(uint256 => mapping(uint256 => uint256)))
        public openLimitOrderIds;
    mapping(address => mapping(uint256 => uint256)) public openLimitOrdersCount;
    OpenLimitOrder[] public openLimitOrders;

    // List of open trades & limit orders
    mapping(uint256 => address[]) public pairTraders;
    mapping(address => mapping(uint256 => uint256)) public pairTradersId;

    // Current and max open interests for each pair
    mapping(uint256 => uint256[2]) public openInterestBaseAsset; /// 1e18 | 1e6 [long,short]

    // List of allowed contracts => can update storage + mint/burn tokens
    mapping(address => bool) public isTradingContract;

    mapping(address => mapping(uint256 => mapping(uint256 => ITizzTradingStorage.OpenLimitOrderType)))
        public openLimitOrderTypes;

    enum LimitOrder {
        TP,
        SL,
        LIQ,
        OPEN
    }
    struct Trade {
        address trader;
        uint256 pairIndex;
        uint256 index;
        uint256 initialPosToken; // 1e18
        uint256 positionSizeBaseAsset; // 1e18 | 1e6
        uint256 openPrice; // PRECISION
        bool buy;
        uint256 leverage;
        uint256 tp; // PRECISION
        uint256 sl; // PRECISION
    }
    struct TradeInfo {
        uint256 tokenPriceBaseAsset; // PRECISION
        uint256 openInterestBaseAsset; // 1e18 | 1e6
        uint256 tpLastUpdated;
        uint256 slLastUpdated;
        bool beingMarketClosed;
    }
    struct OrderTradeInfo {
        uint256 leverage;
        uint256 tp; // PRECISION (%)
        uint256 sl; // PRECISION (%)
        uint256 minPrice; // PRECISION
        uint256 maxPrice; // PRECISION
        uint256 block;
    }

    struct OpenLimitOrder {
        address trader;
        uint256 pairIndex;
        uint256 index;
        uint256 positionSize; // 1e18 | 1e6
        bool buy;
        OrderTradeInfo orderTradeInfo;
    }
    struct PendingMarketOrder {
        Trade trade;
        uint256 block;
        uint256 wantedPrice; // PRECISION
        uint256 slippageP; // PRECISION (%)
        uint256 spreadReductionP;
    }
    struct PendingNftOrder {
        address nftHolder;
        uint256 nftId;
        address trader;
        uint256 pairIndex;
        uint256 index;
        LimitOrder orderType;
    }

    // Events
    event TradingContractAdded(address a);
    event TradingContractRemoved(address a);
    event AddressUpdated(string name, address a);
    event NumberUpdated(string name, uint256 value);
    event NumberUpdatedPair(string name, uint256 pairIndex, uint256 value);
    event OpenLimitOrderTypeSet(
        address trader,
        uint256 pairIndex,
        uint256 index,
        ITizzTradingStorage.OpenLimitOrderType value
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _baseAsset,
        address _token,
        address _gov,
        uint256 _tokenOracleId,
        bool _isNative
    ) external initializer {
        require(
            _baseAsset != address(0) &&
                address(_token) != address(0) &&
                _gov != address(0),
            "WRONG_PARAMS"
        );

        baseAsset = _baseAsset;
        token = _token;
        gov = _gov;
        tokenOracleId = _tokenOracleId;
        isNative = _isNative;

        maxTradesPerPair = 3;
    }

    // Modifiers
    modifier onlyGov() {
        require(msg.sender == gov);
        _;
    }

    modifier onlyTrading() {
        require(
            isTradingContract[msg.sender] &&
                IERC20(token).hasRole(MINTER_ROLE, msg.sender)
        );
        _;
    }

    // Manage addresses

    function setTokenOracleId(uint256 _oracleId) external onlyGov {
        tokenOracleId = _oracleId;
    }

    function setGov(address _gov) external onlyGov {
        require(_gov != address(0));
        gov = _gov;
        emit AddressUpdated("gov", _gov);
    }

    function setDelegatee(address _delegatee) external onlyGov {
        require(_delegatee != address(0), "ADDRESS_0");

        _tryDelegate(baseAsset, _delegatee);
    }

    // Trading + callbacks contracts
    function addTradingContract(address _trading) external onlyGov {
        require(IERC20(token).hasRole(MINTER_ROLE, _trading), "NOT_MINTER");
        require(_trading != address(0));
        isTradingContract[_trading] = true;
        emit TradingContractAdded(_trading);
    }

    function removeTradingContract(address _trading) external onlyGov {
        require(_trading != address(0));
        isTradingContract[_trading] = false;
        emit TradingContractRemoved(_trading);
    }

    function setPriceAggregator(address _aggregator) external onlyGov {
        require(_aggregator != address(0));
        priceAggregator = ITizzPriceAggregator(_aggregator);
        emit AddressUpdated("priceAggregator", _aggregator);
    }

    function setVault(address _vault) external onlyGov {
        require(_vault != address(0));
        vault = _vault;
        emit AddressUpdated("vault", _vault);
    }

    function setCallbacks(address _callbacks) external onlyGov {
        require(_callbacks != address(0));
        callbacks = _callbacks;
        emit AddressUpdated("callbacks", _callbacks);
    }

    // Manage trading variables
    function setMaxTradesPerPair(uint256 _maxTradesPerPair) external onlyGov {
        require(_maxTradesPerPair > 0);
        maxTradesPerPair = _maxTradesPerPair;
        emit NumberUpdated("maxTradesPerPair", _maxTradesPerPair);
    }

    // Manage stored trades
    function setOpenLimitOrderType(
        address _trader,
        uint256 _pairIndex,
        uint256 _index,
        ITizzTradingStorage.OpenLimitOrderType _type
    ) external onlyTrading {
        openLimitOrderTypes[_trader][_pairIndex][_index] = _type;

        emit OpenLimitOrderTypeSet(_trader, _pairIndex, _index, _type);
    }

    function storeTrade(
        Trade memory _trade,
        TradeInfo memory _tradeInfo
    ) external onlyTrading {
        _trade.index = firstEmptyTradeIndex(_trade.trader, _trade.pairIndex);
        openTrades[_trade.trader][_trade.pairIndex][_trade.index] = _trade;

        openTradesCount[_trade.trader][_trade.pairIndex]++;
        perpsTrades[_trade.pairIndex].openPrice += _trade.openPrice;
        perpsTrades[_trade.pairIndex].openCount++;

        if (openTradesCount[_trade.trader][_trade.pairIndex] == 1) {
            pairTradersId[_trade.trader][_trade.pairIndex] = pairTraders[
                _trade.pairIndex
            ].length;
            pairTraders[_trade.pairIndex].push(_trade.trader);
        }

        _tradeInfo.beingMarketClosed = false;
        openTradesInfo[_trade.trader][_trade.pairIndex][
            _trade.index
        ] = _tradeInfo;

        updateOpenInterestBaseAsset(
            _trade.pairIndex,
            _tradeInfo.openInterestBaseAsset,
            true,
            _trade.buy
        );
    }

    function unregisterTrade(
        address trader,
        uint256 pairIndex,
        uint256 index
    ) external onlyTrading {
        Trade storage t = openTrades[trader][pairIndex][index];
        TradeInfo storage i = openTradesInfo[trader][pairIndex][index];
        if (t.leverage == 0) {
            return;
        }

        updateOpenInterestBaseAsset(
            pairIndex,
            i.openInterestBaseAsset,
            false,
            t.buy
        );

        if (openTradesCount[trader][pairIndex] == 1) {
            uint256 _pairTradersId = pairTradersId[trader][pairIndex];
            address[] storage p = pairTraders[pairIndex];

            p[_pairTradersId] = p[p.length - 1];
            pairTradersId[p[_pairTradersId]][pairIndex] = _pairTradersId;

            delete pairTradersId[trader][pairIndex];
            p.pop();
        }

        delete openTrades[trader][pairIndex][index];
        delete openTradesInfo[trader][pairIndex][index];

        openTradesCount[trader][pairIndex]--;
    }

    // Manage open interest
    function updateOpenInterestBaseAsset(
        uint256 _pairIndex,
        uint256 _leveragedPosBaseAsset,
        bool _open,
        bool _long
    ) private {
        uint256 index = _long ? 0 : 1;
        uint256[2] storage o = openInterestBaseAsset[_pairIndex];
        o[index] = _open
            ? o[index] + _leveragedPosBaseAsset
            : o[index] - _leveragedPosBaseAsset;
    }

    // Manage open limit orders
    function storeOpenLimitOrder(OpenLimitOrder memory o) external onlyTrading {
        o.index = firstEmptyOpenLimitIndex(o.trader, o.pairIndex);
        o.orderTradeInfo.block = ChainUtils.getBlockNumber();
        openLimitOrders.push(o);
        openLimitOrderIds[o.trader][o.pairIndex][o.index] =
            openLimitOrders.length -
            1;
        openLimitOrdersCount[o.trader][o.pairIndex]++;
    }

    function updateOpenLimitOrder(
        OpenLimitOrder calldata _o
    ) external onlyTrading {
        if (!hasOpenLimitOrder(_o.trader, _o.pairIndex, _o.index)) {
            return;
        }
        OpenLimitOrder storage o = openLimitOrders[
            openLimitOrderIds[_o.trader][_o.pairIndex][_o.index]
        ];
        o.positionSize = _o.positionSize;
        o.buy = _o.buy;
        o.orderTradeInfo.leverage = _o.orderTradeInfo.leverage;
        o.orderTradeInfo.tp = _o.orderTradeInfo.tp;
        o.orderTradeInfo.sl = _o.orderTradeInfo.sl;
        o.orderTradeInfo.minPrice = _o.orderTradeInfo.minPrice;
        o.orderTradeInfo.maxPrice = _o.orderTradeInfo.maxPrice;
        o.orderTradeInfo.block = ChainUtils.getBlockNumber();
    }

    function unregisterOpenLimitOrder(
        address _trader,
        uint256 _pairIndex,
        uint256 _index
    ) external onlyTrading {
        if (!hasOpenLimitOrder(_trader, _pairIndex, _index)) {
            return;
        }

        // Copy last order to deleted order => update id of this limit order
        uint256 id = openLimitOrderIds[_trader][_pairIndex][_index];
        openLimitOrders[id] = openLimitOrders[openLimitOrders.length - 1];
        openLimitOrderIds[openLimitOrders[id].trader][
            openLimitOrders[id].pairIndex
        ][openLimitOrders[id].index] = id;

        // Remove
        delete openLimitOrderIds[_trader][_pairIndex][_index];
        openLimitOrders.pop();

        openLimitOrdersCount[_trader][_pairIndex]--;
    }

    // Manage open trade
    function updateSl(
        address _trader,
        uint256 _pairIndex,
        uint256 _index,
        uint256 _newSl
    ) external onlyTrading {
        Trade storage t = openTrades[_trader][_pairIndex][_index];
        TradeInfo storage i = openTradesInfo[_trader][_pairIndex][_index];
        if (t.leverage == 0) {
            return;
        }
        t.sl = _newSl;
        i.slLastUpdated = ChainUtils.getBlockNumber();
    }

    function updateTp(
        address _trader,
        uint256 _pairIndex,
        uint256 _index,
        uint256 _newTp
    ) external onlyTrading {
        Trade storage t = openTrades[_trader][_pairIndex][_index];
        TradeInfo storage i = openTradesInfo[_trader][_pairIndex][_index];
        if (t.leverage == 0) {
            return;
        }
        t.tp = _newTp;
        i.tpLastUpdated = ChainUtils.getBlockNumber();
    }

    function updateTrade(Trade memory _t) external onlyTrading {
        // useful when partial adding/closing
        Trade storage t = openTrades[_t.trader][_t.pairIndex][_t.index];
        if (t.leverage == 0) {
            return;
        }
        t.initialPosToken = _t.initialPosToken;
        t.positionSizeBaseAsset = _t.positionSizeBaseAsset;
        t.openPrice = _t.openPrice;
        t.leverage = _t.leverage;
    }

    // Manage tokens
    function transferBaseAsset(
        address _from,
        address _to,
        uint256 _amount
    ) external onlyTrading returns (uint256) {
        uint256 transferredAmount = _amount;
        if (isNative && !_isContract(_to)) {
            if (_from != address(this)) {
                IERC20(baseAsset).safeTransferFrom(
                    _from,
                    address(this),
                    _amount
                );
            }
            IWBTC(baseAsset).withdraw(_amount);
            _transferETH(_to, _amount);
        } else {
            if (_from == address(this)) {
                transferredAmount = Utils.transfer(baseAsset, _to, _amount);
            } else {
                transferredAmount = Utils.transferFrom(
                    baseAsset,
                    _from,
                    _to,
                    _amount
                );
            }
        }

        return transferredAmount;
    }

    function _transferETH(address _to, uint256 _amount) internal {
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Transfer Failed");
    }

    function _isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    // View utils functions
    function firstEmptyTradeIndex(
        address trader,
        uint256 pairIndex
    ) public view returns (uint256 index) {
        for (uint256 i = 0; i < maxTradesPerPair; ++i) {
            if (openTrades[trader][pairIndex][i].leverage == 0) {
                index = i;
                break;
            }
        }
    }

    function firstEmptyOpenLimitIndex(
        address trader,
        uint256 pairIndex
    ) public view returns (uint256 index) {
        for (uint256 i = 0; i < maxTradesPerPair; ++i) {
            if (!hasOpenLimitOrder(trader, pairIndex, i)) {
                index = i;
                break;
            }
        }
    }

    function hasOpenLimitOrder(
        address trader,
        uint256 pairIndex,
        uint256 index
    ) public view returns (bool) {
        if (openLimitOrders.length == 0) {
            return false;
        }
        OpenLimitOrder storage o = openLimitOrders[
            openLimitOrderIds[trader][pairIndex][index]
        ];
        return
            o.trader == trader && o.pairIndex == pairIndex && o.index == index;
    }

    // Additional getters
    function pairTradersArray(
        uint256 _pairIndex
    ) external view returns (address[] memory) {
        return pairTraders[_pairIndex];
    }

    function getOpenLimitOrder(
        address _trader,
        uint256 _pairIndex,
        uint256 _index
    ) external view returns (OpenLimitOrder memory) {
        require(hasOpenLimitOrder(_trader, _pairIndex, _index));
        return openLimitOrders[openLimitOrderIds[_trader][_pairIndex][_index]];
    }

    function getOpenLimitOrders()
        external
        view
        returns (OpenLimitOrder[] memory)
    {
        return openLimitOrders;
    }

    function getPersPrice(uint256 pairIndex) external view returns (uint256) {
        ITizzTradingStorage.PerpsTrade memory info = perpsTrades[pairIndex];
        return info.openCount == 0 ? 0 : info.openPrice / info.openCount;
    }

    receive() external payable {}
}
