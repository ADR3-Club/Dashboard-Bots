const database = require('../config/database');

class NotificationService {
  /**
   * Get webhook settings from database
   */
  async getWebhookSettings() {
    try {
      const settings = await database.query(
        `SELECT key, value FROM settings WHERE key LIKE 'webhook_%'`
      );

      const config = {
        discordEnabled: false,
        discordWebhookUrl: null,
        slackEnabled: false,
        slackWebhookUrl: null,
        notifyOnCrash: true,
        notifyOnAlert: true,
      };

      settings.forEach(setting => {
        if (setting.key === 'webhook_discord_enabled') {
          config.discordEnabled = setting.value === '1' || setting.value === 'true';
        } else if (setting.key === 'webhook_discord_url') {
          config.discordWebhookUrl = setting.value;
        } else if (setting.key === 'webhook_slack_enabled') {
          config.slackEnabled = setting.value === '1' || setting.value === 'true';
        } else if (setting.key === 'webhook_slack_url') {
          config.slackWebhookUrl = setting.value;
        } else if (setting.key === 'webhook_notify_crash') {
          config.notifyOnCrash = setting.value === '1' || setting.value === 'true';
        } else if (setting.key === 'webhook_notify_alert') {
          config.notifyOnAlert = setting.value === '1' || setting.value === 'true';
        }
      });

      return config;
    } catch (error) {
      console.error('Error getting webhook settings:', error);
      return {
        discordEnabled: false,
        discordWebhookUrl: null,
        slackEnabled: false,
        slackWebhookUrl: null,
        notifyOnCrash: true,
        notifyOnAlert: true,
      };
    }
  }

  /**
   * Update webhook settings
   */
  async updateWebhookSettings(newSettings) {
    try {
      const updates = [];

      if (newSettings.discordEnabled !== undefined) {
        updates.push(
          database.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            ['webhook_discord_enabled', newSettings.discordEnabled ? '1' : '0']
          )
        );
      }

      if (newSettings.discordWebhookUrl !== undefined) {
        updates.push(
          database.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            ['webhook_discord_url', newSettings.discordWebhookUrl || '']
          )
        );
      }

