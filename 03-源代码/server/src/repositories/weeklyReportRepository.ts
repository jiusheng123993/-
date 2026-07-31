/**
 * 家庭周报数据访问层 - pet_family_weekly_reports 表的数据库操作
 * 提供周报分页列表、最新周报、详情查询、存在性检查、生成等数据访问接口
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 * report_data 为 JSONB：插入时 JSON.stringify，查询时若为字符串则解析为对象
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 家庭周报数据行 */
export interface WeeklyReportRow extends QueryResultRow {
  id: string;
  family_id: string;
  week_number: number;
  year: number;
  report_data: Record<string, unknown>;
  ai_insight: string | null;
  share_card_url: string | null;
  created_at: string;
}

/**
 * 规范化 report_data 字段
 * pg 默认将 JSONB 解析为对象；若返回字符串（部分驱动配置），则手动解析
 */
function normalizeReportData(row: WeeklyReportRow): WeeklyReportRow {
  if (typeof row.report_data === 'string') {
    try {
      row.report_data = JSON.parse(row.report_data) as Record<string, unknown>;
    } catch {
      // 解析失败保留原值，避免吞掉异常数据
      row.report_data = { _raw: row.report_data };
    }
  }
  return row;
}

export class WeeklyReportRepository extends BaseRepository<WeeklyReportRow> {
  protected tableName = 'pet_family_weekly_reports';
  protected allowedSortFields: readonly string[] = ['created_at', 'year', 'week_number'];

  /**
   * 分页查询家庭周报列表（按 year DESC, week_number DESC 排序）
   * @param familyId - 家庭 ID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量
   * @param year - 可选：年份过滤
   */
  async findByFamilyId(
    familyId: string,
    page: number,
    pageSize: number,
    year?: number,
  ): Promise<WeeklyReportRow[]> {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = ['family_id = $1'];
    const params: unknown[] = [familyId];
    let paramIndex = 2;

    if (year !== undefined) {
      conditions.push(`year = $${paramIndex++}`);
      params.push(year);
    }

    params.push(pageSize, offset);
    const sql = `
      SELECT id, family_id, week_number, year, report_data, ai_insight, share_card_url, created_at
      FROM ${this.tableName}
      WHERE ${conditions.join(' AND ')}
      ORDER BY year DESC, week_number DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const result = await this.rawQuery<WeeklyReportRow>(sql, params);
    return result.rows.map(normalizeReportData);
  }

  /**
   * 统计家庭周报总数（用于分页）
   */
  async countByFamilyId(familyId: string, year?: number): Promise<number> {
    const conditions: string[] = ['family_id = $1'];
    const params: unknown[] = [familyId];
    let paramIndex = 2;

    if (year !== undefined) {
      conditions.push(`year = $${paramIndex++}`);
      params.push(year);
    }

    return this.countWhere(conditions.join(' AND '), params);
  }

  /**
   * 查询家庭最新一条周报（year DESC, week_number DESC）
   */
  async findLatestByFamilyId(familyId: string): Promise<WeeklyReportRow | null> {
    const sql = `
      SELECT id, family_id, week_number, year, report_data, ai_insight, share_card_url, created_at
      FROM ${this.tableName}
      WHERE family_id = $1
      ORDER BY year DESC, week_number DESC
      LIMIT 1
    `;
    const result = await this.rawQuery<WeeklyReportRow>(sql, [familyId]);
    const row = result.rows[0] ?? null;
    return row ? normalizeReportData(row) : null;
  }

  /**
   * 按 reportId 查询周报详情，必须属于指定家庭（防跨家庭越权）
   */
  async findByIdAndFamily(reportId: string, familyId: string): Promise<WeeklyReportRow | null> {
    const sql = `
      SELECT id, family_id, week_number, year, report_data, ai_insight, share_card_url, created_at
      FROM ${this.tableName}
      WHERE id = $1 AND family_id = $2
      LIMIT 1
    `;
    const result = await this.rawQuery<WeeklyReportRow>(sql, [reportId, familyId]);
    const row = result.rows[0] ?? null;
    return row ? normalizeReportData(row) : null;
  }

  /**
   * 检查同一家庭同一周是否已存在周报（UNIQUE 约束的预检，提供 409 而非 500）
   */
  async findExisting(
    familyId: string,
    year: number,
    weekNumber: number,
  ): Promise<WeeklyReportRow | null> {
    return this.findOneWhere(
      'family_id = $1 AND year = $2 AND week_number = $3',
      [familyId, year, weekNumber],
    );
  }

  /**
   * 插入周报记录
   * report_data 使用 JSON.stringify 以便 JSONB 存储
   */
  async insertReport(data: {
    family_id: string;
    year: number;
    week_number: number;
    report_data: Record<string, unknown>;
    ai_insight: string | null;
    share_card_url: string | null;
  }): Promise<WeeklyReportRow> {
    const record = await this.insert({
      family_id: data.family_id,
      year: data.year,
      week_number: data.week_number,
      report_data: JSON.stringify(data.report_data),
      ai_insight: data.ai_insight,
      share_card_url: data.share_card_url,
    });
    return normalizeReportData(record);
  }
}
