/**
 * Solana Data Query Service
 * Provides methods to query and analyze stored Solana trading data
 */

import logger from '../utils/logger.js'
import { Pool } from '@neondatabase/serverless'

class SolanaDataQuery {
  constructor() {
    this.db = null
  }

  /**
   * Initialize database connection
   */
  async init() {
    try {
      if (!process.env.DATABASE_URL) {
        logger.warn('[DataQuery] DATABASE_URL not configured')
        return false
      }

      this.db = new Pool({
        connectionString: process.env.DATABASE_URL,
      })

      await this.db.query('SELECT 1')
      return true
    } catch (error) {
      logger.error('[DataQuery] Database connection failed:', error)
      return false
    }
  }

  /**
   * Get token price history
   */
  async getTokenPriceHistory(mint, hours = 24) {
    try {
      if (!this.db) return []

      const result = await this.db.query(
        `SELECT price, market_cap, volume_24h, recorded_at, price_24h_change
         FROM solana_token_prices
         WHERE mint = $1 AND recorded_at > NOW() - INTERVAL '1 hour' * $2
         ORDER BY recorded_at ASC
         LIMIT 1000`,
        [mint, hours]
      )

      return result.rows
    } catch (error) {
      logger.error('[DataQuery] Error getting price history:', error)
      return []
    }
  }

  /**
   * Get current token price
   */
  async getCurrentTokenPrice(mint) {
    try {
      if (!this.db) return null

      const result = await this.db.query(
        `SELECT * FROM solana_token_prices
         WHERE mint = $1
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [mint]
      )

      return result.rows[0] || null
    } catch (error) {
      logger.error('[DataQuery] Error getting current price:', error)
      return null
    }
  }

  /**
   * Get top gainers (24h)
   */
  async getTopGainers(limit = 20) {
    try {
      if (!this.db) return []

      const result = await this.db.query(
        `SELECT DISTINCT ON (mint) mint, price, price_24h_change, market_cap, volume_24h
         FROM solana_token_prices
         WHERE recorded_at > NOW() - INTERVAL '24 hours'
         ORDER BY mint, recorded_at DESC
         LIMIT $1`,
        [limit]
      )

      return result.rows
        .sort((a, b) => (b.price_24h_change || 0) - (a.price_24h_change || 0))
        .slice(0, limit)
    } catch (error) {
      logger.error('[DataQuery] Error getting top gainers:', error)
      return []
    }
  }

  /**
   * Get top losers (24h)
   */
  async getTopLosers(limit = 20) {
    try {
      if (!this.db) return []

      const result = await this.db.query(
        `SELECT DISTINCT ON (mint) mint, price, price_24h_change, market_cap, volume_24h
         FROM solana_token_prices
         WHERE recorded_at > NOW() - INTERVAL '24 hours'
         ORDER BY mint, recorded_at DESC`,
        []
      )

      return result.rows
        .sort((a, b) => (a.price_24h_change || 0) - (b.price_24h_change || 0))
        .slice(0, limit)
    } catch (error) {
      logger.error('[DataQuery] Error getting top losers:', error)
      return []
    }
  }

  /**
   * Get whale transactions
   */
  async getWhaleTransactions(limit = 50) {
    try {
      if (!this.db) return []

      const result = await this.db.query(
        `SELECT * FROM solana_transactions
         WHERE is_whale_trade = TRUE
         ORDER BY timestamp DESC
         LIMIT $1`,
        [limit]
      )

      return result.rows
    } catch (error) {
      logger.error('[DataQuery] Error getting whale transactions:', error)
      return []
    }
  }

  /**
   * Get whale transactions for specific token
   */
  async getTokenWhaleTransactions(mint, limit = 50) {
    try {
      if (!this.db) return []

      const result = await this.db.query(
        `SELECT * FROM solana_transactions
         WHERE mint = $1 AND is_whale_trade = TRUE
         ORDER BY timestamp DESC
         LIMIT $2`,
        [mint, limit]
      )

      return result.rows
    } catch (error) {
      logger.error('[DataQuery] Error getting token whale transactions:', error)
      return []
    }
  }

  /**
   * Get recent transactions for token
   */
  async getRecentTransactions(mint, limit = 100) {
    try {
      if (!this.db) return []

      const result = await this.db.query(
        `SELECT * FROM solana_transactions
         WHERE mint = $1
         ORDER BY timestamp DESC
         LIMIT $2`,
        [mint, limit]
      )

      return result.rows
    } catch (error) {
      logger.error('[DataQuery] Error getting recent transactions:', error)
      return []
    }
  }

  /**
   * Get top liquidity pools
   */
  async getTopLiquidityPools(limit = 50) {
    try {
      if (!this.db) return []

      const result = await this.db.query(
        `SELECT * FROM solana_liquidity_pools
         ORDER BY liquidity_usd DESC
         LIMIT $1`,
        [limit]
      )

      return result.rows
    } catch (error) {
      logger.error('[DataQuery] Error getting top pools:', error)
      return []
    }
  }

  /**
   * Get pools for token
   */
  async getTokenPools(mint) {
    try {
      if (!this.db) return []

      const result = await this.db.query(
        `SELECT * FROM solana_liquidity_pools
         WHERE token_a_mint = $1 OR token_b_mint = $1
         ORDER BY liquidity_usd DESC`,
        [mint]
      )

      return result.rows
    } catch (error) {
      logger.error('[DataQuery] Error getting token pools:', error)
      return []
    }
  }

  /**
   * Get token holders analysis
   */
  async getTokenHolders(mint) {
    try {
      if (!this.db) return null

      const result = await this.db.query(
        `SELECT * FROM solana_token_holders
         WHERE mint = $1
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [mint]
      )

      return result.rows[0] || null
    } catch (error) {
      logger.error('[DataQuery] Error getting token holders:', error)
      return null
    }
  }

