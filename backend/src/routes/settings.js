const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/settings/webhooks
 * Get webhook settings
 */
router.get('/webhooks', async (req, res) => {
  try {
    const settings = await notificationService.getWebhookSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error getting webhook settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get webhook settings'
    });
  }
});

/**
 * PUT /api/settings/webhooks
 * Update webhook settings
 */
router.put('/webhooks', async (req, res) => {
  try {
    const {
      discordEnabled,
      discordWebhookUrl,
      slackEnabled,
      slackWebhookUrl,
      notifyOnCrash,
      notifyOnAlert
    } = req.body;

    // Validate Discord webhook URL format if provided
    if (discordWebhookUrl && discordWebhookUrl.trim() !== '') {
      const discordPattern = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
      if (!discordPattern.test(discordWebhookUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Discord webhook URL format'
        });
      }
    }

    // Validate Slack webhook URL format if provided
    if (slackWebhookUrl && slackWebhookUrl.trim() !== '') {
      const slackPattern = /^https:\/\/hooks\.slack\.com\/services\/[\w\/]+$/;
      if (!slackPattern.test(slackWebhookUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Slack webhook URL format'
        });
      }
    }

    await notificationService.updateWebhookSettings({
      discordEnabled,
      discordWebhookUrl,
      slackEnabled,
      slackWebhookUrl,
      notifyOnCrash,
      notifyOnAlert
    });

    const updatedSettings = await notificationService.getWebhookSettings();

    res.json({
      success: true,
      message: 'Webhook settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating webhook settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update webhook settings'
    });
  }
});

/**
 * POST /api/settings/webhooks/test
 * Test webhook configuration
 */
router.post('/webhooks/test', async (req, res) => {
  try {
    const { type } = req.body; // 'discord' or 'slack'

    if (!['discord', 'slack'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook type. Must be "discord" or "slack"'
      });
    }

    const result = await notificationService.testWebhook(type);

    if (result.success) {
      res.json({
        success: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} webhook test sent successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Failed to send test webhook: ${result.reason}`
      });
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test webhook'
    });
  }
});

module.exports = router;
