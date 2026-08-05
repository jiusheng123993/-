/**
 * AI 建议记录数据访问层 - pet_suggestion_records 表（效果追踪模块）
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 建议记录数据行 */
export interface SuggestionRecordRow extends QueryResultRow {
  id: string;
  pet_id: string;
  user_id: string;
  type: 'feeding' | 'symptom' | 'trend' | 'chat';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  adopted: boolean;
  adopted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 建议记录仓库 - pet_suggestion_records 表
 */
export class SuggestionRecordRepository extends BaseRepository<SuggestionRecordRow> {
  protected tableName = 'pet_suggestion_records';
  protected allowedSortFields = ['created_at', 'updated_at'] as const;

  /**
   * 创建建议记录
   */
  async create(
    id: string,
    petId: string,
    userId: string,
    data: {
      type: string;
      title: string;
      content: string;
      priority?: string;
    },
  ): Promise<SuggestionRecordRow> {
    const result = await this.rawQuery<SuggestionRecordRow>(
      `INSERT INTO ${this.tableName}
        (id, pet_id, user_id, type, title, content, priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        id, petId, userId,
        data.type, data.title, data.content,
        data.priority ?? 'medium',
      ],
    );
    return result.rows[0];
  }

  /**
   * 查询某宠物的全部建议记录（按创建时间倒序）
   */
  async findByPet(petId: string, userId: string): Promise<SuggestionRecordRow[]> {
    const result = await this.rawQuery<SuggestionRecordRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [petId, userId],
    );
    return result.rows;
  }

  /**
   * 按 ID 查询记录（带归属校验）
   */
  async findOwnedById(id: string, petId: string, userId: string): Promise<SuggestionRecordRow | null> {
    return this.findOneWhere('id = $1 AND pet_id = $2 AND user_id = $3', [id, petId, userId]);
  }

  /**
   * 更新采纳状态（带归属校验）
   */
  async updateAdoption(
    id: string,
    petId: string,
    userId: string,
    adopted: boolean,
  ): Promise<SuggestionRecordRow | null> {
    const result = await this.rawQuery<SuggestionRecordRow>(
      `UPDATE ${this.tableName} SET
        adopted = $3,
        adopted_at = CASE WHEN $3 = TRUE THEN $4 ELSE NULL END,
        updated_at = $4
       WHERE id = $1 AND pet_id = $2 AND user_id = $5
       RETURNING *`,
      [id, petId, adopted, new Date().toISOString(), userId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 删除记录（带归属校验）
   */
  async remove(id: string, petId: string, userId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND pet_id = $2 AND user_id = $3`,
      [id, petId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
