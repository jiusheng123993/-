/**
 * 家庭数据访问层
 * - pet_families：家庭主表
 * - pet_family_members：家庭成员关联表
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 家庭数据行 */
export interface FamilyRow extends QueryResultRow {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/** 家庭成员数据行 */
export interface FamilyMemberRow extends QueryResultRow {
  id: string;
  family_id: string;
  pet_id: string;
  role: string | null;
  joined_at: string;
}

/** 家庭成员详情行（含宠物信息，JOIN 查询） */
export interface FamilyMemberDetailRow extends QueryResultRow {
  id: string;
  family_id: string;
  pet_id: string;
  role: string | null;
  joined_at: string;
  pet_name: string;
  species: string;
  breed: string;
  avatar_cartoon_url: string | null;
  avatar_photo_url: string | null;
}

/** 家庭列表项（含成员数） */
export interface FamilyWithCountRow extends FamilyRow {
  member_count: number;
}

/**
 * 家庭仓库 - pet_families 表
 */
export class FamilyRepository extends BaseRepository<FamilyRow> {
  protected tableName = 'pet_families';
  protected allowedSortFields = ['created_at', 'updated_at', 'name'] as const;

  /**
   * 按 ID + 用户 ID 查询（归属校验）
   */
  async findByIdAndUser(familyId: string, userId: string): Promise<FamilyRow | null> {
    return this.findOneWhere('id = $1 AND user_id = $2', [familyId, userId]);
  }

