const express = require('express');
const historyService = require('../services/historyService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/history/restarts
 * Get restart history with optional filters
 */
router.get('/restarts', async (req, res) => {
  try {
    const filters = {
      processName: req.query.process,
      pmId: req.query.pmId ? parseInt(req.query.pmId) : undefined,
      reason: req.query.reason,
      triggeredBy: req.query.triggeredBy,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    const restarts = await historyService.getRestartHistory(filters);

    res.json({
      success: true,
      restarts,
      count: restarts.length
    });

  } catch (error) {
    console.error('Error getting restart history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restart history'
    });
  }
});

/**
 * GET /api/history/crashes
 * Get crash history with optional filters
 */
router.get('/crashes', async (req, res) => {
  try {
    const filters = {
      processName: req.query.process,
      pmId: req.query.pmId ? parseInt(req.query.pmId) : undefined,
      notified: req.query.notified !== undefined ? req.query.notified === 'true' : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    const crashes = await historyService.getCrashHistory(filters);

    res.json({
      success: true,
      crashes,
      count: crashes.length
    });

  } catch (error) {
    console.error('Error getting crash history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get crash history'
    });
  }
});

/**
 * GET /api/history/timeline
 * Get combined timeline of restarts and crashes
 */
router.get('/timeline', async (req, res) => {
  try {
    const processName = req.query.process;
    const days = req.query.days ? parseInt(req.query.days) : 7;

    const timeline = await historyService.getTimeline(processName, days);

    res.json({
      success: true,
      timeline,
      count: timeline.length,
      days
    });

  } catch (error) {
    console.error('Error getting timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get timeline'
    });
  }
});

/**
 * GET /api/history/statistics
 * Get statistics summary
 */
router.get('/statistics', async (req, res) => {
  try {
    const timeRange = req.query.range || '24h';
    const stats = await historyService.getStatistics(timeRange);

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

/**
 * GET /api/history/restarts/count/:id
 * Get restart count for a specific process
 */
router.get('/restarts/count/:id', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);
    const timeRange = req.query.range || '24h';

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    const count = await historyService.getRestartCount(pmId, timeRange);

    res.json({
      success: true,
      pmId,
      count,
      timeRange
    });

  } catch (error) {
    console.error('Error getting restart count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restart count'
    });
  }
});

/**
 * PUT /api/history/crashes/:id/notify
 * Mark crash as notified
 */
router.put('/crashes/:id/notify', async (req, res) => {
  try {
    const crashId = parseInt(req.params.id);

    if (isNaN(crashId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid crash ID'
      });
    }

    await historyService.markCrashNotified(crashId);

    res.json({
      success: true,
      message: 'Crash marked as notified'
    });

  } catch (error) {
    console.error('Error marking crash as notified:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark crash as notified'
    });
  }
});

/**
 * DELETE /api/history/clean
 * Clean old history entries
 */
router.delete('/clean', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;

    const result = await historyService.cleanOldHistory(days);

    res.json({
      success: true,
      message: `Cleaned history older than ${days} days`,
      deleted: result
    });

  } catch (error) {
    console.error('Error cleaning history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean history'
    });
  }
});

module.exports = router;