  /**
   * Get trading volume statistics
   */
  async getVolumeStats(hours = 24) {
    try {
      if (!this.db) return {}

      const result = await this.db.query(
        `SELECT 
           SUM(volume_24h) as total_volume,
           AVG(volume_24h) as avg_volume,
           MAX(volume_24h) as max_volume,
           MIN(volume_24h) as min_volume,
           COUNT(DISTINCT mint) as active_tokens
         FROM solana_token_prices
         WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1`,
        [hours]
      )

      return result.rows[0] || {}
    } catch (error) {
      logger.error('[DataQuery] Error getting volume stats:', error)
      return {}
    }
  }

  /**
   * Get market cap statistics
   */
  async getMarketCapStats() {
    try {
      if (!this.db) return {}

      const result = await this.db.query(
        `SELECT 
           SUM(market_cap) as total_market_cap,
           AVG(market_cap) as avg_market_cap,
           MAX(market_cap) as max_market_cap,
           COUNT(DISTINCT mint) as tokens_tracked
         FROM solana_token_prices
         WHERE recorded_at > NOW() - INTERVAL '1 hour'`
      )

      return result.rows[0] || {}
    } catch (error) {
      logger.error('[DataQuery] Error getting market cap stats:', error)
      return {}
    }
  }

  /**
   * Search tokens
   */
  async searchTokens(query) {
    try {
      if (!this.db) return []

      const result = await this.db.query(
        `SELECT DISTINCT mint, symbol, name FROM solana_tokens
         WHERE symbol ILIKE $1 OR name ILIKE $1
         LIMIT 20`,
        [`%${query}%`]
      )

      return result.rows
    } catch (error) {
      logger.error('[DataQuery] Error searching tokens:', error)
      return []
    }
  }

  /**
   * Get volatility analysis
   */
  async getVolatilityAnalysis(mint, days = 7) {
    try {
      if (!this.db) return null

      const prices = await this.db.query(
        `SELECT price FROM solana_token_prices
         WHERE mint = $1 AND recorded_at > NOW() - INTERVAL '1 day' * $2
         ORDER BY recorded_at ASC`,
        [mint, days]
      )

      if (prices.rows.length < 2) return null

      const priceValues = prices.rows.map((r) => parseFloat(r.price))
      const mean =
        priceValues.reduce((a, b) => a + b, 0) / priceValues.length
      const variance =
        priceValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) /
        priceValues.length
      const stdDev = Math.sqrt(variance)
      const volatility = (stdDev / mean) * 100

      return {
        mint,
        days,
        volatility,
        mean,
        stdDev,
        min: Math.min(...priceValues),
        max: Math.max(...priceValues),
      }
    } catch (error) {
      logger.error('[DataQuery] Error calculating volatility:', error)
      return null
    }
  }

  /**
   * Get sentiment analysis
   */
  async getSentimentAnalysis(mint) {
    try {
      if (!this.db) return null

      const result = await this.db.query(
        `SELECT * FROM solana_market_metrics
         WHERE mint = $1
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [mint]
      )

      return result.rows[0] || null
    } catch (error) {
      logger.error('[DataQuery] Error getting sentiment:', error)
      return null
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(hours = 24) {
    try {
      if (!this.db) return {}

      const result = await this.db.query(
        `SELECT 
           COUNT(*) as total_syncs,
           AVG(execution_time_ms) as avg_time,
           MAX(execution_time_ms) as max_time,
           SUM(records_processed) as total_records
         FROM solana_sync_logs
         WHERE created_at > NOW() - INTERVAL '1 hour' * $1`,
        [hours]
      )

      return result.rows[0] || {}
    } catch (error) {
      logger.error('[DataQuery] Error getting sync stats:', error)
      return {}
    }
  }
}

export default new SolanaDataQuery()