  /**
   * 查询用户所有家庭（含成员数）
   * 使用 rawQuery 执行带子查询的聚合 SQL
   */
  async findAllByUserWithCount(userId: string): Promise<FamilyWithCountRow[]> {
    const result = await this.rawQuery<FamilyWithCountRow>(
      `SELECT
         f.*,
         COALESCE(
           (SELECT COUNT(*) FROM pet_family_members m WHERE m.family_id = f.id),
           0
         )::INT AS member_count
       FROM pet_families f
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * 检查家庭归属权（用于权限校验）
   * 使用 findOneWhere 而非 countWhere，避免 COUNT 聚合开销，与路由层 mock 契约一致
   */
  async isOwner(familyId: string, userId: string): Promise<boolean> {
    const row = await this.findOneWhere('id = $1 AND user_id = $2', [familyId, userId]);
    return row !== null;
  }

  /**
   * 按 ID + 用户 ID 更新记录（带归属校验，防止越权修改他人家庭）
   * 动态字段使用参数化占位符，updated_at 强制刷新
   */
  async updateByIdAndUser(
    familyId: string,
    userId: string,
    data: Partial<Pick<FamilyRow, 'name' | 'avatar_url'>>,
  ): Promise<FamilyRow | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;

    const setClauses: string[] = keys.map((key, i) => `${key} = $${i + 1}`);
    const values: unknown[] = [...keys.map((k) => data[k as keyof typeof data])];

    setClauses.push(`updated_at = NOW()`);
    values.push(familyId, userId);

    const result = await this.rawQuery<FamilyRow>(
      `UPDATE ${this.tableName} SET ${setClauses.join(', ')}
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }

  /**
   * 按 ID + 用户 ID 删除记录（带归属校验）
   */
  async deleteByIdAndUser(familyId: string, userId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND user_id = $2`,
      [familyId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

/**
 * 家庭成员仓库 - pet_family_members 表
 */
export class FamilyMemberRepository extends BaseRepository<FamilyMemberRow> {
  protected tableName = 'pet_family_members';
  protected allowedSortFields = ['joined_at'] as const;

  /**
   * 查询家庭所有成员（含宠物信息，JOIN pet_profiles）
   */
  async findDetailsByFamilyId(familyId: string): Promise<FamilyMemberDetailRow[]> {
    const result = await this.rawQuery<FamilyMemberDetailRow>(
      `SELECT m.*, p.name AS pet_name, p.species, p.breed, p.avatar_cartoon_url, p.avatar_photo_url
       FROM pet_family_members m
       JOIN pet_profiles p ON p.id = m.pet_id
       WHERE m.family_id = $1
       ORDER BY m.joined_at ASC`,
      [familyId],
    );
    return result.rows;
  }

  /**
   * 查询家庭所有成员的 pet_id（用于动态聚合查询）
   */
  async findPetIdsByFamilyId(familyId: string): Promise<string[]> {
    const result = await this.rawQuery<{ pet_id: string }>(
      'SELECT pet_id FROM pet_family_members WHERE family_id = $1',
      [familyId],
    );
    return result.rows.map((r) => r.pet_id);
  }

  /**
   * 检查宠物是否已是家庭成员（UNIQUE(family_id, pet_id)）
   * 使用 findOneWhere 避免 COUNT 聚合开销，与路由层 mock 契约一致
   */
  async isMember(familyId: string, petId: string): Promise<boolean> {
    const row = await this.findOneWhere('family_id = $1 AND pet_id = $2', [familyId, petId]);
    return row !== null;
  }

  /**
   * 按 family_id + pet_id 删除成员
   */
  async deleteByFamilyAndPet(
    familyId: string,
    petId: string,
  ): Promise<boolean> {
    const result = await this.rawQuery(
      'DELETE FROM pet_family_members WHERE family_id = $1 AND pet_id = $2 RETURNING *',
      [familyId, petId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 按 member_id + family_id 删除成员（带归属校验）
   * 前端仅持有 memberId 时使用此方法，避免 petId 映射问题
   */
  async deleteByMemberId(
    memberId: string,
    familyId: string,
  ): Promise<boolean> {
    const result = await this.rawQuery(
      'DELETE FROM pet_family_members WHERE id = $1 AND family_id = $2 RETURNING *',
      [memberId, familyId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 按 member_id + family_id 更新成员角色（带归属校验）
   * 注意：pet_family_members 表无 updated_at 字段，仅更新 role
   */
  async updateMemberRole(
    memberId: string,
    familyId: string,
    role: string,
  ): Promise<FamilyMemberRow | null> {
    const result = await this.rawQuery<FamilyMemberRow>(
      `UPDATE ${this.tableName} SET role = $3
       WHERE id = $1 AND family_id = $2
       RETURNING *`,
      [memberId, familyId, role],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 查询家庭动态（聚合健康打卡数据）
   * 使用 ANY($1::text[]) 避免动态拼接 IN 列表
   */
  async findFamilyMoments(petIds: string[], limit: number): Promise<QueryResultRow[]> {
    if (petIds.length === 0) return [];
    const result = await this.rawQuery<QueryResultRow>(
      `SELECT
         h.id, h.pet_id AS "petId", h.user_id AS "userId",
         'checkin' AS type,
         json_build_object(
           'poopLevel', h.poop_level,
           'appetiteLevel', h.appetite_level,
           'spiritLevel', h.spirit_level,
           'exerciseLevel', h.exercise_level,
           'weight', h.weight,
           'riskLevel', h.risk_level,
           'note', h.note
         ) AS content,
         h.created_at AS "createdAt"
       FROM pet_health_entries h
       WHERE h.pet_id = ANY($1::text[])
       ORDER BY h.created_at DESC
       LIMIT $2`,
      [petIds, limit],
    );
    return result.rows;
  }

  /**
   * 查询家庭新动态（since 时间戳之后）
   */
  async findNewFamilyMoments(
    petIds: string[],
    since: string,
  ): Promise<QueryResultRow[]> {
    if (petIds.length === 0) return [];
    const result = await this.rawQuery<QueryResultRow>(
      `SELECT
         h.id, h.pet_id AS "petId", h.user_id AS "userId",
         'checkin' AS type,
         json_build_object(
           'poopLevel', h.poop_level,
           'appetiteLevel', h.appetite_level,
           'spiritLevel', h.spirit_level,
           'exerciseLevel', h.exercise_level,
           'weight', h.weight,
           'riskLevel', h.risk_level,
           'note', h.note
         ) AS content,
         h.created_at AS "createdAt"
       FROM pet_health_entries h
       WHERE h.pet_id = ANY($1::text[]) AND h.created_at > $2
       ORDER BY h.created_at DESC`,
      [petIds, since],
    );
    return result.rows;
  }
}
