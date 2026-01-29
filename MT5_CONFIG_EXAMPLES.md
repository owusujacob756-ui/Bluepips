# MT5 Integration Configuration Example

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
# MT5 Configuration
MT5_API_TIMEOUT=30000
MT5_MAX_RETRIES=3
MT5_WEBHOOK_SECRET=your_secret_key_here
MT5_ENCRYPTION_KEY=your_encryption_key_here

# Broker API Keys (if using key-based auth instead of passwords)
MT5_ICMARKETS_API_KEY=your_api_key
MT5_EXNESS_API_KEY=your_api_key
MT5_PEPPERSTONE_API_KEY=your_api_key
MT5_FXPRO_API_KEY=your_api_key

# Trading Bot Settings
MT5_BOT_CHECK_INTERVAL=60000
MT5_BOT_MAX_CONCURRENT_TRADES=5
MT5_BOT_RISK_PERCENTAGE=2
MT5_BOT_TRAILING_STOP_ENABLED=true
MT5_BOT_TRAILING_STOP_DISTANCE=50

# Database
DATABASE_URL=postgres://user:password@localhost:5432/bluepips

# Feature Flags
FEATURE_ENABLE_LIVE_TRADING=false
FEATURE_ENABLE_AUTO_BOT=true
FEATURE_ENABLE_COPY_TRADING=false
```

## Database Connection

Update `src/lib/db.js` or your database connection file:

```javascript
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  max: 20,
  idle_timeout: 30,
  connection: {
    application_name: 'bluepips-mt5',
    statement_timeout: 30000,
  },
  onnotice: () => {}, // Suppress notices
});

export default sql;
```

## MT5 Account Configuration

### Demo Account Setup

For testing with demo accounts:

```javascript
const demoAccount = {
  accountLogin: '12345678',      // Your demo account number
  accountPassword: 'password123', // Your demo account password
  brokerName: 'ICMarkets',       // Choose: ICMarkets, Exness, Pepperstone, FxPro
  accountType: 'demo',            // Use 'demo' for testing
  accountBalance: 10000,          // Starting balance
};

// Register via API
fetch('/api/mt5/accounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(demoAccount),
});
```

### Live Account Setup

For live trading:

```javascript
const liveAccount = {
  accountLogin: '87654321',      // Your live account number
  accountPassword: 'secure_pass', // Your live account password
  brokerName: 'ICMarkets',       // Choose broker
  accountType: 'live',            // Use 'live' for real money
  accountBalance: 50000,          // Your account balance
};

// Register via API
fetch('/api/mt5/accounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(liveAccount),
});
```

## Bot Configuration Examples

### Conservative Trading Bot
```javascript
{
  action: 'updateConfig',
  config: {
    trailingStopEnabled: true,
    trailingStopDistance: 100,    // Large trailing stop
    maxConcurrentTrades: 2,        // Few concurrent trades
    riskPercentage: 1,             // 1% risk per trade
  }
}
```

### Aggressive Trading Bot
```javascript
{
  action: 'updateConfig',
  config: {
    trailingStopEnabled: true,
    trailingStopDistance: 30,     // Tight trailing stop
    maxConcurrentTrades: 10,       // Many concurrent trades
    riskPercentage: 5,             // 5% risk per trade
  }
}
```

### Balanced Trading Bot
```javascript
{
  action: 'updateConfig',
  config: {
    trailingStopEnabled: true,
    trailingStopDistance: 50,     // Medium trailing stop
    maxConcurrentTrades: 5,        // Moderate concurrent trades
    riskPercentage: 2,             // 2% risk per trade (default)
  }
}
```

## Signal Execution Configuration

### High Confidence Only
Execute only signals with confidence > 80%

```javascript
// In mt5-trading-bot.js, modify checkAndExecuteSignals():
const signals = await sql`
  SELECT a.*, fp.symbol
  FROM analysis a
  JOIN forex_pairs fp ON a.pair_id = fp.id
  WHERE a.overall_recommendation IN ('strong_buy', 'buy', 'strong_sell', 'sell')
  AND a.confidence > 80  // High confidence threshold
  AND a.created_at > NOW() - INTERVAL '1 hour'
  ORDER BY a.confidence DESC
  LIMIT 10
`;
```

### Diversified Currency Pairs
Trade multiple currency pairs:

```javascript
const tradingPairs = [
  'EURUSD', // Major
  'GBPUSD', // Major
  'USDJPY', // Major
  'AUDUSD', // Commodity
  'NZDUSD', // Commodity
  'XAUUSD', // Gold
  'XAGUSD', // Silver
];

// Filter signals to only these pairs
const signals = await sql`
  WHERE fp.symbol = ANY($1::text[])
`;
```

### Time-Based Trading
Only trade during specific hours:

```javascript
// In checkAndExecuteSignals(), add:
const now = new Date();
const hour = now.getUTCHours();

