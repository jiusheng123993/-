/**
 * 支付路由 - 微信支付订单创建、回调处理、订单查询
 *
 * 接口清单：
 *   1. POST /api/payment/memoir/order        - 创建回忆录付费订单（登录态）
 *   2. POST /api/payment/membership/order    - 创建会员订阅订单（登录态）
 *   3. POST /api/payment/wechat/notify       - 微信支付回调（无登录，强制验签）
 *   4. GET  /api/payment/orders/:orderId     - 查询订单状态（登录态）
 *
 * 安全约束：
 *   - 创建订单需登录认证
 *   - 回调接口无登录，但必须通过微信签名验证
 *   - 订单查询做用户归属校验，防横向越权
 *   - 回调处理使用 CAS 防并发，transaction_id 唯一索引防重放
 */
import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMemoirOrderSchema, createMembershipOrderSchema } from '../schemas/index.js';
import { isMembershipPromoActive } from '../config/featureFlags.js';
import { PaymentOrderRepository } from '../repositories/paymentOrderRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { PetRepository } from '../repositories/petRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import { MemoirRepository } from '../repositories/memoirRepository.js';
import {
  MemoirError,
  MemoirBusinessError,
  createMemoirFromPayment,
  MEMOIR_ERROR_CODES,
} from '../services/memoirService.js';
import {
  mapMemoirTypeToProductLine,
} from '../services/videoGenerationService.js';
import {
  createJsapiPayment,
  verifyAndDecodeNotify,
  refund,
} from '../services/wechatPayService.js';
import { sendToUser } from '../services/websocketService.js';
import { sanitizeLog } from '../utils/sanitize.js';

const router = Router();

const paymentOrderRepository = new PaymentOrderRepository();
const userRepository = new UserRepository();
const petRepository = new PetRepository();
const membershipRepository = new MembershipRepository();
const memoirRepository = new MemoirRepository();

/** 会员订阅计划促销价（分） - 与 membership.ts 保持一致 */
const MEMBERSHIP_PLAN_PROMO_PRICES: Record<'monthly' | 'quarterly' | 'yearly', number> = {
  monthly: 990,    // 9.9 元
  quarterly: 2590, // 25.9 元
  yearly: 8800,    // 88 元
};

/** 会员订阅计划常规价（分） */
const MEMBERSHIP_PLAN_REGULAR_PRICES: Record<'monthly' | 'quarterly' | 'yearly', number> = {
  monthly: 2990,   // 29.9 元
  quarterly: 7990, // 79.9 元
  yearly: 26900,   // 269 元
};

/** 获取当前生效的会员计划价格（促销开关控制） */
function getMembershipPlanPrice(plan: 'monthly' | 'quarterly' | 'yearly'): number {
  return isMembershipPromoActive() ? MEMBERSHIP_PLAN_PROMO_PRICES[plan] : MEMBERSHIP_PLAN_REGULAR_PRICES[plan];
}

/** 会员订阅计划时长（天） */
const MEMBERSHIP_PLAN_DURATION_DAYS: Record<'monthly' | 'quarterly' | 'yearly', number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

/** 回忆录订单 plan 映射 */
function memoirTypeToOrderPlan(memoirType: string): 'memoir_daily' | 'memoir_memorial' {
  return memoirType === 'memorial' ? 'memoir_memorial' : 'memoir_daily';
}

/**
 * 解析用户身份等级（用于回忆录订单价格计算和回调时上下文恢复）
 */
async function resolveUserTier(userId: string): Promise<'member' | 'free'> {
  const membership = await membershipRepository.findTierAndStatus(userId);
  if (!membership) return 'free';
  if (membership.status !== 'active') return 'free';
  if (membership.expires_at && new Date(membership.expires_at) < new Date()) {
    return 'free';
  }
  return membership.tier === 'member' ? 'member' : 'free';
}

/**
 * 计算回忆录付费金额（分）
 * - memorial：会员 9900（99元），非会员 14900（149元）
 * - daily（及其他非 memorial 类型）：会员配额内免费，超出 990（9.9元）；非会员 990（9.9元）
 *
 * 注意：本函数返回的金额为 0 表示免费（会员配额内），调用方应跳过支付流程
 */
