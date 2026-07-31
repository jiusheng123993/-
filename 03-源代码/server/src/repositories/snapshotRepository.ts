/**
 * 家族图谱快照数据访问层 - pet_family_graph_snapshots 表的数据库操作
 * 提供快照的创建、分页列表、统计等数据访问接口
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 * graph_data 为 JSONB：插入时 JSON.stringify，查询时若为字符串则解析为对象
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 快照数据行 */
export interface SnapshotRow extends QueryResultRow {
  id: string;
  family_id: string;
  layout_type: string;
  graph_data: Record<string, unknown>;
  thumbnail_url: string | null;
  created_at: string;
}

/**
 * 规范化 graph_data 字段
 * pg 默认将 JSONB 解析为对象；若返回字符串（部分驱动配置），则手动解析
 */
function normalizeGraphData(row: SnapshotRow): SnapshotRow {
  if (typeof row.graph_data === 'string') {
    try {
      row.graph_data = JSON.parse(row.graph_data) as Record<string, unknown>;
    } catch {
      // 解析失败保留原值，避免吞掉异常数据
      row.graph_data = { _raw: row.graph_data };
    }
  }
  return row;
}

export class SnapshotRepository extends BaseRepository<SnapshotRow> {
  protected tableName = 'pet_family_graph_snapshots';
  protected allowedSortFields: readonly string[] = ['created_at'];

  /**
   * 分页查询家庭快照列表（按 created_at DESC）
   */
  async findByFamilyId(
    familyId: string,
    page: number,
    pageSize: number,
  ): Promise<SnapshotRow[]> {
    const offset = (page - 1) * pageSize;
    const sql = `
      SELECT id, family_id, layout_type, graph_data, thumbnail_url, created_at
      FROM ${this.tableName}
      WHERE family_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.rawQuery<SnapshotRow>(sql, [familyId, pageSize, offset]);
    return result.rows.map(normalizeGraphData);
  }

  /**
   * 统计家庭快照总数（用于分页）
   */
  async countByFamilyId(familyId: string): Promise<number> {
    return this.countWhere('family_id = $1', [familyId]);
  }

  /**
   * 插入快照记录
   * graph_data 使用 JSON.stringify 以便 JSONB 存储
   */
  async insertSnapshot(data: {
    family_id: string;
    layout_type: string;
    graph_data: Record<string, unknown>;
    thumbnail_url: string | null;
  }): Promise<SnapshotRow> {
    const record = await this.insert({
      family_id: data.family_id,
      layout_type: data.layout_type,
      graph_data: JSON.stringify(data.graph_data),
      thumbnail_url: data.thumbnail_url,
    });
    return normalizeGraphData(record);
  }
}
