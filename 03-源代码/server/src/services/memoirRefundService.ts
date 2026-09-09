/**
 * 回忆录退款闭环（审查⏳3，用户拍板方案 A：失败自动直退）
 *
 * 缺口背景：回忆录付费单条（memoir_daily/memoir_memorial）的生成发生在支付回调之后的
 * 异步处理器，此前最终失败（审核拒绝超重试/生成异常/质检不过）与用户放弃剧本均只
 * markFailed 不退钱——"付了钱没有货"，微信支付场景必招投诉与平台仲裁。
 *
 * 闭环：任何回忆录任务最终失败 → 若该任务关联付费订单（payment_id 非空且订单
 * status='paid'）→ 原路全额退款 + 订单标记 refunded + 资金审计 + WebSocket 通知。
 * 复用 payment.ts 回调层已有的同款机制（refund + markRefunded + 审计 + 通知）。
 *
 * 幂等/安全边界：
 * - 会员订阅用户创建回忆录不产生付费订单（payment_id 为空）→ 天然跳过，不涉会员费
 * - markRefunded 为 CAS（仅 paid 可转 refunded），订单已退款/失败时不会二次退款
 * - 退款动作任何一步失败仅记日志、不抛出——退款失败不能阻断 markFailed 主流程
 */
import { refund } from './wechatPayService.js';
import { PaymentOrderRepository } from '../repositories/paymentOrderRepository.js';
import { recordAuditLog } from './auditService.js';
import { sendToUser } from './websocketService.js';

const paymentOrderRepository = new PaymentOrderRepository();

/** 可退款的回忆录任务最小字段（MemoirRecordRow 的子集） */
export interface RefundableMemoirTask {
  id: string;
  user_id: string;
  payment_id: string | null;
}

/**
 * 回忆录任务最终失败后的自动退款
 * @param task 回忆录任务行（需含 user_id/payment_id）
 * @param reason 退款原因（落审计与微信退款单，用于对账）
 * @returns 是否实际发起退款
 */
export async function refundMemoirOrder(task: RefundableMemoirTask, reason: string): Promise<boolean> {
  // 会员权益创建的任务无付费订单，无需退款
  if (!task.payment_id) {
    return false;
  }

  try {
    const order = await paymentOrderRepository.findById(task.payment_id);
    // 幂等守卫：订单不存在 / 非已支付状态（refunded/failed/pending）一律不退
    if (!order || order.status !== 'paid') {
      console.warn(
        `[MemoirRefund] Task ${task.id}: 订单不可退款（不存在或状态非 paid），跳过 orderId=${task.payment_id}`,
      );
      return false;
    }

    // 微信原路全额退款
    await refund(order.id, order.amount, `回忆录生成失败退款: ${reason.slice(0, 80)}`);

    // CAS 标记订单 refunded（仅 paid 可转，防并发/重复退款）
    await paymentOrderRepository.markRefunded(order.id);

    // 资金审计（与支付回调层退款同动作枚举，对账口径一致）
    await recordAuditLog({
      userId: task.user_id,
      action: 'payment-refunded',
      resourceType: 'payment-order',
      resourceId: order.id,
      detail: { product_type: 'memoir', amount: order.amount, memoir_task_id: task.id, reason: reason.slice(0, 120) },
    });

    // WebSocket 通知用户（前端现有 payment_refunded 事件类型，无新契约）
    sendToUser(task.user_id, {
      type: 'payment_refunded',
      data: {
        order_id: order.id,
        product_type: 'memoir',
        reason: '回忆录生成失败，已自动退款',
        amount: order.amount,
        memoir_task_id: task.id,
      },
    });

    console.log(`[MemoirRefund] Task ${task.id}: 已自动退款 orderId=${order.id}, amount=${order.amount}`);
    return true;
  } catch (err) {
    // 退款失败不阻断任务失败主流程（任务已 markFailed），记录日志供人工对账
    console.error(`[MemoirRefund] Task ${task.id}: 自动退款失败，需人工处理:`, err);
    return false;
  }
}
