const pm2Service = require('./pm2Service');

class MetricsService {
  constructor() {
    this.metricsBuffer = new Map(); // pmId -> [{timestamp, cpu, memory}]
    this.clients = new Set(); // SSE clients
    this.collectionInterval = null;
    this.isCollecting = false;
    this.maxBufferSize = 60; // Keep 2 minutes of data at 2s interval
  }

  /**
   * Start collecting metrics from PM2
   */
  startCollection() {
    if (this.isCollecting) {
      console.log('Metrics collection already running');
      return;
    }

    this.isCollecting = true;
    console.log('✓ Starting metrics collection (2s interval)');

    this.collectionInterval = setInterval(async () => {
      try {
        const processes = await pm2Service.listProcesses();

        processes.forEach(proc => {
          // Initialize buffer if not exists
          if (!this.metricsBuffer.has(proc.pm_id)) {
            this.metricsBuffer.set(proc.pm_id, []);
          }

          const buffer = this.metricsBuffer.get(proc.pm_id);

          // Add new metric point
          buffer.push({
            timestamp: Date.now(),
            cpu: proc.cpu,
            memory: proc.memory,
            status: proc.status
          });

          // Keep only last N points (circular buffer)
          if (buffer.length > this.maxBufferSize) {
            buffer.shift();
          }
        });

        // Broadcast to all connected SSE clients
        this.broadcast(processes);

      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, 2000); // Collect every 2 seconds
  }

  /**
   * Stop collecting metrics
   */
  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      this.isCollecting = false;
      console.log('✓ Metrics collection stopped');
    }
  }

  /**
   * Get historical metrics for a specific process
   */
  getProcessMetrics(pmId) {
    return this.metricsBuffer.get(pmId) || [];
  }

  /**
   * Get latest metrics for all processes
   */
  getAllLatestMetrics() {
    const latest = {};

    this.metricsBuffer.forEach((buffer, pmId) => {
      if (buffer.length > 0) {
        latest[pmId] = buffer[buffer.length - 1];
      }
    });

    return latest;
  }

  /**
   * Broadcast metrics to all connected SSE clients
   */
  broadcast(data) {
    if (this.clients.size === 0) return;

    const message = `data: ${JSON.stringify({
      type: 'metrics',
      timestamp: Date.now(),
      processes: data
    })}\n\n`;

    // Send to all clients
    this.clients.forEach(client => {
      try {
        client.write(message);
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        this.clients.delete(client);
      }
    });
  }

  /**
   * Add a new SSE client
   */
  addClient(res) {
    this.clients.add(res);
    console.log(`SSE client connected (total: ${this.clients.size})`);

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Metrics stream connected' })}\n\n`);

    // Send current metrics immediately
    pm2Service.listProcesses()
      .then(processes => {
        const message = `data: ${JSON.stringify({
          type: 'metrics',
          timestamp: Date.now(),
          processes
        })}\n\n`;
        res.write(message);
      })
      .catch(err => {
        console.error('Error sending initial metrics:', err);
      });

    // Remove client on disconnect
    res.on('close', () => {
      this.clients.delete(res);
      console.log(`SSE client disconnected (remaining: ${this.clients.size})`);
    });
  }

  /**
   * Get connected clients count
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Clear all metrics buffers
   */
  clearBuffers() {
    this.metricsBuffer.clear();
    console.log('✓ Metrics buffers cleared');
  }

  /**
   * Get buffer statistics
   */
  getBufferStats() {
    const stats = {
      totalProcesses: this.metricsBuffer.size,
      processes: {}
    };

    this.metricsBuffer.forEach((buffer, pmId) => {
      stats.processes[pmId] = {
        dataPoints: buffer.length,
        oldestTimestamp: buffer.length > 0 ? buffer[0].timestamp : null,
        newestTimestamp: buffer.length > 0 ? buffer[buffer.length - 1].timestamp : null
      };
    });

    return stats;
  }
}

// Export singleton instance
const metricsService = new MetricsService();
module.exports = metricsService;
