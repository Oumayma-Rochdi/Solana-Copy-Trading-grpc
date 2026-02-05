-- Solana Real-time Data Schema
-- Stores real-time token data, liquidity, transactions, and market data

-- Main tokens table with real-time pricing
CREATE TABLE IF NOT EXISTS solana_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint VARCHAR(255) UNIQUE NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  decimals INTEGER DEFAULT 6,
  supply BIGINT,
  holder_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mint (mint),
  INDEX idx_symbol (symbol)
);

-- Price history table (updated every 30-60 seconds)
CREATE TABLE IF NOT EXISTS solana_token_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES solana_tokens(id) ON DELETE CASCADE,
  mint VARCHAR(255) NOT NULL,
  price DECIMAL(20, 8),
  price_24h_change DECIMAL(10, 4),
  price_7d_change DECIMAL(10, 4),
  price_30d_change DECIMAL(10, 4),
  market_cap DECIMAL(20, 2),
  market_cap_24h_change DECIMAL(10, 4),
  volume_24h DECIMAL(20, 2),
  volume_7d DECIMAL(20, 2),
  ath DECIMAL(20, 8),
  atl DECIMAL(20, 8),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token_id (token_id),
  INDEX idx_mint (mint),
  INDEX idx_recorded_at (recorded_at),
  INDEX idx_price (price)
);

-- Liquidity pools table (Raydium, Orca, Serum)
CREATE TABLE IF NOT EXISTS solana_liquidity_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id VARCHAR(255) UNIQUE NOT NULL,
  pool_name VARCHAR(255),
  pool_type VARCHAR(50), -- raydium, orca, serum, etc
  token_a_mint VARCHAR(255) NOT NULL,
  token_b_mint VARCHAR(255) NOT NULL,
  token_a_symbol VARCHAR(50),
  token_b_symbol VARCHAR(50),
  liquidity_usd DECIMAL(20, 2),
  volume_24h DECIMAL(20, 2),
  fee_tier DECIMAL(5, 2),
  apy DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pool_id (pool_id),
  INDEX idx_token_a (token_a_mint),
  INDEX idx_token_b (token_b_mint),
  INDEX idx_liquidity (liquidity_usd)
);

-- Order book data (bid/ask spreads)
CREATE TABLE IF NOT EXISTS solana_orderbook_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint VARCHAR(255) NOT NULL,
  symbol VARCHAR(50),
  best_bid DECIMAL(20, 8),
  best_ask DECIMAL(20, 8),
  bid_size DECIMAL(20, 2),
  ask_size DECIMAL(20, 2),
  spread_percent DECIMAL(10, 4),
  spread_usd DECIMAL(20, 8),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mint (mint),
  INDEX idx_recorded_at (recorded_at)
);

-- Recent transactions (whale watching, large trades)
CREATE TABLE IF NOT EXISTS solana_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash VARCHAR(255) UNIQUE NOT NULL,
  mint VARCHAR(255) NOT NULL,
  symbol VARCHAR(50),
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  amount DECIMAL(20, 8),
  amount_usd DECIMAL(20, 2),
  transaction_type VARCHAR(50), -- buy, sell, swap, transfer
  is_large_trade BOOLEAN DEFAULT FALSE,
  is_whale_trade BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mint (mint),
  INDEX idx_tx_hash (tx_hash),
  INDEX idx_timestamp (timestamp),
  INDEX idx_amount_usd (amount_usd),
  INDEX idx_is_whale (is_whale_trade)
);

-- Holders analysis
CREATE TABLE IF NOT EXISTS solana_token_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint VARCHAR(255) NOT NULL,
  symbol VARCHAR(50),
  total_holders INTEGER,
  top_10_concentration DECIMAL(10, 4), -- percent
  top_100_concentration DECIMAL(10, 4),
  whale_count INTEGER, -- holders with >5% of supply
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mint (mint),
  INDEX idx_recorded_at (recorded_at)
);

-- Market sentiment and metrics
CREATE TABLE IF NOT EXISTS solana_market_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint VARCHAR(255) NOT NULL,
  symbol VARCHAR(50),
  sentiment_score DECIMAL(5, 2), -- -100 to +100
  sentiment_label VARCHAR(50), -- very_bearish, bearish, neutral, bullish, very_bullish
  volume_to_mcap_ratio DECIMAL(10, 4),
  liquidity_to_volume_ratio DECIMAL(10, 4),
  price_volatility DECIMAL(10, 4),
  momentum_score DECIMAL(5, 2),
  trend VARCHAR(20), -- up, down, sideways
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mint (mint),
  INDEX idx_sentiment (sentiment_score),
  INDEX idx_recorded_at (recorded_at)
);

-- API data sources status
CREATE TABLE IF NOT EXISTS solana_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(100) NOT NULL, -- birdeye, helius, magic_eden, raydium
  api_endpoint VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP,
  last_error VARCHAR(500),
  error_count INTEGER DEFAULT 0,
  sync_frequency_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_source_name (source_name)
);

-- Sync logs for monitoring
CREATE TABLE IF NOT EXISTS solana_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(100),
  action VARCHAR(50), -- fetch_prices, fetch_liquidity, fetch_transactions, etc
  status VARCHAR(50), -- success, error, partial
  records_processed INTEGER,
  error_message VARCHAR(1000),
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_source (source_name),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Create indexes for better query performance
CREATE INDEX idx_tokens_price_recent ON solana_token_prices(mint, recorded_at DESC);
CREATE INDEX idx_pools_liquidity_recent ON solana_liquidity_pools(liquidity_usd DESC);
CREATE INDEX idx_txs_whale_recent ON solana_transactions(is_whale_trade, timestamp DESC);
CREATE INDEX idx_holders_concentration ON solana_token_holders(top_10_concentration DESC);
CREATE INDEX idx_metrics_sentiment ON solana_market_metrics(sentiment_score DESC);

-- Cleanup old data (keep 30 days of data only)
CREATE OR REPLACE FUNCTION cleanup_old_solana_data()
RETURNS void AS $$
BEGIN
  DELETE FROM solana_token_prices WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM solana_orderbook_data WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM solana_transactions WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM solana_token_holders WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM solana_market_metrics WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM solana_sync_logs WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-solana-data', '0 0 * * *', 'SELECT cleanup_old_solana_data()');

-- Grants for applications
ALTER TABLE solana_tokens OWNER TO postgres;
ALTER TABLE solana_token_prices OWNER TO postgres;
ALTER TABLE solana_liquidity_pools OWNER TO postgres;
ALTER TABLE solana_orderbook_data OWNER TO postgres;
ALTER TABLE solana_transactions OWNER TO postgres;
ALTER TABLE solana_token_holders OWNER TO postgres;
ALTER TABLE solana_market_metrics OWNER TO postgres;
ALTER TABLE solana_data_sources OWNER TO postgres;
ALTER TABLE solana_sync_logs OWNER TO postgres;

-- Sample data for testing
INSERT INTO solana_data_sources (source_name, api_endpoint, is_active, sync_frequency_seconds) 
VALUES 
  ('birdeye', 'https://api.birdeye.so/defi', TRUE, 30),
  ('helius', 'https://api.helius.xyz', TRUE, 45),
  ('magic_eden', 'https://api-mainnet.magiceden.dev', TRUE, 60),
  ('raydium', 'https://api.raydium.io', TRUE, 30)
ON CONFLICT DO NOTHING;
