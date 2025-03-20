# Tizz-Liq-Bot
- Handles closing trades by liquiditation.
  
## Notes Liquidation Prices

Trades liquidation prices can get closer over time if you pay borrowing fees.

Liquidation Price Distance = Open Price * (Collateral * 0.9 - Borrowing Fees) / Collateral / Leverage.

Liquidation price = 
If Long: Open Price - Liquidation Price Distance
Else (Short): Open Price + Liquidation Price Distance.

For example, let's say that you have opened a long on BTC/USD at 20,000 USD using 100x leverage and 50 DAI collateral, and that you have paid 1 DAI in borrowing fees:

Liquidation Price = 20,000 - 20,000 * (50 * 0.9 - 1) / 50 / 100 = 19,824 USD.
