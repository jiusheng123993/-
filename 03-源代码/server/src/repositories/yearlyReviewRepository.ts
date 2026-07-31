/**
 * 年度回忆图集数据访问层 - pet_yearly_reviews 表的数据库操作
 * 提供年度回忆的查询、创建、更新、删除等数据访问接口
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 年度回忆数据行 */
export interface YearlyReviewRow extends QueryResultRow {
  id: string;
  user_id: string;
  pet_id: string;
  year: number;
  status: string;
  review_data: Record<string, unknown> | null;
  cover_url: string | null;
  video_url: string | null;
  paid: boolean;
  created_at: string;
  updated_at: string;
}

export class YearlyReviewRepository extends BaseRepository<YearlyReviewRow> {
  protected tableName = 'pet_yearly_reviews';
  protected allowedSortFields = ['year', 'created_at', 'updated_at'] as const;

  /**
   * 按宠物 ID 和年份查询年度回忆（UNIQUE 约束保证唯一）
   */
  async findByPetAndYear(petId: string, year: number): Promise<YearlyReviewRow | null> {
    return this.findOneWhere('pet_id = $1 AND year = $2', [petId, year]);
  }

  /**
   * 按 ID + 用户 ID 查询（归属校验，防横向越权）
   */
  async findByIdAndUser(reviewId: string, userId: string): Promise<YearlyReviewRow | null> {
    return this.findOneWhere('id = $1 AND user_id = $2', [reviewId, userId]);
  }

  /**
   * 按 ID + 宠物 ID + 用户 ID 查询（严格三重归属校验）
   */
  async findByIdPetUser(
    reviewId: string,
    petId: string,
    userId: string,
  ): Promise<YearlyReviewRow | null> {
    return this.findOneWhere('id = $1 AND pet_id = $2 AND user_id = $3', [
      reviewId,
      petId,
      userId,
    ]);
  }

  /**
   * 分页查询宠物的年度回忆列表（按年份倒序）
   */
  async findByPetId(
    petId: string,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<YearlyReviewRow[]> {
    return this.findManyWhere('pet_id = $1 AND user_id = $2', [petId, userId], {
      orderBy: 'year',
      sortDirection: 'DESC',
      limit,
      offset,
    });
  }

  /**
   * 统计宠物的年度回忆总数
   */
  async countByPetId(petId: string, userId: string): Promise<number> {
    return this.countWhere('pet_id = $1 AND user_id = $2', [petId, userId]);
  }

  /**
   * 查询是否已存在（避免同年重复创建）
   */
  async existsByPetAndYear(petId: string, year: number): Promise<boolean> {
    const count = await this.countWhere('pet_id = $1 AND year = $2', [petId, year]);
    return count > 0;
  }
}
