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
  /** 回忆发生日期（DATE 类型，pg 返回 'YYYY-MM-DD' 字符串，无时区歧义） */
  happened_at: string;
}

/**
 * 回忆时间线仓库 - pet_moments 表
 */
export class TimelineRepository extends BaseRepository<MomentRow> {
  protected tableName = 'pet_moments';
  protected allowedSortFields = ['created_at', 'happened_at'] as const;

  /**
   * 创建回忆记录
   * @param happenedAt - 可选：回忆发生日期（YYYY-MM-DD，补记），不传则用 CURRENT_DATE 兜底
   * 坑点：DEFAULT 只在"列清单省略该列"时生效，显式传 NULL 会落库为 NULL。
   * 这里用 COALESCE($7, CURRENT_DATE) 显式兜底，杜绝 NULL 行（NULL 会导致
   * ORDER BY 排最前、旧时光提醒 EXTRACT 永不匹配两个功能回归）。
   */
  async createMoment(
    id: string,
    userId: string,
    petId: string,
    type: string,
    content: string,
    photos: string[],
    happenedAt?: string,
  ): Promise<MomentRow> {
    const result = await this.rawQuery<MomentRow>(
      `INSERT INTO ${this.tableName} (id, user_id, pet_id, type, content, photos, happened_at)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::date, CURRENT_DATE))
       RETURNING *`,
      [id, userId, petId, type, content, photos, happenedAt || null],
    );
    return result.rows[0];
  }

  /**
   * 按宠物查询回忆（带归属校验，限制返回条数）
   * 排序用 happened_at（回忆发生日期），保证补记的旧回忆能按真实时间出现
   */
  async findByPetAndUser(petId: string, userId: string, limit: number): Promise<MomentRow[]> {
    const result = await this.rawQuery<MomentRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
       ORDER BY happened_at DESC LIMIT $3`,
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
       ORDER BY happened_at DESC LIMIT $2`,
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
       ORDER BY happened_at DESC LIMIT $${petIds.length + 1}`,
      [...petIds, limit],
    );
    return result.rows;
  }

  /**
   * 查询"去年今天"的回忆（F5 旧时光提醒）
   * 匹配指定年-月-日的回忆记录（用于"去年今天"推送/展示）
   * 改用 happened_at 匹配：补记的回忆也按真实发生日期参与旧时光提醒
   * @param userId - 用户 ID
   * @param year - 目标年份（如去年）
   * @param month - 月份（1-12）
   * @param day - 日（1-31）
   * @returns 该日期的回忆记录
   */
  async findLastYearMoments(userId: string, year: number, month: number, day: number): Promise<MomentRow[]> {
    const result = await this.rawQuery<MomentRow>(
      `SELECT * FROM ${this.tableName}
       WHERE user_id = $1
         AND EXTRACT(YEAR FROM happened_at) = $2
         AND EXTRACT(MONTH FROM happened_at) = $3
         AND EXTRACT(DAY FROM happened_at) = $4
       ORDER BY happened_at`,
      [userId, year, month, day],
    );
    return result.rows;
  }
}
