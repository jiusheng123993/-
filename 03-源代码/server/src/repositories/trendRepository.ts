/**
 * 健康趋势数据访问层 - pet_health_entries 表的聚合查询
 * 继承 BaseRepository，强制参数化查询防注入
 * 专注于趋势分析（按日聚合、月度报告），与 CheckinRepository（CRUD）职责分离
 *
 * 注意：trendFieldMap 中的字段名是业务常量（非用户输入），经过白名单校验后可直接拼入 SQL
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 趋势查询支持的类型 */
export type TrendType = 'weight' | 'appetite' | 'poop';

/** 趋势类型到数据库字段的映射（白名单，防止 SQL 注入） */
const TREND_FIELD_MAP: Record<TrendType, string> = {
  weight: 'weight',
  appetite: 'appetite_level',
  poop: 'poop_level',
};

/** 合法趋势类型集合（用于白名单校验） */
const VALID_TREND_TYPES: readonly TrendType[] = ['weight', 'appetite', 'poop'];

/** 趋势数据点 */
export interface TrendPoint {
  record_date: Date | string;
  value: string;
}

/** 月度报告聚合行 */
export interface MonthlyReportRow extends QueryResultRow {
  entry_count: string;
  avg_weight: string | null;
  avg_appetite: string | null;
  avg_poop: string | null;
  avg_spirit: string | null;
  avg_exercise: string | null;
  min_weight: string | null;
  max_weight: string | null;
  anomaly_count: string;
}

/**
 * 健康趋势仓库 - pet_health_entries 表（聚合查询）
 */
export class TrendRepository extends BaseRepository<QueryResultRow> {
  protected tableName = 'pet_health_entries';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 校验趋势类型是否合法（白名单校验）
   */
  static isValidTrendType(type: string): type is TrendType {
    return VALID_TREND_TYPES.includes(type as TrendType);
  }

  /**
   * 获取趋势类型对应的数据库字段名（白名单映射，防止 SQL 注入）
   */
  static getFieldName(type: TrendType): string {
    return TREND_FIELD_MAP[type];
  }

  /**
   * 查询指定天数内的趋势数据（原始记录，未聚合）
   * fieldName 经白名单校验，可直接拼入 SQL
   */
  async findTrendPoints(
    petId: string,
    userId: string,
    type: TrendType,
    days: number,
  ): Promise<TrendPoint[]> {
    const fieldName = TrendRepository.getFieldName(type);
    const result = await this.rawQuery<TrendPoint>(
      `SELECT
         -- 审查⏳1：趋势日聚合按北京时区归日
      (created_at AT TIME ZONE 'Asia/Shanghai')::date AS record_date,
         ${fieldName} AS value
       FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
         AND created_at >= NOW() - ($3 || ' days')::INTERVAL
         AND ${fieldName} IS NOT NULL
       ORDER BY record_date ASC`,
      [petId, userId, days],
    );
    return result.rows;
  }

  /**
   * 查询月度健康报告（聚合统计）
   */
  async findMonthlyReport(
    petId: string,
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<MonthlyReportRow | null> {
    const result = await this.rawQuery<MonthlyReportRow>(
      `SELECT
         COUNT(*) AS entry_count,
         AVG(weight) AS avg_weight,
         AVG(appetite_level) AS avg_appetite,
         AVG(poop_level) AS avg_poop,
         AVG(spirit_level) AS avg_spirit,
         AVG(exercise_level) AS avg_exercise,
         MIN(weight) AS min_weight,
         MAX(weight) AS max_weight,
         COUNT(*) FILTER (WHERE has_anomaly = true) AS anomaly_count
       FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
         AND created_at >= ($3::date AT TIME ZONE 'Asia/Shanghai') AND created_at < ($4::date AT TIME ZONE 'Asia/Shanghai')`,
      [petId, userId, startDate, endDate],
    );
    return result.rows[0] ?? null;
  }
}
