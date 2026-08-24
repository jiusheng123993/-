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

/** 家庭成员（人）数据行 - pet_family_users 表 */
export interface FamilyUserRow extends QueryResultRow {
  id: string;
  family_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

/** 家庭成员详情行（JOIN users 带昵称头像） */
export interface FamilyUserDetailRow extends QueryResultRow {
  id: string;
  family_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  nickname: string;
  avatar_url: string | null;
}

/**
 * 家庭成员（人）仓库 - pet_family_users 表
 * 多成员共同养宠的核心支撑：家庭 ←→ 用户 关联
 */
export class FamilyUserRepository extends BaseRepository<FamilyUserRow> {
  protected tableName = 'pet_family_users';
  protected allowedSortFields = ['joined_at'] as const;

  /**
   * 添加家庭成员（owner 邀请）
   * @param familyId - 家庭 ID
   * @param userId - 被邀请用户 ID
   * @param role - 角色（默认 member；owner 仅在创建家庭时使用）
   */
  async addUser(familyId: string, userId: string, role: 'owner' | 'member' = 'member'): Promise<FamilyUserRow | null> {
    return this.insert({ family_id: familyId, user_id: userId, role });
  }

  /**
   * 移除家庭成员
   * @returns true=移除成功；false=该用户不在家庭中
   */
  async removeUser(familyId: string, userId: string): Promise<boolean> {
    const result = await this.rawQuery(
      'DELETE FROM pet_family_users WHERE family_id = $1 AND user_id = $2 RETURNING *',
      [familyId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 查询家庭成员列表（JOIN users 带昵称头像，用于前端展示）
   */
  async findUsersByFamilyId(familyId: string): Promise<FamilyUserDetailRow[]> {
    const result = await this.rawQuery<FamilyUserDetailRow>(
      `SELECT u.id, u.family_id, u.user_id, u.role, u.joined_at,
              COALESCE(users.nickname, '') AS nickname,
              COALESCE(users.avatar_url, '') AS avatar_url
       FROM pet_family_users u
       JOIN users ON users.id = u.user_id
       WHERE u.family_id = $1
       ORDER BY (u.role = 'owner') DESC, u.joined_at ASC`,
      [familyId],
    );
    return result.rows;
  }

  /**
   * 查询用户加入的所有家庭（含"我创建的家庭"）
   */
  async findFamiliesByUser(userId: string): Promise<FamilyRow[]> {
    const result = await this.rawQuery<FamilyRow>(
      `SELECT f.id, f.user_id, f.name, f.avatar_url, f.created_at, f.updated_at
       FROM pet_families f
       JOIN pet_family_users u ON u.family_id = f.id
       WHERE u.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * 检查用户是否家庭成员（用于宠物访问/家庭读权限）
   */
  async isFamilyUser(familyId: string, userId: string): Promise<boolean> {
    const row = await this.findOneWhere('family_id = $1 AND user_id = $2', [familyId, userId]);
    return row !== null;
  }

  /**
   * 检查用户是否为家庭 owner（用于邀请/移除成员等高危管理操作）
   */
  async isFamilyOwner(familyId: string, userId: string): Promise<boolean> {
    const row = await this.findOneWhere('family_id = $1 AND user_id = $2 AND role = $3', [familyId, userId, 'owner']);
    return row !== null;
  }
}

/** 家庭邀请码数据行 - pet_family_invites 表 */
export interface FamilyInviteRow extends QueryResultRow {
  id: string;
  family_id: string;
  code: string;
  created_by: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

/**
 * 家庭邀请码仓库 - pet_family_invites 表
 * owner 生成邀请码 → 对方凭码加入家庭（多成员共同养宠，2026-08-24）
 */
export class FamilyInviteRepository extends BaseRepository<FamilyInviteRow> {
  protected tableName = 'pet_family_invites';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 创建邀请码
   * @param familyId - 家庭 ID
   * @param createdBy - 邀请人（owner）
   * @param code - 邀请码（6 位去混淆字符）
   * @param expiresAt - 过期时间
   */
  async createInvite(
    familyId: string,
    createdBy: string,
    code: string,
    expiresAt: string,
  ): Promise<FamilyInviteRow> {
    return this.insert({ family_id: familyId, created_by: createdBy, code, expires_at: expiresAt });
  }

  /**
   * 按邀请码查询有效邀请（未使用且未过期）
   * 用于加入家庭校验
   */
  async findValidByCode(code: string): Promise<FamilyInviteRow | null> {
    const result = await this.rawQuery<FamilyInviteRow>(
      `SELECT * FROM ${this.tableName}
       WHERE code = $1 AND used_by IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [code],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 标记邀请码已使用（防止重复加入）
   */
  async markUsed(code: string, userId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `UPDATE ${this.tableName}
       SET used_by = $2, used_at = NOW()
       WHERE code = $1 AND used_by IS NULL`,
      [code, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

/** 家庭成员（人）关系数据行 - family_user_relations 表（2026-08-24） */
export interface FamilyUserRelationRow extends QueryResultRow {
  id: string;
  family_id: string;
  user_id_a: string;
  user_id_b: string;
  relation_type: 'couple' | 'father_daughter' | 'father_son' | 'mother_daughter' | 'mother_son' | 'siblings' | 'friends' | 'other';
  created_at: string;
}

/** 家庭成员（人）关系详情行（JOIN users 带双方昵称头像） */
export interface FamilyUserRelationDetailRow extends QueryResultRow {
  id: string;
  family_id: string;
  user_id_a: string;
  user_id_b: string;
  relation_type: FamilyUserRelationRow['relation_type'];
  created_at: string;
  nickname_a: string;
  avatar_url_a: string | null;
  nickname_b: string;
  avatar_url_b: string | null;
}

/**
 * 家庭成员（人）关系仓库 - family_user_relations 表
 * 多成员共同养宠的"人关系"扩展：情侣/父女/兄弟姐妹等任意两人之间的家庭角色关系
 */
export class FamilyUserRelationRepository extends BaseRepository<FamilyUserRelationRow> {
  protected tableName = 'family_user_relations';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 查询家庭全部人关系（JOIN users 带双方昵称头像，供前端图谱/成员列表展示）
   * @param familyId - 家庭 ID
   */
  async listRelations(familyId: string): Promise<FamilyUserRelationDetailRow[]> {
    const result = await this.rawQuery<FamilyUserRelationDetailRow>(
      `SELECT r.id, r.family_id, r.user_id_a, r.user_id_b, r.relation_type, r.created_at,
              COALESCE(ua.nickname, '') AS nickname_a,
              COALESCE(ua.avatar_url, '') AS avatar_url_a,
              COALESCE(ub.nickname, '') AS nickname_b,
              COALESCE(ub.avatar_url, '') AS avatar_url_b
       FROM family_user_relations r
       JOIN users ua ON ua.id = r.user_id_a
       JOIN users ub ON ub.id = r.user_id_b
       WHERE r.family_id = $1
       ORDER BY r.created_at ASC`,
      [familyId],
    );
    return result.rows;
  }

  /**
   * 创建人关系（防重复：同一对成员只允许一条，a-b 与 b-a 视为同一对）
   * @param familyId - 家庭 ID
   * @param userIdA - 关系主体（如父亲）
   * @param userIdB - 被关系对象（如女儿）
   * @param relationType - 关系类型（8 种标准枚举）
   * @returns 插入后的关系行；两人已存在关系时返回 null
   */
  async createRelation(
    familyId: string,
    userIdA: string,
    userIdB: string,
    relationType: FamilyUserRelationRow['relation_type'],
  ): Promise<FamilyUserRelationRow | null> {
    // ON CONFLICT 命中 UNIQUE(family_id, LEAST(a,b), GREATEST(a,b)) 时不做任何事 → 返回 null
    const result = await this.rawQuery<FamilyUserRelationRow>(
      `INSERT INTO ${this.tableName} (family_id, user_id_a, user_id_b, relation_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (family_id, LEAST(user_id_a, user_id_b), GREATEST(user_id_a, user_id_b)) DO NOTHING
       RETURNING *`,
      [familyId, userIdA, userIdB, relationType],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 删除人关系（归属校验：必须同时匹配 familyId，防止跨家庭删除）
   * @returns true=删除成功；false=关系不存在或不属于该家庭
   */
  async removeRelation(id: string, familyId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND family_id = $2 RETURNING *`,
      [id, familyId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
