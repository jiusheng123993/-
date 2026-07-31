/**
 * 症状初筛数据访问层 - pet_symptom_checks 表
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 * 提供症状记录的提交、历史查询（分页）
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 症状初筛数据行 */
export interface SymptomRow extends QueryResultRow {
  id: string;
  pet_id: string;
  user_id: string;
  symptoms: string[];
  duration: string | null;
  severity: string | null;
  additional_info: Record<string, unknown>;
  risk_level: string;
  possible_conditions: string[];
  ai_advice: string | null;
  recommended_actions: string[];
  knowledge_match: Record<string, unknown> | null;
  created_at: string;
}

/**
 * 症状初筛仓库 - pet_symptom_checks 表
 */
export class SymptomRepository extends BaseRepository<SymptomRow> {
  protected tableName = 'pet_symptom_checks';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 创建症状初筛记录
   */
  async createSymptomCheck(
    id: string,
    petId: string,
    userId: string,
    data: {
      symptoms: string[];
      duration: string | null;
      severity: string | null;
      additional_info: string;
      risk_level: string;
      possible_conditions: string[];
      ai_advice: string | null;
      recommended_actions: string[];
      knowledge_match: string | null;
    },
  ): Promise<SymptomRow> {
    const result = await this.rawQuery<SymptomRow>(
      `INSERT INTO ${this.tableName}
        (id, pet_id, user_id, symptoms, duration, severity, additional_info,
         risk_level, possible_conditions, ai_advice, recommended_actions, knowledge_match)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        id, petId, userId,
        data.symptoms, data.duration, data.severity, data.additional_info,
        data.risk_level, data.possible_conditions, data.ai_advice,
        data.recommended_actions, data.knowledge_match,
      ],
    );
    return result.rows[0];
  }

  /**
   * 统计用户症状初筛记录总数
   */
  async countByPetAndUser(petId: string, userId: string): Promise<number> {
    return this.countWhere('pet_id = $1 AND user_id = $2', [petId, userId]);
  }

  /**
   * 分页查询症状初筛历史（按创建时间倒序）
   */
  async findHistoryPage(
    petId: string,
    userId: string,
    pageSize: number,
    offset: number,
  ): Promise<SymptomRow[]> {
    const result = await this.rawQuery<SymptomRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [petId, userId, pageSize, offset],
    );
    return result.rows;
  }
}