async function calculateMemoirPrice(
  userId: string,
  memoirType: string,
): Promise<{ price: number; tier: 'member' | 'free'; needPayment: boolean }> {
  const tier = await resolveUserTier(userId);
  const productLine = mapMemoirTypeToProductLine(memoirType);

  // 纪念Vlog：会员/非会员均需付费
  if (productLine === 'memorial') {
    return {
      price: tier === 'member' ? 9900 : 14900,
      tier,
      needPayment: true,
    };
  }

  // 日常回忆录：会员每月免费 3 次
  if (tier === 'member') {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usedCount = await memoirRepository.countMonthlyDailyMemoirsByUser(userId, yearMonth);
    if (usedCount < 3) {
      return { price: 0, tier, needPayment: false };
    }
    // 超出配额，需付费 9.9 元
    return { price: 990, tier, needPayment: true };
  }

  // 非会员日常回忆录：需付费 9.9 元
  return { price: 990, tier, needPayment: true };
}

// ===== 1. 创建回忆录付费订单 =====

/**
 * POST /api/payment/memoir/order
 * 创建回忆录付费订单
 *
 * 流程：
 *   1. 归属校验
 *   2. 并发检查（同一宠物同时只能有一个 pending/processing 任务）
 *   3. 产品线参数校验（照片数量、时长）
 *   4. 计算价格（会员配额内免费 → 直接创建任务返回；否则创建订单）
 *   5. 创建 pending 订单（product_metadata 存业务上下文）
 *   6. 调微信支付下单，返回 JSAPI 支付参数
 */
router.post(
  '/memoir/order',
  authMiddleware,
  validate({ body: createMemoirOrderSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { pet_id, memoir_type, source_photos, source_text, music_style, duration, style_preset } = req.body;

      // 1. 归属校验
      const owns = await petRepository.isOwner(pet_id, userId);
      if (!owns) {
        res.status(404).json({ success: false, message: '宠物不存在' });
        return;
      }

      // 2. 并发检查
      const activeTask = await memoirRepository.findActiveByPetId(pet_id);
      if (activeTask) {
        res.status(409).json({
          success: false,
          code: MEMOIR_ERROR_CODES.CONCURRENT_TASK,
          message: '该宠物已有正在进行的回忆录任务',
        });
        return;
      }

      // 3. 计算价格
      const { price, tier, needPayment } = await calculateMemoirPrice(userId, memoir_type);

      // 4. 会员配额内免费：直接创建任务，无需支付
      if (!needPayment) {
        const task = await createMemoirFromPayment('free_quota', userId, pet_id, {
          memoir_type,
          source_photos,
          source_text,
          music_style,
          duration,
          style_preset,
        });
        res.status(201).json({
          success: true,
          data: {
            need_payment: false,
            task,
          },
        });
        return;
      }

      // 5. 查询用户 openid（JSAPI 支付必需）
      const user = await userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: '用户不存在' });
        return;
      }
      if (!user.openid) {
        res.status(400).json({ success: false, message: '用户未绑定微信 openid，无法发起支付' });
        return;
      }

      // 6. 创建支付订单
      const orderId = uuidv4();
      const orderPlan = memoirTypeToOrderPlan(memoir_type);
      const description = memoir_type === 'memorial' ? '纪念Vlog生成' : '日常回忆录生成';

      await paymentOrderRepository.createMemoirOrder({
        id: orderId,
        userId,
        plan: orderPlan,
        amount: price,
        productMetadata: {
          pet_id,
          memoir_type,
          source_photos,
          source_text,
          music_style,
          duration,
          style_preset,
          tier,
        },
      });

      // 7. 调微信支付下单
      const paymentParams = await createJsapiPayment(orderId, price, description, user.openid);

      res.status(201).json({
        success: true,
        data: {
          need_payment: true,
          order_id: orderId,
          amount: price,
          payment: paymentParams,
        },
      });
    } catch (err) {
      handleRouteError(res, err, '创建回忆录订单');
    }
  },
);

// ===== 2. 创建会员订阅订单 =====

/**
 * POST /api/payment/membership/order
 * 创建会员订阅支付订单
 *
 * 流程：
 *   1. 计算价格（根据 plan）
 *   2. 创建 pending 订单
 *   3. 调微信支付下单，返回 JSAPI 支付参数
 */
router.post(
  '/membership/order',
  authMiddleware,
  validate({ body: createMembershipOrderSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { plan } = req.body as { plan: 'monthly' | 'quarterly' | 'yearly' };

      const price = getMembershipPlanPrice(plan);
      const description = `星河宠记会员订阅-${plan === 'monthly' ? '月度' : plan === 'quarterly' ? '季度' : '年度'}`;

      // 查询用户 openid
      const user = await userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: '用户不存在' });
        return;
      }
      if (!user.openid) {
        res.status(400).json({ success: false, message: '用户未绑定微信 openid，无法发起支付' });
        return;
      }

      // 创建支付订单
      const orderId = uuidv4();
      await paymentOrderRepository.createMembershipOrder({
        id: orderId,
        userId,
        plan,
        amount: price,
      });

      // 调微信支付下单
      const paymentParams = await createJsapiPayment(orderId, price, description, user.openid);

      res.status(201).json({
        success: true,
        data: {
          need_payment: true,
          order_id: orderId,
          amount: price,
          plan,
          payment: paymentParams,
        },
      });
    } catch (err) {
      handleRouteError(res, err, '创建会员订单');
    }
  },
);

