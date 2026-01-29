# Bluepips MT5 Integration - Getting Started

## Quick Start

### Step 1: Setup Database
```bash
# Apply MT5 schemas to your database
psql -U your_user -d your_database -f database/mt5_schema.sql
psql -U your_user -d your_database -f database/mt5_bot_schema.sql
```

### Step 2: Start the Development Server
```bash
npm run dev
```

### Step 3: Access MT5 Dashboard
Navigate to `http://localhost:3000/mt5`

## Features Summary

✅ **Real Account Trading**: Connect and trade on real MT5 accounts
✅ **Automated Signals**: Automatically execute trades from analysis signals
✅ **Position Management**: Trailing stops, take profit, stop loss
✅ **Multi-Broker Support**: IC Markets, Exness, Pepperstone, FxPro
✅ **Performance Analytics**: Real-time P&L and statistics
✅ **Risk Management**: Automatic position sizing
✅ **Bot Control**: Start/stop automated trading

## Architecture Overview

```
┌─────────────────────────────┐
│   Analysis Engine           │
│   (Generates Signals)       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  MT5 Trading Bot            │
│  - Executes Signals         │
│  - Manages Positions        │
│  - Tracks Performance       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Broker APIs                │
│  (MT5 Real Trading)         │
└─────────────────────────────┘
```

## File Structure

```
src/
├── lib/
│   ├── mt5.js                  # Core MT5 integration
│   ├── mt5-config.js           # Broker configurations
│   └── mt5-trading-bot.js      # Automated trading bot
├── app/
│   ├── mt5/
│   │   └── page.jsx            # MT5 dashboard UI
│   └── api/
│       └── mt5/
│           ├── accounts/       # Account management
│           │   ├── route.js
│           │   ├── [accountId]/
│           │   │   ├── route.js
│           │   │   ├── orders/
│           │   │   ├── bot/
│           │   │   ├── sync/
│           │   │   └── execute-signal/
│           └── brokers/        # Broker list
database/
├── mt5_schema.sql             # Core MT5 tables
└── mt5_bot_schema.sql         # Bot tables
```

## Key Components

### 1. MT5 Core Module (`src/lib/mt5.js`)
- Account registration and management
- Market and pending order execution
- Order modification and closing
- Account info syncing
- Order history retrieval

### 2. MT5 Config (`src/lib/mt5-config.js`)
- Broker configurations
- Symbol support validation
- Volume limits
- Leverage settings
- Trading hours

### 3. Trading Bot (`src/lib/mt5-trading-bot.js`)
- Automated signal execution
- Position management
- Trailing stops
- Performance tracking
- Error logging

### 4. API Routes (`src/app/api/mt5/`)
- REST endpoints for all operations
- Account management
- Order management
- Bot control
- Performance stats

### 5. UI Dashboard (`src/app/mt5/page.jsx`)
- Account management interface
- Real-time account info
- Order management
- Bot control panel
- Performance analytics

## API Endpoints Reference

### Accounts
- `POST /api/mt5/accounts` - Register account
- `GET /api/mt5/accounts` - List accounts
- `GET /api/mt5/accounts/{id}` - Get account info
- `POST /api/mt5/accounts/{id}/sync` - Sync orders

### Orders
- `POST /api/mt5/accounts/{id}/orders` - Place order
- `GET /api/mt5/accounts/{id}/orders` - Get orders
- `PUT /api/mt5/accounts/{id}/orders/{orderId}` - Modify order
- `DELETE /api/mt5/accounts/{id}/orders/{orderId}` - Close order

### Trading Bot
- `GET /api/mt5/accounts/{id}/bot` - Get bot status
- `POST /api/mt5/accounts/{id}/bot` - Control bot
- `GET /api/mt5/accounts/{id}/bot/stats` - Get performance

### Signals
- `POST /api/mt5/accounts/{id}/execute-signal` - Execute from signal

## Configuration

### Bot Settings
The trading bot uses these settings:
```javascript
{
  maxConcurrentTrades: 5,
  riskPercentage: 2,
  trailingStopEnabled: true,
  trailingStopDistance: 50
}
```

### Supported Brokers
1. **IC Markets** - Max leverage 500:1
2. **Exness** - Max leverage 1000:1
3. **Pepperstone** - Max leverage 500:1
4. **FxPro** - Max leverage 500:1

## Usage Flow

### 1. Connect MT5 Account
```javascript
POST /api/mt5/accounts
{
  "accountLogin": "12345678",
  "accountPassword": "password",
  "brokerName": "ICMarkets",
  "accountType": "demo",
  "accountBalance": 10000
}
```

### 2. Get Account Details
```javascript
GET /api/mt5/accounts/1
// Returns balance, equity, margin info
```

### 3. Start Trading Bot
```javascript
POST /api/mt5/accounts/1/bot
{
  "action": "start"
}
// Bot now monitors signals and executes automatically
```

### 4. Monitor Performance
```javascript
GET /api/mt5/accounts/1/bot/stats
// Returns win rate, profit/loss, trade count
```

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Debugging
Enable debug mode:
```javascript
localStorage.setItem('MT5_DEBUG', 'true');
```

## Security Notes

⚠️ **Important for Production:**

1. **Encrypt Credentials** - Use encryption for stored passwords
2. **Use API Keys** - Switch from password auth to API keys
3. **Rate Limiting** - Implement rate limits on endpoints
4. **SSL/TLS** - Use HTTPS for all API calls
5. **Audit Logging** - Log all trading activities
6. **2FA** - Enable on MT5 accounts
7. **Environment Variables** - Store secrets in .env

## Performance Targets

- Order execution latency: < 500ms
- Account sync: Every 5 minutes
- Signal processing: Every 1 minute
- Database queries: < 100ms

## Troubleshooting

### Bot not executing signals
1. Check bot status: `GET /api/mt5/accounts/{id}/bot`
2. Review bot events: `GET /api/mt5/accounts/{id}/bot/stats`
3. Check error logs in database

### Connection failed to broker
1. Verify credentials are correct
2. Check broker API status
3. Verify account is active on broker platform
4. Check network connectivity

### Orders failing
1. Insufficient margin - Reduce position size
2. Invalid trading hours - Check symbol trading hours
3. Volume exceeded - Use smaller volume
4. Invalid price levels - Check SL/TP levels

## Next Steps

1. ✅ Connect your first MT5 account
2. ✅ Review a few signals in the analysis dashboard
3. ✅ Start the trading bot with demo account
4. ✅ Monitor performance for 1 week
5. ✅ Switch to live account when comfortable

## Support

- **Documentation**: See `MT5_INTEGRATION.md`
- **API Docs**: Check individual route files for request/response specs
- **Issues**: Report bugs in GitHub issues
- **Community**: Join Discord community for help

## License

This MT5 integration is part of Bluepips and is subject to the project license.