// Only trade 8am-4pm UTC (London session)
if (hour < 8 || hour > 16) {
  console.log('Outside trading hours, skipping signals');
  return;
}
```

## Broker-Specific Settings

### IC Markets
```javascript
{
  brokerName: 'ICMarkets',
  maxLeverage: 500,
  minVolume: 0.01,
  maxVolume: 100,
  spreadType: 'variable',
  commissionPerMillionTurned: 7,
}
```

### Exness
```javascript
{
  brokerName: 'Exness',
  maxLeverage: 1000,
  minVolume: 0.01,
  maxVolume: 200,
  spreadType: 'variable',
  rebatePerMillion: 5,
}
```

### Pepperstone
```javascript
{
  brokerName: 'Pepperstone',
  maxLeverage: 500,
  minVolume: 0.01,
  maxVolume: 100,
  spreadType: 'fixed',
  interestRate: 0.5,
}
```

## Position Sizing Formula

The bot uses this formula for automatic position sizing:

```
accountBalance = 10,000 USD
riskPercentage = 2%
entryPrice = 1.1000
stopLoss = 1.0950

riskAmount = accountBalance × (riskPercentage / 100)
           = 10,000 × 0.02
           = 200 USD

pips = abs(entryPrice - stopLoss) × 10000
     = abs(1.1000 - 1.0950) × 10000
     = 50 pips

volume = (riskAmount / pips) × 0.0001
       = (200 / 50) × 0.0001
       = 0.4 lots
```

## Risk Management Rules

### Maximum Daily Loss
Stop trading if daily loss exceeds limit:

```javascript
const dailyLossLimit = 500; // Stop if lose more than $500 in a day

const todaysTrades = await sql`
  SELECT SUM(profit_loss) as daily_loss
  FROM mt5_orders
  WHERE account_id = ${accountId}
  AND DATE(closed_at) = CURRENT_DATE
`;

if (todaysTrades[0].daily_loss < -dailyLossLimit) {
  await stopTradingBot(accountId);
}
```

### Maximum Drawdown
Close bot if account equity drops too much:

```javascript
const maxDrawdown = 20; // Stop if lose 20% of balance

const accountInfo = await getAccountInfo(accountId);
const drawdown = ((accountInfo.equity - initialBalance) / initialBalance) * 100;

if (drawdown < -maxDrawdown) {
  await stopTradingBot(accountId);
}
```

### Margin Level Check
Prevent margin calls:

```javascript
const minMarginLevel = 50; // Close positions if margin < 50%

if (accountInfo.marginLevel < minMarginLevel) {
  await closeAllPositions(accountId);
}
```

## Monitoring and Alerting

### Email Alerts
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendAlert(accountId, message) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `Bluepips MT5 Alert - Account ${accountId}`,
    text: message,
  });
}
```

### Webhook Notifications
```javascript
async function sendWebhook(event) {
  const signature = crypto
    .createHmac('sha256', process.env.MT5_WEBHOOK_SECRET)
    .update(JSON.stringify(event))
    .digest('hex');

  await fetch(process.env.WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
    },
    body: JSON.stringify(event),
  });
}
```

## Database Migrations

Run migrations in order:

```bash
# 1. Core MT5 tables
psql -U user -d database -f database/mt5_schema.sql

# 2. Bot-related tables
psql -U user -d database -f database/mt5_bot_schema.sql

# 3. Verify tables
psql -U user -d database -c "\dt"
```

## Backup and Restore

### Backup MT5 Data
```bash
pg_dump -U user -d database --table=mt5_* > mt5_backup.sql
```

### Restore MT5 Data
```bash
psql -U user -d database < mt5_backup.sql
```

## Performance Tuning

### Database Connection Pool
```javascript
const sql = postgres(process.env.DATABASE_URL, {
  max: 50,              // Max connections
  min: 10,              // Min connections
  idle_timeout: 30,     // Idle connection timeout
  statement_timeout: 30000, // Query timeout
});
```

### API Request Timeout
```javascript
const fetchOptions = {
  timeout: parseInt(process.env.MT5_API_TIMEOUT) || 30000,
};

const response = await fetch(url, { ...fetchOptions });
```

### Index Optimization
```sql
-- Add these indexes for better performance
CREATE INDEX idx_mt5_orders_created ON mt5_orders(created_at DESC);
CREATE INDEX idx_mt5_orders_account_status ON mt5_orders(account_id, status);
CREATE INDEX idx_mt5_bot_events_symbol ON mt5_bot_events(symbol, created_at DESC);
```

## Testing Configuration

### Test Environment
```bash
NODE_ENV=test
DATABASE_URL=postgres://user:password@localhost:5432/bluepips_test
MT5_BOT_CHECK_INTERVAL=1000  # Shorter interval for testing
```

### Test Account
```javascript
const testAccount = {
  accountLogin: 'test-12345678',
  accountPassword: 'test-password',
  brokerName: 'ICMarkets',
  accountType: 'demo',
  accountBalance: 1000, // Small test balance
};
```

---

For more information, see `MT5_INTEGRATION.md` and `MT5_GETTING_STARTED.md`.
