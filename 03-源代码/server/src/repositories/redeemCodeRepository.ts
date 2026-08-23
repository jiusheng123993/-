/**
 * 兑换码仓库（2026-08-23）
 * 管理端生成/查询；用户兑换（CAS：仅 unused 可兑换，防并发重复领取）
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 兑换码数据行 */
export interface RedeemCodeRow extends QueryResultRow {
  id: number;
  code: string;
  days: number;
  note: string | null;
  status: 'unused' | 'used';
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

/** 兑换码仓库 - redeem_codes 表 */
export class RedeemCodeRepository extends BaseRepository<RedeemCodeRow> {
  protected tableName = 'redeem_codes';
  protected allowedSortFields = ['created_at'] as const;

  /**
   * 批量生成兑换码（管理端）
   * @param codes - 待插入的码（调用方负责生成唯一码）
   * @param days - 兑换天数
   * @param note - 备注（可选）
   */
  async batchInsert(codes: string[], days: number, note?: string): Promise<void> {
    for (const code of codes) {
      await this.rawQuery(
        `INSERT INTO ${this.tableName} (code, days, note) VALUES ($1, $2, $3)`,
        [code, days, note || null],
      );
    }
  }

  /** 按码查询（区分大小写；兑换码用小写比较时统一转大写存储） */
  async findByCode(code: string): Promise<RedeemCodeRow | null> {
    const result = await this.rawQuery<RedeemCodeRow>(
      `SELECT * FROM ${this.tableName} WHERE code = $1`,
      [code],
    );
    return result.rows[0] || null;
  }

  /**
   * 兑换标记（CAS）：仅 status='unused' 时标记为 used，返回受影响行数
   * 并发下第二个请求因 status 已变而更新 0 行 → 拒绝重复兑换
   */
  async markUsed(id: number, userId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `UPDATE ${this.tableName}
       SET status = 'used', used_by = $2, used_at = now()
       WHERE id = $1 AND status = 'unused'`,
      [id, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /** 按状态列表（管理端） */
  async list(status?: string, limit = 100): Promise<RedeemCodeRow[]> {
    const values: unknown[] = [limit];
    let where = '';
    if (status) {
      values.unshift(status);
      where = 'WHERE status = $1';
    }
    const result = await this.rawQuery<RedeemCodeRow>(
      `SELECT * FROM ${this.tableName}
       ${where}
       ORDER BY created_at DESC
       LIMIT ${status ? '$2' : '$1'}`,
      values,
    );
    return result.rows;
  }
}
