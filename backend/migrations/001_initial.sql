-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Restart history
CREATE TABLE IF NOT EXISTS restart_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pm_id INTEGER NOT NULL,
  process_name TEXT NOT NULL,
  restart_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  triggered_by TEXT,
  previous_uptime INTEGER
);

-- Crash logs
CREATE TABLE IF NOT EXISTS crash_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pm_id INTEGER NOT NULL,
  process_name TEXT NOT NULL,
  crash_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT,
  exit_code INTEGER,
  notified BOOLEAN DEFAULT 0
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_restart_history_process ON restart_history(process_name, restart_time);
CREATE INDEX IF NOT EXISTS idx_crash_logs_process ON crash_logs(process_name, crash_time);
