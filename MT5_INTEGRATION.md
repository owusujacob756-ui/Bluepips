# MetaTrader 5 Integration Guide

## Overview

This comprehensive MT5 integration enables Bluepips to execute real trades on MetaTrader 5 accounts with major forex brokers. The system combines automated signal analysis with real-time order execution.

## Features

### ✅ Supported Features
- **Multiple Account Support**: Connect and manage multiple MT5 accounts
- **Real Account Trading**: Live trading with real capital
- **Automated Signal Execution**: Automatically execute trades based on analysis signals
- **Position Management**: Trailing stops, take profit, stop loss automation
- **Order Types**: Market orders, pending orders (buy/sell limit and stop)
- **Risk Management**: Automatic position sizing based on risk percentage
- **Performance Tracking**: Real-time P&L tracking and performance analytics
- **Bot Control**: Start/stop automated trading with configurable parameters
- **Multi-Broker Support**: IC Markets, Exness, Pepperstone, FxPro

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Bluepips Core                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Analysis Engine → Trading Signals → MT5 Execution   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────────┐      ┌────▼──────────┐
    │ MT5 Module │      │ Trading Bot   │
    │ - Accounts │      │ - Automation  │
    │ - Orders   │      │ - Management  │
    │ - Sync     │      │ - Stats       │
    └───┬────────┘      └────┬──────────┘
        │                    │
        └────────┬───────────┘
                 │
        ┌────────▼──────────┐
        │  Database (SQL)   │
        │  - mt5_accounts   │
        │  - mt5_orders     │
        │  - mt5_performance│
        └───────┬───────────┘
                │
        ┌───────▼──────────┐
        │  Broker APIs     │
        │ (REST/WebSocket) │
        └──────────────────┘
```

## Database Schema

### Tables Created

1. **mt5_accounts** - Connected MT5 accounts
2. **mt5_orders** - Order history and status
3. **mt5_performance** - Performance metrics
4. **mt5_connection_logs** - Connection events
5. **mt5_bot_status** - Bot runtime status
6. **mt5_bot_settings** - Bot configuration
7. **mt5_bot_events** - Bot activity log
8. **mt5_bot_errors** - Bot error tracking

### Initialize Database

```bash
# Apply the MT5 schema to your database
psql -U your_user -d your_db -f database/mt5_schema.sql
```

## API Endpoints

### Account Management

#### Register MT5 Account
```
POST /api/mt5/accounts

Body:
{
  "accountLogin": "12345678",
  "accountPassword": "password",
  "brokerName": "ICMarkets",    // ICMarkets | Exness | Pepperstone | FxPro
  "accountType": "demo",         // demo | live
  "accountBalance": 10000
}

Response:
{
  "account": {
    "id": 1,
    "account_login": "12345678",
    "broker_name": "ICMarkets",
    "account_type": "demo",
    "status": "pending"
  }
}
```

#### Get All Accounts
```
GET /api/mt5/accounts

Response:
{
  "accounts": [
    {
      "id": 1,
      "account_login": "12345678",
      "broker_name": "ICMarkets",
      "account_balance": 10000,
      "status": "connected"
    }
  ]
}
```

#### Get Account Details
```
GET /api/mt5/accounts/{accountId}

Response:
{
  "account": {
    "accountLogin": "12345678",
    "broker": "ICMarkets",
    "balance": 10000,
    "equity": 10500,
    "marginUsed": 2000,
    "marginFree": 8000,
    "marginLevel": 525,
    "leverage": 500
  }
}
```

#### Sync Account Orders
```
POST /api/mt5/accounts/{accountId}/sync

Response:
{
  "result": {
    "synced": 5,
    "orders": [...]
  }
}
```

### Order Management

#### Place Market Order
```
POST /api/mt5/accounts/{accountId}/orders

Body:
{
  "orderType": "buy",              // buy | sell
  "symbol": "EURUSD",
  "volume": 0.5,
  "stopLoss": 1.0950,
  "takeProfit": 1.1050,
  "comment": "Signal: EURUSD BUY"
}

Response:
{
  "order": {
    "id": 1,
    "orderId": "123456",
    "symbol": "EURUSD",
    "orderType": "buy",
    "volume": 0.5,
    "status": "open",
    "openTime": "2024-01-29T10:30:00Z"
  }
}
```

#### Place Pending Order
```
POST /api/mt5/accounts/{accountId}/orders

Body:
{
  "orderType": "buylimit",         // buylimit | selllimit | buystop | sellstop
  "symbol": "GBPUSD",
  "volume": 1.0,
  "openPrice": 1.2500,             // Entry price
  "stopLoss": 1.2450,
  "takeProfit": 1.2600,
  "comment": "Limit order"
}
```

#### Modify Order
```
PUT /api/mt5/accounts/{accountId}/orders/{orderId}