      if (newSettings.slackEnabled !== undefined) {
        updates.push(
          database.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            ['webhook_slack_enabled', newSettings.slackEnabled ? '1' : '0']
          )
        );
      }

      if (newSettings.slackWebhookUrl !== undefined) {
        updates.push(
          database.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            ['webhook_slack_url', newSettings.slackWebhookUrl || '']
          )
        );
      }

      if (newSettings.notifyOnCrash !== undefined) {
        updates.push(
          database.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            ['webhook_notify_crash', newSettings.notifyOnCrash ? '1' : '0']
          )
        );
      }

      if (newSettings.notifyOnAlert !== undefined) {
        updates.push(
          database.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            ['webhook_notify_alert', newSettings.notifyOnAlert ? '1' : '0']
          )
        );
      }

      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating webhook settings:', error);
      throw error;
    }
  }

  /**
   * Send Discord webhook notification
   */
  async sendDiscordNotification(title, description, color = 0x3b82f6, fields = []) {
    try {
      const settings = await this.getWebhookSettings();

      if (!settings.discordEnabled || !settings.discordWebhookUrl) {
        return { success: false, reason: 'Discord notifications not configured' };
      }

      const embed = {
        title,
        description,
        color,
        fields,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'PM2 Dashboard',
        },
      };

      const response = await fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });

      if (!response.ok) {
        console.error('Discord webhook failed:', response.status, await response.text());
        return { success: false, reason: 'Webhook request failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending Discord notification:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Send Slack webhook notification
   */
  async sendSlackNotification(text, attachments = []) {
    try {
      const settings = await this.getWebhookSettings();

      if (!settings.slackEnabled || !settings.slackWebhookUrl) {
        return { success: false, reason: 'Slack notifications not configured' };
      }

      const response = await fetch(settings.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, attachments }),
      });

      if (!response.ok) {
        console.error('Slack webhook failed:', response.status, await response.text());
        return { success: false, reason: 'Webhook request failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Notify about process crash
   */
  async notifyProcessCrash(processName, pmId, exitCode) {
    try {
      const settings = await this.getWebhookSettings();

      if (!settings.notifyOnCrash) {
        return { success: false, reason: 'Crash notifications disabled' };
      }

      const title = `=4 Process Crashed: ${processName}`;
      const description = `Process **${processName}** (ID: ${pmId}) has crashed.`;
      const fields = [
        { name: 'Process Name', value: processName, inline: true },
        { name: 'PM2 ID', value: pmId.toString(), inline: true },
        { name: 'Exit Code', value: exitCode?.toString() || 'Unknown', inline: true },
      ];

      const results = [];

      if (settings.discordEnabled) {
        results.push(await this.sendDiscordNotification(title, description, 0xef4444, fields));
      }

      if (settings.slackEnabled) {
        const slackText = `${title}\n${description}\nExit Code: ${exitCode || 'Unknown'}`;
        results.push(await this.sendSlackNotification(slackText));
      }

      return { success: results.some(r => r.success), results };
    } catch (error) {
      console.error('Error notifying process crash:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Notify about alert triggered
   */
  async notifyAlert(processName, pmId, crashCount, threshold, timeWindow, severity) {
    try {
      const settings = await this.getWebhookSettings();

      if (!settings.notifyOnAlert) {
        return { success: false, reason: 'Alert notifications disabled' };
      }

      const emoji = severity === 'critical' ? '=4' : severity === 'high' ? '=�' : '=�';
      const title = `${emoji} Alert: Unstable Process - ${processName}`;
      const description = `Process **${processName}** has crashed **${crashCount} times** in the last **${timeWindow} minutes** (threshold: ${threshold}).`;

      const colorMap = {
        critical: 0xef4444, // red
        high: 0xf97316,    // orange
        medium: 0xeab308,  // yellow
      };
      const color = colorMap[severity] || 0xeab308;

      const fields = [
        { name: 'Process Name', value: processName, inline: true },
        { name: 'PM2 ID', value: pmId.toString(), inline: true },
        { name: 'Severity', value: severity.toUpperCase(), inline: true },
        { name: 'Crash Count', value: crashCount.toString(), inline: true },
        { name: 'Time Window', value: `${timeWindow} min`, inline: true },
        { name: 'Threshold', value: threshold.toString(), inline: true },
      ];

      const results = [];

      if (settings.discordEnabled) {
        results.push(await this.sendDiscordNotification(title, description, color, fields));
      }

      if (settings.slackEnabled) {
        const slackText = `${title}\n${description}`;
        results.push(await this.sendSlackNotification(slackText));
      }

      return { success: results.some(r => r.success), results };
    } catch (error) {
      console.error('Error notifying alert:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Test webhook configuration
   */
  async testWebhook(type = 'discord') {
    try {
      const title = ' Test Notification';
      const description = 'This is a test notification from PM2 Dashboard. If you see this, your webhook is configured correctly!';
      const fields = [
        { name: 'Type', value: 'Test', inline: true },
        { name: 'Status', value: 'Success', inline: true },
      ];

      if (type === 'discord') {
        return await this.sendDiscordNotification(title, description, 0x10b981, fields);
      } else if (type === 'slack') {
        return await this.sendSlackNotification(`${title}\n${description}`);
      }

      return { success: false, reason: 'Unknown webhook type' };
    } catch (error) {
      console.error('Error testing webhook:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Test crash notification (simulated)
   */
  async testCrashNotification(type = 'discord') {
    try {
      const settings = await this.getWebhookSettings();

      if (!settings.notifyOnCrash) {
        return { success: false, reason: 'Crash notifications are disabled' };
      }

      const title = '🔴 [TEST] Process Crashed: example-bot';
      const description = 'Process **example-bot** (ID: 0) has crashed.\n\n*This is a test notification.*';
      const fields = [
        { name: 'Process Name', value: 'example-bot', inline: true },
        { name: 'PM2 ID', value: '0', inline: true },
        { name: 'Exit Code', value: '1', inline: true },
      ];

      if (type === 'discord' && settings.discordEnabled) {
        return await this.sendDiscordNotification(title, description, 0xef4444, fields);
      } else if (type === 'slack' && settings.slackEnabled) {
        return await this.sendSlackNotification(`${title}\n${description}\nExit Code: 1`);
      }

      return { success: false, reason: `${type} webhook not enabled` };
    } catch (error) {
      console.error('Error testing crash notification:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Test alert notification (simulated)
   */
  async testAlertNotification(type = 'discord') {
    try {
      const settings = await this.getWebhookSettings();

      if (!settings.notifyOnAlert) {
        return { success: false, reason: 'Alert notifications are disabled' };
      }

      const title = '🟠 [TEST] Alert: Unstable Process - example-bot';
      const description = 'Process **example-bot** has crashed **5 times** in the last **5 minutes** (threshold: 3).\n\n*This is a test notification.*';
      const fields = [
        { name: 'Process Name', value: 'example-bot', inline: true },
        { name: 'PM2 ID', value: '0', inline: true },
        { name: 'Severity', value: 'HIGH', inline: true },
        { name: 'Crash Count', value: '5', inline: true },
        { name: 'Time Window', value: '5 min', inline: true },
        { name: 'Threshold', value: '3', inline: true },
      ];

      if (type === 'discord' && settings.discordEnabled) {
        return await this.sendDiscordNotification(title, description, 0xf97316, fields);
      } else if (type === 'slack' && settings.slackEnabled) {
        return await this.sendSlackNotification(`${title}\n${description}`);
      }

      return { success: false, reason: `${type} webhook not enabled` };
    } catch (error) {
      console.error('Error testing alert notification:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Get cleanup settings
   */
  async getCleanupSettings() {
    try {
      const result = await database.get(
        `SELECT value FROM settings WHERE key = 'history_retention_days'`
      );

      return {
        retentionDays: result ? parseInt(result.value) : 30,
        autoCleanup: true, // Always enabled with cron job
      };
    } catch (error) {
      console.error('Error getting cleanup settings:', error);
      return {
        retentionDays: 30,
        autoCleanup: true,
      };
    }
  }

  /**
   * Update cleanup settings
   */
  async updateCleanupSettings(retentionDays) {
    try {
      await database.run(
        `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        ['history_retention_days', retentionDays.toString()]
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating cleanup settings:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
