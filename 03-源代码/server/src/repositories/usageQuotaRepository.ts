/**
 * 使用配额数据访问层 - usage_quotas 表
 * 处理用户每日使用配额查询（食物查询、症状初筛、趋势查看）
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 使用配额数据行 */
export interface UsageQuotaRow extends QueryResultRow {
  id: string;
  user_id: string;
  date: string;
  food_queries_count: number;
  symptom_checks_count: number;
  trend_days_viewed: number;
  created_at: string;
  updated_at: string;
}

/** 配额查询结果（响应构建用） */
export interface UsageQuotaSummary {
  food_queries_count: number;
  symptom_checks_count: number;
  trend_days_viewed: number;
}

export class UsageQuotaRepository extends BaseRepository<UsageQuotaRow> {
  protected tableName = 'usage_quotas';
  protected allowedSortFields = ['date', 'created_at'] as const;

  /**
   * 查询用户当日使用配额
   * @param userId - 用户 ID
   * @param date - 日期字符串（YYYY-MM-DD 格式）
   */
  async findTodayUsage(userId: string, date: string): Promise<UsageQuotaSummary | null> {
    const result = await this.rawQuery<UsageQuotaSummary>(
      `SELECT food_queries_count, symptom_checks_count, trend_days_viewed
       FROM ${this.tableName}
       WHERE user_id = $1 AND date = $2
       LIMIT 1`,
      [userId, date],
    );
    return result.rows[0] ?? null;
  }
}
