/**
 * 慢性病记录数据访问层 - pet_chronic_records 表
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 慢性病记录数据行 */
export interface ChronicRecordRow extends QueryResultRow {
  id: string;
  pet_id: string;
  user_id: string;
  condition: string;
  diagnosed_date: string;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'managed' | 'resolved';
  medications: string[];
  vet_name: string | null;
  vet_contact: string | null;
  next_checkup_date: string | null;
  notes: string | null;
  symptoms: string[];
  created_at: string;
  updated_at: string;
}

/**
 * 慢性病记录仓库 - pet_chronic_records 表
 */
export class ChronicRepository extends BaseRepository<ChronicRecordRow> {
  protected tableName = 'pet_chronic_records';
  protected allowedSortFields = ['created_at', 'updated_at'] as const;

  /**
   * 创建慢性病记录
   */
  async create(
    id: string,
    petId: string,
    userId: string,
    data: {
      condition: string;
      diagnosed_date: string;
      severity: 'mild' | 'moderate' | 'severe';
      status: 'active' | 'managed' | 'resolved';
      medications?: string[];
      vet_name?: string | null;
      vet_contact?: string | null;
      next_checkup_date?: string | null;
      notes?: string | null;
      symptoms?: string[];
    },
  ): Promise<ChronicRecordRow> {
    const result = await this.rawQuery<ChronicRecordRow>(
      `INSERT INTO ${this.tableName}
        (id, pet_id, user_id, condition, diagnosed_date, severity, status,
         medications, vet_name, vet_contact, next_checkup_date, notes, symptoms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        id, petId, userId,
        data.condition, data.diagnosed_date, data.severity, data.status,
        data.medications ?? [],
        data.vet_name ?? null, data.vet_contact ?? null,
        data.next_checkup_date ?? null, data.notes ?? null,
        data.symptoms ?? [],
      ],
    );
    return result.rows[0];
  }

  /**
   * 查询某宠物的全部慢性病记录（按创建时间倒序）
   */
  async findByPet(petId: string, userId: string): Promise<ChronicRecordRow[]> {
    const result = await this.rawQuery<ChronicRecordRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [petId, userId],
    );
    return result.rows;
  }

  /**
   * 按 ID 查询记录（带归属校验）
   */
  async findOwnedById(id: string, petId: string, userId: string): Promise<ChronicRecordRow | null> {
    return this.findOneWhere('id = $1 AND pet_id = $2 AND user_id = $3', [id, petId, userId]);
  }

  /**
   * 更新记录（带归属校验，仅更新提供的字段）
   */
  async update(
    id: string,
    petId: string,
    userId: string,
    data: Partial<{
      condition: string;
      diagnosed_date: string;
      severity: string;
      status: string;
      medications: string[];
      vet_name: string | null;
      vet_contact: string | null;
      next_checkup_date: string | null;
      notes: string | null;
      symptoms: string[];
    }>,
  ): Promise<ChronicRecordRow | null> {
    const updates: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
    const result = await this.rawQuery<ChronicRecordRow>(
      `UPDATE ${this.tableName} SET
        condition = COALESCE($3, condition),
        diagnosed_date = COALESCE($4, diagnosed_date),
        severity = COALESCE($5, severity),
        status = COALESCE($6, status),
        medications = COALESCE($7, medications),
        vet_name = COALESCE($8, vet_name),
        vet_contact = COALESCE($9, vet_contact),
        next_checkup_date = COALESCE($10, next_checkup_date),
        notes = COALESCE($11, notes),
        symptoms = COALESCE($12, symptoms),
        updated_at = $13
       WHERE id = $1 AND pet_id = $2 AND user_id = $14
       RETURNING *`,
      [
        id, petId,
        updates.condition ?? null,
        updates.diagnosed_date ?? null,
        updates.severity ?? null,
        updates.status ?? null,
        updates.medications ?? null,
        updates.vet_name ?? null,
        updates.vet_contact ?? null,
        updates.next_checkup_date ?? null,
        updates.notes ?? null,
        updates.symptoms ?? null,
        updates.updated_at,
        userId,
      ],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 删除记录（带归属校验）
   */
  async remove(id: string, petId: string, userId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND pet_id = $2 AND user_id = $3`,
      [id, petId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
