// PM2 Ecosystem Configuration for CENTO Frontend
// Usage: pm2 start frontend-ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'cento-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/centouser/cento/frontend',
      instances: 1,
      exec_mode: 'fork',

      // Environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },

      // Auto-restart configuration
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // Memory management
      max_memory_restart: '1G',

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 30000,

      // Health check
      health_check: {
        protocol: 'http',
        host: 'localhost',
        port: 3000,
        path: '/',
        timeout: 2000,
        interval: 10000
      }
    }
  ]
};