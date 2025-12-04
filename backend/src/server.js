require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

// Import config and services
const database = require('./config/database');
const pm2Service = require('./services/pm2Service');
const metricsService = require('./services/metricsService');
const historyService = require('./services/historyService');
const alertService = require('./services/alertService');
const notificationService = require('./services/notificationService');

// Import routes
const authRoutes = require('./routes/auth');
const processesRoutes = require('./routes/processes');
const logsRoutes = require('./routes/logs');
const metricsRoutes = require('./routes/metrics');
const historyRoutes = require('./routes/history');
const alertsRoutes = require('./routes/alerts');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, configure for production
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || 5),
  message: {
    success: false,
    error: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to auth routes
app.use('/api/auth/login', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/processes', processesRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    pm2Connected: pm2Service.isConnected(),
    metricsCollecting: metricsService.isCollecting
  });
});

// Serve static frontend files in production
if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Catch-all route for SPA
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received, starting graceful shutdown...`);

  try {
    // Stop metrics collection
    metricsService.stopCollection();

    // Stop log tailing
    const logService = require('./services/logService');
    logService.stopAll();

    // Disconnect from PM2
    pm2Service.disconnect();

    // Close database connection
    await database.close();

    console.log('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Setup PM2 event listeners for crashes
function setupPM2EventListeners() {
  pm2Service.setupEventListeners(async (data) => {
    // Log crashes
    if (data.event === 'exit' && data.manually === false) {
      console.log(`Process ${data.process.name} crashed`);

      try {
        await historyService.logCrash(
          data.process.pm_id,
          data.process.name,
          data.process.pm2_env?.status,
          data.process.pm2_env?.exit_code
        );

        // Send crash notification
        await notificationService.notifyProcessCrash(
          data.process.name,
          data.process.pm_id,
          data.process.pm2_env?.exit_code
        );

        // Check if this crash triggers an alert
        const alertCheck = await alertService.checkProcessAlert(
          data.process.pm_id,
          data.process.name
        );

        if (alertCheck.shouldAlert) {
          console.warn(`⚠️  ALERT: Process ${data.process.name} has crashed ${alertCheck.crashCount} times in ${alertCheck.timeWindow} minutes (threshold: ${alertCheck.threshold})`);

          // Determine severity for notification
          const alerts = await alertService.getActiveAlerts();
          const alert = alerts.find(a => a.pmId === data.process.pm_id && a.processName === data.process.name);

          if (alert) {
            await notificationService.notifyAlert(
              data.process.name,
              data.process.pm_id,
              alertCheck.crashCount,
              alertCheck.threshold,
              alertCheck.timeWindow,
              alert.severity
            );
          }
        }
      } catch (error) {
        console.error('Error logging crash:', error);
      }
    }

    // Log auto restarts
    if (data.event === 'restart' && data.manually === false) {
      console.log(`Process ${data.process.name} auto-restarted`);

      try {
        await historyService.logRestart(
          data.process.pm_id,
          data.process.name,
          'auto',
          'system'
        );
      } catch (error) {
        console.error('Error logging restart:', error);
      }
    }
  });
}

// Initialize and start server
async function startServer() {
  try {
    console.log('=== PM2 Dashboard Server ===');
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Port: ${PORT}`);

    // Connect to database
    console.log('\n[1/4] Connecting to database...');
    await database.connect();
    await database.initialize();

    // Connect to PM2
    console.log('[2/4] Connecting to PM2...');
    await pm2Service.connect();

    // Setup PM2 event listeners
    console.log('[3/4] Setting up PM2 event listeners...');
    setupPM2EventListeners();

    // Start metrics collection
    console.log('[4/4] Starting metrics collection...');
    metricsService.startCollection();

    // Setup history cleanup cron job (runs daily at 2 AM)
    console.log('[5/5] Setting up history cleanup cron job...');
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('Running scheduled history cleanup...');
        const settings = await notificationService.getCleanupSettings();
        const result = await historyService.cleanOldHistory(settings.retentionDays);
        console.log(`History cleanup completed: ${result.restartsDeleted} restarts, ${result.crashesDeleted} crashes deleted`);
      } catch (error) {
        console.error('Error in scheduled history cleanup:', error);
      }
    });

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log(`\nPress Ctrl+C to stop\n`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
