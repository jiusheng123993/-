/**
 * 数据库连接池管理 - 提供 PostgreSQL 数据库连接
 * 使用 pg 连接池管理数据库连接，自动重连和错误处理
 */
import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

/**
 * date 类型（OID 1082）解析器：返回原始 'YYYY-MM-DD' 字符串
 * 坑点：pg 默认把 date 解析成 JS Date（按服务器本地时区取当天 00:00），
 * JSON 序列化后变成 UTC ISO 串（如 '2026-06-14T16:00:00.000Z'），
 * 前端 slice(0,10) 会差一天（服务器 +8 时区）。这里强制返回纯日期字符串，
 * 展示/排序/比较全部无时区歧义（happened_at 回忆补记日期依赖此行为）。
 */
pg.types.setTypeParser(1082, (val: string) => val);

/** PostgreSQL 连接池实例 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('error', (err) => {
  console.error('[DB Pool Error]', err.message);
});
