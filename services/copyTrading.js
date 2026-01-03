import logger from "../utils/logger.js"

// Copy Trading Service
class CopyTradingService {
  constructor() {
    this.trackedWallets = new Map()
    this.copiedTrades = new Map()
    this.settings = {
      enabled: process.env.ENABLE_COPY_TRADING === "true",
      maxCopyPositions: Number.parseInt(process.env.MAX_COPY_POSITIONS || "3"),
      copyAmount: Number.parseFloat(process.env.COPY_AMOUNT || "0.05"), // SOL
      copyRatio: Number.parseFloat(process.env.COPY_RATIO || "1.0"), // 1:1 copy
      minWalletAge: Number.parseInt(process.env.MIN_WALLET_AGE || "7"), // days
      minWinRate: Number.parseFloat(process.env.MIN_WIN_RATE || "0.5"), // 50%
      skipCheckTokenAge: process.env.SKIP_TOKEN_AGE_CHECK === "true",
    }
    this.stats = {
      totalCopiedTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalProfit: 0,
    }
  }

  // Add wallet to track
  addWalletToTrack(walletAddress, options = {}) {
    if (!walletAddress || walletAddress.length < 40) {
      throw new Error("Invalid wallet address")
    }

    this.trackedWallets.set(walletAddress, {
      address: walletAddress,
      label: options.label || `Trader_${walletAddress.slice(0, 6)}`,
      enabled: options.enabled !== false,
      copyRatio: options.copyRatio || this.settings.copyRatio,
      maxCopy: options.maxCopy || this.settings.maxCopyPositions,
      minWinRate: options.minWinRate || this.settings.minWinRate,
      stats: {
        tradedCount: 0,
        winCount: 0,
        lossCount: 0,
        totalPnl: 0,
        copiedCount: 0,
      },
      addedAt: new Date(),
    })

    logger.info(`[Copy-Trading] Added wallet to track: ${options.label || walletAddress}`)
    return this.trackedWallets.get(walletAddress)
  }

  // Remove wallet from tracking
  removeWalletFromTrack(walletAddress) {
    this.trackedWallets.delete(walletAddress)
    logger.info(`[Copy-Trading] Removed wallet from tracking: ${walletAddress}`)
  }

  // Get all tracked wallets
  getTrackedWallets() {
    return Array.from(this.trackedWallets.values())
  }

  // Check if wallet is being tracked
  isWalletTracked(walletAddress) {
    return this.trackedWallets.has(walletAddress)
  }

  // Process transaction from tracked wallet
  async processTrackedWalletTransaction(transaction) {
    if (!this.settings.enabled) return null

    const fromAddress = transaction.from

    if (!this.isWalletTracked(fromAddress)) {
      return null
    }

    const walletData = this.trackedWallets.get(fromAddress)

    if (!walletData.enabled) {
      return null
    }

    try {
      // Check win rate
      if (walletData.stats.tradedCount > 0) {
        const winRate = walletData.stats.winCount / walletData.stats.tradedCount
        if (winRate < walletData.minWinRate) {
          logger.warn(
            `[Copy-Trading] Skipping copy - Win rate ${(winRate * 100).toFixed(2)}% below minimum ${(walletData.minWinRate * 100).toFixed(2)}%`,
          )
          return null
        }
      }

      // Check if already at max positions
      const activePositions = Array.from(this.copiedTrades.values()).filter(
        (t) => t.walletAddress === fromAddress && t.status === "active",
      ).length

      if (activePositions >= walletData.maxCopy) {
        logger.warn(`[Copy-Trading] Max copy positions reached for wallet: ${walletData.label}`)
        return null
      }

      // Copy the trade
      const copiedTrade = {
        id: `${fromAddress}-${Date.now()}`,
        walletAddress: fromAddress,
        walletLabel: walletData.label,
        originalAmount: transaction.amount,
        copyAmount: this.settings.copyAmount * walletData.copyRatio,
        tokenMint: transaction.tokenMint,
        isBuy: transaction.isBuy,
        status: "pending",
        originalTx: transaction.hash,
        copiedAt: new Date(),
        entryPrice: transaction.price,
      }

      this.copiedTrades.set(copiedTrade.id, copiedTrade)
      walletData.stats.copiedCount++
      this.stats.totalCopiedTrades++

      logger.info(
        `[Copy-Trading] Copied trade from ${walletData.label}: ${copiedTrade.isBuy ? "BUY" : "SELL"} ${copiedTrade.tokenMint.slice(0, 8)}... with ${copiedTrade.copyAmount} SOL`,
      )

      return copiedTrade
    } catch (error) {
      logger.error("[Copy-Trading] Error processing tracked wallet transaction", error)
      this.stats.failedTrades++
      return null
    }
  }

  // Update trade outcome
  updateTradeOutcome(tradeId, outcome) {
    const trade = this.copiedTrades.get(tradeId)

    if (!trade) return null

    const walletData = this.trackedWallets.get(trade.walletAddress)

    if (walletData) {
      walletData.stats.tradedCount++

      if (outcome.isWin) {
        walletData.stats.winCount++
        this.stats.successfulTrades++
      } else {
        walletData.stats.lossCount++
        this.stats.failedTrades++
      }

      walletData.stats.totalPnl += outcome.pnl
      this.stats.totalProfit += outcome.pnl
    }

    trade.status = outcome.isWin ? "closed_profit" : "closed_loss"
    trade.exitPrice = outcome.exitPrice
    trade.pnl = outcome.pnl
    trade.closedAt = new Date()

    logger.info(
      `[Copy-Trading] Trade closed: ${trade.walletLabel} - ${outcome.isWin ? "PROFIT" : "LOSS"} ${outcome.pnl.toFixed(4)} SOL`,
    )

    return trade
  }

  // Get stats for specific wallet
  getWalletStats(walletAddress) {
    const wallet = this.trackedWallets.get(walletAddress)
    return wallet ? wallet.stats : null
  }

  // Get copy trading statistics
  getStats() {
    return {
      ...this.stats,
      totalTrackedWallets: this.trackedWallets.size,
      activeCopies: Array.from(this.copiedTrades.values()).filter((t) => t.status === "active").length,
      trackedWallets: this.getTrackedWallets(),
    }
  }

  // Reset daily stats
  resetDailyStats() {
    for (const wallet of this.trackedWallets.values()) {
      wallet.stats = {
        tradedCount: 0,
        winCount: 0,
        lossCount: 0,
        totalPnl: 0,
        copiedCount: 0,
      }
    }
  }

  // Enable/Disable copy trading
  setEnabled(enabled) {
    this.settings.enabled = enabled
    logger.info(`[Copy-Trading] Service ${enabled ? "enabled" : "disabled"}`)
  }
}

export default new CopyTradingService()