Body:
{
  "stopLoss": 1.0950,
  "takeProfit": 1.1050,
  "openPrice": 1.0990
}

Response:
{
  "result": {
    "success": true,
    "orderId": "123456"
  }
}
```

#### Close Order
```
DELETE /api/mt5/accounts/{accountId}/orders/{orderId}

Body:
{
  "closePrice": 1.1020,
  "comment": "Closing position"
}

Response:
{
  "result": {
    "orderId": "123456",
    "status": "closed",
    "closePrice": 1.1020,
    "closeTime": "2024-01-29T11:30:00Z"
  }
}
```

#### Get Order History
```
GET /api/mt5/accounts/{accountId}/orders?symbol=EURUSD&status=closed&limit=50

Response:
{
  "orders": [
    {
      "id": 1,
      "symbol": "EURUSD",
      "orderType": "buy",
      "volume": 0.5,
      "openPrice": 1.1000,
      "closePrice": 1.1050,
      "profitLoss": 25,
      "status": "closed"
    }
  ]
}
```

### Automated Trading Bot

#### Start Bot
```
POST /api/mt5/accounts/{accountId}/bot

Body:
{
  "action": "start"
}

Response:
{
  "message": "Bot started",
  "status": "running"
}
```

#### Stop Bot
```
POST /api/mt5/accounts/{accountId}/bot

Body:
{
  "action": "stop"
}

Response:
{
  "message": "Bot stopped",
  "status": "stopped"
}
```

#### Update Bot Configuration
```
POST /api/mt5/accounts/{accountId}/bot

Body:
{
  "action": "updateConfig",
  "config": {
    "trailingStopEnabled": true,
    "trailingStopDistance": 50,      // in pips
    "maxConcurrentTrades": 5,
    "riskPercentage": 2
  }
}

Response:
{
  "message": "Config updated"
}
```

#### Get Bot Status
```
GET /api/mt5/accounts/{accountId}/bot

Response:
{
  "bot": {
    "accountId": 1,
    "status": "running",
    "startedAt": "2024-01-29T10:00:00Z",
    "lastActivity": "2024-01-29T11:30:00Z"
  }
}
```

#### Get Bot Performance Stats
```
GET /api/mt5/accounts/{accountId}/bot/stats

Response:
{
  "stats": {
    "totalTrades": 45,
    "winningTrades": 28,
    "losingTrades": 17,
    "totalProfit": 1250.50,
    "averageProfit": 27.80,
    "bestTrade": 150.25,
    "worstTrade": -75.50,
    "winRate": 62.22
  },
  "recentEvents": [
    {
      "eventType": "signal_executed",
      "symbol": "EURUSD",
      "createdAt": "2024-01-29T11:25:00Z"
    }
  ]
}
```

### Execute Signal
```
POST /api/mt5/accounts/{accountId}/execute-signal

Body:
{
  "signalData": {
    "symbol": "EURUSD",
    "direction": "BUY",
    "entryPrice": 1.1000,
    "stopLoss": 1.0950,
    "takeProfit": 1.1050,
    "confidence": 85
  },
  "riskPercentage": 2,
  "maxLeverage": 10
}

Response:
{
  "order": {
    "id": 1,
    "orderId": "123456",
    "symbol": "EURUSD",
    "volume": 0.5,
    "status": "open"
  }
}
```

## Usage Examples

### JavaScript/TypeScript

```javascript
// Connect MT5 Account
async function connectAccount() {
  const response = await fetch('/api/mt5/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountLogin: '12345678',
      accountPassword: 'password',
      brokerName: 'ICMarkets',
      accountType: 'demo',
      accountBalance: 10000
    })
  });
  return response.json();
}

// Get Account Info
async function getAccountInfo(accountId) {
  const response = await fetch(`/api/mt5/accounts/${accountId}`);
  return response.json();
}

// Place Buy Order
async function placeBuyOrder(accountId) {
  const response = await fetch(`/api/mt5/accounts/${accountId}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderType: 'buy',
      symbol: 'EURUSD',
      volume: 0.5,
      stopLoss: 1.0950,
      takeProfit: 1.1050,
      comment: 'Manual trade'
    })
  });
  return response.json();
}

// Start Trading Bot
async function startTradingBot(accountId) {
  const response = await fetch(`/api/mt5/accounts/${accountId}/bot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'start'
    })
  });
  return response.json();
}

