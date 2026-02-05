import axios from 'axios'
import logger from '../utils/logger.js'

/**
 * Real Data Collector
 * Integrates multiple data sources: Binance, Magic Eden, Solscan, Birdeye
 */

class RealDataCollector {
  constructor() {
    this.binanceAPI = 'https://api.binance.com/api/v3'
    this.birdeyeAPI = 'https://public-api.birdeye.so/defi'
    this.magicEdenAPI = 'https://api-mainnet.magiceden.dev/v2'
    this.solscanAPI = 'https://api.solscan.io/v2'

    // Cache configuration
    this.cache = new Map()
    this.cacheExpiry = new Map()
    this.CACHE_TTL = 5 * 60 * 1000 // 5 minutes

    logger.info('[RealDataCollector] Initialized with multiple data sources')
  }

  // ============== CACHE MANAGEMENT ==============

  _getCacheKey(source, identifier) {
    return `${source}:${identifier}`
  }

  _setCache(key, data, ttl = this.CACHE_TTL) {
    this.cache.set(key, data)
    this.cacheExpiry.set(key, Date.now() + ttl)
  }

  _getCache(key) {
    const expiry = this.cacheExpiry.get(key)
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key)
      this.cacheExpiry.delete(key)
      return null
    }
    return this.cache.get(key)
  }

  _clearExpiredCache() {
    const now = Date.now()
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.cache.delete(key)
        this.cacheExpiry.delete(key)
      }
    }
  }

  // ============== BINANCE DATA ==============

  /**
   * Get Binance OHLCV data (Open, High, Low, Close, Volume)
   * @param {string} symbol - Trading pair (e.g., 'SOLUSDT')
   * @param {string} interval - Candle interval (1m, 5m, 1h, 1d, etc.)
   * @param {number} limit - Number of candles (max 1000)
   */
  async getBinanceOHLCV(symbol = 'SOLUSDT', interval = '1h', limit = 100) {
    const cacheKey = this._getCacheKey('binance_ohlcv', `${symbol}_${interval}`)
    const cached = this._getCache(cacheKey)
    if (cached) {
      logger.debug(`[RealDataCollector] Binance OHLCV cache hit: ${symbol}`)
      return cached
    }

    try {
      const response = await axios.get(`${this.binanceAPI}/klines`, {
        params: {
          symbol,
          interval,
          limit: Math.min(limit, 1000),
        },
        timeout: 5000,
      })

      const ohlcv = response.data.map(candle => ({
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
        closeTime: candle[6],
        quoteAssetVolume: parseFloat(candle[7]),
        numberOfTrades: candle[8],
      }))

      this._setCache(cacheKey, ohlcv)
      logger.info(`[RealDataCollector] Fetched ${ohlcv.length} OHLCV candles for ${symbol}`)
      return ohlcv
    } catch (error) {
      logger.error(`[RealDataCollector] Error fetching Binance OHLCV for ${symbol}:`, error.message)
      return []
    }
  }

  /**
   * Get Binance 24h ticker data
   */
  async getBinance24hTicker(symbol = 'SOLUSDT') {
    const cacheKey = this._getCacheKey('binance_ticker24h', symbol)
    const cached = this._getCache(cacheKey)
    if (cached) {
      logger.debug(`[RealDataCollector] Binance 24h ticker cache hit: ${symbol}`)
      return cached
    }

    try {
      const response = await axios.get(`${this.binanceAPI}/ticker/24hr`, {
        params: { symbol },
        timeout: 5000,
      })

      const ticker = {
        symbol: response.data.symbol,
        priceChange: parseFloat(response.data.priceChange),
        priceChangePercent: parseFloat(response.data.priceChangePercent),
        weightedAvgPrice: parseFloat(response.data.weightedAvgPrice),
        prevClosePrice: parseFloat(response.data.prevClosePrice),
        lastPrice: parseFloat(response.data.lastPrice),
        bidPrice: parseFloat(response.data.bidPrice),
        askPrice: parseFloat(response.data.askPrice),
        openPrice: parseFloat(response.data.openPrice),
        highPrice: parseFloat(response.data.highPrice),
        lowPrice: parseFloat(response.data.lowPrice),
        volume: parseFloat(response.data.volume),
        quoteAssetVolume: parseFloat(response.data.quoteAssetVolume),
        count: response.data.count,
        timestamp: Date.now(),
      }

      this._setCache(cacheKey, ticker, 1 * 60 * 1000) // 1 minute cache
      logger.info(`[RealDataCollector] Fetched 24h ticker for ${symbol}`)
      return ticker
    } catch (error) {
      logger.error(`[RealDataCollector] Error fetching Binance ticker for ${symbol}:`, error.message)
      return null
    }
  }

  // ============== SOLANA/BIRDEYE DATA ==============

  /**
   * Get Solana token price and data from Birdeye
   */
  async getSolanaTokenData(tokenMint) {
    const cacheKey = this._getCacheKey('birdeye_token', tokenMint)
    const cached = this._getCache(cacheKey)
    if (cached) {
      logger.debug(`[RealDataCollector] Birdeye token data cache hit: ${tokenMint}`)
      return cached
    }

    try {
      const response = await axios.get(`${this.birdeyeAPI}/token/overview`, {
        params: { address: tokenMint },
        headers: {
          'x-chain': 'solana',
        },
        timeout: 5000,
      })

      if (!response.data.success) {
        logger.warn(`[RealDataCollector] Birdeye API error: ${response.data.message}`)
        return null
      }

      const tokenData = {
        mint: tokenMint,
        symbol: response.data.data.symbol,
        name: response.data.data.name,
        decimals: response.data.data.decimals,
        price: response.data.data.price,
        priceChange24h: response.data.data.priceChange24h,
        priceChange7d: response.data.data.priceChange7d,
        marketCap: response.data.data.marketCap,
        liquidity: response.data.data.liquidity,
        volume24h: response.data.data.volume24h,
        trades24h: response.data.data.trades24h,
        holders: response.data.data.holders,
        lastUpdated: Date.now(),
      }

      this._setCache(cacheKey, tokenData, 2 * 60 * 1000) // 2 minutes cache
      logger.info(`[RealDataCollector] Fetched Solana token data: ${tokenData.symbol}`)
      return tokenData
    } catch (error) {
      logger.error(`[RealDataCollector] Error fetching token data for ${tokenMint}:`, error.message)
      return null
    }
  }

  /**
   * Get Solana token OHLCV from Birdeye
   */
  async getSolanaTokenOHLCV(tokenMint, timeframe = '1h') {
    const cacheKey = this._getCacheKey('birdeye_ohlcv', `${tokenMint}_${timeframe}`)
    const cached = this._getCache(cacheKey)
    if (cached) {
      logger.debug(`[RealDataCollector] Birdeye OHLCV cache hit: ${tokenMint}`)
      return cached
    }

    try {
      const response = await axios.get(`${this.birdeyeAPI}/ohlcv`, {
        params: {
          address: tokenMint,
          type: timeframe,
          limit: 100,
        },
        headers: {
          'x-chain': 'solana',
        },
        timeout: 5000,
      })

      if (!response.data.success || !response.data.data) {
        logger.warn(`[RealDataCollector] Birdeye OHLCV error for ${tokenMint}`)
        return []
      }

      const ohlcv = response.data.data.map(candle => ({
        timestamp: candle.unixTime * 1000,
        open: parseFloat(candle.o),
        high: parseFloat(candle.h),
        low: parseFloat(candle.l),
        close: parseFloat(candle.c),
        volume: parseFloat(candle.v),
      }))

      this._setCache(cacheKey, ohlcv, 5 * 60 * 1000) // 5 minutes cache
      logger.info(`[RealDataCollector] Fetched ${ohlcv.length} OHLCV candles for ${tokenMint}`)
      return ohlcv
    } catch (error) {
      logger.error(`[RealDataCollector] Error fetching OHLCV for ${tokenMint}:`, error.message)
      return []
    }
  }

  // ============== MAGIC EDEN DATA ==============

  /**
   * Get Magic Eden collections data
   */
  async getMagicEdenCollections(limit = 50) {
    const cacheKey = this._getCacheKey('magiceden_collections', 'list')
    const cached = this._getCache(cacheKey)
    if (cached) {
      logger.debug(`[RealDataCollector] Magic Eden collections cache hit`)
      return cached
    }

    try {
      const response = await axios.get(`${this.magicEdenAPI}/collections`, {
        params: { limit },
        timeout: 5000,
      })

      const collections = response.data.map(col => ({
        symbol: col.symbol,
        name: col.name,
        image: col.image,
        description: col.description,
        floorPrice: col.floorPrice,
        listedCount: col.listedCount,
        volume24h: col.volumeAll?.['24h'] || 0,
        volume7d: col.volumeAll?.['7d'] || 0,
      }))

      this._setCache(cacheKey, collections, 15 * 60 * 1000) // 15 minutes cache
      logger.info(`[RealDataCollector] Fetched ${collections.length} Magic Eden collections`)
      return collections
    } catch (error) {
      logger.error(`[RealDataCollector] Error fetching Magic Eden collections:`, error.message)
      return []
    }
  }

  // ============== SOLSCAN DATA ==============

  /**
   * Get Solana blockchain statistics from Solscan
   */
  async getSolanaStats() {
    const cacheKey = this._getCacheKey('solscan_stats', 'global')
    const cached = this._getCache(cacheKey)
    if (cached) {
      logger.debug(`[RealDataCollector] Solscan stats cache hit`)
      return cached
    }

    try {
      const response = await axios.get(`${this.solscanAPI}/system`, {
        timeout: 5000,
      })

      const stats = {
        totalStaked: response.data.totalStaked,
        circulatingSupply: response.data.circulatingSupply,
        maxSupply: response.data.maxSupply,
        transactionsPerSecond: response.data.transactionsPerSecond,
        activeValidators: response.data.activeValidators,
        blockTime: response.data.blockTime,
        lastBlock: response.data.lastBlock,
        lastUpdated: Date.now(),
      }

      this._setCache(cacheKey, stats, 5 * 60 * 1000) // 5 minutes cache
      logger.info(`[RealDataCollector] Fetched Solana blockchain stats`)
      return stats
    } catch (error) {
      logger.error(`[RealDataCollector] Error fetching Solana stats:`, error.message)
      return null
    }
  }

  /**
   * Get top tokens by volume from Solscan
   */
  async getTopTokensByVolume(limit = 50) {
    const cacheKey = this._getCacheKey('solscan_top_tokens', 'volume')
    const cached = this._getCache(cacheKey)
    if (cached) {
      logger.debug(`[RealDataCollector] Top tokens cache hit`)
      return cached
    }

    try {
      const response = await axios.get(`${this.solscanAPI}/token/tokens`, {
        params: {
          sortBy: 'volume',
          direction: 'desc',
          limit,
          offset: 0,
        },
        timeout: 5000,
      })

      const tokens = response.data.data.map(token => ({
        mint: token.mint,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logo: token.logo,
        volume24h: token.volume24h,
        price: token.price,
        holders: token.holders,
        supply: token.supply,
      }))

      this._setCache(cacheKey, tokens, 10 * 60 * 1000) // 10 minutes cache
      logger.info(`[RealDataCollector] Fetched ${tokens.length} top tokens by volume`)
      return tokens
    } catch (error) {
      logger.error(`[RealDataCollector] Error fetching top tokens:`, error.message)
      return []
    }
  }

  // ============== BATCH OPERATIONS ==============

  /**
   * Get comprehensive market data snapshot
   */
  async getMarketSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      binance: {
        solusdt: await this.getBinance24hTicker('SOLUSDT'),
        ohlcv: await this.getBinanceOHLCV('SOLUSDT', '1h', 24),
      },
      solana: {
        stats: await this.getSolanaStats(),
        topTokens: await this.getTopTokensByVolume(10),
      },
      magicEden: {
        collections: await this.getMagicEdenCollections(5),
      },
    }

    return snapshot
  }

  /**
   * Get comprehensive token data
   */
  async getTokenComprehensiveData(tokenMint) {
    const data = {
      timestamp: Date.now(),
      mint: tokenMint,
      tokenData: await this.getSolanaTokenData(tokenMint),
      ohlcv: await this.getSolanaTokenOHLCV(tokenMint),
    }

    return data
  }

  // ============== CACHE UTILITIES ==============

  /**
   * Get cache statistics
   */
  getCacheStats() {
    this._clearExpiredCache()
    return {
      cachedItems: this.cache.size,
      memory: JSON.stringify(Array.from(this.cache.entries())).length,
      items: Array.from(this.cache.keys()),
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear()
    this.cacheExpiry.clear()
    logger.info('[RealDataCollector] Cache cleared')
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(key) {
    this.cache.delete(key)
    this.cacheExpiry.delete(key)
    logger.debug(`[RealDataCollector] Cache entry cleared: ${key}`)
  }
}

const realDataCollector = new RealDataCollector()
export default realDataCollector
