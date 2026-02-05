import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../config.js';
import logger from '../utils/logger.js';
import riskManager from '../services/riskManager.js';
import notificationService from '../services/notifications.js';
import { copyTradingAPI } from '../services/copyTradingDashboard.js';
import aiAnalysis from '../services/aiAnalysis.js';
import aiPersistence from '../services/aiPersistence.js';
import solanaDataSync from '../services/solanaDataSync.js';
import solanaDataQuery from '../services/solanaDataQuery.js';

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: config.security.maxRequestsPerMinute,
  duration: 60,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static('dashboard/public'));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000),
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Copy Trading Routes
app.get('/api/copy-trading/wallets', copyTradingAPI.getTrackedWallets);
app.post('/api/copy-trading/wallets', copyTradingAPI.addWalletToTrack);
app.delete('/api/copy-trading/wallets/:walletAddress', copyTradingAPI.removeWalletFromTrack);
app.get('/api/copy-trading/stats', copyTradingAPI.getStats);
app.get('/api/copy-trading/stats/:walletAddress', copyTradingAPI.getWalletStats);
app.post('/api/copy-trading/toggle', copyTradingAPI.toggleCopyTrading);

// Get bot status and configuration
app.get('/api/status', (req, res) => {
  try {
    const status = {
      bot: {
        status: 'running',
        uptime: process.uptime(),
        version: '2.0.0',
        timestamp: new Date().toISOString(),
      },
      config: {
        trading: config.trading,
        risk: config.risk,
        pools: config.pools,
      },
    };
    
    res.json(status);
  } catch (error) {
    logger.error('Error getting bot status', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get risk metrics
app.get('/api/risk', (req, res) => {
  try {
    const riskMetrics = riskManager.getRiskMetrics();
    res.json(riskMetrics);
  } catch (error) {
    logger.error('Error getting risk metrics', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active positions
app.get('/api/positions', (req, res) => {
  try {
    const positions = riskManager.getActivePositions();
    const summary = riskManager.getPositionSummary();
    
    res.json({
      positions,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting positions', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trading history
app.get('/api/history', (req, res) => {
  try {
    const history = riskManager.tradeHistory || [];
    const dailyStats = riskManager.getDailyStats();
    
    res.json({
      history,
      dailyStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting trading history', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get daily statistics
app.get('/api/stats', (req, res) => {
  try {
    const dailyStats = riskManager.getDailyStats();
    res.json(dailyStats);
  } catch (error) {
    logger.error('Error getting daily stats', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Emergency actions
app.post('/api/emergency/close-all', async (req, res) => {
  try {
    const { reason } = req.body;
    const results = await riskManager.emergencyCloseAll(reason || 'dashboard_request');
    
    res.json({
      success: true,
      message: 'Emergency closure initiated',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error initiating emergency closure', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send test notification
app.post('/api/notifications/test', async (req, res) => {
  try {
    const { message, type } = req.body;
    await notificationService.sendNotification(
      message || 'Test notification from dashboard',
      type || 'info',
      { source: 'dashboard' }
    );
    
    res.json({
      success: true,
      message: 'Test notification sent',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error sending test notification', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update configuration (read-only for now, could be extended)
app.get('/api/config', (req, res) => {
  try {
    // Return safe configuration (no sensitive data)
    const safeConfig = {
      trading: config.trading,
      risk: config.risk,
      pools: config.pools,
      swap: config.swap,
      logging: config.logging,
    };
    
    res.json(safeConfig);
  } catch (error) {
    logger.error('Error getting configuration', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebSocket endpoint for real-time updates (placeholder)
app.get('/api/ws', (req, res) => {
  res.json({
    message: 'WebSocket endpoint - implement with Socket.IO for real-time updates',
    timestamp: new Date().toISOString(),
  });
});

// ============== AI Analysis Endpoints ==============

// Get market analysis
app.post('/api/ai/analyze-market', async (req, res) => {
  try {
    const { marketData } = req.body;

    if (!marketData) {
      return res.status(400).json({
        error: 'Missing marketData',
        timestamp: new Date().toISOString(),
      });
    }

    const analysis = await aiAnalysis.analyzeMarketConditions(marketData);

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in market analysis endpoint', error);
    res.status(500).json({
      error: 'Failed to analyze market',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Stream market analysis
app.post('/api/ai/analyze-market-stream', async (req, res) => {
  try {
    const { marketData } = req.body;

    if (!marketData) {
      return res.status(400).json({
        error: 'Missing marketData',
        timestamp: new Date().toISOString(),
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of aiAnalysis.streamMarketAnalysis(marketData)) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    logger.error('Error in streaming analysis endpoint', error);
    res.status(500).json({
      error: 'Failed to stream analysis',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get trading suggestions
app.post('/api/ai/suggestions', async (req, res) => {
  try {
    const positions = riskManager.getActivePositions();
    const { marketData } = req.body;

    if (!marketData) {
      return res.status(400).json({
        error: 'Missing marketData',
        timestamp: new Date().toISOString(),
      });
    }

    const suggestions = await aiAnalysis.getTradingSuggestions(positions, marketData);

    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error generating trading suggestions', error);
    res.status(500).json({
      error: 'Failed to generate suggestions',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Analyze specific token
app.post('/api/ai/analyze-token', async (req, res) => {
  try {
    const { tokenMint, tokenData } = req.body;

    if (!tokenMint || !tokenData) {
      return res.status(400).json({
        error: 'Missing tokenMint or tokenData',
        timestamp: new Date().toISOString(),
      });
    }

    const analysis = await aiAnalysis.analyzeToken(tokenMint, tokenData);

    res.json({
      success: true,
      analysis,
      tokenMint,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error analyzing token', error);
    res.status(500).json({
      error: 'Failed to analyze token',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get risk assessment
app.get('/api/ai/risk-assessment', async (req, res) => {
  try {
    const positions = riskManager.getActivePositions();
    const assessment = await aiAnalysis.getRiskAssessment(positions);

    res.json({
      success: true,
      assessment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in risk assessment endpoint', error);
    res.status(500).json({
      error: 'Failed to assess risk',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get AI analysis history
app.get('/api/ai/history', (req, res) => {
  try {
    const history = aiAnalysis.getHistory();
    const latest = aiAnalysis.getLatestAnalysis();

    res.json({
      success: true,
      total: history.length,
      latest,
      history: history.slice(-10), // Return last 10 entries
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting AI history', error);
    res.status(500).json({
      error: 'Failed to get history',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get current trading suggestions from AI
app.get('/api/ai/current-suggestions', (req, res) => {
  try {
    const suggestions = aiAnalysis.getTradeSuggestions();

    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting current suggestions', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Clear AI analysis history
app.post('/api/ai/clear-history', (req, res) => {
  try {
    aiAnalysis.clearHistory();

    res.json({
      success: true,
      message: 'AI analysis history cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error clearing AI history', error);
    res.status(500).json({
      error: 'Failed to clear history',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get AI statistics from database
app.get('/api/ai/statistics', async (req, res) => {
  try {
    const stats = await aiPersistence.getStatistics();

    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting AI statistics', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get AI analysis from database history
app.get('/api/ai/db-history', async (req, res) => {
  try {
    const type = req.query.type || 'all';
    const limit = parseInt(req.query.limit) || 50;

    const history = await aiPersistence.getAnalysisHistory(type, limit);

    res.json({
      success: true,
      history,
      count: history.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting DB history', error);
    res.status(500).json({
      error: 'Failed to get history',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get trading suggestions from database
app.get('/api/ai/db-suggestions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const suggestions = await aiPersistence.getTradingSuggestionsHistory(limit);

    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting DB suggestions', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get token analysis from database
app.get('/api/ai/token/:tokenMint', async (req, res) => {
  try {
    const { tokenMint } = req.params;
    const analysis = await aiPersistence.getTokenAnalysis(tokenMint);

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting token analysis', error);
    res.status(500).json({
      error: 'Failed to get token analysis',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============== Solana Real-Time Data Endpoints ==============

// Start data synchronization
app.post('/api/data/sync/start', async (req, res) => {
  try {
    const frequency = req.body.frequency || 30000; // 30 seconds default
    
    // Initialize database connection
    const dbConnected = await solanaDataSync.init();
    if (!dbConnected) {
      return res.status(400).json({
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      });
    }

    await solanaDataSync.start(frequency);

    res.json({
      success: true,
      message: 'Data synchronization started',
      frequency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error starting data sync', error);
    res.status(500).json({
      error: 'Failed to start data sync',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Stop data synchronization
app.post('/api/data/sync/stop', (req, res) => {
  try {
    solanaDataSync.stop();

    res.json({
      success: true,
      message: 'Data synchronization stopped',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error stopping data sync', error);
    res.status(500).json({
      error: 'Failed to stop data sync',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Add token to watch list
app.post('/api/data/watch', (req, res) => {
  try {
    const { tokenMint } = req.body;

    if (!tokenMint) {
      return res.status(400).json({
        error: 'Missing tokenMint',
        timestamp: new Date().toISOString(),
      });
    }

    solanaDataSync.addWatchedToken(tokenMint);

    res.json({
      success: true,
      message: 'Token added to watch list',
      tokenMint,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error adding watched token', error);
    res.status(500).json({
      error: 'Failed to add token',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Remove token from watch list
app.delete('/api/data/watch/:tokenMint', (req, res) => {
  try {
    const { tokenMint } = req.params;
    solanaDataSync.removeWatchedToken(tokenMint);

    res.json({
      success: true,
      message: 'Token removed from watch list',
      tokenMint,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error removing watched token', error);
    res.status(500).json({
      error: 'Failed to remove token',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get watched tokens
app.get('/api/data/watch', (req, res) => {
  try {
    const watched = solanaDataSync.getWatchedTokens();

    res.json({
      success: true,
      watched,
      count: watched.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting watched tokens', error);
    res.status(500).json({
      error: 'Failed to get watched tokens',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get current token price
app.get('/api/data/token/:mint/price', async (req, res) => {
  try {
    const { mint } = req.params;
    
    await solanaDataQuery.init();
    const price = await solanaDataQuery.getCurrentTokenPrice(mint);

    if (!price) {
      return res.status(404).json({
        error: 'Token price not found',
        mint,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      price,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting token price', error);
    res.status(500).json({
      error: 'Failed to get token price',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get token price history
app.get('/api/data/token/:mint/history', async (req, res) => {
  try {
    const { mint } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    await solanaDataQuery.init();
    const history = await solanaDataQuery.getTokenPriceHistory(mint, hours);

    res.json({
      success: true,
      mint,
      hours,
      history,
      count: history.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting price history', error);
    res.status(500).json({
      error: 'Failed to get price history',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get top gainers
app.get('/api/data/gainers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    await solanaDataQuery.init();
    const gainers = await solanaDataQuery.getTopGainers(limit);

    res.json({
      success: true,
      gainers,
      count: gainers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting top gainers', error);
    res.status(500).json({
      error: 'Failed to get gainers',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get top losers
app.get('/api/data/losers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    await solanaDataQuery.init();
    const losers = await solanaDataQuery.getTopLosers(limit);

    res.json({
      success: true,
      losers,
      count: losers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting top losers', error);
    res.status(500).json({
      error: 'Failed to get losers',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get whale transactions
app.get('/api/data/whale-transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    await solanaDataQuery.init();
    const transactions = await solanaDataQuery.getWhaleTransactions(limit);

    res.json({
      success: true,
      transactions,
      count: transactions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting whale transactions', error);
    res.status(500).json({
      error: 'Failed to get whale transactions',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get whale transactions for specific token
app.get('/api/data/token/:mint/whale-transactions', async (req, res) => {
  try {
    const { mint } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    await solanaDataQuery.init();
    const transactions = await solanaDataQuery.getTokenWhaleTransactions(mint, limit);

    res.json({
      success: true,
      mint,
      transactions,
      count: transactions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting token whale transactions', error);
    res.status(500).json({
      error: 'Failed to get whale transactions',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get recent transactions for token
app.get('/api/data/token/:mint/transactions', async (req, res) => {
  try {
    const { mint } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    await solanaDataQuery.init();
    const transactions = await solanaDataQuery.getRecentTransactions(mint, limit);

    res.json({
      success: true,
      mint,
      transactions,
      count: transactions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting recent transactions', error);
    res.status(500).json({
      error: 'Failed to get transactions',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get top liquidity pools
app.get('/api/data/pools', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    await solanaDataQuery.init();
    const pools = await solanaDataQuery.getTopLiquidityPools(limit);

    res.json({
      success: true,
      pools,
      count: pools.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting liquidity pools', error);
    res.status(500).json({
      error: 'Failed to get pools',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get pools for specific token
app.get('/api/data/token/:mint/pools', async (req, res) => {
  try {
    const { mint } = req.params;

    await solanaDataQuery.init();
    const pools = await solanaDataQuery.getTokenPools(mint);

    res.json({
      success: true,
      mint,
      pools,
      count: pools.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting token pools', error);
    res.status(500).json({
      error: 'Failed to get pools',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get token holders analysis
app.get('/api/data/token/:mint/holders', async (req, res) => {
  try {
    const { mint } = req.params;

    await solanaDataQuery.init();
    const holders = await solanaDataQuery.getTokenHolders(mint);

    res.json({
      success: true,
      mint,
      holders,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting token holders', error);
    res.status(500).json({
      error: 'Failed to get holders',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get volume statistics
app.get('/api/data/stats/volume', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;

    await solanaDataQuery.init();
    const stats = await solanaDataQuery.getVolumeStats(hours);

    res.json({
      success: true,
      stats,
      hours,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting volume stats', error);
    res.status(500).json({
      error: 'Failed to get volume stats',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get market cap statistics
app.get('/api/data/stats/marketcap', async (req, res) => {
  try {
    await solanaDataQuery.init();
    const stats = await solanaDataQuery.getMarketCapStats();

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting market cap stats', error);
    res.status(500).json({
      error: 'Failed to get market cap stats',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Search tokens
app.get('/api/data/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Missing search query',
        timestamp: new Date().toISOString(),
      });
    }

    await solanaDataQuery.init();
    const results = await solanaDataQuery.searchTokens(query);

    res.json({
      success: true,
      query,
      results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error searching tokens', error);
    res.status(500).json({
      error: 'Failed to search tokens',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get volatility analysis
app.get('/api/data/token/:mint/volatility', async (req, res) => {
  try {
    const { mint } = req.params;
    const days = parseInt(req.query.days) || 7;

    await solanaDataQuery.init();
    const analysis = await solanaDataQuery.getVolatilityAnalysis(mint, days);

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting volatility analysis', error);
    res.status(500).json({
      error: 'Failed to get volatility analysis',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get sentiment analysis
app.get('/api/data/token/:mint/sentiment', async (req, res) => {
  try {
    const { mint } = req.params;

    await solanaDataQuery.init();
    const sentiment = await solanaDataQuery.getSentimentAnalysis(mint);

    res.json({
      success: true,
      sentiment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting sentiment analysis', error);
    res.status(500).json({
      error: 'Failed to get sentiment analysis',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get sync statistics
app.get('/api/data/sync/stats', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;

    await solanaDataQuery.init();
    const stats = await solanaDataQuery.getSyncStats(hours);

    res.json({
      success: true,
      stats,
      hours,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting sync stats', error);
    res.status(500).json({
      error: 'Failed to get sync stats',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Dashboard error', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Dashboard server started on port ${PORT}`);
  logger.info(`Dashboard available at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down dashboard server');
  server.close(() => {
    logger.info('Dashboard server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down dashboard server');
  server.close(() => {
    logger.info('Dashboard server closed');
    process.exit(0);
  });
});

export default app;
