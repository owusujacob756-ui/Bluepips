-- MT5 Accounts Table
CREATE TABLE IF NOT EXISTS mt5_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  account_login VARCHAR(50) NOT NULL,
  account_password VARCHAR(255) NOT NULL, -- Should be encrypted in production
  broker_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(20) NOT NULL DEFAULT 'demo', -- 'demo' or 'live'
  account_balance DECIMAL(15, 2) DEFAULT 0,
  equity DECIMAL(15, 2),
  margin_used DECIMAL(15, 2),
  margin_free DECIMAL(15, 2),
  leverage INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'connected', 'disconnected', 'error'
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, account_login, broker_name),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- MT5 Orders Table
CREATE TABLE IF NOT EXISTS mt5_orders (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  order_type VARCHAR(50) NOT NULL, -- 'buy', 'sell', 'buylimit', 'selllimit', 'buystop', 'sellstop'
  volume DECIMAL(10, 2) NOT NULL,
  open_price DECIMAL(10, 5),
  current_price DECIMAL(10, 5),
  stop_loss DECIMAL(10, 5),
  take_profit DECIMAL(10, 5),
  close_price DECIMAL(10, 5),
  order_id VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'open', 'closed', 'cancelled'
  profit_loss DECIMAL(15, 2),
  profit_loss_percentage DECIMAL(5, 2),
  opened_at TIMESTAMP,
  closed_at TIMESTAMP,
  expiration TIMESTAMP,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(account_id) REFERENCES mt5_accounts(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX(account_id, status),
  INDEX(user_id, opened_at),
  INDEX(symbol, opened_at)
);

-- MT5 Account Performance Table
CREATE TABLE IF NOT EXISTS mt5_performance (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  daily_profit_loss DECIMAL(15, 2),
  daily_return_percentage DECIMAL(5, 2),
  weekly_profit_loss DECIMAL(15, 2),
  weekly_return_percentage DECIMAL(5, 2),
  monthly_profit_loss DECIMAL(15, 2),
  monthly_return_percentage DECIMAL(5, 2),
  total_closed_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2),
  average_win DECIMAL(15, 2),
  average_loss DECIMAL(15, 2),
  largest_win DECIMAL(15, 2),
  largest_loss DECIMAL(15, 2),
  average_trade_duration INTERVAL,
  recorded_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(account_id) REFERENCES mt5_accounts(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX(account_id, recorded_at),
  INDEX(user_id, recorded_at)
);

-- MT5 Connection Logs Table
CREATE TABLE IF NOT EXISTS mt5_connection_logs (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  event_type VARCHAR(50), -- 'connected', 'disconnected', 'sync', 'error'
  status VARCHAR(20),
  message TEXT,
  error_details TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(account_id) REFERENCES mt5_accounts(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX(account_id, created_at),
  INDEX(event_type, created_at)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_user ON mt5_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_mt5_orders_account_symbol ON mt5_orders(account_id, symbol);
CREATE INDEX IF NOT EXISTS idx_mt5_orders_status ON mt5_orders(status);
CREATE INDEX IF NOT EXISTS idx_mt5_performance_account ON mt5_performance(account_id);
CREATE INDEX IF NOT EXISTS idx_mt5_connection_logs_account ON mt5_connection_logs(account_id);
