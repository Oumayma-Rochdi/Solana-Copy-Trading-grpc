/**
 * Birdeye API Provider
 * Fetches token prices, market data, holders info
 * Free tier: https://docs.birdeye.so/
 */

import logger from '../../utils/logger.js'

class BirdeyeProvider {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.BIRDEYE_API_KEY
    this.baseUrl = 'https://api.birdeye.so/defi'
    this.cache = new Map()
    this.cacheExpiry = 30000 // 30 seconds
  }

  /**
   * Get token price and market data
   */
  async getTokenPrice(tokenMint) {
    try {
      const cacheKey = `price_${tokenMint}`
      if (this._isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      const response = await fetch(
        `${this.baseUrl}/token_overview?address=${tokenMint}`,
        {
          headers: {
            'x-chain': 'solana',
            'X-API-KEY': this.apiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Birdeye API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.data) {
        logger.warn(`[Birdeye] No data for token: ${tokenMint}`)
        return null
      }

      const result = {
        mint: tokenMint,
        symbol: data.data.symbol,
        name: data.data.name,
        price: data.data.price,
        priceChange24h: data.data.priceChange24h,
        priceChange7d: data.data.priceChange7d,
        priceChange30d: data.data.priceChange30d,
        marketCap: data.data.mc,
        marketCapChange24h: data.data.mcChange24h,
        volume24h: data.data.v24hUSD,
        volume7d: data.data.v7dUSD,
        liquidity: data.data.liquidity,
        ath: data.data.ath,
        atl: data.data.atl,
        holders: data.data.holders,
        creator: data.data.creator,
        decimals: data.data.decimals,
        supply: data.data.supply,
        chainId: 'solana',
        source: 'birdeye',
        timestamp: new Date(),
      }

      this.cache.set(cacheKey, result)
      this.cache.set(`${cacheKey}_time`, Date.now())

      return result
    } catch (error) {
      logger.error('[Birdeye] Error fetching token price:', error)
      return null
    }
  }

  /**
   * Search tokens by symbol
   */
  async searchTokens(query) {
    try {
      const response = await fetch(
        `${this.baseUrl}/token_search?query=${encodeURIComponent(query)}&sort_type=liquidity&sort_order=desc&limit=10`,
        {
          headers: {
            'x-chain': 'solana',
            'X-API-KEY': this.apiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Birdeye search error: ${response.statusText}`)
      }

      const data = await response.json()

      return (
        data.data?.map((token) => ({
          mint: token.address,
          symbol: token.symbol,
          name: token.name,
          price: token.price,
          volume24h: token.v24hUSD,
          liquidity: token.liquidity,
          holders: token.holders,
          source: 'birdeye',
        })) || []
      )
    } catch (error) {
      logger.error('[Birdeye] Error searching tokens:', error)
      return []
    }
  }

  /**
   * Get token holders distribution
   */
  async getHolders(tokenMint) {
    try {
      const response = await fetch(
        `${this.baseUrl}/token_holder?address=${tokenMint}&offset=0&limit=1000`,
        {
          headers: {
            'x-chain': 'solana',
            'X-API-KEY': this.apiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Birdeye holders error: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.data || !data.data.holders) {
        return null
      }

      // Calculate concentration
      const totalSupply = data.data.totalSupply || 1
      let top10Concentration = 0
      let top100Concentration = 0

      data.data.holders.forEach((holder, index) => {
        const percentage = (holder.amount / totalSupply) * 100
        if (index < 10) top10Concentration += percentage
        if (index < 100) top100Concentration += percentage
      })

      return {
        mint: tokenMint,
        totalHolders: data.data.holder_count || data.data.holders.length,
        top10Concentration,
        top100Concentration,
        whaleCount: data.data.holders.filter((h) => (h.amount / totalSupply) * 100 > 5)
          .length,
        holders: data.data.holders.slice(0, 50).map((h) => ({
          address: h.address,
          amount: h.amount,
          percentage: (h.amount / totalSupply) * 100,
        })),
        source: 'birdeye',
        timestamp: new Date(),
      }
    } catch (error) {
      logger.error('[Birdeye] Error fetching holders:', error)
      return null
    }
  }

  /**
   * Get trending tokens
   */
  async getTrendingTokens(timeframe = '24h') {
    try {
      const response = await fetch(
        `${this.baseUrl}/token_list?sort_type=vol_24h&sort_order=desc&limit=50`,
        {
          headers: {
            'x-chain': 'solana',
            'X-API-KEY': this.apiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Birdeye trending error: ${response.statusText}`)
      }

      const data = await response.json()

      return (
        data.data?.map((token) => ({
          mint: token.address,
          symbol: token.symbol,
          name: token.name,
          price: token.price,
          volume24h: token.v24hUSD,
          priceChange24h: token.priceChange24h,
          liquidity: token.liquidity,
          holders: token.holders,
          source: 'birdeye',
        })) || []
      )
    } catch (error) {
      logger.error('[Birdeye] Error fetching trending tokens:', error)
      return []
    }
  }

  /**
   * Check cache validity
   */
  _isCacheValid(key) {
    const timeKey = `${key}_time`
    if (!this.cache.has(key) || !this.cache.has(timeKey)) {
      return false
    }

    const age = Date.now() - this.cache.get(timeKey)
    return age < this.cacheExpiry
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
    logger.info('[Birdeye] Cache cleared')
  }
}

export default new BirdeyeProvider()
