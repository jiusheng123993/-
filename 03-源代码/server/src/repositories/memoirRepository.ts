/**
 * 回忆录数据访问层 - pet_memoir_records 表的数据库操作
 * 提供回忆录任务查询、创建、删除等数据访问接口
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 回忆录任务数据行 */
export interface MemoirRecordRow extends QueryResultRow {
  id: string;
  user_id: string;
  pet_id: string;
  memoir_type: string;
  status: string;
  source_photos: string[];
  source_text: string | null;
  narrative_structure: Record<string, unknown> | null;
  video_url: string | null;
  preview_url: string | null;
  cost_credits: number | null;
  payment_id: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  /** 剧本确认闸门（立项 v0.2 P0-2）：true=剧本已生成、暂停等待用户确认 */
  awaiting_confirmation?: boolean;
  script_confirmed_at?: string | null;
  script_rejected_at?: string | null;
  /** 审核拒绝重试计数（迁移 033，持久化防进程重启清零多烧视频成本） */
  retry_count?: number;
}

export class MemoirRepository extends BaseRepository<MemoirRecordRow> {
  protected tableName = 'pet_memoir_records';
  protected allowedSortFields: readonly string[] = ['created_at', 'completed_at'];

  /**
   * 查找宠物当前进行中的任务（pending/processing）
   * 用于并发检查：同一宠物同时只能存在一个视频生成任务
   * 注：等待剧本确认的任务 status 仍为 pending，天然被本查询覆盖（创建互斥）
   */
  async findActiveByPetId(petId: string): Promise<MemoirRecordRow | null> {
    return this.findOneWhere(
      'pet_id = $1 AND status IN ($2, $3)',
      [petId, 'pending', 'processing'],
    );
  }

  /**
   * 分页查询宠物的回忆录列表
   */
  async findByPetId(petId: string, limit: number, offset: number): Promise<MemoirRecordRow[]> {
    return this.findManyWhere(
      'pet_id = $1',
      [petId],
      { orderBy: 'created_at', sortDirection: 'DESC', limit, offset },
    );
  }

  /**
   * 查询宠物最新一条回忆录任务（用于状态查询）
   */
  async findLatestByPetId(petId: string): Promise<MemoirRecordRow | null> {
    const rows = await this.findManyWhere(
      'pet_id = $1',
      [petId],
      { orderBy: 'created_at', sortDirection: 'DESC', limit: 1 },
    );
    return rows[0] ?? null;
  }

  /**
   * 查找属于指定用户的回忆录（归属校验，防横向越权）
   */
  async findByIdAndUser(memoirId: string, userId: string): Promise<MemoirRecordRow | null> {
    return this.findOneWhere(
      'id = $1 AND user_id = $2',
      [memoirId, userId],
    );
  }

  /**
   * 统计宠物的回忆录总数（用于分页）
   */
  async countByPetId(petId: string): Promise<number> {
    return this.countWhere('pet_id = $1', [petId]);
  }

  /**
   * 统计用户当月已创建的日常回忆录数量（用于会员配额校验）
   * 仅统计 daily/seasonal/milestone/custom 类型，memorial 不计入免费配额
   * @param userId - 用户 ID
   * @param yearMonth - 月份字符串，格式 YYYY-MM
   */
  async countMonthlyDailyMemoirsByUser(userId: string, yearMonth: string): Promise<number> {
    const result = await this.rawQuery<QueryResultRow>(
      `SELECT COUNT(*)::int as count FROM ${this.tableName}
       WHERE user_id = $1
         AND memoir_type != 'memorial'
         AND to_char(created_at, 'YYYY-MM') = $2`,
      [userId, yearMonth],
    );
    const count = result.rows[0]?.count;
    return count === undefined || count === null ? 0 : Number(count);
  }

