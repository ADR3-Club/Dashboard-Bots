const database = require('../config/database');

class HistoryService {
  /**
   * Log a restart event
   */
  async logRestart(pmId, processName, reason = 'manual', triggeredBy = 'system', previousUptime = 0) {
    try {
      const result = await database.run(
        `INSERT INTO restart_history (pm_id, process_name, reason, triggered_by, previous_uptime)
         VALUES (?, ?, ?, ?, ?)`,
        [pmId, processName, reason, triggeredBy, previousUptime]
      );

      return { id: result.id, success: true };
    } catch (error) {
      console.error('Error logging restart:', error);
      throw error;
    }
  }

  /**
   * Get restart history with optional filters
   */
  async getRestartHistory(filters = {}) {
    try {
      let query = 'SELECT * FROM restart_history WHERE 1=1';
      const params = [];

      // Filter by process name
      if (filters.processName) {
        query += ' AND process_name = ?';
        params.push(filters.processName);
      }

      // Filter by PM ID
      if (filters.pmId !== undefined) {
        query += ' AND pm_id = ?';
        params.push(filters.pmId);
      }

      // Filter by reason
      if (filters.reason) {
        query += ' AND reason = ?';
        params.push(filters.reason);
      }

      // Filter by triggered_by
      if (filters.triggeredBy) {
        query += ' AND triggered_by = ?';
        params.push(filters.triggeredBy);
      }

      // Filter by date range
      if (filters.startDate) {
        query += ' AND restart_time >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND restart_time <= ?';
        params.push(filters.endDate);
      }

      // Order by most recent first
      query += ' ORDER BY restart_time DESC';

      // Limit results
      const limit = filters.limit || 50;
      query += ' LIMIT ?';
      params.push(limit);

      const results = await database.query(query, params);
      return results;
    } catch (error) {
      console.error('Error getting restart history:', error);
      throw error;
    }
  }

  /**
   * Get restart count for a process
   */
  async getRestartCount(pmId, timeRange = '24h') {
    try {
      const timeRanges = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30
      };

      const hours = timeRanges[timeRange] || 24;
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const result = await database.get(
        `SELECT COUNT(*) as count
         FROM restart_history
         WHERE pm_id = ? AND restart_time >= ?`,
        [pmId, startTime]
      );

      return result.count || 0;
    } catch (error) {
      console.error('Error getting restart count:', error);
      throw error;
    }
  }

  /**
   * Log a crash event
   */
  async logCrash(pmId, processName, errorMessage = null, exitCode = null) {
    try {
      const result = await database.run(
        `INSERT INTO crash_logs (pm_id, process_name, error_message, exit_code)
         VALUES (?, ?, ?, ?)`,
        [pmId, processName, errorMessage, exitCode]
      );

      return { id: result.id, success: true };
    } catch (error) {
      console.error('Error logging crash:', error);
      throw error;
    }
  }

  /**
   * Get crash history with optional filters
   */
  async getCrashHistory(filters = {}) {
    try {
      let query = 'SELECT * FROM crash_logs WHERE 1=1';
      const params = [];

      // Filter by process name
      if (filters.processName) {
        query += ' AND process_name = ?';
        params.push(filters.processName);
      }

      // Filter by PM ID
      if (filters.pmId !== undefined) {
        query += ' AND pm_id = ?';
        params.push(filters.pmId);
      }

      // Filter by notified status
      if (filters.notified !== undefined) {
        query += ' AND notified = ?';
        params.push(filters.notified ? 1 : 0);
      }

      // Filter by date range
      if (filters.startDate) {
        query += ' AND crash_time >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND crash_time <= ?';
        params.push(filters.endDate);
      }

      // Order by most recent first
      query += ' ORDER BY crash_time DESC';

      // Limit results
      const limit = filters.limit || 50;
      query += ' LIMIT ?';
      params.push(limit);

      const results = await database.query(query, params);
      return results;
    } catch (error) {
      console.error('Error getting crash history:', error);
      throw error;
    }
  }

  /**
   * Mark crash as notified
   */
  async markCrashNotified(crashId) {
    try {
      await database.run(
        'UPDATE crash_logs SET notified = 1 WHERE id = ?',
        [crashId]
      );

      return { success: true };
    } catch (error) {
      console.error('Error marking crash as notified:', error);
      throw error;
    }
  }

  /**
   * Get timeline data for visualization
   */
  async getTimeline(processName = null, days = 7) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      let restartQuery = `
        SELECT restart_time as time, 'restart' as type, reason, triggered_by, process_name
        FROM restart_history
        WHERE restart_time >= ?
      `;
      let crashQuery = `
        SELECT crash_time as time, 'crash' as type, error_message as reason, process_name
        FROM crash_logs
        WHERE crash_time >= ?
      `;

      const params = [startDate];

      if (processName) {
        restartQuery += ' AND process_name = ?';
        crashQuery += ' AND process_name = ?';
        params.push(processName);
      }

      const restarts = await database.query(restartQuery, params);
      const crashes = await database.query(crashQuery, params);

      // Combine and sort by time
      const timeline = [...restarts, ...crashes].sort((a, b) => {
        return new Date(b.time) - new Date(a.time);
      });

      return timeline;
    } catch (error) {
      console.error('Error getting timeline:', error);
      throw error;
    }
  }

  /**
   * Get statistics summary
   */
  async getStatistics(timeRange = '24h') {
    try {
      const timeRanges = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30
      };

      const hours = timeRanges[timeRange] || 24;
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const totalRestarts = await database.get(
        'SELECT COUNT(*) as count FROM restart_history WHERE restart_time >= ?',
        [startTime]
      );

      const totalCrashes = await database.get(
        'SELECT COUNT(*) as count FROM crash_logs WHERE crash_time >= ?',
        [startTime]
      );

      const manualRestarts = await database.get(
        'SELECT COUNT(*) as count FROM restart_history WHERE restart_time >= ? AND reason = ?',
        [startTime, 'manual']
      );

      const autoRestarts = await database.get(
        'SELECT COUNT(*) as count FROM restart_history WHERE restart_time >= ? AND reason = ?',
        [startTime, 'auto']
      );

      return {
        timeRange,
        totalRestarts: totalRestarts.count || 0,
        totalCrashes: totalCrashes.count || 0,
        manualRestarts: manualRestarts.count || 0,
        autoRestarts: autoRestarts.count || 0
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Clean old history entries
   */
  async cleanOldHistory(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

      const restartResult = await database.run(
        'DELETE FROM restart_history WHERE restart_time < ?',
        [cutoffDate]
      );

      const crashResult = await database.run(
        'DELETE FROM crash_logs WHERE crash_time < ?',
        [cutoffDate]
      );

      return {
        restartsDeleted: restartResult.changes || 0,
        crashesDeleted: crashResult.changes || 0
      };
    } catch (error) {
      console.error('Error cleaning old history:', error);
      throw error;
    }
  }
}

// Export singleton instance
const historyService = new HistoryService();
module.exports = historyService;
