# PM2 Dashboard - Deployment Guide

## Prerequisites

- Node.js v18+ and npm
- PM2 installed globally: `npm install -g pm2`
- Git

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/ADR3-Club/Dashboard-Bots.git
cd Dashboard-Bots

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Backend configuration
cd backend
cp .env.example .env
nano .env  # Edit with your settings
```

**Required environment variables:**
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Backend port (default: 3000)
- `DB_PATH` - SQLite database path
- `CORS_ORIGIN` - Frontend URL

### 3. Initialize Database

```bash
cd backend
node src/scripts/init-db.js
```

This creates:
- Admin user (username: `admin`, password: `admin123`)
- Database tables

**⚠️ Change default password after first login!**

## Deployment

### Backend Deployment

```bash
cd backend

# Option 1: Using ecosystem file (recommended)
pm2 start ecosystem.config.js

# Option 2: Manual start
pm2 start src/server.js --name pm2-dashboard

# Check status
pm2 status
pm2 logs pm2-dashboard

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
```

### Frontend Build

```bash
cd frontend
npm run build
```

The built files are in `frontend/dist/`. Serve them with:
- Nginx (recommended for production)
- Express static middleware (already configured in backend)

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name dashboard.example.com;

    # Frontend
    location / {
        root /home/adr3bot/bot/Dashboard-Bots/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Updates

```bash
# Pull latest changes
cd /home/adr3bot/bot/Dashboard-Bots
git pull

# Update backend
cd backend
npm install
pm2 restart pm2-dashboard

# Update frontend
cd ../frontend
npm install
npm run build
```

## PM2 Commands

```bash
# View logs
pm2 logs pm2-dashboard
pm2 logs pm2-dashboard --lines 100

# Restart
pm2 restart pm2-dashboard

# Stop
pm2 stop pm2-dashboard

# Delete process
pm2 delete pm2-dashboard

# Monitor
pm2 monit
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs pm2-dashboard --err --lines 50

# Common issues:
# - Port already in use: Change PORT in .env
# - Database locked: Stop all instances and restart
# - Missing dependencies: Run npm install
```

### Frontend shows blank page
```bash
# Check browser console for errors
# Rebuild frontend:
cd frontend
rm -rf dist node_modules
npm install
npm run build
```

### Database issues
```bash
# Reset database (⚠️ deletes all data)
cd backend
rm database.sqlite
node src/scripts/init-db.js
pm2 restart pm2-dashboard
```

## Features

- ✅ Real-time PM2 process monitoring
- ✅ Process actions (start/stop/restart)
- ✅ Live logs streaming
- ✅ Action history tracking
- ✅ Real-time CPU/RAM metrics charts
- ✅ Crash alert monitoring system
- ✅ Dark mode support
- ✅ Multi-language (FR/EN)
- ✅ Responsive mobile design

## Tech Stack

**Backend:**
- Node.js + Express
- SQLite database
- JWT authentication
- PM2 programmatic API

**Frontend:**
- React + Vite
- TailwindCSS
- React Query
- Chart.js
- React Router

## Security

- Change default admin password
- Use strong JWT_SECRET in production
- Enable HTTPS with SSL certificate
- Configure CORS properly
- Keep dependencies updated

## Support

Report issues: https://github.com/ADR3-Club/Dashboard-Bots/issues
