/**
 * 数据库连接池管理 - 提供 PostgreSQL 数据库连接
 * 使用 pg 连接池管理数据库连接，自动重连和错误处理
 */
import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

/** PostgreSQL 连接池实例 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('error', (err) => {
  console.error('[DB Pool Error]', err.message);
});
