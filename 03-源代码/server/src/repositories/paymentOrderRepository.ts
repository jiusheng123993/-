/**
 * 支付订单数据访问层 - payment_orders 表
 * 处理会员订阅支付订单和回忆录付费订单的创建和状态更新
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 *
 * 支持两种产品类型：
 *   - membership：会员订阅（plan=monthly/quarterly/yearly）
 *   - memoir：回忆录付费生成（plan=memoir_daily/memoir_memorial）
 *
 * 状态机：
 *   pending → paid（支付成功）→ refunded（已退款）
 *   pending → failed（支付失败）
 *
 * 安全约束：
 *   - 状态变更必须使用 CAS（Compare-And-Swap）防并发
 *   - transaction_id 唯一索引防重复回调
 *   - 退款前必须为 paid 状态
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 支付订单数据行 */
export interface PaymentOrderRow extends QueryResultRow {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  status: string;
  channel: string;
  product_type: 'membership' | 'memoir';
  product_metadata: Record<string, unknown> | null;
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 创建会员订阅订单参数 */
export interface CreateMembershipOrderParams {
  id: string;
  userId: string;
  plan: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
}

/** 创建回忆录订单参数 */
export interface CreateMemoirOrderParams {
  id: string;
  userId: string;
  /** 回忆录订单的 plan：memoir_daily（日常回忆录9.9元）| memoir_memorial（纪念Vlog 99/149元） */
  plan: 'memoir_daily' | 'memoir_memorial';
  amount: number;
  /** 业务上下文：memoir_type、pet_id、source_photos 等 */
  productMetadata: {
    pet_id: string;
    memoir_type: string;
    source_photos: string[];
    source_text?: string;
    music_style?: string;
    duration?: number;
    style_preset?: string;
    /** 用户身份上下文，用于回调时重建 createMemoir 入参 */
    tier: 'member' | 'free';
  };
}

export class PaymentOrderRepository extends BaseRepository<PaymentOrderRow> {
  protected tableName = 'payment_orders';
  protected allowedSortFields = ['created_at', 'updated_at'] as const;

  /**
   * 创建会员订阅订单（初始状态 pending）
   * 兼容旧调用契约（createOrder），保留以支持 membership.ts 历史调用
   */
  async createOrder(params: CreateMembershipOrderParams): Promise<PaymentOrderRow> {
    return this.insert({
      id: params.id,
      user_id: params.userId,
      plan: params.plan,
      amount: params.amount,
      status: 'pending',
      channel: 'wechat',
      product_type: 'membership',
    });
  }

  /**
   * 创建会员订阅订单（新接口，语义更清晰）
   */
  async createMembershipOrder(params: CreateMembershipOrderParams): Promise<PaymentOrderRow> {
    return this.insert({
      id: params.id,
      user_id: params.userId,
      plan: params.plan,
      amount: params.amount,
      status: 'pending',
      channel: 'wechat',
      product_type: 'membership',
    });
  }

  /**
   * 创建回忆录付费订单
   * product_metadata 不存敏感信息（source_text 原文不入库，仅存元数据）
   */
  async createMemoirOrder(params: CreateMemoirOrderParams): Promise<PaymentOrderRow> {
    return this.insert({
      id: params.id,
      user_id: params.userId,
      plan: params.plan,
      amount: params.amount,
      status: 'pending',
      channel: 'wechat',
      product_type: 'memoir',
      product_metadata: params.productMetadata,
    });
  }

  /**
   * 标记订单为已支付（旧接口，无 transaction_id）
   * 兼容 membership.ts 旧调用契约
   */
  async markPaid(orderId: string): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName} SET status = 'paid', paid_at = now() WHERE id = $1`,
      [orderId],
    );
  }

  /**
   * 微信回调标记订单已支付（CAS 防并发）
   * 仅当 status='pending' 时才更新，写入 transaction_id
   * @returns 是否更新成功（false 表示订单不存在/已处理/状态不符）
   */
  async markPaidByCallback(orderId: string, transactionId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `UPDATE ${this.tableName}
       SET status = 'paid', transaction_id = $1, paid_at = now()
       WHERE id = $2 AND status = 'pending'
       RETURNING id`,
      [transactionId, orderId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 标记订单为已退款（CAS：仅 paid 状态可退款）
   * @returns 是否退款成功
   */
  async markRefunded(orderId: string): Promise<boolean> {
    const result = await this.rawQuery(
      `UPDATE ${this.tableName}
       SET status = 'refunded'
       WHERE id = $1 AND status = 'paid'
       RETURNING id`,
      [orderId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 标记订单为失败（用于支付超时或主动查询失败）
   */
  async markFailed(orderId: string): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName} SET status = 'failed' WHERE id = $1 AND status = 'pending'`,
      [orderId],
    );
  }

  /**
   * 按 ID 查询订单（带用户归属校验）
   */
  async findByIdAndUser(orderId: string, userId: string): Promise<PaymentOrderRow | null> {
    return this.findOneWhere('id = $1 AND user_id = $2', [orderId, userId]);
  }

  /**
   * 按 ID 查询订单（不带归属校验，仅用于回调处理）
   */
  async findById(orderId: string): Promise<PaymentOrderRow | null> {
    return this.findOneWhere('id = $1', [orderId]);
  }
}
