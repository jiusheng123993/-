/**
 * 用户数据访问层 - users 表
 * 处理微信登录、用户资料 CRUD、活跃时间更新
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 用户数据行 */
export interface UserRow extends QueryResultRow {
  id: string;
  openid: string;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
  last_active: string | null;
}

/** 更新用户资料参数（仅允许更新 nickname 和 avatar_url） */
export interface UpdateUserProfileParams {
  nickname?: string;
  avatar_url?: string;
}

export class UserRepository extends BaseRepository<UserRow> {
  protected tableName = 'users';
  protected allowedSortFields = ['created_at', 'last_active'] as const;

  /**
   * 根据 openid 查询用户（用于微信登录）
   */
  async findByOpenid(openid: string): Promise<UserRow | null> {
    return this.findOneWhere('openid = $1', [openid]);
  }

  /**
   * 根据 ID 查询用户
   */
  async findById(userId: string): Promise<UserRow | null> {
    return this.findOneWhere('id = $1', [userId]);
  }

  /**
   * 创建新用户（用于首次登录）
   */
  async createUser(id: string, openid: string): Promise<UserRow> {
    return this.insert({ id, openid });
  }

  /**
   * 更新用户最后活跃时间
   */
  async updateLastActive(userId: string): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName} SET last_active = now() WHERE id = $1`,
      [userId],
    );
  }

  /**
   * 更新用户资料（仅允许 nickname 和 avatar_url 字段，白名单防注入）
   * 字段名来自白名单 allowedFields（非用户输入），可直接拼入 SET 子句
   * 即使未传入任何字段，也会执行 UPDATE last_active = now() RETURNING *（保持单次 query）
   */
  async updateProfile(
    userId: string,
    params: UpdateUserProfileParams,
  ): Promise<UserRow | null> {
    const allowedFields: readonly string[] = ['nickname', 'avatar_url'];
    const keys = Object.keys(params).filter((k) => allowedFields.includes(k));

    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`);
    const values = keys.map((k) => params[k as keyof UpdateUserProfileParams]);

    setClauses.push(`last_active = now()`);
    values.push(userId);

    const result = await this.rawQuery<UserRow>(
      `UPDATE ${this.tableName} SET ${setClauses.join(', ')}
       WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }
}
