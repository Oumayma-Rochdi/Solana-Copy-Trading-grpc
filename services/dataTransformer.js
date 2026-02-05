import logger from '../utils/logger.js'

/**
 * Data Transformer
 * Normalizes and transforms data from multiple sources for analysis
 */

class DataTransformer {
  constructor() {
    logger.info('[DataTransformer] Initialized')
  }

  // ============== OHLCV CALCULATIONS ==============

  /**
   * Calculate technical indicators from OHLCV
   */
  calculateIndicators(ohlcv) {
    if (ohlcv.length === 0) {
      return {
        currentPrice: 0,
        ma7: 0,
        ma20: 0,
        rsi: 0,
        volatility: 0,
        trend: 'NEUTRAL',
      }
    }

    const closes = ohlcv.map(candle => candle.close)
    const currentPrice = closes[closes.length - 1]

    // Moving Averages
    const ma7 = closes.length >= 7 
      ? closes.slice(-7).reduce((a, b) => a + b) / 7 
      : closes.reduce((a, b) => a + b) / closes.length

    const ma20 = closes.length >= 20
      ? closes.slice(-20).reduce((a, b) => a + b) / 20
      : closes.reduce((a, b) => a + b) / closes.length

    // RSI (Relative Strength Index)
    const rsi = this._calculateRSI(closes)

    // Volatility
    const volatility = this._calculateVolatility(closes)

    // Trend
    const trend = this._determineTrend(closes, ma7, ma20)

    return {
      currentPrice,
      ma7,
      ma20,
      rsi,
      volatility,
      trend,
      support: Math.min(...closes.slice(-20)),
      resistance: Math.max(...closes.slice(-20)),
      priceChange24h: ((currentPrice - closes[0]) / closes[0]) * 100,
    }
  }

