-- MT5 Bot Status Table
CREATE TABLE IF NOT EXISTS mt5_bot_status (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'stopped', -- 'running', 'stopped', 'paused', 'error'
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(account_id) REFERENCES mt5_accounts(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX(account_id, status)
);

-- MT5 Bot Settings Table
CREATE TABLE IF NOT EXISTS mt5_bot_settings (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  trailing_stop_enabled BOOLEAN DEFAULT false,
  trailing_stop_distance DECIMAL(10, 2) DEFAULT 50,  -- in pips
  max_concurrent_trades INTEGER DEFAULT 5,
  risk_percentage DECIMAL(5, 2) DEFAULT 2,           -- percentage of account
  auto_close_on_loss BOOLEAN DEFAULT false,
  daily_loss_limit DECIMAL(15, 2),
  auto_recovery_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(account_id) REFERENCES mt5_accounts(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- MT5 Bot Events Table
CREATE TABLE IF NOT EXISTS mt5_bot_events (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  event_type VARCHAR(50), -- 'signal_executed', 'signal_failed', 'take_profit_hit', 'stop_loss_hit', 'trade_opened', 'trade_closed'
  symbol VARCHAR(20),
  details JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(account_id) REFERENCES mt5_accounts(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX(account_id, created_at),
  INDEX(event_type, created_at),
  INDEX(symbol, created_at)
);

-- MT5 Bot Errors Table
CREATE TABLE IF NOT EXISTS mt5_bot_errors (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  FOREIGN KEY(account_id) REFERENCES mt5_accounts(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX(account_id, created_at),
  INDEX(resolved, created_at)
);

-- Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_mt5_bot_status_user ON mt5_bot_status(user_id);
CREATE INDEX IF NOT EXISTS idx_mt5_bot_settings_user ON mt5_bot_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_mt5_bot_events_account_date ON mt5_bot_events(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mt5_bot_errors_account ON mt5_bot_errors(account_id, created_at DESC);
