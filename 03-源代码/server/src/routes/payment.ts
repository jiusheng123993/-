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
  resolveMemoirTier,
} from '../services/videoGenerationService.js';
import { MEMOIR_TIER_PRICES, type MemoirTier } from '../config.js';
import {
  createJsapiPayment,
  verifyAndDecodeNotify,
  refund,
} from '../services/wechatPayService.js';
import { sendToUser } from '../services/websocketService.js';
import { recordAuditLog } from '../services/auditService.js';
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

/** 回忆录订单 plan 映射（2026-09-09 三档：按档位而非类型映射，审计与退款分类更准确） */
function memoirTierToOrderPlan(tier: MemoirTier): 'memoir_daily' | 'memoir_standard' | 'memoir_memorial' {
  if (tier === 'light') return 'memoir_daily';
  if (tier === 'standard') return 'memoir_standard';
  return 'memoir_memorial';
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
 * 计算回忆录付费金额（分）—— 2026-09-09 三档定价体系
 * - light 轻纪念：会员 1890（18.9元），非会员 2590（25.9元）
 * - standard 标准回忆录：会员 4500（45元），非会员 5900（59元）
 * - full 完整回忆录：会员 7900（79元），非会员 9900（99元）
 *
 * 注意（用户拍板的口径变更）：视频类一律付费，会员免费次数已废除——
 * 模型换 Seedance 2.0 mini 720p 后成本 ~0.5 元/秒，免费送每位会员月亏 24-36 元。
 * 本函数返回金额恒 >0，needPayment 恒 true。
 */
async function calculateMemoirPrice(
  userId: string,
  memoirType: string,
  tier?: string,
): Promise<{ price: number; tier: MemoirTier; userTier: 'member' | 'free'; needPayment: boolean }> {
  const userTier = await resolveUserTier(userId);
  // 档位解析：显式 tier 优先，缺省按 memoir_type 历史规则回退（兼容旧客户端/旧订单）
  const resolvedTier = resolveMemoirTier(tier, memoirType);
  const prices = MEMOIR_TIER_PRICES[resolvedTier];
  return {
    price: userTier === 'member' ? prices.member : prices.free,
    tier: resolvedTier,
    userTier,
    needPayment: true,
  };
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
      const { pet_id, memoir_type, tier, source_photos, source_text, music_style, duration, style_preset, tags, selected_moment_ids, custom_bgm_url } = req.body;

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

      // 3. 计算价格（三档定价：一律付费，会员享价差；needPayment 恒 true，免费直通分支已废除）
      const { price, tier: resolvedTier, userTier } = await calculateMemoirPrice(userId, memoir_type, tier);

      // 4. 查询用户 openid（JSAPI 支付必需）
      const user = await userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: '用户不存在' });
        return;
      }
      if (!user.openid) {
        res.status(400).json({ success: false, message: '用户未绑定微信 openid，无法发起支付' });
        return;
      }

      // 5. 创建支付订单
      const orderId = uuidv4();
      const orderPlan = memoirTierToOrderPlan(resolvedTier);
      const tierName = { light: '轻纪念', standard: '标准回忆录', full: '完整回忆录' }[resolvedTier];
      const description = `${tierName}生成`;

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
          tags,
          selected_moment_ids,
          custom_bgm_url,
          tier: resolvedTier,
          user_tier: userTier,
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

  // 续费顺延口径（2026-09 审查 P1 修复）：原实现 expiresAt = now + 时长 直接覆盖，
  // 用户剩 29 天再购月度只多得约 1 天（吞掉剩余时长）。现改为 base = max(当前到期时间, 现在)，
  // 与 redeem.ts 的兑换顺延口径一致。
  const current = await membershipRepository.findTierAndStatus(order.user_id);
  const currentExpiry =
    current && current.status === 'active' && current.expires_at ? new Date(current.expires_at) : null;
  const base = currentExpiry && currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
  const expiresAt = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await membershipRepository.activateMembership(order.user_id, plan, order.amount, expiresAt);

  // 资金审计（2026-09 审查 P1 修复：支付/激活全链路此前零审计，无法对账追责）
  await recordAuditLog({
    userId: order.user_id,
    action: 'membership-activated',
    resourceType: 'membership',
    resourceId: order.id,
    detail: { plan, amount: order.amount, expires_at: expiresAt.toISOString(), base: 'renewal-extended' },
  });

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
 * 迁移期旧价白名单（审查 P2-5）：三档改价前创建的在途订单按旧契约履约。
 * - 990：旧日常回忆录 9.9 元（会员免费配额超限/非会员价）→ 回调建 light 任务
 * （旧 memorial 9900/14900 不需白名单：实付 ≥ 新 full 价，走"多付履约"分支）
 */
