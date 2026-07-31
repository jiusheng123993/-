/**
 * 家庭动态墙数据访问层 - pet_family_feeds 表的数据库操作
 * 提供动态发布、编辑、删除、分页列表、精选动态等数据访问接口
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 家庭动态数据行 */
export interface FeedRow extends QueryResultRow {
  id: string;
  family_id: string;
  pet_id: string | null;
  user_id: string;
  feed_type: string;
  content: string;
  photos: string[] | null;
  ai_generated: boolean;
  source_ref: string | null;
  created_at: string;
}

/** 列表查询结果（含宠物信息） */
export interface FeedWithPetRow extends FeedRow {
  pet_name: string | null;
  pet_avatar_url: string | null;
}

export class FeedRepository extends BaseRepository<FeedRow> {
  protected tableName = 'pet_family_feeds';
  protected allowedSortFields: readonly string[] = ['created_at'];

  /**
   * 分页查询家庭动态列表（带宠物信息）
   * @param familyId - 家庭 ID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量
   * @param feedType - 可选：动态类型过滤
   * @param petId - 可选：宠物 ID 过滤
   */
  async findByFamilyId(
    familyId: string,
    page: number,
    pageSize: number,
    feedType?: string,
    petId?: string,
  ): Promise<FeedWithPetRow[]> {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = ['f.family_id = $1'];
    const params: unknown[] = [familyId];
    let paramIndex = 2;

    if (feedType) {
      conditions.push(`f.feed_type = $${paramIndex++}`);
      params.push(feedType);
    }

    if (petId) {
      conditions.push(`f.pet_id = $${paramIndex++}`);
      params.push(petId);
    }

    params.push(pageSize, offset);
    const sql = `
      SELECT
        f.id, f.family_id, f.pet_id, f.user_id, f.feed_type,
        f.content, f.photos, f.ai_generated, f.source_ref, f.created_at,
        p.name AS pet_name,
        COALESCE(p.avatar_photo_url, p.avatar_cartoon_url) AS pet_avatar_url
      FROM pet_family_feeds f
      LEFT JOIN pet_profiles p ON p.id = f.pet_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY f.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const result = await this.rawQuery<FeedWithPetRow>(sql, params);
    return result.rows;
  }

  /**
   * 统计家庭动态总数（用于分页）
   */
  async countByFamilyId(
    familyId: string,
    feedType?: string,
    petId?: string,
  ): Promise<number> {
    const conditions: string[] = ['family_id = $1'];
    const params: unknown[] = [familyId];
    let paramIndex = 2;

    if (feedType) {
      conditions.push(`feed_type = $${paramIndex++}`);
      params.push(feedType);
    }

    if (petId) {
      conditions.push(`pet_id = $${paramIndex++}`);
      params.push(petId);
    }

    return this.countWhere(conditions.join(' AND '), params);
  }

  /**
   * 查找属于指定用户的动态（归属校验，防横向越权）
   */
  async findByIdAndUser(feedId: string, userId: string): Promise<FeedRow | null> {
    return this.findOneWhere('id = $1 AND user_id = $2', [feedId, userId]);
  }

  /**
   * 查找属于指定家庭的动态（用于编辑/删除时的家庭归属二次校验）
   */
  async findByIdAndFamily(feedId: string, familyId: string): Promise<FeedRow | null> {
    return this.findOneWhere('id = $1 AND family_id = $2', [feedId, familyId]);
  }

  /**
   * 查询家庭精选动态（最近 30 天内前 5 条，按创建时间倒序）
   * 注：当前骨架阶段无点赞表，按 created_at DESC 取前 5 条作为精选
   * @param familyId - 家庭 ID
   * @param limit - 返回数量，默认 5
   */
  async findHighlightByFamilyId(
    familyId: string,
    limit = 5,
  ): Promise<FeedWithPetRow[]> {
    const sql = `
      SELECT
        f.id, f.family_id, f.pet_id, f.user_id, f.feed_type,
        f.content, f.photos, f.ai_generated, f.source_ref, f.created_at,
        p.name AS pet_name,
        COALESCE(p.avatar_photo_url, p.avatar_cartoon_url) AS pet_avatar_url
      FROM pet_family_feeds f
      LEFT JOIN pet_profiles p ON p.id = f.pet_id
      WHERE f.family_id = $1
        AND f.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY f.created_at DESC
      LIMIT $2
    `;
    const result = await this.rawQuery<FeedWithPetRow>(sql, [familyId, limit]);
    return result.rows;
  }
}
