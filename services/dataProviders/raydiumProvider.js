/**
 * Raydium API Provider
 * Fetches liquidity pool data, swap information
 * Public API: https://api.raydium.io/
 */

import logger from '../../utils/logger.js'

class RaydiumProvider {
  constructor() {
    this.baseUrl = 'https://api.raydium.io/v2'
    this.cache = new Map()
    this.cacheExpiry = 30000 // 30 seconds
  }

  /**
   * Get liquidity pools
   */
  async getLiquidityPools(limit = 100) {
    try {
      if (this._isCacheValid('pools_list')) {
        return this.cache.get('pools_list')
      }

      const response = await fetch(`${this.baseUrl}/main/pairs`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Raydium API error: ${response.statusText}`)
      }

      const data = await response.json()

      const pools = (data.pairs || [])
        .slice(0, limit)
        .map((pool) => ({
          poolId: pool.id,
          poolName: pool.name,
          poolType: 'raydium',
          tokenAMint: pool.tokenA?.address,
          tokenBMint: pool.tokenB?.address,
          tokenASymbol: pool.tokenA?.symbol,
          tokenBSymbol: pool.tokenB?.symbol,
          liquidityUsd: pool.tvl,
          volume24h: pool.volume24h,
          apy: pool.apy,
          lpFeePercent: pool.lpFee,
          status: pool.status,
          source: 'raydium',
          timestamp: new Date(),
        }))

      this.cache.set('pools_list', pools)
      this.cache.set('pools_list_time', Date.now())

      return pools
    } catch (error) {
      logger.error('[Raydium] Error fetching pools:', error)
      return []
    }
  }

  /**
   * Get specific pool details
   */
  async getPoolDetails(poolId) {
    try {
      const response = await fetch(`${this.baseUrl}/main/pairs/${poolId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Raydium pool error: ${response.statusText}`)
      }

      const pool = await response.json()

      return {
        poolId: pool.id,
        poolName: pool.name,
        tokenA: {
          mint: pool.tokenA?.address,
          symbol: pool.tokenA?.symbol,
          name: pool.tokenA?.name,
          decimals: pool.tokenA?.decimals,
          reserve: pool.tokenA?.reserve,
        },
        tokenB: {
          mint: pool.tokenB?.address,
          symbol: pool.tokenB?.symbol,
          name: pool.tokenB?.name,
          decimals: pool.tokenB?.decimals,
          reserve: pool.tokenB?.reserve,
        },
        liquidityUsd: pool.tvl,
        volume24h: pool.volume24h,
        volume7d: pool.volume7d,
        apy: pool.apy,
        lpFeePercent: pool.lpFee,
        createdAt: pool.createdAt,
        source: 'raydium',
        timestamp: new Date(),
      }
    } catch (error) {
      logger.error('[Raydium] Error fetching pool details:', error)
      return null
    }
  }

  /**
   * Search pools by token
   */
  async searchPoolsByToken(tokenMint) {
    try {
      const pools = await this.getLiquidityPools(500)
      return pools.filter(
        (pool) => pool.tokenAMint === tokenMint || pool.tokenBMint === tokenMint
      )
    } catch (error) {
      logger.error('[Raydium] Error searching pools:', error)
      return []
    }
  }

  /**
   * Get swap estimate
   */
  async getSwapEstimate(inputMint, outputMint, inputAmount) {
    try {
      const response = await fetch(
        `${this.baseUrl}/swap/estimate?inputMint=${inputMint}&outputMint=${outputMint}&amount=${inputAmount}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Raydium swap error: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        inputAmount,
        inputMint,
        outputMint,
        outputAmount: data.outputAmount,
        priceImpact: data.priceImpact,
        minReceived: data.minReceived,
        route: data.route,
        source: 'raydium',
        timestamp: new Date(),
      }
    } catch (error) {
      logger.error('[Raydium] Error getting swap estimate:', error)
      return null
    }
  }

  /**
   * Get top pools by volume
   */
  async getTopPoolsByVolume(limit = 50) {
    try {
      const pools = await this.getLiquidityPools(500)
      return pools
        .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
        .slice(0, limit)
    } catch (error) {
      logger.error('[Raydium] Error getting top pools:', error)
      return []
    }
  }

  /**
   * Get top pools by liquidity
   */
  async getTopPoolsByLiquidity(limit = 50) {
    try {
      const pools = await this.getLiquidityPools(500)
      return pools
        .sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0))
        .slice(0, limit)
    } catch (error) {
      logger.error('[Raydium] Error getting pools by liquidity:', error)
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
    logger.info('[Raydium] Cache cleared')
  }
}

export default new RaydiumProvider()
