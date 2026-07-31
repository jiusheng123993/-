/**
 * 形象生成任务数据访问层 - avatar_generation_tasks 表
 * 处理 2D/3D 任务的统计查询（配额校验用）
 * 任务的核心 CRUD（创建/查询/获取最新）由 taskQueue 服务管理，本仓库仅提供统计能力
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 任务类型枚举 */
export type AvatarTaskType = '2d' | '3d';

/** 任务数据行 */
export interface AvatarTaskRow extends QueryResultRow {
  id: string;
  user_id: string;
  pet_id: string;
  task_type: AvatarTaskType;
  status: string;
  reference_photo_url: string | null;
  result_url: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export class AvatarTaskRepository extends BaseRepository<AvatarTaskRow> {
  protected tableName = 'avatar_generation_tasks';
  protected allowedSortFields = ['created_at', 'updated_at'] as const;

  /**
   * 统计用户当月已成功的指定类型任务数（用于配额校验）
   * @param userId - 用户 ID
   * @param taskType - 任务类型（2d/3d）
   * @param monthStart - 当月起始时间
   */
  async countMonthlyCompleted(userId: string, taskType: AvatarTaskType, monthStart: Date): Promise<number> {
    return this.countWhere(
      'user_id = $1 AND task_type = $2 AND status = $3 AND created_at >= $4',
      [userId, taskType, 'completed', monthStart],
    );
  }
}
