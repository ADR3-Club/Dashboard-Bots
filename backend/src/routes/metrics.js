const express = require('express');
const metricsService = require('../services/metricsService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/metrics/stream
 * Stream real-time metrics using SSE
 */
router.get('/stream', (req, res) => {
  try {
    // Add client to metrics service
    metricsService.addClient(res);

  } catch (error) {
    console.error('Error setting up metrics stream:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to setup metrics stream'
      });
    }
  }
});

/**
 * GET /api/metrics/:id
 * Get historical metrics for a specific process
 * Query params:
 *   - range: Time range in minutes (default: 120, max: 1440 = 24h)
 */
router.get('/:id', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    // Parse range parameter (default 2 hours, max 24 hours)
    let range = parseInt(req.query.range) || 120;
    range = Math.min(Math.max(range, 1), 1440); // Clamp between 1 min and 24h

    const metrics = await metricsService.getProcessMetrics(pmId, range);

    res.json({
      success: true,
      pmId,
      range,
      metrics,
      count: metrics.length
    });

  } catch (error) {
    console.error('Error getting process metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

/**
 * GET /api/metrics/latest
 * Get latest metrics for all processes
 */
router.get('/latest', (req, res) => {
  try {
    const latest = metricsService.getAllLatestMetrics();

    res.json({
      success: true,
      metrics: latest
    });

  } catch (error) {
    console.error('Error getting latest metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get latest metrics'
    });
  }
});

/**
 * GET /api/metrics/stats
 * Get metrics service statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = metricsService.getBufferStats();
    const clientCount = metricsService.getClientCount();

    res.json({
      success: true,
      stats: {
        ...stats,
        connectedClients: clientCount,
        isCollecting: metricsService.isCollecting
      }
    });

  } catch (error) {
    console.error('Error getting metrics stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

/**
 * POST /api/metrics/clear
 * Clear all metrics buffers
 */
router.post('/clear', (req, res) => {
  try {
    metricsService.clearBuffers();

    res.json({
      success: true,
      message: 'Metrics buffers cleared'
    });

  } catch (error) {
    console.error('Error clearing metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear metrics'
    });
  }
});

module.exports = router;
