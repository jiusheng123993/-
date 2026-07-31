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
   * 查询宠物的所有疫苗/驱虫记录（按日期倒序，再按创建时间倒序）
   */
  async findByPetAndUser(petId: string, userId: string): Promise<VaccineRow[]> {
    const result = await this.rawQuery<VaccineRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
       ORDER BY date DESC, created_at DESC`,
      [petId, userId],
    );
    return result.rows;
  }

  /**
   * 标记记录为已完成
   */
  async markCompleted(vaccineId: string, userId: string): Promise<VaccineRow | null> {
    const result = await this.rawQuery<VaccineRow>(
      `UPDATE ${this.tableName}
       SET status = 'completed', updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [vaccineId, userId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 更新提醒开关
   */
  async updateReminder(
    vaccineId: string,
    userId: string,
    reminderEnabled: boolean,
  ): Promise<VaccineRow | null> {
    const result = await this.rawQuery<VaccineRow>(
      `UPDATE ${this.tableName}
       SET reminder_enabled = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [reminderEnabled, vaccineId, userId],
    );
    return result.rows[0] ?? null;
  }
}
