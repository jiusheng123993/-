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

/** 形象库数据行（用户保存的多次生成形象，按风格/表情/类型分类） */
export interface AvatarLibraryRow extends QueryResultRow {
  id: string;
  pet_id: string;
  user_id: string;
  style: string;
  expression: string | null;
  image_url: string;
  /** 条目类型：headshot=头像 / multiview=全方位角色设定图（迁移 030，历史行默认 headshot） */
  view_type: string;
  created_at: string;
}

/** 保存形象到形象库参数 */
export interface SaveAvatarLibraryParams {
  id: string;
  petId: string;
  userId: string;
  style: string;
  expression: string | null;
  imageUrl: string;
  /** 条目类型（缺省 headshot，路由层已做白名单校验） */
  viewType: string;
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
   * ⚠️ 口径：排除文字生成（style 含 -text-，如 options-cartoon-text-q），
   * 文字生成 1 张/次且更频繁，不能占满"照片生成 3 次/月"额度
   * @param userId - 用户 ID
   * @param monthStart - 本月 1 号 0 点
   */
  async countMonthlyOptionsByUser(userId: string, monthStart: Date): Promise<number> {
    const result = await this.rawQuery(
      `SELECT COUNT(*)::int AS count
       FROM ${this.tableName}
       WHERE user_id = $1 AND style LIKE 'options-%' AND style NOT LIKE '%-text-%'
         AND status = 'completed' AND created_at >= $2`,
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

/**
 * 形象库仓库 - pet_avatar_library 表
 * 用户多次生成的形象可保存入库，按风格/表情分类，随时切换当前形象
 */
export class AvatarLibraryRepository extends BaseRepository<AvatarLibraryRow> {
  protected tableName = 'pet_avatar_library';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 保存一个形象到形象库（UPSERT：UNIQUE(pet_id,image_url) 冲突时刷新元数据）
   * 幂等设计（双 Agent 审查修复）：重复保存同一张图（如一套两条部分失败后重试、双击收藏）
   * 不再抛 23505 → 500，而是按"再次收藏"处理——刷新 view_type/表情/画风并置顶
   */
  async save(params: SaveAvatarLibraryParams): Promise<AvatarLibraryRow | null> {
    const result = await this.rawQuery<AvatarLibraryRow>(
      `INSERT INTO ${this.tableName}
         (id, pet_id, user_id, style, expression, image_url, view_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (pet_id, image_url) DO UPDATE SET
         style = EXCLUDED.style,
         expression = EXCLUDED.expression,
         view_type = EXCLUDED.view_type,
         created_at = NOW()
       RETURNING *`,
      [params.id, params.petId, params.userId, params.style, params.expression, params.imageUrl, params.viewType],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 查询某宠物的形象库（时间倒序，最新在前）
   */
  async findByPet(petId: string, userId: string): Promise<AvatarLibraryRow[]> {
    const result = await this.rawQuery<AvatarLibraryRow>(
      `SELECT id, pet_id, user_id, style, expression, image_url, view_type, created_at
       FROM ${this.tableName}
       WHERE pet_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [petId, userId],
    );
    return result.rows;
  }

  /**
   * 删除形象库中的一条（校验归属）
   * @returns 是否删除成功（0 行 = 不存在或非本人）
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
