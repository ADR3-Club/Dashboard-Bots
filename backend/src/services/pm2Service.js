const pm2 = require('pm2');

class PM2Service {
  constructor() {
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Connect to PM2 daemon
   */
  async connect() {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('PM2 connection error:', err);
          reject(err);
        } else {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('✓ Connected to PM2 daemon');
          resolve();
        }
      });
    });
  }

  /**
   * Reconnect to PM2 with exponential backoff
   */
  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error('Max PM2 reconnection attempts reached');
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Reconnecting to PM2... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    await new Promise(resolve => setTimeout(resolve, delay));
    return this.connect();
  }

  /**
   * Get list of all PM2 processes with formatted data
   */
  async listProcesses() {
    return new Promise((resolve, reject) => {
      pm2.list((err, processes) => {
        if (err) {
          console.error('Error listing PM2 processes:', err);
          reject(err);
        } else {
          const formatted = processes.map(proc => ({
            pm_id: proc.pm_id,
            name: proc.name,
            status: proc.pm2_env.status,
            uptime: proc.pm2_env.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
            cpu: proc.monit ? proc.monit.cpu : 0,
            memory: proc.monit ? proc.monit.memory : 0,
            restarts: proc.pm2_env.restart_time || 0,
            version: proc.pm2_env.version,
            pid: proc.pid,
            pm2_env: {
              pm_out_log_path: proc.pm2_env.pm_out_log_path,
              pm_err_log_path: proc.pm2_env.pm_err_log_path,
              exec_mode: proc.pm2_env.exec_mode,
              instances: proc.pm2_env.instances
            }
          }));
          resolve(formatted);
        }
      });
    });
  }

  /**
   * Get details of a single process by PM2 ID
   */
  async getProcess(pmId) {
    const processes = await this.listProcesses();
    const process = processes.find(p => p.pm_id === parseInt(pmId));

    if (!process) {
      throw new Error(`Process with PM ID ${pmId} not found`);
    }

    return process;
  }

  /**
   * Get details of a single process by name
   */
  async getProcessByName(name) {
    const processes = await this.listProcesses();
    const process = processes.find(p => p.name === name);

    if (!process) {
      throw new Error(`Process with name "${name}" not found`);
    }

    return process;
  }

  /**
   * Get process by ID or name (helper for routes)
   */
  async getProcessByIdOrName(identifier) {
    // If it's a number, search by ID
    if (!isNaN(identifier)) {
      return this.getProcess(parseInt(identifier));
    }
    // Otherwise search by name
    return this.getProcessByName(decodeURIComponent(identifier));
  }

  /**
   * Get extended details of a single process by PM2 ID or name
   */
  async getProcessDetails(identifier) {
    return new Promise((resolve, reject) => {
      pm2.list((err, processes) => {
        if (err) {
          console.error('Error getting process details:', err);
          reject(err);
          return;
        }

        // Find by ID or name
        let proc;
        if (!isNaN(identifier)) {
          proc = processes.find(p => p.pm_id === parseInt(identifier));
        } else {
          proc = processes.find(p => p.name === decodeURIComponent(identifier));
        }

        if (!proc) {
          reject(new Error(`Process "${identifier}" not found`));
          return;
        }

        // Return extended process information
        const details = {
          pm_id: proc.pm_id,
          name: proc.name,
          status: proc.pm2_env.status,
          pid: proc.pid,
          uptime: proc.pm2_env.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
          cpu: proc.monit ? proc.monit.cpu : 0,
          memory: proc.monit ? proc.monit.memory : 0,
          restarts: proc.pm2_env.restart_time || 0,

          // Extended info
          script: proc.pm2_env.pm_exec_path,
          cwd: proc.pm2_env.pm_cwd,
          interpreter: proc.pm2_env.exec_interpreter || 'node',
          interpreterArgs: proc.pm2_env.node_args || [],
          args: proc.pm2_env.args || [],
          execMode: proc.pm2_env.exec_mode,
          instances: proc.pm2_env.instances,

          // Environment
          nodeVersion: proc.pm2_env.node_version,
          version: proc.pm2_env.version,

          // Logs paths
          outLogPath: proc.pm2_env.pm_out_log_path,
          errLogPath: proc.pm2_env.pm_err_log_path,
          pidPath: proc.pm2_env.pm_pid_path,

          // Timestamps
          createdAt: proc.pm2_env.created_at,
          startedAt: proc.pm2_env.pm_uptime,

          // Watch mode
          watch: proc.pm2_env.watch || false,
          autorestart: proc.pm2_env.autorestart !== false,

          // Resource limits
          maxMemoryRestart: proc.pm2_env.max_memory_restart,
        };

        resolve(details);
      });
    });
  }

  /**
   * Restart a process by PM2 ID
   */
  async restartProcess(pmId) {
    return new Promise((resolve, reject) => {
      pm2.restart(pmId, (err, proc) => {
        if (err) {
          console.error(`Error restarting process ${pmId}:`, err);
          reject(err);
        } else {
          console.log(`✓ Process ${pmId} restarted`);
          resolve(proc);
        }
      });
    });
  }

  /**
   * Stop a process by PM2 ID
   */
  async stopProcess(pmId) {
    return new Promise((resolve, reject) => {
      pm2.stop(pmId, (err, proc) => {
        if (err) {
          console.error(`Error stopping process ${pmId}:`, err);
          reject(err);
        } else {
          console.log(`✓ Process ${pmId} stopped`);
          resolve(proc);
        }
      });
    });
  }

  /**
   * Start a process by PM2 ID
   */
  async startProcess(pmId) {
    return new Promise((resolve, reject) => {
      pm2.restart(pmId, (err, proc) => {
        if (err) {
          console.error(`Error starting process ${pmId}:`, err);
          reject(err);
        } else {
          console.log(`✓ Process ${pmId} started`);
          resolve(proc);
        }
      });
    });
  }

  /**
   * Delete a process from PM2 by PM2 ID
   */
  async deleteProcess(pmId) {
    return new Promise((resolve, reject) => {
      pm2.delete(pmId, (err, proc) => {
        if (err) {
          console.error(`Error deleting process ${pmId}:`, err);
          reject(err);
        } else {
          console.log(`✓ Process ${pmId} deleted`);
          resolve(proc);
        }
      });
    });
  }

  /**
   * Setup PM2 event listeners for crashes and restarts
   */
  setupEventListeners(onEvent) {
    pm2.launchBus((err, bus) => {
      if (err) {
        console.error('Error launching PM2 bus:', err);
        throw err;
      }

      console.log('✓ PM2 event bus connected');

      // Listen for process events
      bus.on('process:event', (data) => {
        if (onEvent) {
          onEvent(data);
        }
      });

      // Listen for log events (optional)
      bus.on('log:out', (data) => {
        // console.log('PM2 log:out', data);
      });

      bus.on('log:err', (data) => {
        // console.error('PM2 log:err', data);
      });
    });
  }

  /**
   * Disconnect from PM2
   */
  disconnect() {
    pm2.disconnect();
    this.connected = false;
    console.log('Disconnected from PM2');
  }

  /**
   * Check if connected to PM2
   */
  isConnected() {
    return this.connected;
  }
}

// Export singleton instance
const pm2Service = new PM2Service();
module.exports = pm2Service;
