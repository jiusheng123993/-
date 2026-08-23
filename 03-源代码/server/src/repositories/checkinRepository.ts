/**
 * 健康打卡数据访问层 - pet_health_entries 表
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 * 提供打卡记录的创建、历史查询、今日打卡查询
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 健康打卡数据行 */
export interface CheckinRow extends QueryResultRow {
  id: string;
  pet_id: string;
  user_id: string;
  poop_level: number;
  appetite_level: number;
  spirit_level: number;
  exercise_level: number;
  weight: number | null;
  has_anomaly: boolean;
  anomaly_items: unknown[];
  ai_feedback: string | null;
  risk_level: string;
  note: string | null;
  created_at: string;
}

/**
 * 健康打卡仓库 - pet_health_entries 表
 */
export class CheckinRepository extends BaseRepository<CheckinRow> {
  protected tableName = 'pet_health_entries';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 创建打卡记录
   */
  async createCheckin(
    id: string,
    petId: string,
    userId: string,
    data: {
      poop_level: number;
      appetite_level: number;
      spirit_level: number;
      exercise_level: number;
      weight: number | null;
      has_anomaly: boolean;
      anomaly_items: unknown[];
      ai_feedback: string | null;
      risk_level: string;
      note: string | null;
    },
  ): Promise<CheckinRow> {
    const result = await this.rawQuery<CheckinRow>(
      `INSERT INTO ${this.tableName}
        (id, pet_id, user_id, poop_level, appetite_level, spirit_level,
         exercise_level, weight, has_anomaly, anomaly_items, ai_feedback, risk_level, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        id, petId, userId,
        data.poop_level, data.appetite_level, data.spirit_level,
        data.exercise_level, data.weight, data.has_anomaly, data.anomaly_items,
        data.ai_feedback, data.risk_level, data.note,
      ],
    );
    return result.rows[0];
  }

  /**
   * 查询指定天数内的打卡历史（pet 维度，多成员共同养宠：家庭成员可见共享宠物全部记录）
   * 返回值含 user_id，前端可标注"谁记录的"；老用户无家庭时（单 owner）等价于只看自己的
   */
  async findHistoryByDays(petId: string, since: string): Promise<CheckinRow[]> {
    const result = await this.rawQuery<CheckinRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id = $1 AND created_at >= $2
       ORDER BY created_at DESC`,
      [petId, since],
    );
    return result.rows;
  }

  /**
   * 查询今日打卡记录（pet 维度：任一成员打卡即视为今日已打卡，返回最新一条）
   */
  async findTodayCheckin(petId: string, today: string): Promise<CheckinRow | null> {
    const result = await this.rawQuery<CheckinRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id = $1 AND created_at::date = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [petId, today],
    );
    return result.rows[0] ?? null;
  }
}
