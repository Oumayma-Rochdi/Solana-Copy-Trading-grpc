/**
 * Helius API Provider
 * Fetches on-chain transaction data, webhook support
 * Free tier: https://www.helius.xyz/
 */

import logger from '../../utils/logger.js'

class HeliusProvider {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.HELIUS_API_KEY
    this.baseUrl = 'https://api.helius.xyz/v0'
  }

  /**
   * Get recent transactions for a token
   */
  async getRecentTransactions(tokenMint, limit = 100) {
    try {
      const response = await fetch(
        `${this.baseUrl}/addresses/${tokenMint}/transactions?api-key=${this.apiKey}&limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`)
      }

      const transactions = await response.json()

      // Process and categorize transactions
      const processed = []

      for (const tx of transactions.slice(0, limit)) {
        const txData = {
          txHash: tx.signature,
          mint: tokenMint,
          type: this._categorizeTransaction(tx),
          timestamp: new Date(tx.timestamp * 1000),
          fee: tx.fee,
          status: tx.status?.Ok ? 'success' : 'failed',
          source: 'helius',
        }

        // Extract token amounts if available
        if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
          const transfer = tx.tokenTransfers[0]
          txData.amount = transfer.tokenAmount
          txData.decimals = transfer.decimals
          txData.fromAddress = transfer.fromUserAccount
          txData.toAddress = transfer.toUserAccount
        }

        processed.push(txData)
      }

      return processed
    } catch (error) {
      logger.error('[Helius] Error fetching transactions:', error)
      return []
    }
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenMint) {
    try {
      // Using Metaplex Token Registry API through Helius
      const response = await fetch(
        `${this.baseUrl}/tokens/${tokenMint}?api-key=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        logger.warn(`[Helius] Could not fetch metadata for ${tokenMint}`)
        return null
      }

      const data = await response.json()

      return {
        mint: tokenMint,
        name: data.name,
        symbol: data.symbol,
        logo: data.image,
        decimals: data.decimals,
        website: data.extensions?.website,
        twitter: data.extensions?.twitter,
        source: 'helius',
      }
    } catch (error) {
      logger.error('[Helius] Error fetching token metadata:', error)
      return null
    }
  }

  /**
   * Get wallet information
   */
  async getWalletTransactions(walletAddress, limit = 50) {
    try {
      const response = await fetch(
        `${this.baseUrl}/addresses/${walletAddress}/transactions?api-key=${this.apiKey}&limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Helius wallet error: ${response.statusText}`)
      }

      const transactions = await response.json()

      return transactions.map((tx) => ({
        txHash: tx.signature,
        timestamp: new Date(tx.timestamp * 1000),
        fee: tx.fee,
        status: tx.status?.Ok ? 'success' : 'failed',
        type: this._categorizeTransaction(tx),
        raw: tx,
        source: 'helius',
      }))
    } catch (error) {
      logger.error('[Helius] Error fetching wallet transactions:', error)
      return []
    }
  }

  /**
   * Detect whale transactions
   */
  async detectWhaleTransactions(tokenMint, minUsdValue = 100000) {
    try {
      const transactions = await this.getRecentTransactions(tokenMint, 1000)

      // Filter for large transactions
      const whaleTransactions = transactions.filter((tx) => {
        // This is simplified - in production you'd calculate actual USD value
        return tx.amount && tx.amount > 1000000 // Adjust threshold
      })

      return whaleTransactions.map((tx) => ({
        ...tx,
        isWhaleTrade: true,
        severity:
          tx.amount > 10000000 ? 'critical' : tx.amount > 1000000 ? 'high' : 'medium',
      }))
    } catch (error) {
      logger.error('[Helius] Error detecting whale transactions:', error)
      return []
    }
  }

  /**
   * Categorize transaction type
   */
  _categorizeTransaction(tx) {
    if (!tx.type) return 'unknown'

    const type = tx.type.toLowerCase()
    if (type.includes('swap')) return 'swap'
    if (type.includes('transfer')) return 'transfer'
    if (type.includes('mint')) return 'mint'
    if (type.includes('burn')) return 'burn'
    if (type.includes('liquidation')) return 'liquidation'

    return type
  }
}

export default new HeliusProvider()
