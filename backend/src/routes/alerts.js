const express = require('express');
const router = express.Router();
const alertService = require('../services/alertService');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/alerts
 * Get all active alerts
 */
router.get('/', async (req, res) => {
  try {
    const alerts = await alertService.getActiveAlerts();
    res.json({ success: true, alerts });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts'
    });
  }
});

/**
 * GET /api/alerts/statistics
 * Get alert statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await alertService.getAlertStatistics();
    res.json({ success: true, statistics });
  } catch (error) {
    console.error('Error getting alert statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alert statistics'
    });
  }
});

/**
 * GET /api/alerts/settings
 * Get alert configuration settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await alertService.getAlertSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error getting alert settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alert settings'
    });
  }
});

/**
 * PUT /api/alerts/settings
 * Update alert configuration settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { crashThreshold, timeWindowMinutes, enabled } = req.body;

    // Validation
    if (crashThreshold !== undefined && (crashThreshold < 1 || crashThreshold > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Crash threshold must be between 1 and 100'
      });
    }

    if (timeWindowMinutes !== undefined && (timeWindowMinutes < 1 || timeWindowMinutes > 1440)) {
      return res.status(400).json({
        success: false,
        message: 'Time window must be between 1 and 1440 minutes (24 hours)'
      });
    }

    await alertService.updateAlertSettings({
      crashThreshold,
      timeWindowMinutes,
      enabled
    });

    const updatedSettings = await alertService.getAlertSettings();

    res.json({
      success: true,
      message: 'Alert settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating alert settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert settings'
    });
  }
});

/**
 * POST /api/alerts/:pmId/dismiss
 * Dismiss/acknowledge an alert for a specific process
 */
router.post('/:pmId/dismiss', async (req, res) => {
  try {
    const pmId = parseInt(req.params.pmId, 10);
    const { processName } = req.body;

    if (!processName) {
      return res.status(400).json({
        success: false,
        message: 'Process name is required'
      });
    }

    await alertService.dismissAlert(pmId, processName);

    res.json({
      success: true,
      message: `Alert for ${processName} has been dismissed`
    });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss alert'
    });
  }
});

/**
 * GET /api/alerts/check/:pmId
 * Check if a specific process should trigger an alert
 */
router.get('/check/:pmId', async (req, res) => {
  try {
    const pmId = parseInt(req.params.pmId, 10);
    const { processName } = req.query;

    if (!processName) {
      return res.status(400).json({
        success: false,
        message: 'Process name is required'
      });
    }

    const alertStatus = await alertService.checkProcessAlert(pmId, processName);

    res.json({
      success: true,
      alert: alertStatus
    });
  } catch (error) {
    console.error('Error checking process alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check process alert'
    });
  }
});

module.exports = router;
