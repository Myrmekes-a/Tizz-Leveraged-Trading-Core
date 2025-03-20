# Tizz BE API Server

## API Endpoints

### Current Prices

`/price`

Response e.g.

```
{
  "BTC/USD": {
    "price":"7210300000000",
    "decimal":8,
    "pairIndex":0,
    "timestamp":1710250574
  },
  "ETH/USD":{
    "price":"403460016853",
    "decimal":8,
    "pairIndex":1,
    "timestamp":1710250570
  }
}
```

### Trading Variables

`/pair/trading-variables` \
Response e.g. \
`./api/src/services/pairs/default.ts`

### Chart History

`/charts/:pairIndex/:start/:end/:range`

    <:start>, <:end>: timestamp
    <:range>: period of a candle
      1(1min), 5(5mins), 15(30mins), 60(1hr), 120(2hrs)

### Trades

POST `/trades` \
Req Body e.g.
```
{
  "addresses": ["address1", "address2],
  "start": 1685332900000, // timestamp
  "end": 1697332900000
}
```
Res e.g.
```
{
    "data": [
        {
            "_id": "66049d8589261b7e79870bab",
            "trader": "0xF7bBA0C4D438589d2adA5DaFAC116C0544f7FDD8",
            "block": 37103279,
            "__v": 0,
            "action": "TradeOpenedMarket",
            "buy": 1,
            "collateralPriceUsd": 0,
            "leverage": 2,
            "pair": "BTC/USD",
            "pnl": 0,
            "price": 28879.036996,
            "size": 2430.1056,
            "timestamp": "2023-06-21T07:35:43.000Z",
            "tx": ""
        },
        {
            "_id": "66049d8589261b7e79870baf",
            "block": 37136542,
            "trader": "0xF7bBA0C4D438589d2adA5DaFAC116C0544f7FDD8",
            "__v": 0,
            "action": "TradeOpenedMarket",
            "buy": 1,
            "collateralPriceUsd": 0,
            "leverage": 2,
            "pair": "BTC/USD",
            "pnl": 0,
            "price": 30343.687622,
            "size": 1043.328,
            "timestamp": "2023-06-22T05:04:50.000Z",
            "tx": ""
        },
        {
            "_id": "66049d8589261b7e79870bb5",
            "trader": "0x904777d0788A014074e8A1f9693A4e60ecC0DeCE",
            "block": 36670023,
            "__v": 0,
            "action": "TradeOpenedMarket",
            "buy": 1,
            "collateralPriceUsd": 0,
            "leverage": 2,
            "pair": "BTC/USD",
            "pnl": 0,
            "price": 25729.597724,
            "size": 4992.000000000001,
            "timestamp": "2023-06-10T08:41:32.000Z",
            "tx": ""
        },
        {
            "_id": "66049d8589261b7e79870dcf",
            "trader": "0x904777d0788A014074e8A1f9693A4e60ecC0DeCE",
            "block": 36875103,
            "__v": 0,
            "action": "TradeOpenedMarket",
            "buy": 1,
            "collateralPriceUsd": 0,
            "leverage": 2,
            "pair": "BTC/USD",
            "pnl": 0,
            "price": 24968.78352,
            "size": 2495.9999999999995,
            "timestamp": "2023-06-15T10:29:56.000Z",
            "tx": ""
        }
    ]
}
```

POST `/trades/winner` \
Req Body e.g.
```
{
  "addresses": ["address1", "address2],
  "start": 1685332900000, // timestamp
  "end": 1697332900000
}
```
Res e.g.
```
{
    "data": {
        "0xF7bBA0C4D438589d2adA5DaFAC116C0544f7FDD8": {
            "address": "0xF7bBA0C4D438589d2adA5DaFAC116C0544f7FDD8",
            "tradeCount": 2,
            "wins": 0,
            "pnl": 0,
            "volume": 3473.4336
        },
        "0x904777d0788A014074e8A1f9693A4e60ecC0DeCE": {
            "address": "0x904777d0788A014074e8A1f9693A4e60ecC0DeCE",
            "tradeCount": 2,
            "wins": 0,
            "pnl": 0,
            "volume": 7488
        }
    }
}
```

## WS Endpoints

### Live Updated Trading Variables

`trading-variables`

Msg e.g. \
`./api/src/services/pairs/default.ts`

### Live Price Changes

`current-prices`

Msg e.g. \
Same as API Endpoint
