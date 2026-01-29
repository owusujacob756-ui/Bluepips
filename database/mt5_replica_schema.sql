/**
 * MT5 Replica DB Schema
 * Tables for persistent storage of replica accounts, orders, positions, and trades
 */

-- MT5 Replica Accounts
CREATE TABLE IF NOT EXISTS mt5_replica_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    account_name VARCHAR(255) NOT NULL,
    account_number INTEGER UNIQUE DEFAULT floor(random() * 1000000)::int,
    initial_balance NUMERIC(15,2) NOT NULL,
    current_balance NUMERIC(15,2) NOT NULL,
    leverage INTEGER DEFAULT 100,
    account_type VARCHAR(20) DEFAULT 'demo' CHECK (account_type IN ('demo', 'real')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, account_name)
);

-- MT5 Replica Orders (market & pending)
CREATE TABLE IF NOT EXISTS mt5_replica_orders (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES mt5_replica_accounts(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    order_id INTEGER UNIQUE,
    symbol VARCHAR(20) NOT NULL,
    order_type VARCHAR(20) NOT NULL CHECK (
        order_type IN ('buy', 'sell', 'buylimit', 'selllimit', 'buystop', 'sellstop')
    ),
    volume NUMERIC(10,2) NOT NULL,
    entry_price NUMERIC(10,5) NOT NULL,
    stop_loss NUMERIC(10,5),
    take_profit NUMERIC(10,5),
    status VARCHAR(20) DEFAULT 'open' CHECK (
        status IN ('open', 'pending', 'executed', 'closed', 'cancelled')
    ),
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    modified_at TIMESTAMP,
    expiration TIMESTAMP,
    comment TEXT,
    INDEX idx_account_status (account_id, status),
    INDEX idx_opened_at (opened_at DESC)
);

-- MT5 Replica Positions (open trades)
CREATE TABLE IF NOT EXISTS mt5_replica_positions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES mt5_replica_accounts(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    trade_id INTEGER UNIQUE,
    symbol VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('buy', 'sell')),
    volume NUMERIC(10,2) NOT NULL,
    entry_price NUMERIC(10,5) NOT NULL,
    current_price NUMERIC(10,5),
    stop_loss NUMERIC(10,5),
    take_profit NUMERIC(10,5),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    unrealized_pnl NUMERIC(15,2) DEFAULT 0,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    close_price NUMERIC(10,5),
    INDEX idx_account_status (account_id, status),
    INDEX idx_symbol (symbol)
);

-- MT5 Replica Trades (closed trades history)
CREATE TABLE IF NOT EXISTS mt5_replica_trades (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES mt5_replica_accounts(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('buy', 'sell')),
    volume NUMERIC(10,2) NOT NULL,
    entry_price NUMERIC(10,5) NOT NULL,
    exit_price NUMERIC(10,5) NOT NULL,
    pnl NUMERIC(15,2) NOT NULL,
    pnl_percent NUMERIC(10,2) DEFAULT 0,
    duration_seconds INTEGER,
    opened_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP NOT NULL,
    INDEX idx_account_date (account_id, closed_at DESC),
    INDEX idx_symbol (symbol)
);

-- MT5 Replica Price History (OHLC data)
CREATE TABLE IF NOT EXISTS mt5_replica_price_history (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) DEFAULT '1m' CHECK (timeframe IN ('1m', '5m', '15m', '1h', '4h', '1d')),
    open_price NUMERIC(10,5) NOT NULL,
    high_price NUMERIC(10,5) NOT NULL,
    low_price NUMERIC(10,5) NOT NULL,
    close_price NUMERIC(10,5) NOT NULL,
    tick_volume BIGINT DEFAULT 0,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_symbol_time (symbol, timeframe, timestamp DESC)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_user ON mt5_replica_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_mt5_orders_account ON mt5_replica_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_mt5_positions_account ON mt5_replica_positions(account_id);
CREATE INDEX IF NOT EXISTS idx_mt5_trades_account ON mt5_replica_trades(account_id);
