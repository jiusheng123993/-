/**
 * 排行榜与角色数据访问层
 * - pet_roles：宠物在家庭中的角色分配
 * - pet_leaderboard_snapshots：家庭周/月/总榜快照
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 角色数据行 */
export interface RoleRow extends QueryResultRow {
  id: string;
  pet_id: string;
  family_id: string;
  role_type: string;
  assignment: string;
  created_at: string;
}

/** 排行榜快照数据行 */
export interface LeaderboardSnapshotRow extends QueryResultRow {
  id: string;
  family_id: string;
  period: string;
  rankings: unknown[];
  computed_at: string;
}

/**
 * 角色仓库 - pet_roles 表
 */
export class RoleRepository extends BaseRepository<RoleRow> {
  protected tableName = 'pet_roles';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 查询家庭所有角色（按创建时间正序）
   */
  async findByFamilyId(familyId: string): Promise<RoleRow[]> {
    return this.findManyWhere('family_id = $1', [familyId], {
      orderBy: 'created_at',
      sortDirection: 'ASC',
    });
  }

  /**
   * 按 ID + 家庭 ID 查询（归属校验）
   */
  async findByIdAndFamily(
    roleId: string,
    familyId: string,
  ): Promise<RoleRow | null> {
    return this.findOneWhere('id = $1 AND family_id = $2', [roleId, familyId]);
  }

  /**
   * 查询某宠物在某家庭的所有角色
   */
  async findByPetAndFamily(
    petId: string,
    familyId: string,
  ): Promise<RoleRow[]> {
    return this.findManyWhere('pet_id = $1 AND family_id = $2', [petId, familyId]);
  }

  /**
   * 检查角色是否已存在（UNIQUE(pet_id, role_type)）
   */
  async existsByPetAndType(
    petId: string,
    roleType: string,
  ): Promise<boolean> {
    const count = await this.countWhere('pet_id = $1 AND role_type = $2', [
      petId,
      roleType,
    ]);
    return count > 0;
  }
}

/**
 * 排行榜快照仓库 - pet_leaderboard_snapshots 表
 */
export class LeaderboardSnapshotRepository extends BaseRepository<LeaderboardSnapshotRow> {
  protected tableName = 'pet_leaderboard_snapshots';
  protected allowedSortFields = ['computed_at'] as const;

  /**
   * 按家庭 + 周期查询快照
   */
  async findByFamilyAndPeriod(
    familyId: string,
    period: string,
  ): Promise<LeaderboardSnapshotRow | null> {
    return this.findOneWhere('family_id = $1 AND period = $2', [
      familyId,
      period,
    ]);
  }

  /**
   * Upsert 快照（family_id + period 唯一）
   */
  async upsertSnapshot(
    familyId: string,
    period: string,
    rankings: unknown[],
  ): Promise<LeaderboardSnapshotRow> {
    const result = await this.rawQuery<LeaderboardSnapshotRow>(
      `INSERT INTO pet_leaderboard_snapshots (family_id, period, rankings, computed_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (family_id, period)
       DO UPDATE SET rankings = $3::jsonb, computed_at = NOW()
       RETURNING *`,
      [familyId, period, JSON.stringify(rankings)],
    );
    return result.rows[0];
  }
}
