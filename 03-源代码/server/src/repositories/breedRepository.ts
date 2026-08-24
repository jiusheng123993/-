/**
 * 品种知识库仓库（热更新）
 * 复刻 KnowledgeGraphRepository 模式：JSONB 单文档版本表 + 惰性播种种子 + 版本递增。
 * - 服务端为权威数据源；前端启动时拉取最新版本实现"不发版修订品种数据"
 * - 种子 JSON（src/data/breedSeed.json）与小程序 breeds.ts 静态兜底同构（含 sources 来源标注）
 */
import { BaseRepository } from './baseRepository.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { QueryResultRow } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 品种知识库版本行 */
export interface BreedKnowledgeRow extends QueryResultRow {
  id: number;
  version: string;
  data: Record<string, unknown>;
  created_at: string;
}

/**
 * 品种知识库仓库 - breed_knowledge 表
 */
export class BreedKnowledgeRepository extends BaseRepository<BreedKnowledgeRow> {
  protected tableName = 'breed_knowledge';
  protected allowedSortFields = ['created_at'] as const;

  /** 读取种子 JSON（初始品种库，与小程序 breeds.ts 的 BREED_DATA 兜底一致） */
  private readSeed(): Record<string, unknown> {
    const seedPath = path.resolve(__dirname, '..', 'data', 'breedSeed.json');
    return JSON.parse(readFileSync(seedPath, 'utf-8')) as Record<string, unknown>;
  }

  /**
   * 获取最新品种库；空表时用种子初始化（惰性播种，无需手工迁移数据）
   * @returns 最新版本与数据（无表/DB 异常返回 null，调用方降级 503 由前端静态兜底）
   */
  async getLatestBreeds(): Promise<{ version: string; data: Record<string, unknown> } | null> {
    try {
      const result = await this.rawQuery<BreedKnowledgeRow>(
        `SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT 1`,
        [],
      );
      if (result.rows.length > 0) {
        return { version: result.rows[0].version, data: result.rows[0].data };
      }
      // 空表 → 种子作为首个权威版本（ON CONFLICT 防并发重复播种；插入后重查取权威行）
      const seed = this.readSeed();
      const version = String(seed.version || '2026-08-25.1');
      await this.rawQuery(
        `INSERT INTO ${this.tableName} (version, data) VALUES ($1, $2)
         ON CONFLICT (version) DO NOTHING`,
        [version, seed],
      );
      const after = await this.rawQuery<BreedKnowledgeRow>(
        `SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT 1`,
        [],
      );
      if (after.rows.length > 0) {
        return { version: after.rows[0].version, data: after.rows[0].data };
      }
      return null;
    } catch {
      // 表不存在/DB 异常 → 返回 null（前端继续用静态兜底 BREED_DATA）
      return null;
    }
  }

  /**
   * 保存新品种库（管理端人工校对后调用），版本自动递增：同日 .n → .n+1，跨日 .1
   * @param data - 新的品种库数据（全量替换语义：{ updatedAt?, breeds: [...] }，服务端补版本元信息）
   * @returns 新版本号
   */
  async saveBreeds(data: Record<string, unknown>): Promise<string> {
    const latest = await this.getLatestBreeds();
    const base = new Date().toISOString().slice(0, 10);
    let next: string;
    if (latest && latest.version.startsWith(`${base}.`)) {
      const n = parseInt(latest.version.split('.').pop() || '0', 10);
      next = `${base}.${n + 1}`;
    } else {
      next = `${base}.1`;
    }
    // 管理端提交的 data 视为全量替换（保证删除条目可生效），仅覆盖版本元信息
    const merged = { ...data, version: next, updatedAt: base };
    await this.rawQuery(`INSERT INTO ${this.tableName} (version, data) VALUES ($1, $2)`, [next, merged]);
    return next;
  }
}
