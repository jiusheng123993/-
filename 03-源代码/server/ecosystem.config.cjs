// ============================================================
// 星河宠记 - PM2 进程配置
// 放置路径: 03-源代码/server/ecosystem.config.cjs
// 2026-09 全项目审查修正：进程名/日志路径与生产实况对齐（PM2 实际进程为
// xinghuanhai-server、部署目录 /opt/xinghuanhai，见 05-部署配置/部署配置.md）。
// 旧名 xinghechongji-server 是立项初期占位，从未在生产使用过。
// wait_ready:true 要求进程就绪后显式 process.send('ready')——src/index.ts 已实现。
// ============================================================
module.exports = {
  apps: [
    {
      name: 'xinghuanhai-server',
      script: 'src/index.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',

      // 运行环境
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // 进程管理
      instances: 1,             // 实例数（轻量服务器用 1）
      exec_mode: 'fork',        // fork 模式（单实例）
      max_memory_restart: '500M', // 内存超限自动重启

      // 日志
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/opt/xinghuanhai/logs/err.log',
      out_file: '/opt/xinghuanhai/logs/out.log',
      merge_logs: true,

      // 自动重启
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,

      // 优雅关闭
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};