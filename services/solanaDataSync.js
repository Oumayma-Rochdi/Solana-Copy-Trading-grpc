/**
 * Solana Data Synchronization Service
 * Orchestrates real-time data collection from multiple providers
 * Syncs every 30-60 seconds
 */

import logger from '../utils/logger.js'
import birdeyeProvider from './dataProviders/birdeyeProvider.js'
import heliusProvider from './dataProviders/heliusProvider.js'
import raydiumProvider from './dataProviders/raydiumProvider.js'
import { Pool } from '@neondatabase/serverless'

class SolanaDataSync {
  constructor() {
    this.db = null
    this.syncInterval = null
    this.lastSyncTime = {}
    this.watchedTokens = new Set()
    this.syncFrequency = 30000 // 30 seconds default
    this.isRunning = false
    this.providers = {
      birdeye: birdeyeProvider,
      helius: heliusProvider,
      raydium: raydiumProvider,
    }
  }

  /**
   * Initialize database connection
   */
  async init() {
    try {
      if (!process.env.DATABASE_URL) {
        logger.warn('[DataSync] DATABASE_URL not configured, data persistence disabled')
        return false
      }

      this.db = new Pool({
        connectionString: process.env.DATABASE_URL,
      })

      await this.db.query('SELECT 1')
      logger.info('[DataSync] Database connection established')
      return true
    } catch (error) {
      logger.error('[DataSync] Database connection failed:', error)
      return false
    }
  }

  /**
   * Start real-time data synchronization
   */
  async start(frequency = 30000) {
    try {
      if (this.isRunning) {
        logger.warn('[DataSync] Sync already running')
        return
      }

      this.syncFrequency = frequency
      this.isRunning = true

      logger.info(`[DataSync] Starting data sync (interval: ${frequency}ms)`)

      // Perform initial sync
      await this.performSync()

      // Set up periodic sync
      this.syncInterval = setInterval(() => {
        this.performSync().catch((error) => {
          logger.error('[DataSync] Sync error:', error)
        })
      }, this.syncFrequency)
    } catch (error) {
      logger.error('[DataSync] Failed to start sync:', error)
      this.isRunning = false
    }
  }

  /**
   * Stop synchronization
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.isRunning = false
    logger.info('[DataSync] Data sync stopped')
  }

  /**
   * Add token to watch list
   */
  addWatchedToken(tokenMint) {
    this.watchedTokens.add(tokenMint)
    logger.info(`[DataSync] Added token to watch: ${tokenMint}`)
  }

  /**
   * Remove token from watch list
   */
  removeWatchedToken(tokenMint) {
    this.watchedTokens.delete(tokenMint)
    logger.info(`[DataSync] Removed token from watch: ${tokenMint}`)
  }

  /**
   * Get watched tokens
   */
  getWatchedTokens() {
    return Array.from(this.watchedTokens)
  }

