/**
 * 数据库迁移脚本 - 按序执行 migrations 目录下的所有 SQL 文件
 *
 * 改造说明(v2):
 *   早期版本硬编码读取 04-数据库/postgres/init.sql,但该文件在仓库中不存在,
 *   导致 02-deploy-app.sh 调用 migrate.ts 时静默失败(process.exit(1) 被 || echo 吞掉),
 *   服务器因此漏建 pet_moments / pet_family_members 等表,触发 500 错误。
 *
 * 新版本:
 *   1. 扫描 server/migrations/ 目录下所有 *.sql 文件,按文件名升序执行
 *   2. 单个文件失败时记录错误并继续,避免阻塞后续 migration
 *   3. 兼容旧路径:若 04-数据库/postgres/init.sql 存在,追加执行
 *   4. 全部执行完毕后输出汇总,便于部署日志排查
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** migrations 目录(优先) */
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

/** 旧版 init.sql 路径(向后兼容,可选) */
const LEGACY_INIT_SQL = path.resolve(__dirname, '..', '..', '..', '04-数据库', 'postgres', 'init.sql');

interface MigrationResult {
  file: string;
  status: 'ok' | 'skip' | 'fail';
  error?: string;
}

/** 列出 migrations 目录下所有 .sql 文件,按文件名升序 */
function listMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.warn('[Migrate] migrations 目录不存在:', MIGRATIONS_DIR);
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort()
    .map((f) => path.join(MIGRATIONS_DIR, f));
}

/** 执行单个 SQL 文件 */
async function executeSqlFile(client: import('pg').PoolClient, filePath: string): Promise<void> {
  const sql = fs.readFileSync(filePath, 'utf-8');
  await client.query(sql);
}

async function migrate(): Promise<void> {
  console.log('[Migrate] 开始数据库迁移...');
  console.log('[Migrate] migrations 目录:', MIGRATIONS_DIR);

  const files = listMigrationFiles();
  console.log(`[Migrate] 发现 ${files.length} 个 migration 文件`);

  const results: MigrationResult[] = [];
  const client = await pool.connect();

  try {
    for (const file of files) {
      const basename = path.basename(file);
      try {
        await executeSqlFile(client, file);
        console.log(`[Migrate] ✓ ${basename}`);
        results.push({ file: basename, status: 'ok' });
      } catch (err) {
        // 单个文件失败不阻塞,记录后继续(便于排查跨表依赖问题)
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Migrate] ✗ ${basename}:`, message);
        results.push({ file: basename, status: 'fail', error: message });
      }
    }

    // 兼容旧路径:若 init.sql 存在则追加执行(供老部署使用)
    if (fs.existsSync(LEGACY_INIT_SQL)) {
      console.log('[Migrate] 发现旧版 init.sql,追加执行:', LEGACY_INIT_SQL);
      try {
        await executeSqlFile(client, LEGACY_INIT_SQL);
        console.log('[Migrate] ✓ legacy init.sql');
        results.push({ file: 'init.sql (legacy)', status: 'ok' });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[Migrate] ✗ legacy init.sql:', message);
        results.push({ file: 'init.sql (legacy)', status: 'fail', error: message });
      }
    } else {
      console.log('[Migrate] 旧版 init.sql 不存在,跳过(正常情况)');
    }

    // 汇总
    const ok = results.filter((r) => r.status === 'ok').length;
    const fail = results.filter((r) => r.status === 'fail').length;
    console.log(`[Migrate] 迁移完成: 成功 ${ok} / 失败 ${fail} / 总计 ${results.length}`);

    if (fail > 0) {
      console.error('[Migrate] 失败的 migration:');
      results
        .filter((r) => r.status === 'fail')
        .forEach((r) => console.error(`  - ${r.file}: ${r.error}`));
      // 不再 process.exit(1),避免 02-deploy-app.sh 的 || echo 吞掉真实错误
      // 失败的 migration 应当显式暴露,便于部署人员发现
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('[Migrate] 致命错误:', err);
  process.exit(1);
});
