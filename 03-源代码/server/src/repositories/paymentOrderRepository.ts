/**
 * 支付订单数据访问层 - payment_orders 表
 * 处理会员订阅支付订单的创建和状态更新
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
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
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 创建订单参数 */
export interface CreateOrderParams {
  id: string;
  userId: string;
  plan: string;
  amount: number;
}

export class PaymentOrderRepository extends BaseRepository<PaymentOrderRow> {
  protected tableName = 'payment_orders';
  protected allowedSortFields = ['created_at', 'updated_at'] as const;

  /**
   * 创建支付订单（初始状态 pending）
   */
  async createOrder(params: CreateOrderParams): Promise<PaymentOrderRow> {
    return this.insert({
      id: params.id,
      user_id: params.userId,
      plan: params.plan,
      amount: params.amount,
      status: 'pending',
      channel: 'wechat',
    });
  }

  /**
   * 标记订单为已支付
   */
  async markPaid(orderId: string): Promise<void> {
    await this.rawQuery(
      `UPDATE ${this.tableName} SET status = 'paid', paid_at = now() WHERE id = $1`,
      [orderId],
    );
  }
}
