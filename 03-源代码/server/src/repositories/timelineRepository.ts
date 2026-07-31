/**
 * 回忆时间线数据访问层 - pet_moments 表
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 * 支持回忆创建、按宠物/家庭/用户查询
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 回忆数据行 */
export interface MomentRow extends QueryResultRow {
  id: string;
  user_id: string;
  pet_id: string;
  type: string;
  content: Record<string, unknown>;
  photos: string[];
  created_at: string;
}

/**
 * 回忆时间线仓库 - pet_moments 表
 */
export class TimelineRepository extends BaseRepository<MomentRow> {
  protected tableName = 'pet_moments';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 创建回忆记录
   */
  async createMoment(
    id: string,
    userId: string,
    petId: string,
    type: string,
    content: string,
    photos: string[],
  ): Promise<MomentRow> {
    const result = await this.rawQuery<MomentRow>(
      `INSERT INTO ${this.tableName} (id, user_id, pet_id, type, content, photos)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, userId, petId, type, content, photos],
    );
    return result.rows[0];
  }

  /**
   * 按宠物查询回忆（带归属校验，限制返回条数）
   */
  async findByPetAndUser(petId: string, userId: string, limit: number): Promise<MomentRow[]> {
    const result = await this.rawQuery<MomentRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
       ORDER BY created_at DESC LIMIT $3`,
      [petId, userId, limit],
    );
    return result.rows;
  }

  /**
   * 按用户查询所有回忆（限制返回条数）
   */
  async findByUser(userId: string, limit: number): Promise<MomentRow[]> {
    const result = await this.rawQuery<MomentRow>(
      `SELECT * FROM ${this.tableName}
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  /**
   * 按家庭查询回忆（通过家庭成员宠物 ID 列表）
   * petIds 为空时返回空数组（调用方应提前检查）
   * 动态 IN 占位符由本方法构造，petIds 来自数据库查询结果（非用户输入），安全可控
   */
  async findByPetIds(petIds: string[], limit: number): Promise<MomentRow[]> {
    if (petIds.length === 0) return [];
    const placeholders = petIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await this.rawQuery<MomentRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id IN (${placeholders})
       ORDER BY created_at DESC LIMIT $${petIds.length + 1}`,
      [...petIds, limit],
    );
    return result.rows;
  }
}