const LEGACY_MEMOIR_PRICE_ALLOWANCE = new Set<number>([990]);

/**
 * 处理回忆录支付成功
 */
async function handleMemoirPaymentSuccess(order: {
  id: string;
  user_id: string;
  amount: number;
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
    tags?: string[];
    selected_moment_ids?: string[];
    /** 用户导入的自定义 BGM 公网 URL（2026-09-09，合成优先使用） */
    custom_bgm_url?: string;
    /** 档位（2026-09-09 三档）：兼容历史订单可能存的会员身份旧语义，回调时统一 resolveMemoirTier 兜底 */
    tier?: 'light' | 'standard' | 'full' | 'member' | 'free';
  };

  // 金额-档位一致性复核（审查 P2-5 防御纵深）：防"收 light 钱建 full 任务"。
  // 口径（欠付拒发、多付履约）：
  //   - 实付 = 应付（MEMOIR_TIER_PRICES[tier][userTier]）→ 正常建任务
  //   - 实付 > 应付（迁移期旧 memorial 9900/14900 单 vs 新 full 价）→ 按旧契约履约，不差价不退款
  //   - 实付 < 应付 且在旧价白名单（旧 daily 990 单）→ 按旧契约履约（建 light 任务）
  //   - 实付 < 应付 且不在白名单 → 拒绝：抛错走 handlePaymentBusinessFailure 自动退款，不建任务
  //   （防未来旁路写入 product_metadata 或回调金额被篡改的低价建高价值任务）
  const checkTier = resolveMemoirTier(meta.tier, meta.memoir_type);
  const userTierForCheck = await resolveUserTier(order.user_id);
  const expectedAmount = MEMOIR_TIER_PRICES[checkTier][userTierForCheck];
  if (
    order.amount < expectedAmount &&
    !LEGACY_MEMOIR_PRICE_ALLOWANCE.has(order.amount)
  ) {
    throw new Error(
      `订单金额低于档位应付价: paid=${order.amount}, expected=${expectedAmount} (tier=${checkTier}, userTier=${userTierForCheck})`,
    );
  }

  // 调用 memoirService 创建任务（跳过付费校验，写 payment_id 关联）
  const task = await createMemoirFromPayment(order.id, order.user_id, meta.pet_id, {
    memoir_type: meta.memoir_type,
    // 档位透传（resolveMemoirTier 会兜底非法值/历史旧语义值）
    tier: meta.tier,
    source_photos: meta.source_photos,
    source_text: meta.source_text,
    music_style: meta.music_style,
    duration: meta.duration,
    style_preset: meta.style_preset,
    custom_bgm_url: meta.custom_bgm_url,
    tags: meta.tags,
    selected_moment_ids: meta.selected_moment_ids,
  });

  // 资金审计（2026-09 审查 P1 修复：回忆录付费任务创建落审计）
  await recordAuditLog({
    userId: order.user_id,
    action: 'memoir-created',
    resourceType: 'memoir',
    resourceId: task.id,
    detail: { order_id: order.id, memoir_type: meta.memoir_type, amount: order.amount },
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

    // 资金审计（2026-09 审查 P1 修复：退款动作落审计，含失败原因便于对账）
    await recordAuditLog({
      userId: order.user_id,
      action: 'payment-refunded',
      resourceType: 'payment-order',
      resourceId: order.id,
      detail: { product_type: order.product_type, amount: order.amount, reason: errorMessage.slice(0, 120) },
    });

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