  /**
   * 查询所有待处理的回忆录任务（pending 且未在等待剧本确认）
   * 用于异步任务处理器轮询
   * 立项 v0.2 P0-2：awaiting_confirmation=true 的任务已生成剧本、暂停等用户确认，不领取
   */
  async findPendingTasks(limit: number): Promise<MemoirRecordRow[]> {
    const result = await this.rawQuery<MemoirRecordRow>(
      `SELECT * FROM ${this.tableName}
       WHERE status = 'pending' AND awaiting_confirmation = false
       ORDER BY created_at ASC LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  /**
   * 原子更新任务状态为 processing（防止并发重复处理）
   * 仅当当前状态为 pending 且未在等待剧本确认时才更新，返回是否抢占成功
   */
  async claimTask(taskId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `UPDATE ${this.tableName}
       SET status = 'processing'
       WHERE id = $1 AND status = 'pending' AND awaiting_confirmation = false
       RETURNING id`,
      [taskId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 剧本生成后暂停任务，等待用户确认（立项 v0.2 P0-2）
   * 任务保持 pending + awaiting_confirmation=true，处理器不再领取；
   * 用户确认后由 confirmScript 释放回队列，视频生成成本在确认后才发生
   */
  async pauseForScriptConfirmation(taskId: string): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName}
       SET awaiting_confirmation = true
       WHERE id = $1 AND status = 'pending'`,
      [taskId],
    );
  }

  /**
   * 用户确认分镜脚本：释放回生成队列（立项 v0.2 P0-2）
   * 仅 awaiting_confirmation=true 的任务可确认（幂等：重复确认无效果）
   */
  async confirmScript(taskId: string, userId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `UPDATE ${this.tableName}
       SET awaiting_confirmation = false, script_confirmed_at = now()
       WHERE id = $1 AND user_id = $2 AND status = 'pending' AND awaiting_confirmation = true
       RETURNING id`,
      [taskId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 用户拒绝分镜脚本：终止任务（立项 v0.2 P0-2）
   * 拒绝发生在视频生成之前，Seedance 成本未发生；failed 终态由用户在页面重建任务
   */
  async rejectScript(taskId: string, userId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `UPDATE ${this.tableName}
       SET status = 'failed',
           awaiting_confirmation = false,
           script_rejected_at = now(),
           error_message = '用户放弃生成（剧本未确认）'
       WHERE id = $1 AND user_id = $2 AND status = 'pending' AND awaiting_confirmation = true
       RETURNING id`,
      [taskId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 标记任务完成，写入视频 URL 和预览 URL
   */
  async markCompleted(
    taskId: string,
    videoUrl: string,
    previewUrl: string,
  ): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName}
       SET status = 'completed', video_url = $1, preview_url = $2,
           completed_at = now()
       WHERE id = $3`,
      [videoUrl, previewUrl, taskId],
    );
  }

  /**
   * 标记任务失败，写入错误信息
   */
  async markFailed(taskId: string, errorMessage: string): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName}
       SET status = 'failed', error_message = $1
       WHERE id = $2`,
      [errorMessage, taskId],
    );
  }

  /**
   * 更新分镜脚本（回忆录 2.0）
   * 在原有 narrative_structure 上叠加 script 字段（保留 music_style/duration 等旧字段，兼容）
   * @param taskId - 任务 ID
   * @param script - 分镜脚本对象（存 JSONB）
   */
  async updateScript(taskId: string, script: Record<string, unknown>): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName}
       SET narrative_structure = jsonb_set(
             COALESCE(narrative_structure, '{}'::jsonb),
             '{script}',
             $1::jsonb
           )
       WHERE id = $2`,
      [JSON.stringify(script), taskId],
    );
  }

  /**
   * 重置任务为 pending（用于审核失败重试）
   */
  async resetToPending(taskId: string): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName}
       SET status = 'pending', error_message = null
       WHERE id = $1`,
      [taskId],
    );
  }

  /**
   * 重试计数原子递增（迁移 033，审查⏳4）
   * 原 retryCountMap 内存 Map 在进程重启后清零，坏任务可多烧最多 2 轮 Seedance 视频
   * （单条 20-200 元）。改为落库 + UPDATE ... RETURNING 原子递增，返回递增后的计数值。
   */
  async incrementRetryCount(taskId: string): Promise<number> {
    const result = await this.rawQuery(
      `UPDATE ${this.tableName}
       SET retry_count = retry_count + 1
       WHERE id = $1
       RETURNING retry_count`,
      [taskId],
    );
    return Number(result.rows[0]?.retry_count ?? 0);
  }
}
