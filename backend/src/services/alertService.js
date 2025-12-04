const database = require('../config/database');
const historyService = require('./historyService');

class AlertService {
  /**
   * Default alert settings
   */
  static DEFAULT_SETTINGS = {
    crashThreshold: 3,        // Number of crashes
    timeWindowMinutes: 5,     // Time window in minutes
    enabled: true             // Whether alerts are enabled
  };

  /**
   * Get alert settings from database
   */
  async getAlertSettings() {
    try {
      const settings = await database.query(
        `SELECT key, value FROM settings WHERE key LIKE 'alert_%'`
      );

      const config = { ...AlertService.DEFAULT_SETTINGS };

      // Parse settings from database
      settings.forEach(setting => {
        if (setting.key === 'alert_crash_threshold') {
          config.crashThreshold = parseInt(setting.value, 10);
        } else if (setting.key === 'alert_time_window_minutes') {
          config.timeWindowMinutes = parseInt(setting.value, 10);
        } else if (setting.key === 'alert_enabled') {
          config.enabled = setting.value === 'true' || setting.value === '1';
        }
      });

      return config;
    } catch (error) {
      console.error('Error getting alert settings:', error);
      return AlertService.DEFAULT_SETTINGS;
    }
  }

  /**
   * Update alert settings
   */
  async updateAlertSettings(newSettings) {
    try {
      const updates = [];

      if (newSettings.crashThreshold !== undefined) {
        updates.push(
          database.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            ['alert_crash_threshold', newSettings.crashThreshold.toString()]
          )
        );
      }

      if (newSettings.timeWindowMinutes !== undefined) {
        updates.push(
          database.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            ['alert_time_window_minutes', newSettings.timeWindowMinutes.toString()]
          )
        );
      }

      if (newSettings.enabled !== undefined) {
        updates.push(
          database.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            ['alert_enabled', newSettings.enabled ? '1' : '0']
          )
        );
      }

      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating alert settings:', error);
      throw error;
    }
  }

  /**
   * Get crash count for a process within the time window
   */
  async getCrashCount(pmId, processName, timeWindowMinutes) {
    try {
      const result = await database.get(
        `SELECT COUNT(*) as count
         FROM crash_logs
         WHERE (pm_id = ? OR process_name = ?)
         AND crash_time >= datetime('now', '-' || ? || ' minutes')`,
        [pmId, processName, timeWindowMinutes]
      );

      return result?.count || 0;
    } catch (error) {
      console.error('Error getting crash count:', error);
      return 0;
    }
  }

  /**
   * Check if a specific process should trigger an alert
   */
  async checkProcessAlert(pmId, processName) {
    try {
      const settings = await this.getAlertSettings();

      if (!settings.enabled) {
        return { shouldAlert: false, crashCount: 0 };
      }

      const crashCount = await this.getCrashCount(
        pmId,
        processName,
        settings.timeWindowMinutes
      );

      const shouldAlert = crashCount >= settings.crashThreshold;

      return {
        shouldAlert,
        crashCount,
        threshold: settings.crashThreshold,
        timeWindow: settings.timeWindowMinutes
      };
    } catch (error) {
      console.error('Error checking process alert:', error);
      return { shouldAlert: false, crashCount: 0 };
    }
  }

  /**
   * Get all active alerts (processes that exceeded crash threshold)
   */
  async getActiveAlerts() {
    try {
      const settings = await this.getAlertSettings();

      if (!settings.enabled) {
        return [];
      }

      // Get all processes with crashes in the time window
      const crashes = await database.query(
        `SELECT
          pm_id,
          process_name,
          COUNT(*) as crash_count,
          MAX(crash_time) as last_crash_time,
          MIN(notified) as has_unnotified
         FROM crash_logs
         WHERE crash_time >= datetime('now', '-' || ? || ' minutes')
         GROUP BY pm_id, process_name
         HAVING crash_count >= ?
         ORDER BY last_crash_time DESC`,
        [settings.timeWindowMinutes, settings.crashThreshold]
      );

      // Format alert objects
      return crashes.map(crash => ({
        pmId: crash.pm_id,
        processName: crash.process_name,
        crashCount: crash.crash_count,
        lastCrashTime: crash.last_crash_time,
        threshold: settings.crashThreshold,
        timeWindow: settings.timeWindowMinutes,
        isNew: crash.has_unnotified === 0, // Has at least one unnotified crash
        severity: this.calculateSeverity(crash.crash_count, settings.crashThreshold)
      }));
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Calculate alert severity based on crash count
   */
  calculateSeverity(crashCount, threshold) {
    if (crashCount >= threshold * 3) return 'critical';
    if (crashCount >= threshold * 2) return 'high';
    if (crashCount >= threshold) return 'medium';
    return 'low';
  }

  /**
   * Dismiss/acknowledge an alert for a process
   * Marks all unnotified crashes for the process as notified
   */
  async dismissAlert(pmId, processName) {
    try {
      await database.run(
        `UPDATE crash_logs
         SET notified = 1
         WHERE (pm_id = ? OR process_name = ?) AND notified = 0`,
        [pmId, processName]
      );

      return { success: true };
    } catch (error) {
      console.error('Error dismissing alert:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics() {
    try {
      const settings = await this.getAlertSettings();

      const stats = await database.get(
        `SELECT
          COUNT(DISTINCT CASE WHEN crash_time >= datetime('now', '-' || ? || ' minutes') THEN process_name END) as active_processes,
          COUNT(CASE WHEN crash_time >= datetime('now', '-24 hours') THEN 1 END) as crashes_24h,
          COUNT(CASE WHEN notified = 0 THEN 1 END) as unacknowledged
         FROM crash_logs`,
        [settings.timeWindowMinutes]
      );

      return {
        activeAlertProcesses: stats?.active_processes || 0,
        crashes24h: stats?.crashes_24h || 0,
        unacknowledged: stats?.unacknowledged || 0
      };
    } catch (error) {
      console.error('Error getting alert statistics:', error);
      return {
        activeAlertProcesses: 0,
        crashes24h: 0,
        unacknowledged: 0
      };
    }
  }
}

module.exports = new AlertService();
