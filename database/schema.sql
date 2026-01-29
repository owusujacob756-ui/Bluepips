-- Bluepips Forex Trading Platform Database Schema
-- PostgreSQL Database

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    strategy_tier VARCHAR(50) DEFAULT 'copilot' CHECK (strategy_tier IN ('copilot', 'autonomous', 'professional')),
    demo_mode BOOLEAN DEFAULT true,
    risk_tolerance VARCHAR(20) DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forex pairs table
CREATE TABLE forex_pairs (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    base_currency VARCHAR(3) NOT NULL,
    quote_currency VARCHAR(3) NOT NULL,
    current_price NUMERIC(10,5) NOT NULL,
    price_change_24h NUMERIC(10,5) DEFAULT 0,
    price_change_percent NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading signals table
CREATE TABLE signals (
    id SERIAL PRIMARY KEY,
    pair_id INTEGER REFERENCES forex_pairs(id),
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('buy', 'sell')),
    confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    entry_price NUMERIC(10,5) NOT NULL,
    stop_loss NUMERIC(10,5) NOT NULL,
    take_profit NUMERIC(10,5) NOT NULL,
    technical_indicators JSONB,
    ai_reasoning TEXT,
    pattern_detected VARCHAR(100),
    timeframe VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'executed')),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technical analysis table
