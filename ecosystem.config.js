module.exports = {
  apps: [
    {
      name: 'pm2-dashboard',
      script: './backend/src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        JWT_SECRET: 'CHANGE_THIS_IN_PRODUCTION',
        JWT_EXPIRATION: '24h',
        DB_PATH: './backend/database.sqlite',
        CORS_ORIGIN: 'http://localhost:3000',
        LOG_LEVEL: 'info',
        RATE_LIMIT_WINDOW: 15,
        RATE_LIMIT_MAX: 5
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        CORS_ORIGIN: 'http://localhost:5173'
      }
    }
  ]
};
