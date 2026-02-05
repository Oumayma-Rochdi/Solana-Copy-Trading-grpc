/**
 * Initialization Service
 * Starts all services including data sync, AI analysis, and bot monitoring
 */

import logger from '../utils/logger.js'
import riskManager from './riskManager.js'
import solanaDataSync from './solanaDataSync.js'
import aiAnalysis from './aiAnalysis.js'
import aiPersistence from './aiPersistence.js'
import solanaDataQuery from './solanaDataQuery.js'

class InitializationService {
  constructor() {
    this.services = {
      riskManager: false,
      dataSync: false,
      aiAnalysis: false,
      aiPersistence: false,
      dataQuery: false,
    }
  }

  /**
   * Initialize all services
   */
  async initializeAll() {
    try {
      logger.info('[Init] Starting service initialization...')

      // Initialize Data Query (requires DB connection first)
      logger.info('[Init] Initializing Data Query service...')
      const queryInitialized = await solanaDataQuery.init()
      this.services.dataQuery = queryInitialized

      // Initialize Data Sync
      logger.info('[Init] Initializing Data Sync service...')
      const syncInitialized = await solanaDataSync.init()
      this.services.dataSync = syncInitialized

      // Initialize AI Persistence
      logger.info('[Init] Initializing AI Persistence service...')
      const aiPersistInitialized = await aiPersistence.init()
      this.services.aiPersistence = aiPersistInitialized

      // Initialize Risk Manager
      logger.info('[Init] Initializing Risk Manager...')
      riskManager.init()
      this.services.riskManager = true

      // Initialize AI Analysis
      logger.info('[Init] Initializing AI Analysis...')
      this.services.aiAnalysis = true

      // Log initialization results
      this._logInitResults()

      // Start optional services based on configuration
      await this._startOptionalServices()

      logger.info('[Init] All services initialized successfully!')
      return {
        success: true,
        services: this.services,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logger.error('[Init] Initialization failed:', error)
      return {
        success: false,
        error: error.message,
        services: this.services,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Start data synchronization
   */
  async startDataSync(frequency = 30000) {
    try {
      if (!this.services.dataSync) {
        logger.warn('[Init] Data Sync service not initialized')
        return false
      }

      logger.info(`[Init] Starting Data Sync (frequency: ${frequency}ms)`)

      // Add popular tokens to watch list if configured
      const watchTokens = process.env.WATCH_TOKENS?.split(',') || []
      for (const token of watchTokens) {
        if (token.trim()) {
          solanaDataSync.addWatchedToken(token.trim())
        }
      }

      await solanaDataSync.start(frequency)
      return true
    } catch (error) {
      logger.error('[Init] Failed to start Data Sync:', error)
      return false
    }
  }

  /**
   * Start AI analysis service
   */
  async startAIAnalysis() {
    try {
      logger.info('[Init] Starting AI Analysis service')

      if (!this.services.aiAnalysis) {
        logger.warn('[Init] AI Analysis service not initialized')
        return false
      }

      // AI Analysis runs on-demand, no continuous service needed
      logger.info('[Init] AI Analysis service ready')
      return true
    } catch (error) {
      logger.error('[Init] Failed to start AI Analysis:', error)
      return false
    }
  }

  /**
   * Start monitoring and alerts
   */
  async startMonitoring() {
    try {
      logger.info('[Init] Starting monitoring and alerts...')

      // Monitor risk levels
      setInterval(() => {
        const riskMetrics = riskManager.getRiskMetrics()
        const riskLevel = riskManager.calculateRiskLevel()

        if (riskLevel > 7) {
          logger.warn(`[Monitor] HIGH RISK LEVEL: ${riskLevel}/10`)
        }
      }, 60000) // Check every minute

      // Monitor data sync health
      setInterval(() => {
        if (solanaDataSync.isRunning) {
          logger.debug('[Monitor] Data sync is running')
        }
      }, 300000) // Check every 5 minutes

      logger.info('[Init] Monitoring started')
      return true
    } catch (error) {
      logger.error('[Init] Failed to start monitoring:', error)
      return false
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()

    return {
      timestamp: new Date().toISOString(),
      uptime,
      services: this.services,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
      },
      dataSyncRunning: solanaDataSync.isRunning,
      watchedTokens: solanaDataSync.getWatchedTokens().length,
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      logger.info('[Init] Initiating graceful shutdown...')

      // Stop data sync
      if (this.services.dataSync && solanaDataSync.isRunning) {
        logger.info('[Init] Stopping Data Sync...')
        solanaDataSync.stop()
      }

      // Close any open connections
      if (
        this.services.aiPersistence &&
        aiPersistence.db &&
        aiPersistence.db.end
      ) {
        logger.info('[Init] Closing database connections...')
        await aiPersistence.db.end()
      }

      if (
        this.services.dataQuery &&
        solanaDataQuery.db &&
        solanaDataQuery.db.end
      ) {
        logger.info('[Init] Closing query database...')
        await solanaDataQuery.db.end()
      }

      if (
        this.services.dataSync &&
        solanaDataSync.db &&
        solanaDataSync.db.end
      ) {
        logger.info('[Init] Closing sync database...')
        await solanaDataSync.db.end()
      }

      logger.info('[Init] Graceful shutdown completed')
      return true
    } catch (error) {
      logger.error('[Init] Error during shutdown:', error)
      return false
    }
  }

  /**
   * Start optional services based on env configuration
   */
  async _startOptionalServices() {
    try {
      // Start data sync if configured
      if (process.env.AUTO_START_DATA_SYNC === 'true') {
        const syncFrequency = parseInt(process.env.SYNC_FREQUENCY) || 30000
        await this.startDataSync(syncFrequency)
      }

      // Start AI Analysis if configured
      if (process.env.AUTO_START_AI === 'true') {
        await this.startAIAnalysis()
      }

      // Start monitoring if configured
      if (process.env.AUTO_START_MONITORING === 'true') {
        await this.startMonitoring()
      }
    } catch (error) {
      logger.error('[Init] Error starting optional services:', error)
    }
  }

  /**
   * Log initialization results
   */
  _logInitResults() {
    const results = Object.entries(this.services)
      .map(([service, initialized]) => `${service}: ${initialized ? '✓' : '✗'}`)
      .join(', ')

    logger.info(`[Init] Service status: ${results}`)
  }
}

export default new InitializationService()