  /**
   * Perform data synchronization
   */
  async performSync() {
    try {
      const startTime = Date.now()
      const syncLog = {
        timestamp: new Date(),
        results: {},
      }

      // Get top tokens if no specific watches
      const tokensToSync =
        this.watchedTokens.size > 0
          ? this.getWatchedTokens()
          : await this._getTopTokens(20)

      logger.info(`[DataSync] Syncing ${tokensToSync.length} tokens`)

      // Parallel sync from all providers
      const syncPromises = [
        this._syncBirdeye(tokensToSync),
        this._syncHelius(tokensToSync),
        this._syncRaydium(),
      ]

      const results = await Promise.allSettled(syncPromises)

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          logger.error('[DataSync] Provider sync failed:', result.reason)
        }
      })

      const duration = Date.now() - startTime
      logger.info(`[DataSync] Sync completed in ${duration}ms`)

      // Log sync to database
      if (this.db) {
        await this._logSyncActivity({
          timestamp: new Date(),
          tokensCount: tokensToSync.length,
          duration,
        })
      }

      return syncLog
    } catch (error) {
      logger.error('[DataSync] Sync error:', error)
    }
  }

  /**
   * Sync Birdeye data
   */
  async _syncBirdeye(tokens) {
    if (!this.db) return { status: 'skipped' }

    try {
      const results = []

      for (const mint of tokens) {
        // Get token price
        const priceData = await birdeyeProvider.getTokenPrice(mint)
        if (priceData) {
          await this._saveTokenPrice(priceData)
          results.push(priceData)
        }

        // Get holders
        const holdersData = await birdeyeProvider.getHolders(mint)
        if (holdersData) {
          await this._saveHolderData(holdersData)
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      logger.info(`[DataSync] Birdeye: Synced ${results.length} tokens`)
      return { provider: 'birdeye', count: results.length, status: 'success' }
    } catch (error) {
      logger.error('[DataSync] Birdeye sync error:', error)
      return { provider: 'birdeye', status: 'error', error: error.message }
    }
  }

  /**
   * Sync Helius data
   */
  async _syncHelius(tokens) {
    if (!this.db) return { status: 'skipped' }

    try {
      const results = []

      for (const mint of tokens) {
        // Get transactions
        const transactions = await heliusProvider.getRecentTransactions(mint, 100)
        if (transactions.length > 0) {
          await this._saveTransactions(transactions)
          results.push(...transactions)
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      logger.info(`[DataSync] Helius: Synced ${results.length} transactions`)
      return { provider: 'helius', count: results.length, status: 'success' }
    } catch (error) {
      logger.error('[DataSync] Helius sync error:', error)
      return { provider: 'helius', status: 'error', error: error.message }
    }
  }

  /**
   * Sync Raydium liquidity data
   */
  async _syncRaydium() {
    if (!this.db) return { status: 'skipped' }

    try {
      const pools = await raydiumProvider.getLiquidityPools(100)
      if (pools.length > 0) {
        await this._saveLiquidityPools(pools)
      }

      logger.info(`[DataSync] Raydium: Synced ${pools.length} pools`)
      return { provider: 'raydium', count: pools.length, status: 'success' }
    } catch (error) {
      logger.error('[DataSync] Raydium sync error:', error)
      return { provider: 'raydium', status: 'error', error: error.message }
    }
  }

  /**
   * Save token price to database
   */
  async _saveTokenPrice(priceData) {
    try {
      // First ensure token exists
      await this.db.query(
        `INSERT INTO solana_tokens (mint, symbol, name, decimals, supply, holder_count)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (mint) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
        [
          priceData.mint,
          priceData.symbol,
          priceData.name,
          priceData.decimals,
          priceData.supply,
          priceData.holders,
        ]
      )

      // Insert price record
      await this.db.query(
        `INSERT INTO solana_token_prices 
         (token_id, mint, price, price_24h_change, price_7d_change, price_30d_change, 
          market_cap, market_cap_24h_change, volume_24h, volume_7d, ath, atl, recorded_at)
         SELECT id, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP
         FROM solana_tokens WHERE mint = $1`,
        [
          priceData.mint,
          priceData.price,
          priceData.priceChange24h,
          priceData.priceChange7d,
          priceData.priceChange30d,
          priceData.marketCap,
          priceData.marketCapChange24h,
          priceData.volume24h,
          priceData.volume7d,
          priceData.ath,
          priceData.atl,
        ]
      )
    } catch (error) {
      logger.error('[DataSync] Error saving token price:', error)
    }
  }

  /**
   * Save holder data
   */
  async _saveHolderData(holdersData) {
    try {
      await this.db.query(
        `INSERT INTO solana_token_holders 
         (mint, symbol, total_holders, top_10_concentration, top_100_concentration, whale_count, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          holdersData.mint,
          '',
          holdersData.totalHolders,
          holdersData.top10Concentration,
          holdersData.top100Concentration,
          holdersData.whaleCount,
        ]
      )
    } catch (error) {
      logger.error('[DataSync] Error saving holder data:', error)
    }
  }

  /**
   * Save transactions
   */
  async _saveTransactions(transactions) {
    try {
      for (const tx of transactions) {
        await this.db.query(
          `INSERT INTO solana_transactions 
           (tx_hash, mint, from_address, to_address, amount, amount_usd, transaction_type, is_whale_trade, timestamp, recorded_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
           ON CONFLICT (tx_hash) DO NOTHING`,
          [
            tx.txHash,
            tx.mint,
            tx.fromAddress || null,
            tx.toAddress || null,
            tx.amount || null,
            tx.amountUsd || null,
            tx.type,
            tx.isWhaleTrade || false,
            tx.timestamp,
          ]
        )
      }
    } catch (error) {
      logger.error('[DataSync] Error saving transactions:', error)
    }
  }

  /**
   * Save liquidity pools
   */
  async _saveLiquidityPools(pools) {
    try {
      for (const pool of pools) {
        await this.db.query(
          `INSERT INTO solana_liquidity_pools 
           (pool_id, pool_name, pool_type, token_a_mint, token_b_mint, token_a_symbol, token_b_symbol,
            liquidity_usd, volume_24h, fee_tier, apy)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (pool_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
          [
            pool.poolId,
            pool.poolName,
            pool.poolType,
            pool.tokenAMint,
            pool.tokenBMint,
            pool.tokenASymbol,
            pool.tokenBSymbol,
            pool.liquidityUsd,
            pool.volume24h,
            pool.lpFeePercent,
            pool.apy,
          ]
        )
      }
    } catch (error) {
      logger.error('[DataSync] Error saving liquidity pools:', error)
    }
  }

  /**
   * Log sync activity
   */
  async _logSyncActivity(data) {
    try {
      await this.db.query(
        `INSERT INTO solana_sync_logs (source_name, action, status, records_processed, execution_time_ms)
         VALUES ($1, $2, $3, $4, $5)`,
        ['multi', 'full_sync', 'success', data.tokensCount, data.duration]
      )
    } catch (error) {
      logger.error('[DataSync] Error logging sync activity:', error)
    }
  }

  /**
   * Get top tokens to sync
   */
  async _getTopTokens(limit = 20) {
    try {
      const trending = await birdeyeProvider.getTrendingTokens()
      return trending.slice(0, limit).map((t) => t.mint)
    } catch (error) {
      logger.error('[DataSync] Error getting top tokens:', error)
      return []
    }
  }
}

export default new SolanaDataSync()