CREATE TABLE technical_analysis (
    id SERIAL PRIMARY KEY,
    pair_id INTEGER REFERENCES forex_pairs(id),
    timeframe VARCHAR(10),
    indicators JSONB,
    ai_summary TEXT,
    recommendation VARCHAR(10) CHECK (recommendation IN ('buy','sell','hold')),
    confidence NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fundamental analysis table
CREATE TABLE fundamental_analysis (
    id SERIAL PRIMARY KEY,
    pair_id INTEGER REFERENCES forex_pairs(id),
    news JSONB,
    sentiment VARCHAR(10) CHECK (sentiment IN ('bullish','bearish','neutral')),
    impact VARCHAR(10) CHECK (impact IN ('high','medium','low')),
    ai_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Combined analysis table
CREATE TABLE combined_analysis (
    id SERIAL PRIMARY KEY,
    pair_id INTEGER REFERENCES forex_pairs(id),
    technical_id INTEGER REFERENCES technical_analysis(id),
    fundamental_id INTEGER REFERENCES fundamental_analysis(id),
    overall_recommendation VARCHAR(10) CHECK (overall_recommendation IN ('buy','sell','hold')),
    confidence NUMERIC(5,2),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unified analysis table (merged technical + fundamental + combined)
CREATE TABLE analysis (
    id SERIAL PRIMARY KEY,
    pair_id INTEGER REFERENCES forex_pairs(id),
    timeframe VARCHAR(10),
    technical JSONB,
    fundamental JSONB,
    overall_recommendation VARCHAR(10) CHECK (overall_recommendation IN ('buy','sell','hold')),
    confidence NUMERIC(5,2),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News items table (store individual articles for auditing / re-analysis)
CREATE TABLE news_items (
    id SERIAL PRIMARY KEY,
    pair_id INTEGER REFERENCES forex_pairs(id),
    source VARCHAR(255),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    published_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes to speed analysis queries
CREATE INDEX idx_analysis_pair_time ON analysis(pair_id, timeframe, created_at DESC);
CREATE INDEX idx_news_items_pair_time ON news_items(pair_id, published_at DESC);

-- Trades table
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    signal_id INTEGER REFERENCES signals(id),
    pair_id INTEGER REFERENCES forex_pairs(id),
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    entry_price NUMERIC(10,5) NOT NULL,
    exit_price NUMERIC(10,5),
    position_size NUMERIC(10,2) NOT NULL,
    stop_loss NUMERIC(10,5),
    take_profit NUMERIC(10,5),
    profit_loss NUMERIC(10,2),
    profit_loss_percent NUMERIC(5,2),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    execution_mode VARCHAR(20) DEFAULT 'demo' CHECK (execution_mode IN ('demo', 'manual', 'auto')),
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    notes TEXT,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Price history table
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    pair_id INTEGER REFERENCES forex_pairs(id),
    open_price NUMERIC(10,5) NOT NULL,
    high_price NUMERIC(10,5) NOT NULL,
    low_price NUMERIC(10,5) NOT NULL,
    close_price NUMERIC(10,5) NOT NULL,
    volume BIGINT DEFAULT 0,
    timeframe TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    notification_type TEXT NOT NULL CHECK (notification_type IN ('signal', 'trade_opened', 'trade_closed', 'alert', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_signal_id INTEGER REFERENCES signals(id),
    related_trade_id INTEGER REFERENCES trades(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    kill_switch_enabled BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    notification_channels JSONB DEFAULT '{"push": true, "email": true, "telegram": false}',
    max_daily_trades INTEGER DEFAULT 10,
    max_position_size NUMERIC(10,2) DEFAULT 1000.00,
    auto_trading_enabled BOOLEAN DEFAULT false,
    preferred_pairs TEXT[],
    trading_hours JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_profit_loss NUMERIC(10,2) DEFAULT 0,
    win_rate NUMERIC(5,2),
    sharpe_ratio NUMERIC(5,2),
    max_drawdown NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX idx_forex_pairs_symbol ON forex_pairs(symbol);
CREATE INDEX idx_signals_status ON signals(status);
CREATE INDEX idx_trades_user_status ON trades(user_id, status);
CREATE INDEX idx_trades_opened_at ON trades(opened_at);
CREATE INDEX idx_price_history_pair_time ON price_history(pair_id, timeframe, timestamp DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- Insert demo data
-- Forex Pairs
INSERT INTO forex_pairs (symbol, name, base_currency, quote_currency, current_price, price_change_24h, price_change_percent, is_active) VALUES
('EUR/USD', 'Euro / US Dollar', 'EUR', 'USD', 1.08450, 0.00235, 0.22, true),
('GBP/USD', 'British Pound / US Dollar', 'GBP', 'USD', 1.26320, -0.00180, -0.14, true),
('USD/JPY', 'US Dollar / Japanese Yen', 'USD', 'JPY', 149.850, 0.420, 0.28, true),
('USD/CHF', 'US Dollar / Swiss Franc', 'USD', 'CHF', 0.88560, 0.00095, 0.11, true),
('AUD/USD', 'Australian Dollar / US Dollar', 'AUD', 'USD', 0.66240, 0.00310, 0.47, true),
('USD/CAD', 'US Dollar / Canadian Dollar', 'USD', 'CAD', 1.35680, -0.00145, -0.11, true),
('NZD/USD', 'New Zealand Dollar / US Dollar', 'NZD', 'USD', 0.60180, 0.00225, 0.38, true),
('EUR/GBP', 'Euro / British Pound', 'EUR', 'GBP', 0.85890, 0.00068, 0.08, true),
('EUR/JPY', 'Euro / Japanese Yen', 'EUR', 'JPY', 162.450, 0.380, 0.23, true),
('GBP/JPY', 'British Pound / Japanese Yen', 'GBP', 'JPY', 189.270, 0.520, 0.28, true);

-- Demo User
INSERT INTO users (email, full_name, strategy_tier, demo_mode, risk_tolerance) VALUES
('demo@bluepips.ai', 'Demo User', 'copilot', true, 'moderate')
RETURNING id;

-- User Settings (assuming user id = 1)
INSERT INTO user_settings (user_id, kill_switch_enabled, notifications_enabled, max_daily_trades, max_position_size, auto_trading_enabled) VALUES
(1, true, true, 10, 1000.00, false);

-- Active Signals
INSERT INTO signals (pair_id, signal_type, confidence, entry_price, stop_loss, take_profit, technical_indicators, ai_reasoning, pattern_detected, timeframe, status) VALUES
(1, 'buy', 87.50, 1.08450, 1.08200, 1.09000, 
'{"rsi": 58.3, "macd": 0.0012, "ema_20": 1.0835, "ema_50": 1.0815, "bollinger_upper": 1.0890, "bollinger_lower": 1.0805, "fibonacci_618": 1.0840}',
'Strong bullish momentum detected. RSI showing healthy uptrend without overbought conditions. MACD histogram expanding positively. Price bouncing from 61.8% Fibonacci retracement level. Volume confirming trend.',
'Morning Star + Fibonacci 61.8% Support',
'4H',
'active'),

(3, 'sell', 82.30, 149.850, 150.500, 148.500,
'{"rsi": 71.2, "macd": -0.0025, "ema_20": 150.10, "ema_50": 149.20, "bollinger_upper": 151.00, "bollinger_lower": 148.50, "support_level": 148.80}',
'Overbought conditions on RSI (>70). MACD bearish divergence forming. Price testing upper Bollinger Band resistance. Japanese Yen showing strength fundamentals.',
'Bearish Divergence + Resistance Zone',
'1H',
'active'),

(5, 'buy', 91.20, 0.66240, 0.65900, 0.67000,
'{"rsi": 45.8, "macd": 0.0008, "ema_20": 0.6610, "ema_50": 0.6595, "bullish_engulfing": true, "volume_spike": 1.35}',
'Bullish engulfing pattern confirmed on daily chart. AUD fundamentals improving with commodity price strength. Volume spike confirming breakout. Risk-reward ratio 1:2.5 favorable.',
'Bullish Engulfing + Volume Confirmation',
'1D',
'active');

-- Sample trades
INSERT INTO trades (user_id, signal_id, pair_id, trade_type, entry_price, exit_price, position_size, stop_loss, take_profit, profit_loss, profit_loss_percent, status, execution_mode, user_rating, opened_at, closed_at) VALUES
-- Closed trades
(1, 1, 1, 'buy', 1.08200, 1.08950, 500.00, 1.07950, 1.09000, 375.00, 6.93, 'closed', 'demo', 5, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
(1, 2, 2, 'sell', 1.26500, 1.26150, 400.00, 1.26850, 1.25800, 140.00, 2.77, 'closed', 'demo', 4, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
(1, NULL, 3, 'buy', 149.200, 148.900, 600.00, 148.700, 150.500, -180.00, -2.01, 'closed', 'manual', 2, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
(1, 3, 4, 'buy', 0.88300, 0.88720, 450.00, 0.88000, 0.89000, 189.00, 4.76, 'closed', 'demo', 5, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(1, NULL, 5, 'sell', 0.66500, 0.66180, 550.00, 0.66850, 0.65800, 176.00, 4.81, 'closed', 'demo', 4, NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'),
(1, NULL, 6, 'buy', 1.35900, 1.35500, 350.00, 1.35500, 1.36500, -140.00, -2.94, 'closed', 'manual', 3, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '4 hours'),

-- Open trades
(1, 1, 1, 'buy', 1.08450, NULL, 500.00, 1.08200, 1.09000, NULL, NULL, 'open', 'demo', NULL, NOW() - INTERVAL '2 hours', NULL),
(1, 3, 5, 'buy', 0.66240, NULL, 550.00, 0.65900, 0.67000, NULL, NULL, 'open', 'demo', NULL, NOW() - INTERVAL '1 hour', NULL);

-- Sample price history for EUR/USD
INSERT INTO price_history (pair_id, open_price, high_price, low_price, close_price, volume, timeframe, timestamp)
SELECT 
    1 as pair_id,
    1.08000 + (random() * 0.01) as open_price,
    1.08200 + (random() * 0.01) as high_price,
    1.07800 + (random() * 0.01) as low_price,
    1.08100 + (random() * 0.01) as close_price,
    (random() * 100000)::BIGINT as volume,
    '1H' as timeframe,
    NOW() - (n || ' hours')::INTERVAL as timestamp
FROM generate_series(1, 100) as n;

-- Notifications
INSERT INTO notifications (user_id, notification_type, title, message, related_signal_id, is_read) VALUES
(1, 'signal', 'New BUY Signal', 'High confidence BUY signal for EUR/USD at 1.08450', 1, false),
(1, 'trade_opened', 'Trade Opened', 'EUR/USD BUY position opened at 1.08450', 1, false),
(1, 'alert', 'Price Alert', 'AUD/USD reached your target price of 0.6624', NULL, false),
(1, 'signal', 'New SELL Signal', 'Strong SELL signal for USD/JPY at 149.850', 2, true),
(1, 'system', 'Daily Summary', 'Your portfolio is up 2.3% today with 3 winning trades', NULL, true);