// ===== 3. 微信支付回调 =====

/**
 * POST /api/payment/wechat/notify
 * 微信支付回调（无登录，强制验签）
 *
 * 流程：
 *   1. 验签 + 解密回调内容
 *   2. 查订单（不存在则返回 SUCCESS 让微信停止重试）
 *   3. CAS 标记订单 paid（已 paid 则跳过，幂等）
 *   4. 根据订单类型执行业务逻辑：
 *      - membership：调用 activateMembership 激活会员
 *      - memoir：调用 createMemoirFromPayment 创建任务
 *   5. 业务失败：自动退款 + 标记订单 refunded + WebSocket 通知用户
 *   6. 返回 SUCCESS 给微信
 *
 * 幂等性保证：
 *   - markPaidByCallback 使用 CAS（status='pending'），重复回调直接跳过
 *   - transaction_id 唯一索引防止不同 transaction_id 复用同一订单
 */
router.post(
  '/wechat/notify',
  async (req: Request, res: Response) => {
    try {
      // 微信回调签名在请求头，body 必须是 raw string
      // 注意：本路由在 index.ts 中需用 express.raw 中间件单独处理
      const timestamp = req.get('Wechatpay-Timestamp') ?? '';
      const nonce = req.get('Wechatpay-Nonce') ?? '';
      const serial = req.get('Wechatpay-Serial') ?? '';
      const signature = req.get('Wechatpay-Signature') ?? '';

      // rawBody 由 express.raw 中间件挂载
      const rawBody = (req as unknown as { rawBody: string }).rawBody ?? '';

      // 1. 验签 + 解密
      const notifyResult = await verifyAndDecodeNotify(timestamp, nonce, serial, signature, rawBody);

      console.log(
        `[Payment Notify] orderId=${sanitizeLog(notifyResult.out_trade_no)}, state=${notifyResult.trade_state}, txId=${sanitizeLog(notifyResult.transaction_id)}`,
      );

      // 2. 仅处理 SUCCESS 状态
      if (notifyResult.trade_state !== 'SUCCESS') {
        // 非 SUCCESS（如 CLOSED、PAYERROR）：标记订单失败
        await paymentOrderRepository.markFailed(notifyResult.out_trade_no);
        res.json({ code: 'SUCCESS', message: '成功' });
        return;
      }

      // 3. 查订单
      const order = await paymentOrderRepository.findById(notifyResult.out_trade_no);
      if (!order) {
        // 订单不存在，记录但返回 SUCCESS 让微信停止重试（防止恶意回调）
        console.error(`[Payment Notify] 订单不存在: ${sanitizeLog(notifyResult.out_trade_no)}`);
        res.json({ code: 'SUCCESS', message: '成功' });
        return;
      }

      // 4. CAS 标记 paid（幂等：已 paid 直接跳过业务逻辑）
      const updated = await paymentOrderRepository.markPaidByCallback(
        order.id,
        notifyResult.transaction_id,
      );
      if (!updated) {
        // 订单已处理（paid/refunded/failed），幂等返回 SUCCESS
        console.log(`[Payment Notify] 订单已处理，跳过: ${sanitizeLog(order.id)}`);
        res.json({ code: 'SUCCESS', message: '成功' });
        return;
      }

      // 5. 执行业务逻辑
      try {
        if (order.product_type === 'membership') {
          await handleMembershipPaymentSuccess(order);
        } else if (order.product_type === 'memoir') {
          await handleMemoirPaymentSuccess(order);
        } else {
          console.error(`[Payment Notify] 未知 product_type: ${order.product_type}`);
        }
      } catch (bizErr) {
        // 业务失败：自动退款 + 通知用户
        await handlePaymentBusinessFailure(order, bizErr);
      }

      res.json({ code: 'SUCCESS', message: '成功' });
    } catch (err) {
      console.error('[Payment Notify] 回调处理失败:', err);
      // 返回非 SUCCESS 让微信重试
      res.status(500).json({ code: 'FAIL', message: '处理失败' });
    }
  },
);

