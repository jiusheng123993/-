/**
 * 宠物形象数据访问层 - avatar_generations / avatar_2d_images / avatar_3d_models 表
 * 处理头像生成记录、2D 形象图片、3D 模型的查询和更新
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 头像生成记录数据行 */
export interface AvatarGenerationRow extends QueryResultRow {
  id: string;
  user_id: string;
  pet_id: string;
  prompt: string;
  style: string;
  status: string;
  result_url: string | null;
  error: string | null;
  completed_at: string | null;
  created_at: string;
}

/** 2D 形象图片数据行 */
export interface Avatar2DImageRow extends QueryResultRow {
  id: string;
  task_id: string;
  angle: string | null;
  expression: string | null;
  image_url: string;
  is_selected: boolean;
  sort_order: number;
}

/** 3D 模型数据行 */
export interface Avatar3DModelRow extends QueryResultRow {
  id: string;
  task_id: string;
  model_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

/** 创建头像生成记录参数 */
export interface CreateAvatarGenerationParams {
  id: string;
  user_id: string;
  pet_id: string;
  prompt: string;
  style: string;
}

/**
 * 头像生成记录仓库 - avatar_generations 表
 * 处理头像生成（基础 cartoon/realistic 风格）记录的创建和状态更新
 */
export class AvatarGenerationRepository extends BaseRepository<AvatarGenerationRow> {
  protected tableName = 'avatar_generations';
  protected allowedSortFields = ['created_at', 'completed_at'] as const;

  /**
   * 创建头像生成记录（初始状态 processing）
   */
  async createGeneration(params: CreateAvatarGenerationParams): Promise<AvatarGenerationRow> {
    return this.insert({
      id: params.id,
      user_id: params.user_id,
      pet_id: params.pet_id,
      prompt: params.prompt,
      style: params.style,
      status: 'processing',
    });
  }

  /**
   * 标记头像生成失败
   */
  async markFailed(generationId: string, error: string): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName} SET status = 'failed', error = $1 WHERE id = $2`,
      [error, generationId],
    );
  }

  /**
   * 标记头像生成完成并写入结果 URL
   */
  async markCompleted(generationId: string, resultUrl: string): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName}
       SET status = 'completed', result_url = $1, completed_at = now()
       WHERE id = $2`,
      [resultUrl, generationId],
    );
  }

  /**
   * 统计用户本月已完成的多风格候选生成次数（用于照片生成会员额度）
   * 只统计 style 为 options-* 且成功完成的记录，AI 服务故障导致的失败不占用次数
   * @param userId - 用户 ID
   * @param monthStart - 本月 1 号 0 点
   */
  async countMonthlyOptionsByUser(userId: string, monthStart: Date): Promise<number> {
    const result = await this.rawQuery(
      `SELECT COUNT(*)::int AS count
       FROM ${this.tableName}
       WHERE user_id = $1 AND style LIKE 'options-%' AND status = 'completed' AND created_at >= $2`,
      [userId, monthStart],
    );
    return result.rows[0]?.count ?? 0;
  }
}

/**
 * 2D 形象图片仓库 - avatar_2d_images 表
 * 处理 2D 形象包生成的图片查询
 */
export class Avatar2DImageRepository extends BaseRepository<Avatar2DImageRow> {
  protected tableName = 'avatar_2d_images';
  protected allowedSortFields = ['sort_order', 'created_at'] as const;

  /**
   * 按任务 ID 查询 2D 形象图片列表（按 sort_order 排序）
   */
  async findByTaskId(taskId: string): Promise<Avatar2DImageRow[]> {
    const result = await this.rawQuery<Avatar2DImageRow>(
      `SELECT id, angle, expression, image_url, is_selected, sort_order
       FROM ${this.tableName}
       WHERE task_id = $1
       ORDER BY sort_order`,
      [taskId],
    );
    return result.rows;
  }
}

/**
 * 3D 模型仓库 - avatar_3d_models 表
 * 处理 3D 模型生成结果的查询
 */
export class Avatar3DModelRepository extends BaseRepository<Avatar3DModelRow> {
  protected tableName = 'avatar_3d_models';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 按任务 ID 查询最新的 3D 模型
   */
  async findLatestByTaskId(taskId: string): Promise<Avatar3DModelRow | null> {
    const result = await this.rawQuery<Avatar3DModelRow>(
      `SELECT id, model_url, thumbnail_url, created_at
       FROM ${this.tableName}
       WHERE task_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [taskId],
    );
    return result.rows[0] ?? null;
  }
}
