/**
 * 食物安全查询数据访问层 - pet_food_queries 表
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 * 支持关键词模糊匹配（ILIKE）、历史查询、按日统计
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 食物查询数据行 */
export interface FoodRow extends QueryResultRow {
  id: string;
  user_id: string;
  food_name: string;
  safety_level: 'safe' | 'caution' | 'danger';
  detail: string;
  created_at: string;
}

/** 历史查询最大返回条数（业务常量，非用户输入，可直接拼入 SQL） */
const HISTORY_LIMIT = 50;

/** 关键词搜索最大返回条数 */
const SEARCH_LIMIT = 5;

/**
 * 食物查询仓库 - pet_food_queries 表
 */
export class FoodRepository extends BaseRepository<FoodRow> {
  protected tableName = 'pet_food_queries';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 按关键词模糊匹配食物（ILIKE，前缀通配）
   * 限制返回 SEARCH_LIMIT 条，按创建时间倒序
   */
  async searchByKeyword(keyword: string): Promise<FoodRow[]> {
    const result = await this.rawQuery<FoodRow>(
      `SELECT * FROM ${this.tableName}
       WHERE food_name ILIKE $1
       ORDER BY created_at DESC
       LIMIT ${SEARCH_LIMIT}`,
      [`%${keyword}%`],
    );
    return result.rows;
  }

  /**
   * 插入占位记录（未知食物的兜底记录，safety_level=caution）
   */
  async insertPlaceholder(
    id: string,
    userId: string,
    foodName: string,
    detail: string,
  ): Promise<FoodRow> {
    return this.insert({
      id,
      user_id: userId,
      food_name: foodName,
      safety_level: 'caution',
      detail,
    });
  }

  /**
   * 查询用户历史记录（按 user_id 隔离，最多 HISTORY_LIMIT 条）
   * HISTORY_LIMIT 为业务常量，直接拼入 SQL 以保持契约稳定
   */
  async findHistoryByUser(userId: string): Promise<FoodRow[]> {
    const result = await this.rawQuery<FoodRow>(
      `SELECT * FROM ${this.tableName}
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT ${HISTORY_LIMIT}`,
      [userId],
    );
    return result.rows;
  }

  /**
   * 统计用户总查询次数
   */
  async countByUser(userId: string): Promise<number> {
    return this.countWhere('user_id = $1', [userId]);
  }

  /**
   * 统计用户当日查询次数（按日期匹配）
   */
  async countTodayByUser(userId: string, today: string): Promise<number> {
    const result = await this.rawQuery<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM ${this.tableName}
       -- 审查⏳1：北京时区归日（原 UTC 归组 0-8 点错日）
      WHERE user_id = $1 AND (created_at AT TIME ZONE 'Asia/Shanghai')::date = $2::date`,
      [userId, today],
    );
    return result.rows[0]?.count ?? 0;
  }
}
