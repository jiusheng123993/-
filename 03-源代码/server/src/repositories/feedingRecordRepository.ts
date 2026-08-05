/**
 * 喂养记录数据访问层 - pet_feeding_records 表
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 喂养记录数据行 */
export interface FeedingRecordRow extends QueryResultRow {
  id: string;
  pet_id: string;
  user_id: string;
  record_date: string;
  food_type: string;
  brand: string | null;
  amount: string | number;
  unit: string | null;
  meal_time: string | null;
  appetite: 'good' | 'normal' | 'poor' | null;
  stool: 'normal' | 'loose' | 'hard' | null;
  energy: 'high' | 'normal' | 'low' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 喂养记录仓库 - pet_feeding_records 表
 */
export class FeedingRecordRepository extends BaseRepository<FeedingRecordRow> {
  protected tableName = 'pet_feeding_records';
  protected allowedSortFields = ['record_date', 'created_at'] as const;

  /**
   * 创建喂养记录
   */
  async create(
    id: string,
    petId: string,
    userId: string,
    data: {
      record_date: string;
      food_type: string;
      brand?: string | null;
      amount?: number;
      unit?: string | null;
      meal_time?: string | null;
      appetite?: string | null;
      stool?: string | null;
      energy?: string | null;
      notes?: string | null;
    },
  ): Promise<FeedingRecordRow> {
    const result = await this.rawQuery<FeedingRecordRow>(
      `INSERT INTO ${this.tableName}
        (id, pet_id, user_id, record_date, food_type, brand, amount,
         unit, meal_time, appetite, stool, energy, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        id, petId, userId,
        data.record_date, data.food_type, data.brand ?? null,
        data.amount ?? 0, data.unit ?? null, data.meal_time ?? null,
        data.appetite ?? null, data.stool ?? null, data.energy ?? null,
        data.notes ?? null,
      ],
    );
    return result.rows[0];
  }

  /**
   * 查询某宠物的全部喂养记录（按日期倒序）
   */
  async findByPet(petId: string, userId: string): Promise<FeedingRecordRow[]> {
    const result = await this.rawQuery<FeedingRecordRow>(
      `SELECT * FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
       ORDER BY record_date DESC, created_at DESC`,
      [petId, userId],
    );
    return result.rows;
  }

  /**
   * 按 ID 查询记录（带归属校验）
   */
  async findOwnedById(id: string, petId: string, userId: string): Promise<FeedingRecordRow | null> {
    return this.findOneWhere('id = $1 AND pet_id = $2 AND user_id = $3', [id, petId, userId]);
  }

  /**
   * 更新记录（带归属校验）
   */
  async update(
    id: string,
    petId: string,
    userId: string,
    data: Partial<{
      record_date: string;
      food_type: string;
      brand: string | null;
      amount: number;
      unit: string | null;
      meal_time: string | null;
      appetite: string | null;
      stool: string | null;
      energy: string | null;
      notes: string | null;
    }>,
  ): Promise<FeedingRecordRow | null> {
    const result = await this.rawQuery<FeedingRecordRow>(
      `UPDATE ${this.tableName} SET
        record_date = COALESCE($3, record_date),
        food_type = COALESCE($4, food_type),
        brand = COALESCE($5, brand),
        amount = COALESCE($6, amount),
        unit = COALESCE($7, unit),
        meal_time = COALESCE($8, meal_time),
        appetite = COALESCE($9, appetite),
        stool = COALESCE($10, stool),
        energy = COALESCE($11, energy),
        notes = COALESCE($12, notes),
        updated_at = $13
       WHERE id = $1 AND pet_id = $2 AND user_id = $14
       RETURNING *`,
      [
        id, petId,
        data.record_date ?? null,
        data.food_type ?? null,
        data.brand ?? null,
        data.amount ?? null,
        data.unit ?? null,
        data.meal_time ?? null,
        data.appetite ?? null,
        data.stool ?? null,
        data.energy ?? null,
        data.notes ?? null,
        new Date().toISOString(),
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
