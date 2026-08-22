/**
 * 知识图谱仓库（Phase 3：图谱热更新 + 用户纠错审核）
 * - KnowledgeGraphRepository：服务端权威图谱（惰性播种种子 JSON、版本递增、查询/保存）
 * - KnowledgeFeedbackRepository：用户纠错反馈（提交/列表/审核）
 * 设计来源：01-产品文档/宠物医学知识图谱与置信度-设计方案-2026-08-22.md 第七章（审核流程）
 */
import { BaseRepository } from './baseRepository.js';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { QueryResultRow } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 知识图谱版本行 */
export interface KnowledgeGraphRow extends QueryResultRow {
  id: number;
  version: string;
  data: Record<string, unknown>;
  created_at: string;
}

/** 知识纠错反馈行 */
export interface KnowledgeFeedbackRow extends QueryResultRow {
  id: string;
  user_id: string;
  pet_id: string | null;
  check_id: string | null;
  entity_type: string;
  entity_name: string;
  suggestion: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

/**
 * 知识图谱仓库 - knowledge_graphs 表
 */
export class KnowledgeGraphRepository extends BaseRepository<KnowledgeGraphRow> {
  protected tableName = 'knowledge_graphs';
  protected allowedSortFields = ['created_at'] as const;

  /** 读取种子 JSON（初始图谱，与小程序 medicalGraph.ts 导出一致） */
  private readSeed(): Record<string, unknown> {
    const seedPath = path.resolve(__dirname, '..', 'data', 'medicalGraphSeed.json');
    return JSON.parse(readFileSync(seedPath, 'utf-8')) as Record<string, unknown>;
  }

  /**
   * 获取最新图谱；空表时用种子初始化（惰性播种，无需手工迁移数据）
   * @returns 最新版本与数据（无表/异常返回 null，调用方降级）
   */
  async getLatestGraph(): Promise<{ version: string; data: Record<string, unknown> } | null> {
    try {
      const result = await this.rawQuery<KnowledgeGraphRow>(
        `SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT 1`,
        [],
      );
      if (result.rows.length > 0) {
        return { version: result.rows[0].version, data: result.rows[0].data };
      }
      // 空表 → 种子作为 v1 权威图谱（ON CONFLICT 防并发重复播种；插入后重查取权威行）
      const seed = this.readSeed();
      const version = String(seed.version || '2026-08-22.1');
      await this.rawQuery(
        `INSERT INTO ${this.tableName} (version, data) VALUES ($1, $2)
         ON CONFLICT (version) DO NOTHING`,
        [version, seed],
      );
      const after = await this.rawQuery<KnowledgeGraphRow>(
        `SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT 1`,
        [],
      );
      if (after.rows.length > 0) {
        return { version: after.rows[0].version, data: after.rows[0].data };
      }
      return null;
    } catch {
      // 表不存在/DB 异常 → 返回 null（前端继续用静态兜底）
      return null;
    }
  }

  /**
   * 保存新图谱（管理端审核通过后调用），版本自动递增：同日 .n → .n+1，跨日 .1
   * @param data - 新的图谱数据（增量合并到最新版本之上）
   * @returns 新版本号
   */
  async saveGraph(data: Record<string, unknown>): Promise<string> {
    const latest = await this.getLatestGraph();
    const base = new Date().toISOString().slice(0, 10);
    let next: string;
    if (latest && latest.version.startsWith(`${base}.`)) {
      const n = parseInt(latest.version.split('.').pop() || '0', 10);
      next = `${base}.${n + 1}`;
    } else {
      next = `${base}.1`;
    }
    // 管理端提交的 data 视为全量替换（可删除顶层键；原并集合并导致删除永不生效），仅补版本元信息
    const merged = { ...data, version: next, updatedAt: base };
    await this.rawQuery(`INSERT INTO ${this.tableName} (version, data) VALUES ($1, $2)`, [next, merged]);
    return next;
  }
}

/**
 * 知识纠错反馈仓库 - knowledge_feedback 表
 */
export class KnowledgeFeedbackRepository extends BaseRepository<KnowledgeFeedbackRow> {
  protected tableName = 'knowledge_feedback';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 提交纠错反馈
   * @param params - 反馈内容（entity_type/entity_name/suggestion + 可选上下文）
   */
  async create(params: {
    userId: string;
    petId?: string;
    checkId?: string;
    entityType: 'disease' | 'risk_level' | 'advice' | 'other';
    entityName: string;
    suggestion: string;
  }): Promise<KnowledgeFeedbackRow> {
    const id = randomUUID();
    const result = await this.rawQuery<KnowledgeFeedbackRow>(
      `INSERT INTO ${this.tableName}
         (id, user_id, pet_id, check_id, entity_type, entity_name, suggestion)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        id,
        params.userId,
        params.petId || null,
        params.checkId || null,
        params.entityType,
        params.entityName,
        params.suggestion,
      ],
    );
    return result.rows[0];
  }

  /**
   * 按状态列出反馈（默认全部，按时间倒序）
   * @param status - 状态过滤（open/approved/rejected，可选）
   */
  async list(status?: string, limit = 50): Promise<KnowledgeFeedbackRow[]> {
    const values: unknown[] = [limit];
    let where = '';
    if (status) {
      values.unshift(status);
      where = 'WHERE status = $1';
    }
    const result = await this.rawQuery<KnowledgeFeedbackRow>(
      `SELECT * FROM ${this.tableName}
       ${where}
       ORDER BY created_at DESC
       LIMIT ${status ? '$2' : '$1'}`,
      values,
    );
    return result.rows;
  }

  /**
   * 审核反馈（approve/reject），记录管理员备注与审核时间
   * @param id - 反馈 ID
   * @param action - approve / reject
   * @param note - 管理员备注（可选）
   */
  async review(id: string, action: 'approve' | 'reject', note?: string): Promise<KnowledgeFeedbackRow | null> {
    const result = await this.rawQuery<KnowledgeFeedbackRow>(
      `UPDATE ${this.tableName}
       SET status = $2, admin_note = $3, reviewed_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, action, note || null],
    );
    return result.rows[0] || null;
  }
}
