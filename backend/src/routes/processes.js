const express = require('express');
const pm2Service = require('../services/pm2Service');
const historyService = require('../services/historyService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/processes
 * Get list of all PM2 processes
 */
router.get('/', async (req, res) => {
  try {
    const processes = await pm2Service.listProcesses();

    res.json({
      success: true,
      processes,
      count: processes.length
    });

  } catch (error) {
    console.error('Error listing processes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list processes'
    });
  }
});

/**
 * GET /api/processes/:id
 * Get details of a specific process
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

    const process = await pm2Service.getProcess(pmId);

    res.json({
      success: true,
      process
    });

  } catch (error) {
    console.error('Error getting process:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Process not found'
    });
  }
});

/**
 * POST /api/processes/:id/restart
 * Restart a specific process
 */
router.post('/:id/restart', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    // Get process info before restart
    const process = await pm2Service.getProcess(pmId);
    const previousUptime = Math.floor(process.uptime / 1000); // Convert to seconds

    // Restart the process
    await pm2Service.restartProcess(pmId);

    // Log restart in history
    await historyService.logRestart(
      pmId,
      process.name,
      'manual',
      req.user.username,
      previousUptime
    );

    res.json({
      success: true,
      message: `Process ${process.name} restarted successfully`
    });

  } catch (error) {
    console.error('Error restarting process:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to restart process'
    });
  }
});

/**
 * POST /api/processes/:id/stop
 * Stop a specific process
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    // Get process info before stopping
    const process = await pm2Service.getProcess(pmId);
    const previousUptime = Math.floor(process.uptime / 1000); // Convert to seconds

    // Stop the process
    await pm2Service.stopProcess(pmId);

    // Log stop in history
    await historyService.logStop(
      pmId,
      process.name,
      req.user.username,
      previousUptime
    );

    res.json({
      success: true,
      message: `Process ${process.name} stopped successfully`
    });

  } catch (error) {
    console.error('Error stopping process:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop process'
    });
  }
});

/**
 * POST /api/processes/:id/start
 * Start a specific process
 */
router.post('/:id/start', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    const process = await pm2Service.getProcess(pmId);
    await pm2Service.startProcess(pmId);

    // Log start in history
    await historyService.logStart(
      pmId,
      process.name,
      req.user.username
    );

    res.json({
      success: true,
      message: `Process ${process.name} started successfully`
    });

  } catch (error) {
    console.error('Error starting process:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start process'
    });
  }
});

/**
 * DELETE /api/processes/:id
 * Delete a process from PM2
 */
router.delete('/:id', async (req, res) => {
  try {
    const pmId = parseInt(req.params.id);

    if (isNaN(pmId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid process ID'
      });
    }

    const process = await pm2Service.getProcess(pmId);
    await pm2Service.deleteProcess(pmId);

    // Log delete in history
    await historyService.logDelete(
      pmId,
      process.name,
      req.user.username
    );

    res.json({
      success: true,
      message: `Process ${process.name} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting process:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete process'
    });
  }
});

module.exports = router;
