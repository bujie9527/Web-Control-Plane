/**
 * PM2 进程配置，用于生产环境 Node 直跑（非 Docker 时使用）
 * 使用方式：在项目根目录执行 pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'awcc',
      script: 'server/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
}
