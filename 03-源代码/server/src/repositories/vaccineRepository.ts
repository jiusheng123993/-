/**
 * 疫苗与驱虫记录数据访问层 - pet_vaccinations 表
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 * 提供统一的记录归属校验（消除 routes/vaccines.ts 中 verifyVaccinationOwnership 直连 SQL）
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 疫苗/驱虫记录数据行 */
export interface VaccineRow extends QueryResultRow {
  id: string;
  pet_id: string;
  user_id: string;
  type: 'vaccine' | 'deworm';
  category: string;
  date: string;
  next_date: string | null;
  status: 'completed' | 'pending' | 'overdue';
  hospital: string | null;
  doctor: string | null;
  notes: string | null;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 疫苗仓库 - pet_vaccinations 表
 */
export class VaccineRepository extends BaseRepository<VaccineRow> {
  protected tableName = 'pet_vaccinations';
  protected allowedSortFields = ['date', 'created_at', 'updated_at'] as const;

  /**
   * 校验记录归属权（用于权限校验）
   * 使用 findOneWhere 而非 countWhere，避免 COUNT 聚合开销
   */
  async isOwner(vaccineId: string, userId: string): Promise<boolean> {
    const row = await this.findOneWhere('id = $1 AND user_id = $2', [vaccineId, userId]);
    return row !== null;
  }

  /**
   * 校验疫苗记录访问权（多成员共同养宠，2026-08-24）
   * 疫苗是宠物维度管理：记录所属宠物可被主人或家庭成员访问
   */
  async canAccess(vaccineId: string, userId: string): Promise<boolean> {
    const result = await this.rawQuery<{ ok: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pet_vaccinations v
         WHERE v.id = $1 AND (
           EXISTS (SELECT 1 FROM pet_profiles p WHERE p.id = v.pet_id AND p.user_id = $2)
           UNION ALL
           EXISTS (SELECT 1 FROM pet_family_members m
                   JOIN pet_family_users u ON u.family_id = m.family_id
                   WHERE m.pet_id = v.pet_id AND u.user_id = $2)
         )
       ) AS ok`,
      [vaccineId, userId],
    );
    return result.rows[0]?.ok ?? false;
  }

  /**
   * 查询宠物的所有疫苗/驱虫记录（pet 维度，多成员共享：返回家庭成员的共同记录）
   */
  async findByPet(petId: string): Promise<VaccineRow[]> {
    const result = await this.rawQuery<VaccineRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id = $1
       ORDER BY date DESC, created_at DESC`,
      [petId],
    );
    return result.rows;
  }

  /**
   * 标记记录为已完成（权限已在路由层 canAccess 校验，不再按 user_id 过滤）
   */
  async markCompleted(vaccineId: string): Promise<VaccineRow | null> {
    const result = await this.rawQuery<VaccineRow>(
      `UPDATE ${this.tableName}
       SET status = 'completed', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [vaccineId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 更新提醒开关（权限已在路由层 canAccess 校验，不再按 user_id 过滤）
   */
  async updateReminder(
    vaccineId: string,
    reminderEnabled: boolean,
  ): Promise<VaccineRow | null> {
    const result = await this.rawQuery<VaccineRow>(
      `UPDATE ${this.tableName}
       SET reminder_enabled = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reminderEnabled, vaccineId],
    );
    return result.rows[0] ?? null;
  }
}
