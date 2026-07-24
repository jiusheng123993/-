import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SQL_PATH = path.resolve(__dirname, '..', '..', '..', '..', '04-数据库', 'postgres', 'init.sql');

async function migrate() {
  console.log('[Migrate] 读取 SQL 文件:', SQL_PATH);

  if (!fs.existsSync(SQL_PATH)) {
    console.error('[Migrate] 文件不存在:', SQL_PATH);
    process.exit(1);
  }

  const sql = fs.readFileSync(SQL_PATH, 'utf-8');

  const client = await pool.connect();
  try {
    console.log('[Migrate] 开始执行数据库迁移...');
    await client.query(sql);
    console.log('[Migrate] 数据库迁移完成');
  } catch (err) {
    console.error('[Migrate] 迁移失败:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();