/**
 * 处理会员订阅支付成功
 */
async function handleMembershipPaymentSuccess(order: {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
}): Promise<void> {
  const plan = order.plan as 'monthly' | 'quarterly' | 'yearly';
  const durationDays = MEMBERSHIP_PLAN_DURATION_DAYS[plan];
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await membershipRepository.activateMembership(order.user_id, plan, order.amount, expiresAt);

  // WebSocket 通知用户
  sendToUser(order.user_id, {
    type: 'payment_success',
    data: {
      product_type: 'membership',
      order_id: order.id,
      plan,
      expires_at: expiresAt.toISOString(),
    },
  });

  console.log(`[Payment Notify] 会员激活成功: userId=${sanitizeLog(order.user_id)}, plan=${plan}`);
}

/**
 * 处理回忆录支付成功
 */
async function handleMemoirPaymentSuccess(order: {
  id: string;
  user_id: string;
  product_metadata: Record<string, unknown> | null;
}): Promise<void> {
  if (!order.product_metadata) {
    throw new Error('回忆录订单缺少 product_metadata');
  }

  const meta = order.product_metadata as {
    pet_id: string;
    memoir_type: string;
    source_photos: string[];
    source_text?: string;
    music_style?: string;
    duration?: number;
    style_preset?: string;
    tier: 'member' | 'free';
  };

  // 调用 memoirService 创建任务（跳过付费校验，写 payment_id 关联）
  const task = await createMemoirFromPayment(order.id, order.user_id, meta.pet_id, {
    memoir_type: meta.memoir_type,
    source_photos: meta.source_photos,
    source_text: meta.source_text,
    music_style: meta.music_style,
    duration: meta.duration,
    style_preset: meta.style_preset,
  });

  // WebSocket 通知用户：任务已创建
  sendToUser(order.user_id, {
    type: 'payment_success',
    data: {
      product_type: 'memoir',
      order_id: order.id,
      task_id: task.id,
      task_status: task.status,
    },
  });

  console.log(
    `[Payment Notify] 回忆录任务已创建: userId=${sanitizeLog(order.user_id)}, taskId=${task.id}, memoir_type=${meta.memoir_type}`,
  );
}

/**
 * 处理支付成功但业务执行失败的情况
 * 自动退款 + 标记订单 refunded + WebSocket 通知用户
 */
async function handlePaymentBusinessFailure(
  order: { id: string; user_id: string; amount: number; product_type: string },
  err: unknown,
): Promise<void> {
  const errorMessage = err instanceof Error ? err.message : 'unknown error';
  console.error(
    `[Payment Notify] 业务执行失败，自动退款: orderId=${sanitizeLog(order.id)}, error=${sanitizeLog(errorMessage)}`,
  );

  try {
    // 调用微信退款
    await refund(order.id, order.amount, `业务执行失败: ${errorMessage.slice(0, 80)}`);

    // 标记订单 refunded
    await paymentOrderRepository.markRefunded(order.id);

    // WebSocket 通知用户
    sendToUser(order.user_id, {
      type: 'payment_refunded',
      data: {
        order_id: order.id,
        product_type: order.product_type,
        reason: '业务执行失败，已自动退款',
        amount: order.amount,
      },
    });
  } catch (refundErr) {
    // 退款失败：记录错误，等待人工介入
    console.error(
      `[Payment Notify] 退款失败，需人工介入: orderId=${sanitizeLog(order.id)}, error=`,
      refundErr,
    );
  }
}

// ===== 4. 查询订单状态 =====

/**
 * GET /api/payment/orders/:orderId
 * 查询订单状态（前端轮询用，做归属校验防越权）
 */
router.get(
  '/orders/:orderId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const orderId = req.params.orderId as string;

      const order = await paymentOrderRepository.findByIdAndUser(orderId, userId);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在' });
        return;
      }

      res.json({
        success: true,
        data: {
          order_id: order.id,
          product_type: order.product_type,
          plan: order.plan,
          amount: order.amount,
          status: order.status,
          transaction_id: order.transaction_id,
          created_at: order.created_at,
          paid_at: order.paid_at,
        },
      });
    } catch (err) {
      handleRouteError(res, err, '查询订单');
    }
  },
);

// ===== 错误处理工具函数 =====

function handleRouteError(res: Response, err: unknown, action: string): void {
  if (err instanceof MemoirBusinessError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.extra ?? {}),
    });
    return;
  }
  if (err instanceof MemoirError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  console.error(`[Payment Route] ${action}失败:`, err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
}

export default router;