// Get Bot Stats
async function getBotStats(accountId) {
  const response = await fetch(`/api/mt5/accounts/${accountId}/bot/stats`);
  return response.json();
}
```

## Supported Brokers

### IC Markets
- **Website**: https://www.icmarkets.com/
- **Max Leverage**: 500:1
- **Spread Type**: Variable
- **Supported Symbols**: EURUSD, GBPUSD, USDJPY, AUDUSD, NZDUSD, USDCAD, USDCHF, XAUUSD

### Exness
- **Website**: https://www.exness.com/
- **Max Leverage**: 1000:1
- **Spread Type**: Variable
- **Supported Symbols**: EURUSD, GBPUSD, USDJPY, AUDUSD, NZDUSD, USDCAD, USDCHF, XAUUSD, XAGUSD

### Pepperstone
- **Website**: https://www.pepperstone.com/
- **Max Leverage**: 500:1
- **Spread Type**: Fixed
- **Supported Symbols**: EURUSD, GBPUSD, USDJPY, AUDUSD, NZDUSD, USDCAD, USDCHF, XAUUSD, XAGUSD, BTCUSD

### FxPro
- **Website**: https://www.fxpro.com/
- **Max Leverage**: 500:1
- **Spread Type**: Variable
- **Supported Symbols**: EURUSD, GBPUSD, USDJPY, AUDUSD, NZDUSD, USDCAD, USDCHF, XAUUSD

## Trading Bot Features

### Automated Signal Execution
The trading bot automatically:
1. Monitors analysis signals in real-time
2. Validates signal quality and confidence
3. Calculates optimal position size based on risk
4. Executes orders with stop loss and take profit
5. Tracks profit/loss in real-time

### Position Management
- **Trailing Stops**: Automatically adjust stop loss to lock in profits
- **Take Profit**: Close positions at predefined targets
- **Stop Loss**: Limit losses with fixed stop levels
- **Risk Management**: Position sizing based on account balance and risk %

### Performance Analytics
- Win rate calculation
- Profit/loss tracking
- Trade statistics and metrics
- Event logging and analysis

## Configuration

### Bot Settings
```javascript
{
  trailingStopEnabled: true,
  trailingStopDistance: 50,    // Distance in pips
  maxConcurrentTrades: 5,       // Max open positions
  riskPercentage: 2             // Risk per trade as % of balance
}
```

### Risk Management Rules
- **Max Position Size**: Limited by margin and leverage
- **Risk per Trade**: 2% of account balance
- **Max Leverage**: 1:10 (configurable per broker)
- **Margin Check**: Automatic position sizing to stay within limits

## Security Considerations

### Important
⚠️ **For Production Use:**

1. **Encrypt Credentials**: Store account credentials encrypted in the database
2. **Use API Keys**: Replace password authentication with broker API keys
3. **SSL/TLS**: All broker communication should use HTTPS
4. **Environment Variables**: Store sensitive data in .env files
5. **Rate Limiting**: Implement rate limiting on API endpoints
6. **Audit Logging**: Log all trading activities
7. **2FA**: Enable two-factor authentication on MT5 accounts

### Environment Variables
```bash
MT5_API_ENCRYPTION_KEY=your_encryption_key
MT5_API_TIMEOUT=30000
MT5_MAX_RETRIES=3
MT5_WEBHOOK_SECRET=your_webhook_secret
```

## Troubleshooting

### Common Issues

#### Connection Failed
- Verify broker API is accessible
- Check account credentials
- Verify account status on broker platform
- Check internet connectivity

#### Order Placement Failed
- Insufficient margin
- Invalid trading hours for symbol
- Volume exceeds broker limits
- Invalid price levels

#### Bot Not Executing Signals
- Verify bot is running
- Check signal confidence threshold
- Verify max concurrent trades limit
- Check bot error logs

### Debugging

```javascript
// Enable detailed logging
localStorage.setItem('MT5_DEBUG', 'true');

// Check bot error logs
GET /api/mt5/accounts/{accountId}/bot/stats
// Look at error entries in response
```

## Performance Optimization

- **Order Sync**: Sync orders every 5 minutes
- **Account Info Refresh**: Refresh every 30 seconds
- **Signal Check**: Process new signals every 1 minute
- **Database Indexing**: Proper indexes on frequently queried fields

## Advanced Features

### Copy Trading
Connect multiple accounts and mirror trades from a master account.

### Social Trading
Share performance and allow other traders to follow your signals.

### Strategy Backtesting
Test strategies against historical data before live trading.

### Multi-Currency Support
Trade across multiple currency pairs simultaneously.

## Support & Resources

- **Documentation**: https://bluepips.io/docs
- **API Reference**: https://bluepips.io/api-docs
- **Community**: https://discord.gg/bluepips
- **Support Email**: support@bluepips.io

## License

This MT5 integration is part of Bluepips and is subject to the same license terms.
