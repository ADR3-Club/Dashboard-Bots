const { Tail } = require('tail');
const fs = require('fs');
const path = require('path');
const pm2Service = require('./pm2Service');

class LogService {
  constructor() {
    this.activeTails = new Map(); // pmId -> { tail, clients: Set }
    this.maxLinesPerRequest = 100;
  }

  /**
   * Start tailing logs for a specific process and add client
   */
  async startTailing(pmId, client) {
    try {
      const process = await pm2Service.getProcess(pmId);
      const logPath = process.pm2_env.pm_out_log_path;

      // Check if log file exists
      if (!fs.existsSync(logPath)) {
        throw new Error(`Log file not found: ${logPath}`);
      }

      // Setup SSE headers
      client.setHeader('Content-Type', 'text/event-stream');
      client.setHeader('Cache-Control', 'no-cache');
      client.setHeader('Connection', 'keep-alive');
      client.setHeader('X-Accel-Buffering', 'no');

      // Send connection message
      client.write(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Log stream connected',
        process: process.name
      })}\n\n`);

      // Check if we're already tailing this log
      if (this.activeTails.has(pmId)) {
        const tailData = this.activeTails.get(pmId);
        tailData.clients.add(client);
        console.log(`Added client to existing tail for process ${pmId} (${process.name})`);
      } else {
        // Create new tail
        const tail = new Tail(logPath, {
          fromBeginning: false,
          follow: true,
          useWatchFile: true,
          fsWatchOptions: {
            interval: 1000
          }
        });

        const clients = new Set([client]);
        this.activeTails.set(pmId, { tail, clients, processName: process.name });

        // Handle new log lines
        tail.on('line', (line) => {
          const message = `data: ${JSON.stringify({
            type: 'log',
            line,
            timestamp: Date.now()
          })}\n\n`;

          // Broadcast to all clients watching this process
          clients.forEach(c => {
            try {
              c.write(message);
            } catch (error) {
              console.error('Error writing to client:', error);
              clients.delete(c);
            }
          });
        });

        // Handle tail errors
        tail.on('error', (error) => {
          console.error(`Tail error for process ${pmId}:`, error);
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            message: error.message
          })}\n\n`;

          clients.forEach(c => {
            try {
              c.write(errorMessage);
            } catch (e) {
              clients.delete(c);
            }
          });
        });

        console.log(`Started tailing logs for process ${pmId} (${process.name})`);
      }

      // Remove client on disconnect
      client.on('close', () => {
        this.removeClient(pmId, client);
      });

      // Read and send last N lines immediately
      this.sendRecentLines(logPath, client, 50);

    } catch (error) {
      console.error(`Error starting tail for process ${pmId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a client from tailing
   */
  removeClient(pmId, client) {
    if (this.activeTails.has(pmId)) {
      const tailData = this.activeTails.get(pmId);
      tailData.clients.delete(client);

      console.log(`Client removed from tail ${pmId} (remaining: ${tailData.clients.size})`);

      // If no more clients, stop tailing
      if (tailData.clients.size === 0) {
        tailData.tail.unwatch();
        this.activeTails.delete(pmId);
        console.log(`Stopped tailing logs for process ${pmId}`);
      }
    }
  }

  /**
   * Send recent log lines to client
   */
  sendRecentLines(logPath, client, lineCount = 50) {
    try {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      const recentLines = lines.slice(-lineCount);

      recentLines.forEach(line => {
        const message = `data: ${JSON.stringify({
          type: 'log',
          line,
          timestamp: Date.now(),
          historical: true
        })}\n\n`;
        client.write(message);
      });

    } catch (error) {
      console.error('Error reading recent lines:', error);
    }
  }

  /**
   * Get historical logs (not streaming)
   */
  async getHistoricalLogs(pmId, lines = 100) {
    try {
      const process = await pm2Service.getProcess(pmId);
      const logPath = process.pm2_env.pm_out_log_path;

      if (!fs.existsSync(logPath)) {
        return { logs: [], error: 'Log file not found' };
      }

      const content = fs.readFileSync(logPath, 'utf8');
      const allLines = content.split('\n').filter(line => line.trim());
      const recentLines = allLines.slice(-Math.min(lines, this.maxLinesPerRequest));

      return {
        logs: recentLines,
        totalLines: allLines.length,
        processName: process.name
      };

    } catch (error) {
      console.error('Error reading historical logs:', error);
      throw error;
    }
  }

  /**
   * Get error logs
   */
  async getErrorLogs(pmId, lines = 100) {
    try {
      const process = await pm2Service.getProcess(pmId);
      const errLogPath = process.pm2_env.pm_err_log_path;

      if (!fs.existsSync(errLogPath)) {
        return { logs: [], error: 'Error log file not found' };
      }

      const content = fs.readFileSync(errLogPath, 'utf8');
      const allLines = content.split('\n').filter(line => line.trim());
      const recentLines = allLines.slice(-Math.min(lines, this.maxLinesPerRequest));

      return {
        logs: recentLines,
        totalLines: allLines.length,
        processName: process.name
      };

    } catch (error) {
      console.error('Error reading error logs:', error);
      throw error;
    }
  }

  /**
   * Search logs for a pattern
   */
  async searchLogs(pmId, searchQuery, type = 'out') {
    try {
      const process = await pm2Service.getProcess(pmId);
      const logPath = type === 'error'
        ? process.pm2_env.pm_err_log_path
        : process.pm2_env.pm_out_log_path;

      if (!fs.existsSync(logPath)) {
        return { matches: [], error: 'Log file not found' };
      }

      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n');

      const regex = new RegExp(searchQuery, 'gi');
      const matches = lines
        .map((line, index) => ({ line, lineNumber: index + 1 }))
        .filter(item => regex.test(item.line));

      return {
        matches: matches.slice(-this.maxLinesPerRequest), // Limit results
        totalMatches: matches.length,
        processName: process.name
      };

    } catch (error) {
      console.error('Error searching logs:', error);
      throw error;
    }
  }

  /**
   * Export logs to file
   */
  async exportLogs(pmId, type = 'out') {
    try {
      const process = await pm2Service.getProcess(pmId);
      const logPath = type === 'error'
        ? process.pm2_env.pm_err_log_path
        : process.pm2_env.pm_out_log_path;

      if (!fs.existsSync(logPath)) {
        throw new Error('Log file not found');
      }

      return {
        path: logPath,
        processName: process.name,
        type
      };

    } catch (error) {
      console.error('Error exporting logs:', error);
      throw error;
    }
  }

  /**
   * Stop all tailing
   */
  stopAll() {
    this.activeTails.forEach((tailData, pmId) => {
      tailData.tail.unwatch();
      console.log(`Stopped tailing logs for process ${pmId}`);
    });
    this.activeTails.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      activeTails: this.activeTails.size,
      processes: []
    };

    this.activeTails.forEach((tailData, pmId) => {
      stats.processes.push({
        pmId,
        processName: tailData.processName,
        clients: tailData.clients.size
      });
    });

    return stats;
  }
}

// Export singleton instance
const logService = new LogService();
module.exports = logService;
