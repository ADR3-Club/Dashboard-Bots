const Redis = require('ioredis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.enabled = process.env.REDIS_ENABLED === 'true';
  }

  /**
   * Connect to Redis
   */
  async connect() {
    if (!this.enabled) {
      console.log('Redis disabled (set REDIS_ENABLED=true to enable)');
      return false;
    }

    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || 0),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('✓ Connected to Redis');
      return true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      console.log('Falling back to in-memory storage');
      this.enabled = false;
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✓ Disconnected from Redis');
    }
  }

  /**
   * Store metrics for a process (time series with 24h TTL)
   */
  async storeMetrics(pmId, metrics) {
    if (!this.isConnected) return false;

    try {
      const key = `metrics:${pmId}`;
      const timestamp = Date.now();
      const data = JSON.stringify({
        ...metrics,
        timestamp
      });

      // Add to sorted set with timestamp as score
      await this.client.zadd(key, timestamp, data);

      // Remove data older than 24 hours
      const cutoff = timestamp - (24 * 60 * 60 * 1000);
      await this.client.zremrangebyscore(key, '-inf', cutoff);

      // Set key expiry to 25 hours (safety margin)
      await this.client.expire(key, 90000);

      return true;
    } catch (error) {
      console.error('Error storing metrics in Redis:', error);
      return false;
    }
  }

  /**
   * Get metrics for a process within time range
   * @param {number} pmId - Process ID
   * @param {number} range - Time range in minutes (default: 120 = 2 hours)
   */
  async getMetrics(pmId, range = 120) {
    if (!this.isConnected) return null;

    try {
      const key = `metrics:${pmId}`;
      const now = Date.now();
      const from = now - (range * 60 * 1000);

      // Get metrics within time range
      const data = await this.client.zrangebyscore(key, from, now);

      return data.map(item => JSON.parse(item));
    } catch (error) {
      console.error('Error getting metrics from Redis:', error);
      return null;
    }
  }

  /**
   * Get aggregated metrics (for longer time ranges)
   * Aggregates data into intervals to reduce data points
   * @param {number} pmId - Process ID
   * @param {number} range - Time range in minutes
   * @param {number} interval - Aggregation interval in minutes (default: 5)
   */
  async getAggregatedMetrics(pmId, range = 1440, interval = 5) {
    if (!this.isConnected) return null;

    try {
      const rawMetrics = await this.getMetrics(pmId, range);
      if (!rawMetrics || rawMetrics.length === 0) return [];

      // Group metrics by interval
      const intervalMs = interval * 60 * 1000;
      const buckets = new Map();

      rawMetrics.forEach(metric => {
        const bucketKey = Math.floor(metric.timestamp / intervalMs) * intervalMs;

        if (!buckets.has(bucketKey)) {
          buckets.set(bucketKey, {
            timestamp: bucketKey,
            cpu: [],
            memory: [],
            status: metric.status
          });
        }

        const bucket = buckets.get(bucketKey);
        if (metric.cpu !== undefined) bucket.cpu.push(metric.cpu);
        if (metric.memory !== undefined) bucket.memory.push(metric.memory);
      });

      // Calculate averages for each bucket
      const aggregated = [];
      buckets.forEach((bucket) => {
        aggregated.push({
          timestamp: bucket.timestamp,
          cpu: bucket.cpu.length > 0
            ? bucket.cpu.reduce((a, b) => a + b, 0) / bucket.cpu.length
            : 0,
          memory: bucket.memory.length > 0
            ? bucket.memory.reduce((a, b) => a + b, 0) / bucket.memory.length
            : 0,
          status: bucket.status,
          dataPoints: bucket.cpu.length
        });
      });

      // Sort by timestamp
      return aggregated.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error aggregating metrics:', error);
      return null;
    }
  }

  /**
   * Cache any value with TTL
   */
  async set(key, value, ttlSeconds = 60) {
    if (!this.isConnected) return false;

    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return true;
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }

  /**
   * Get cached value
   */
  async get(key) {
    if (!this.isConnected) return null;

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  /**
   * Delete cached value
   */
  async del(key) {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Error deleting cache:', error);
      return false;
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return this.enabled && this.isConnected;
  }
}

// Export singleton instance
const redisService = new RedisService();
module.exports = redisService;
