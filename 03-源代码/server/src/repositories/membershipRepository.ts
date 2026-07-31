/**
 * 会员数据访问层 - memberships 表
 * 处理会员订阅状态查询、订阅、取消、过期检查
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 * 事务化的订阅流程封装在 subscribeWithTransaction 方法中，保证订单和会员状态原子更新
 */
import { BaseRepository } from './baseRepository.js';
import { PaymentOrderRepository, type CreateOrderParams } from './paymentOrderRepository.js';
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
   * 事务化的订阅流程：创建订单 → 创建/更新会员 → 标记订单已支付
   * 任一步骤失败自动回滚，保证订单和会员状态原子更新
   * @param orderParams - 订单参数（id/userId/plan/amount）
   * @param subscribeParams - 会员订阅参数（plan/price/expiresAt）
   * @param paymentOrderRepo - 支付订单仓库实例
   */
  async subscribeWithTransaction(
    orderParams: CreateOrderParams,
    subscribeParams: { plan: string; price: number; expiresAt: Date },
    paymentOrderRepo: PaymentOrderRepository,
  ): Promise<void> {
    await this.db.query('BEGIN');
    try {
      await paymentOrderRepo.createOrder(orderParams);

      const existing = await this.findByUser(orderParams.userId);
      if (existing === null) {
        await this.createMembership({
          userId: orderParams.userId,
          plan: subscribeParams.plan,
          price: subscribeParams.price,
          expiresAt: subscribeParams.expiresAt,
        });
      } else {
        await this.renewMembership({
          userId: orderParams.userId,
          plan: subscribeParams.plan,
          price: subscribeParams.price,
          expiresAt: subscribeParams.expiresAt,
        });
      }

      await paymentOrderRepo.markPaid(orderParams.id);
      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }
}
