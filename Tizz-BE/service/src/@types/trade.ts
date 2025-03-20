export enum TRADE_EVENT {
    // events for open limit order
    OPEN_LIMIT_PLACED = "OpenLimitPlaced",
    OPEN_LIMIT_UPDATED = "OpenLimitUpdated",
    OPEN_LIMIT_CANCELED = "OpenLimitCanceled",

    // events for update
    TP_UPDATED = "TpUpdated",
    SL_UPDATED = "SlUpdated",
    SL_CANCELED = "SlCanceled",

    // events for order execution
    MARKET_EXECUTED = "MarketExecuted",
    LIMIT_EXECUTED = "LimitExecuted",

    //
    MARKET_CLOSE_CANCELED = "MarketCloseCanceled",

    // Price impact events - multicollat contract events
    PRICE_IMPACT_OPEN_INTEREST_ADDED = "PriceImpactOpenInterestAdded",
    PRICE_IMPACT_OPEN_INTEREST_REMOVED = "PriceImpactOpenInterestRemoved",
    PRICE_IMPACT_OI_TRANSFERRED_PAIRS = "PriceImpactOiTransferredPairs",
    PRICE_IMPACT_WINDOWS_DURATION_UPDATED = "PriceImpactWindowsDurationUpdated",
    PRICE_IMPACT_WINDOWS_COUNT_UPDATED = "PriceImpactWindowsCountUpdated",
    PAIR_CUSTOM_MAX_LEVERAGE_UPDATED = "PairCustomMaxLeverageUpdated",

    // borrowing fees events
    PAIR_ACC_FEES_UPDATED = "PairAccFeesUpdated",
    GROUP_ACC_FEES_UPDATED = "GroupAccFeesUpdated",
    GROUP_OI_UPDATED = "GroupOiUpdated",
    PAIR_PARAMS_UPDATED = "PairParamsUpdated",


    MARKET_ORDER_INITIATED = "MarketOrderInitiated",
    MARKET_OPEN_CANCELED = "MarketOpenCanceled"
}