/**
 * 宠物特征数据访问层 - pet_facts 表
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 * 用于 AI 对话中提取并保存宠物特征（喜好、习惯等）
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 宠物特征数据行 */
export interface PetFactRow extends QueryResultRow {
  id: string;
  pet_id: string;
  user_id: string;
  category: 'like' | 'dislike' | 'habit' | 'personality' | 'general';
  fact: string;
  created_at: string;
}

/**
 * 宠物特征仓库 - pet_facts 表
 */
export class PetFactRepository extends BaseRepository<PetFactRow> {
  protected tableName = 'pet_facts';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 插入宠物特征记录
   */
  async insertFact(
    petId: string,
    userId: string,
    category: string,
    fact: string,
  ): Promise<PetFactRow> {
    return this.insert({
      pet_id: petId,
      user_id: userId,
      category,
      fact,
    });
  }

  /**
   * 查询宠物所有特征（按创建时间倒序）
   * 返回 id、pet_id、category、fact、created_at 字段
   */
  async findByPetAndUser(petId: string, userId: string): Promise<PetFactRow[]> {
    const result = await this.rawQuery<PetFactRow>(
      `SELECT id, pet_id, category, fact, created_at
       FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [petId, userId],
    );
    return result.rows;
  }
}
