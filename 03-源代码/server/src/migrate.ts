import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SQL_PATH = path.resolve(__dirname, '..', '..', '..', '..', '04-数据库', 'supabase', 'init.sql');

function cleanSql(raw: string): string {
  const lines = raw.split('\n');
  const result: string[] = [];
  let skipDepth = 0;
  let inRemoveBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*--\s*=+/.test(line) || /^\s*--\s*\d+\./.test(line) || /^\s*--\s*[0-9ivx]+\./.test(line)) {
      inRemoveBlock = false;
    }

    if (skipDepth > 0) {
      if (line.includes('$$')) {
        skipDepth--;
        if (/$$;?\s*$/.test(line.trimEnd())) {
          skipDepth = Math.max(0, skipDepth - 1);
        }
      }
      continue;
    }

    if (line.includes('DO $$') || line.includes('DO $$')) {
      skipDepth = 1;
      if (line.includes('$$;') || /$$;\s*$/.test(line)) {
        skipDepth = 0;
      }
      continue;
    }

    const trimmed = line.trim();

    if (
      trimmed.includes('REFERENCES auth.users') ||
      trimmed.includes('SECURITY DEFINER') ||
      trimmed.match(/^\s*CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+public\.(apply_user_rls|apply_profile_rls|admin_read_policy|verify_pet_ownership|handle_new_user)/) ||
      trimmed.match(/^\s*SELECT\s+public\.(apply_user_rls|apply_profile_rls|admin_read_policy)/) ||
      trimmed.startsWith('CREATE POLICY ') ||
      trimmed.match(/^\s*(ALTER\s+TABLE\s+\w+\s+)?ENABLE ROW LEVEL SECURITY/) ||
      trimmed.match(/^\s*--\s*RLS/) ||
      trimmed === '-- RLS 策略' ||
      trimmed === '-- Storage Buckets（存储桶）' ||
      trimmed === '-- Storage RLS 策略' ||
      trimmed.includes('INSERT INTO storage.buckets') ||
      trimmed.includes('ON storage.objects') ||
      trimmed === '-- 辅助函数：为指定表启用 RLS 并创建标准 CRUD 策略' ||
      trimmed === '-- 辅助函数：为 profiles 表启用 RLS（主键即用户ID）' ||
      trimmed === '-- 管理员可读所有用户数据（用于运营后台）' ||
      trimmed === '-- 对所有用户数据表应用 RLS' ||
      trimmed.includes("'Authenticated users can read knowledge base'") ||
      trimmed === '-- pet_knowledge_base: 公开只读（无 user_id，所有认证用户可读，仅服务端写入）' ||
      trimmed === '-- pet_health_entries / pet_vaccinations 额外安全策略' ||
      trimmed === '-- 防止 A 用户的 pet_id 写入 B 用户的宠物数据' ||
      trimmed === '-- 验证 pet_id 归属当前用户（通过 pet_profiles.user_id）' ||
      trimmed.match(/^\s*CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+public\.verify_pet_ownership/) ||
      trimmed.match(/^\s*DROP\s+TRIGGER\s+IF\s+EXISTS\s+verify_/) ||
      trimmed.match(/^\s*CREATE\s+TRIGGER\s+verify_/) ||
      trimmed.match(/^\s*(DROP\s+)?POLICY\s+/) ||
      trimmed.match(/^\s*(DROP\s+)?TRIGGER\s+IF\s+EXISTS\s+on_auth_user_created/) ||
      trimmed.match(/^\s*CREATE\s+TRIGGER\s+on_auth_user_created/) ||
      trimmed.match(/^\s*--\s*v\d+\.\d+\s+新增/) ||
      trimmed.includes("'用户只能访问自己的家庭'") ||
      trimmed.includes("'用户只能看到自己家庭的成员'") ||
      trimmed.includes("'用户只能访问自己的时刻'") ||
      trimmed.includes("'用户只能访问自己的里程碑'") ||
      trimmed.includes("'用户只能访问自己的取名记录'") ||
      trimmed.includes("'Service role can upload pet avatars'") ||
      trimmed.includes("'Users can") ||
      trimmed.includes("'Admin can read all") ||
      trimmed === '-- RLS 策略' ||
      trimmed === '-- Storage RLS 策略'
    ) {
      continue;
    }

    if (
      trimmed.startsWith('-- 辅助函数') ||
      trimmed.startsWith('-- 管理员可读') ||
      trimmed.startsWith('-- 对所有用户数据表应用 RLS') ||
      trimmed.startsWith('-- pet_health_entries / pet_vaccinations') ||
      trimmed.startsWith('-- 防止 A 用户') ||
      trimmed.startsWith('-- 验证 pet_id')
    ) {
      continue;
    }

    if (trimmed.startsWith('RETURNS') && i > 0) {
      const prevLine = lines[i - 1].trim();
      if (
        prevLine.includes('apply_user_rls') ||
        prevLine.includes('apply_profile_rls') ||
        prevLine.includes('admin_read_policy') ||
        prevLine.includes('verify_pet_ownership') ||
        prevLine.includes('handle_new_user')
      ) {
        continue;
      }
    }

    if (trimmed.startsWith('BEGIN') || trimmed.startsWith('EXECUTE') || trimmed.startsWith('END;') || trimmed === '$$ LANGUAGE plpgsql' || trimmed === '$$ LANGUAGE plpgsql SECURITY DEFINER;' || trimmed === '$$ LANGUAGE plpgsql;') {
      const contextStart = Math.max(0, i - 10);
      const contextEnd = Math.min(lines.length - 1, i);
      let isInRemovedFunc = false;
      for (let j = contextStart; j <= contextEnd; j++) {
        const c = lines[j].trim();
        if (
          c.includes('apply_user_rls') ||
          c.includes('apply_profile_rls') ||
          c.includes('admin_read_policy') ||
          c.includes('verify_pet_ownership') ||
          c.includes('handle_new_user')
        ) {
          isInRemovedFunc = true;
          break;
        }
      }
      if (isInRemovedFunc) {
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

async function migrate() {
  console.log('[Migrate] 读取 SQL 文件:', SQL_PATH);

  if (!fs.existsSync(SQL_PATH)) {
    console.error('[Migrate] 文件不存在:', SQL_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(SQL_PATH, 'utf-8');
  const cleaned = cleanSql(raw);

  const client = await pool.connect();
  try {
    console.log('[Migrate] 开始执行数据库迁移...');
    await client.query(cleaned);
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