  /**
   * Calculate RSI indicator
   */
  _calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) {
      return 50 // Neutral
    }

    let gains = 0
    let losses = 0

    for (let i = 1; i < period + 1; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) gains += change
      else losses -= change
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      const currentGain = change > 0 ? change : 0
      const currentLoss = change < 0 ? -change : 0

      avgGain = (avgGain * (period - 1) + currentGain) / period
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsi = 100 - 100 / (1 + rs)

    return Math.round(rsi * 100) / 100
  }

  /**
   * Calculate volatility
   */
  _calculateVolatility(prices) {
    if (prices.length < 2) return 0

    const returns = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }

    const mean = returns.reduce((a, b) => a + b) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    const stdDev = Math.sqrt(variance)

    return Math.round(stdDev * 10000) / 100 // As percentage
  }

  /**
   * Determine trend
   */
  _determineTrend(prices, ma7, ma20) {
    const currentPrice = prices[prices.length - 1]

    if (currentPrice > ma7 && ma7 > ma20) {
      return 'STRONG_UPTREND'
    } else if (currentPrice > ma7) {
      return 'UPTREND'
    } else if (currentPrice < ma7 && ma7 < ma20) {
      return 'STRONG_DOWNTREND'
    } else if (currentPrice < ma7) {
      return 'DOWNTREND'
    } else {
      return 'NEUTRAL'
    }
  }

  // ============== TOKEN ANALYSIS ==============

  /**
   * Analyze token fundamentals
   */
  analyzeTokenFundamentals(tokenData) {
    if (!tokenData) return null

    const scores = {
      liquidityScore: this._calculateLiquidityScore(tokenData.liquidity || 0),
      volumeScore: this._calculateVolumeScore(tokenData.volume24h || 0),
      marketCapScore: this._calculateMarketCapScore(tokenData.marketCap || 0),
      holdersScore: this._calculateHoldersScore(tokenData.holders || 0),
      tradingActivityScore: this._calculateTradingActivityScore(tokenData.trades24h || 0),
    }

    const overallScore = Object.values(scores).reduce((a, b) => a + b) / Object.keys(scores).length

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      ...scores,
      strengths: this._identifyStrengths(scores),
      weaknesses: this._identifyWeaknesses(scores),
    }
  }

  _calculateLiquidityScore(liquidity) {
    // Score based on liquidity levels
    if (liquidity > 1000000) return 10
    if (liquidity > 500000) return 8
    if (liquidity > 100000) return 6
    if (liquidity > 50000) return 4
    if (liquidity > 10000) return 2
    return 1
  }

  _calculateVolumeScore(volume24h) {
    if (volume24h > 10000000) return 10
    if (volume24h > 5000000) return 8
    if (volume24h > 1000000) return 6
    if (volume24h > 500000) return 4
    if (volume24h > 100000) return 2
    return 1
  }

  _calculateMarketCapScore(marketCap) {
    if (marketCap > 100000000) return 10
    if (marketCap > 50000000) return 8
    if (marketCap > 10000000) return 6
    if (marketCap > 1000000) return 4
    if (marketCap > 100000) return 2
    return 1
  }

  _calculateHoldersScore(holders) {
    if (holders > 50000) return 10
    if (holders > 20000) return 8
    if (holders > 5000) return 6
    if (holders > 1000) return 4
    if (holders > 100) return 2
    return 1
  }

  _calculateTradingActivityScore(trades24h) {
    if (trades24h > 100000) return 10
    if (trades24h > 50000) return 8
    if (trades24h > 10000) return 6
    if (trades24h > 5000) return 4
    if (trades24h > 1000) return 2
    return 1
  }

  _identifyStrengths(scores) {
    return Object.entries(scores)
      .filter(([, score]) => score >= 7)
      .map(([name]) => name)
  }

  _identifyWeaknesses(scores) {
    return Object.entries(scores)
      .filter(([, score]) => score <= 3)
      .map(([name]) => name)
  }

  // ============== MARKET ANALYSIS ==============

  /**
   * Analyze market conditions
   */
  analyzeMarketConditions(marketSnapshot) {
    const analysis = {
      timestamp: Date.now(),
      marketTrend: this._analyzeMarketTrend(marketSnapshot),
      volatilityAssessment: this._assessVolatility(marketSnapshot),
      opportunityScore: 0,
      riskLevel: 'MEDIUM',
      recommendation: 'HOLD',
      summary: '',
    }

    // Calculate opportunity score
    if (marketSnapshot.binance?.ohlcv) {
      const indicators = this.calculateIndicators(marketSnapshot.binance.ohlcv)
      analysis.opportunityScore = this._calculateOpportunityScore(indicators)
    }

    // Determine risk level
    analysis.riskLevel = this._determineRiskLevel(analysis.opportunityScore)

    // Generate recommendation
    analysis.recommendation = this._generateRecommendation(
      analysis.marketTrend,
      analysis.opportunityScore,
      analysis.riskLevel
    )

    return analysis
  }

  _analyzeMarketTrend(snapshot) {
    if (!snapshot.binance?.ohlcv || snapshot.binance.ohlcv.length === 0) {
      return 'UNKNOWN'
    }

    const ohlcv = snapshot.binance.ohlcv
    const closes = ohlcv.map(c => c.close)
    const priceChange = ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100

    if (priceChange > 5) return 'STRONG_BULLISH'
    if (priceChange > 0) return 'BULLISH'
    if (priceChange > -5) return 'BEARISH'
    return 'STRONG_BEARISH'
  }

  _assessVolatility(snapshot) {
    if (!snapshot.binance?.ohlcv || snapshot.binance.ohlcv.length < 2) {
      return 'UNKNOWN'
    }

    const closes = snapshot.binance.ohlcv.map(c => c.close)
    const volatility = this._calculateVolatility(closes)

    if (volatility > 5) return 'VERY_HIGH'
    if (volatility > 3) return 'HIGH'
    if (volatility > 1) return 'MODERATE'
    return 'LOW'
  }

  _calculateOpportunityScore(indicators) {
    let score = 5 // Base score

    // Trend component
    if (indicators.trend === 'STRONG_UPTREND') score += 3
    else if (indicators.trend === 'UPTREND') score += 2
    else if (indicators.trend === 'DOWNTREND') score -= 2
    else if (indicators.trend === 'STRONG_DOWNTREND') score -= 3

    // RSI component
    if (indicators.rsi < 30) score += 2 // Oversold
    else if (indicators.rsi > 70) score -= 2 // Overbought

    // Volatility component
    if (indicators.volatility > 3) score += 1

    return Math.max(0, Math.min(10, score))
  }

  _determineRiskLevel(opportunityScore) {
    if (opportunityScore < 2) return 'VERY_HIGH'
    if (opportunityScore < 4) return 'HIGH'
    if (opportunityScore < 6) return 'MEDIUM'
    if (opportunityScore < 8) return 'LOW'
    return 'VERY_LOW'
  }

  _generateRecommendation(trend, opportunityScore, riskLevel) {
    if (trend === 'STRONG_BULLISH' && opportunityScore > 6 && riskLevel !== 'VERY_HIGH') {
      return 'BUY'
    }
    if (trend === 'STRONG_BEARISH' || opportunityScore < 3) {
      return 'SELL'
    }
    if (opportunityScore > 7) {
      return 'BUY'
    }
    return 'HOLD'
  }

  // ============== PRICE ANALYSIS ==============

  /**
   * Analyze price movements and patterns
   */
  analyzePriceAction(ohlcv) {
    if (ohlcv.length < 2) return null

    const recent = ohlcv.slice(-10) // Last 10 candles
    const patterns = {
      currentCandle: recent[recent.length - 1],
      previousCandle: recent[recent.length - 2],
      highestPrice: Math.max(...recent.map(c => c.high)),
      lowestPrice: Math.min(...recent.map(c => c.low)),
      averageVolume: recent.reduce((sum, c) => sum + c.volume, 0) / recent.length,
      bullishCandles: recent.filter(c => c.close > c.open).length,
      bearishCandles: recent.filter(c => c.close < c.open).length,
    }

    // Identify patterns
    patterns.supportLevel = this._findSupportLevel(ohlcv)
    patterns.resistanceLevel = this._findResistanceLevel(ohlcv)
    patterns.volumeProfile = this._analyzeVolumeProfile(recent)

    return patterns
  }

  _findSupportLevel(ohlcv) {
    const lows = ohlcv.map(c => c.low)
    return Math.min(...lows)
  }

  _findResistanceLevel(ohlcv) {
    const highs = ohlcv.map(c => c.high)
    return Math.max(...highs)
  }

  _analyzeVolumeProfile(ohlcv) {
    const totalVolume = ohlcv.reduce((sum, c) => sum + c.volume, 0)
    const avgVolume = totalVolume / ohlcv.length

    return {
      totalVolume,
      averageVolume: avgVolume,
      highVolume: Math.max(...ohlcv.map(c => c.volume)),
      lowVolume: Math.min(...ohlcv.map(c => c.volume)),
      volumeTrend: ohlcv[ohlcv.length - 1].volume > avgVolume ? 'INCREASING' : 'DECREASING',
    }
  }

  // ============== DATA EXTRACTION ==============

  /**
   * Extract specific fields from market data
   */
  extractData(data, fields) {
    const extracted = {}

    fields.forEach(field => {
      const value = this._getNestedValue(data, field)
      if (value !== undefined) {
        extracted[field] = value
      }
    })

    return extracted
  }

  _getNestedValue(obj, path) {
    const keys = path.split('.')
    let value = obj

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return undefined
      }
    }

    return value
  }

  /**
   * Convert market data to CSV format
   */
  toCSV(data, headers) {
    if (!Array.isArray(data) || data.length === 0) {
      return ''
    }

    const csvHeaders = headers.join(',')
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = this._getNestedValue(row, header)
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value
      }).join(',')
    })

    return [csvHeaders, ...csvRows].join('\n')
  }

  /**
   * Convert market data to JSON
   */
  toJSON(data) {
    return JSON.stringify(data, null, 2)
  }
}

const dataTransformer = new DataTransformer()
export default dataTransformer
