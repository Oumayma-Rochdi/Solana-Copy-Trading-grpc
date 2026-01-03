import logger from "../utils/logger.js"
import copyTrading from "./copyTrading.js"

// Dashboard API handlers for copy trading
export const copyTradingAPI = {
  // GET: Get all tracked wallets with stats
  getTrackedWallets: (req, res) => {
    try {
      const wallets = copyTrading.getTrackedWallets()
      res.json({
        success: true,
        data: wallets,
      })
    } catch (error) {
      logger.error("[CopyTradingAPI] Error getting tracked wallets", error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },

  // POST: Add wallet to track
  addWalletToTrack: (req, res) => {
    try {
      const { walletAddress, label, copyRatio } = req.body

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: "Wallet address is required",
        })
      }

      const wallet = copyTrading.addWalletToTrack(walletAddress, { label, copyRatio })
      res.json({
        success: true,
        data: wallet,
      })
    } catch (error) {
      logger.error("[CopyTradingAPI] Error adding wallet to track", error)
      res.status(400).json({
        success: false,
        error: error.message,
      })
    }
  },

  // DELETE: Remove wallet from tracking
  removeWalletFromTrack: (req, res) => {
    try {
      const { walletAddress } = req.params
      copyTrading.removeWalletFromTrack(walletAddress)
      res.json({
        success: true,
        message: "Wallet removed from tracking",
      })
    } catch (error) {
      logger.error("[CopyTradingAPI] Error removing wallet from track", error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },

  // GET: Get copy trading statistics
  getStats: (req, res) => {
    try {
      const stats = copyTrading.getStats()
      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      logger.error("[CopyTradingAPI] Error getting stats", error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },

  // GET: Get wallet specific stats
  getWalletStats: (req, res) => {
    try {
      const { walletAddress } = req.params
      const stats = copyTrading.getWalletStats(walletAddress)

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: "Wallet not found",
        })
      }

      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      logger.error("[CopyTradingAPI] Error getting wallet stats", error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },

  // POST: Enable/Disable copy trading
  toggleCopyTrading: (req, res) => {
    try {
      const { enabled } = req.body
      copyTrading.setEnabled(enabled)
      res.json({
        success: true,
        data: { enabled },
      })
    } catch (error) {
      logger.error("[CopyTradingAPI] Error toggling copy trading", error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },
}

export default copyTradingAPI
