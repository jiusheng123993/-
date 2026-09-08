/**
 * 会员数据访问层 - memberships 表
 * 处理会员订阅状态查询、订阅、取消、过期检查
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 *
 * 2026-09 全项目审查：已删除 subscribeWithTransaction（旧模拟支付专用）。
 * 原因有二：①全仓无调用方（/subscribe 已改为真实支付下单），属死代码；
 * ②其 BEGIN/COMMIT 依赖 BaseRepository 持有的 pg 连接池，各语句可能被池分配到
 * 不同连接，事务原子性实际失效（资金埋雷）。真实支付链路由 payment 模块的
 * activateMembership 承接，订单与会员状态一致性由回调 CAS + 退款兜底保证。
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 会员数据行 */
export interface MembershipRow extends QueryResultRow {
  id: string;
  user_id: string;
  tier: string;
  plan: string | null;
  status: string;
  price: number | null;
  expires_at: string | null;
  started_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 会员状态摘要（响应构建用，不含敏感字段） */
export interface MembershipStatus {
  id: string;
  tier: string;
  plan: string | null;
  status: string;
  price: number | null;
  expires_at: string | null;
  started_at: string | null;
}

/** 订阅计划参数 */
export interface SubscribeParams {
  userId: string;
  plan: string;
  price: number;
  expiresAt: Date;
}

export class MembershipRepository extends BaseRepository<MembershipRow> {
  protected tableName = 'memberships';
  protected allowedSortFields = ['created_at', 'updated_at', 'expires_at'] as const;

  /**
   * 查询用户会员状态（不含 cancelled_at 等敏感字段）
   */
  async findStatusByUser(userId: string): Promise<MembershipStatus | null> {
    const result = await this.rawQuery<MembershipStatus>(
      `SELECT id, tier, plan, status, price, expires_at, started_at
       FROM ${this.tableName}
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 查询用户会员完整记录（含过期检查用字段）
   */
  async findByUser(userId: string): Promise<MembershipRow | null> {
    return this.findOneWhere('user_id = $1', [userId]);
  }

  /**
   * 标记会员为过期状态
   */
  async markExpired(membershipId: string): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName} SET status = $1, updated_at = now() WHERE id = $2`,
      ['expired', membershipId],
    );
  }

  /**
   * 取消会员订阅（仅活跃订阅可取消，到期前仍可使用）
   * 返回取消后的会员信息，若无活跃订阅返回 null
   */
  async cancelActive(userId: string): Promise<{ id: string; tier: string; plan: string | null; expires_at: string | null } | null> {
    const result = await this.rawQuery<{ id: string; tier: string; plan: string | null; expires_at: string | null }>(
      `UPDATE ${this.tableName}
       SET status = 'cancelled', cancelled_at = now(), updated_at = now()
       WHERE user_id = $1 AND status = 'active'
       RETURNING id, tier, plan, expires_at`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 创建新会员订阅
   */
  async createMembership(params: SubscribeParams): Promise<MembershipRow> {
    return this.insert({
      user_id: params.userId,
      tier: 'member',
      plan: params.plan,
      status: 'active',
      price: params.price,
      expires_at: params.expiresAt,
      started_at: new Date(),
    });
  }

  /**
   * 更新现有会员订阅（续费或切换计划）
   */
  async renewMembership(params: SubscribeParams): Promise<MembershipRow | null> {
    const result = await this.rawQuery<MembershipRow>(
      `UPDATE ${this.tableName}
       SET tier = 'member', plan = $1, status = 'active', price = $2,
           expires_at = $3, started_at = now(), updated_at = now()
       WHERE user_id = $4
       RETURNING *`,
      [params.plan, params.price, params.expiresAt, params.userId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 查询用户会员状态（用于配额校验，包含过期判断）
   */
  async findTierAndStatus(userId: string): Promise<{ tier: string; status: string; expires_at: string | null } | null> {
    const result = await this.rawQuery<{ tier: string; status: string; expires_at: string | null }>(
      `SELECT tier, status, expires_at
       FROM ${this.tableName}
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 支付回调后激活会员（真实支付链路唯一入口）
   *
   * 由 payment 模块的微信回调调用，订单已标记 paid 后才调用此方法。
   * 此方法只负责创建/续期会员，不操作订单状态（订单状态由 payment 模块管理）。
   *
   * 业务规则：
   *   - 不存在会员记录：创建新会员
   *   - 已存在会员：按调用方传入的 expiresAt 更新（调用方必须按「未到期顺延」口径计算，
   *     即 base = max(当前到期时间, 现在) + 时长，否则会吞掉用户剩余会员时长——
   *     2026-09 审查 P1，参见 payment.ts handleMembershipPaymentSuccess）
   *
   * @param userId - 用户 ID
   * @param plan - 订阅计划：monthly/quarterly/yearly
   * @param price - 实际支付金额（分）
   * @param expiresAt - 会员到期时间（调用方按顺延口径算好传入）
   */
  async activateMembership(
    userId: string,
    plan: string,
    price: number,
    expiresAt: Date,
  ): Promise<void> {
    const existing = await this.findByUser(userId);
    if (existing === null) {
      await this.createMembership({ userId, plan, price, expiresAt });
    } else {
      await this.renewMembership({ userId, plan, price, expiresAt });
    }
  }
}
