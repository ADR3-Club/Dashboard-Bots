const express = require('express');
const logService = require('../services/logService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/logs/:id/stream
 * Stream logs in real-time using SSE
 */
router.get('/:id/stream', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    // Start tailing logs and add client to SSE stream
    await logService.startTailing(pmId, res);

  } catch (error) {
    console.error('Error streaming logs:', error);

    // Send error via SSE if possible
    try {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: error.message || 'Failed to stream logs'
      })}\n\n`);
    } catch (e) {
      // If SSE headers not sent yet, send JSON error
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to stream logs'
        });
      }
    }
  }
});

/**
 * GET /api/logs/:id/history
 * Get historical logs (not streaming)
 */
router.get('/:id/history', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);
    const lines = parseInt(req.query.lines) || 100;

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    const result = await logService.getHistoricalLogs(pmId, lines);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error getting historical logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get logs'
    });
  }
});

/**
 * GET /api/logs/:id/errors
 * Get error logs
 */
router.get('/:id/errors', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);
    const lines = parseInt(req.query.lines) || 100;

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    const result = await logService.getErrorLogs(pmId, lines);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error getting error logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get error logs'
    });
  }
});

/**
 * POST /api/logs/:id/search
 * Search logs for a pattern
 */
router.post('/:id/search', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);
    const { query, type } = req.body;

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const result = await logService.searchLogs(pmId, query, type);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search logs'
    });
  }
});

/**
 * GET /api/logs/:id/export
 * Export logs as downloadable file
 */
router.get('/:id/export', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);
    const type = req.query.type || 'out';

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    const result = await logService.exportLogs(pmId, type);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.processName}-${type}.log"`
    );

    // Stream file to response
    const fs = require('fs');
    const stream = fs.createReadStream(result.path);

    stream.on('error', (error) => {
      console.error('Error streaming log file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to export logs'
        });
      }
    });

    stream.pipe(res);

  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export logs'
    });
  }
});

/**
 * GET /api/logs/stats
 * Get log service statistics
 */
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const stats = logService.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting log stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

module.exports = router;
