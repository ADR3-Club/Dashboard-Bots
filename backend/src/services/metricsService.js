const pm2Service = require('./pm2Service');
const redisService = require('./redisService');

class MetricsService {
  constructor() {
    this.metricsBuffer = new Map(); // pmId -> [{timestamp, cpu, memory}]
    this.clients = new Set(); // SSE clients
    this.collectionInterval = null;
    this.isCollecting = false;
    // In-memory buffer: keep 50 minutes of data at 10s interval (300 points) as fallback
    this.maxBufferSize = 300;
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
    console.log('✓ Starting metrics collection (10s interval)');

    this.collectionInterval = setInterval(async () => {
      try {
        const processes = await pm2Service.listProcesses();

        for (const proc of processes) {
          const metricPoint = {
            timestamp: Date.now(),
            cpu: proc.cpu,
            memory: proc.memory,
            status: proc.status
          };

          // Store in Redis if available (for 24h history)
          if (redisService.isAvailable()) {
            await redisService.storeMetrics(proc.pm_id, metricPoint);
          }

          // Also store in memory buffer (fallback / recent data)
          if (!this.metricsBuffer.has(proc.pm_id)) {
            this.metricsBuffer.set(proc.pm_id, []);
          }

          const buffer = this.metricsBuffer.get(proc.pm_id);
          buffer.push(metricPoint);

          // Keep only last N points (circular buffer)
          if (buffer.length > this.maxBufferSize) {
            buffer.shift();
          }
        }

        // Broadcast to all connected SSE clients
        this.broadcast(processes);

      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, 10000); // Collect every 10 seconds
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
   * Thin out data to target number of points (evenly distributed)
   */
  thinOutData(data, targetPoints) {
    if (!data || data.length <= targetPoints) return data;

    const step = (data.length - 1) / (targetPoints - 1);
    const result = [];

    for (let i = 0; i < targetPoints; i++) {
      const index = Math.round(i * step);
      result.push(data[index]);
    }

    return result;
  }

  /**
   * Get historical metrics for a specific process
   * @param {number} pmId - Process ID
   * @param {number} range - Time range in minutes (default: 120 = 2 hours)
   */
  async getProcessMetrics(pmId, range = 120) {
    // Limit to 60 points for all ranges
    const maxPoints = 60;

    // For Redis available, fetch from Redis
    if (redisService.isAvailable()) {
      // For short ranges (<= 60 min), return raw data then thin out
      if (range <= 60) {
        const rawMetrics = await redisService.getMetrics(pmId, range);
        if (rawMetrics && rawMetrics.length > 0) {
          return this.thinOutData(rawMetrics, maxPoints);
        }
      } else {
        // For longer ranges, aggregate to reduce data points
        let interval = 3; // 3 minute intervals by default

        if (range >= 1440) {        // 24h -> 15 minute intervals (~100 points)
          interval = 15;
        } else if (range >= 360) {  // 6h -> 3 minute intervals (~120 points)
          interval = 3;
        }

        const aggregated = await redisService.getAggregatedMetrics(pmId, range, interval);
        if (aggregated && aggregated.length > 0) {
          return this.thinOutData(aggregated, maxPoints);
        }
      }
    }

    // Fallback to memory buffer (if Redis unavailable)
    const buffer = this.metricsBuffer.get(pmId) || [];

    // Filter by time range if needed
    if (range && buffer.length > 0) {
      const cutoff = Date.now() - (range * 60 * 1000);
      const filtered = buffer.filter(m => m.timestamp >= cutoff);
      return this.thinOutData(filtered, maxPoints);
    }

    return this.thinOutData(buffer, maxPoints);
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
