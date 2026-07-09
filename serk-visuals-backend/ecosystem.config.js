// PM2 ecosystem config — production deployment on DigitalOcean
// Usage:
//   pm2 start ecosystem.config.js --env production
//   pm2 save
//   pm2 startup   (follow the printed command to auto-start on reboot)

module.exports = {
  apps: [
    {
      name: 'serkvisuals-api',
      script: 'npm',
      args:   'start',
      cwd: '/var/www/serkvisuals/serk-visuals/serk-visuals-backend',

      // Single process — scale with instances: 'max' if needed later
      instances: 1,
      exec_mode: 'fork',

      // PM2 will NOT watch files in production — restart via 'pm2 restart'
      watch: false,

      env_production: {
        NODE_ENV: 'production',
        PORT: 5001,
      },

      // Log files — ensure /var/log/pm2/ exists and is writable
      error_file: '/var/log/pm2/serkvisuals-api-error.log',
      out_file:   '/var/log/pm2/serkvisuals-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Restart policy
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
