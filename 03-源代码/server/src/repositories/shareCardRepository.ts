/**
 * 分享卡片数据访问层 - share_cards 表的数据库操作
 * 提供卡片分页列表、详情、归属校验、分享次数累加等数据访问接口
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 * card_data 为 JSONB：插入时 JSON.stringify，查询时若为字符串则解析为对象
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 分享卡片数据行 */
export interface ShareCardRow extends QueryResultRow {
  id: string;
  user_id: string;
  card_type: string;
  card_data: Record<string, unknown>;
  card_url: string | null;
  share_channel: string | null;
  share_count: number;
  created_at: string;
}

/**
 * 规范化 card_data 字段
 * pg 默认将 JSONB 解析为对象；若返回字符串（部分驱动配置），则手动解析
 */
function normalizeCardData(row: ShareCardRow): ShareCardRow {
  if (typeof row.card_data === 'string') {
    try {
      row.card_data = JSON.parse(row.card_data) as Record<string, unknown>;
    } catch {
      // 解析失败保留原值，避免吞掉异常数据
      row.card_data = { _raw: row.card_data };
    }
  }
  return row;
}

export class ShareCardRepository extends BaseRepository<ShareCardRow> {
  protected tableName = 'share_cards';
  protected allowedSortFields: readonly string[] = ['created_at'];

  /**
   * 分页查询用户分享卡片列表（按 created_at DESC 排序）
   * @param userId - 用户 ID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量
   * @param cardType - 可选：卡片类型过滤
   */
  async findByUserId(
    userId: string,
    page: number,
    pageSize: number,
    cardType?: string,
  ): Promise<ShareCardRow[]> {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = ['user_id = $1'];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (cardType) {
      conditions.push(`card_type = $${paramIndex++}`);
      params.push(cardType);
    }

    params.push(pageSize, offset);
    const sql = `
      SELECT id, user_id, card_type, card_data, card_url, share_channel, share_count, created_at
      FROM ${this.tableName}
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const result = await this.rawQuery<ShareCardRow>(sql, params);
    return result.rows.map(normalizeCardData);
  }

  /**
   * 统计用户分享卡片总数（用于分页）
   */
  async countByUserId(userId: string, cardType?: string): Promise<number> {
    const conditions: string[] = ['user_id = $1'];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (cardType) {
      conditions.push(`card_type = $${paramIndex++}`);
      params.push(cardType);
    }

    return this.countWhere(conditions.join(' AND '), params);
  }

  /**
   * 查找属于指定用户的卡片（归属校验，防横向越权）
   * 用 id + user_id 双条件查询：卡片不存在与卡片不属于当前用户均返回 null
   * 避免泄露卡片存在性，同时统一对外返回 404
   */
  async findByIdAndUser(cardId: string, userId: string): Promise<ShareCardRow | null> {
    const sql = `
      SELECT id, user_id, card_type, card_data, card_url, share_channel, share_count, created_at
      FROM ${this.tableName}
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `;
    const result = await this.rawQuery<ShareCardRow>(sql, [cardId, userId]);
    const row = result.rows[0] ?? null;
    return row ? normalizeCardData(row) : null;
  }

  /**
   * 累加分享次数并更新最近分享渠道
   * 使用 share_count = share_count + 1 原子自增，避免并发计数丢失
   * @param cardId - 卡片 ID
   * @param userId - 用户 ID（归属校验，防越权操作他人卡片）
   * @param channel - 分享渠道
   * @returns 更新后的卡片记录，不存在或不属于该用户返回 null
   */
  async incrementShareCount(
    cardId: string,
    userId: string,
    channel: string,
  ): Promise<ShareCardRow | null> {
    const sql = `
      UPDATE ${this.tableName}
      SET share_count = share_count + 1,
          share_channel = $3
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, card_type, card_data, card_url, share_channel, share_count, created_at
    `;
    const result = await this.rawQuery<ShareCardRow>(sql, [cardId, userId, channel]);
    const row = result.rows[0] ?? null;
    return row ? normalizeCardData(row) : null;
  }

  /**
   * 插入分享卡片记录
   * card_data 使用 JSON.stringify 以便 JSONB 存储
   */
  async insertCard(data: {
    user_id: string;
    card_type: string;
    card_data: Record<string, unknown>;
    card_url: string;
    share_channel: null;
    share_count: number;
  }): Promise<ShareCardRow> {
    const record = await this.insert({
      user_id: data.user_id,
      card_type: data.card_type,
      card_data: JSON.stringify(data.card_data),
      card_url: data.card_url,
      share_channel: data.share_channel,
      share_count: data.share_count,
    });
    return normalizeCardData(record);
  }
}
