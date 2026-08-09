/**
 * 会员管理路由 - 会员订阅与用量配额管理
 * 查询会员状态、订阅/取消会员、查询当日使用配额
 * 通过 MembershipRepository、PaymentOrderRepository、UsageQuotaRepository 访问数据库
 *
 * 改造说明（v2）：
 *   原 /subscribe 接口为模拟支付，直接创建订单+激活会员+标记已支付
 *   新流程改为：/subscribe 创建支付订单 → 调微信支付下单 → 前端调起支付
 *             → 微信回调 /api/payment/wechat/notify → 激活会员
 *   保留 /subscribe 接口名称以兼容前端，但内部改为走支付流程
 *   前端如需直接走支付，可调用 /api/payment/membership/order（推荐）
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema } from '../schemas/index.js';
import { v4 as uuidv4 } from 'uuid';
import { isMembershipPromoActive } from '../config/featureFlags.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import { PaymentOrderRepository } from '../repositories/paymentOrderRepository.js';
import { UsageQuotaRepository } from '../repositories/usageQuotaRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { createJsapiPayment } from '../services/wechatPayService.js';

const router = Router();

const membershipRepository = new MembershipRepository();
const paymentOrderRepository = new PaymentOrderRepository();
const usageQuotaRepository = new UsageQuotaRepository();
const userRepository = new UserRepository();

/** 会员订阅计划促销价（分） - 上线前三个月 3.3 折获客 */
const PLAN_PROMO_PRICES: Record<'monthly' | 'quarterly' | 'yearly', number> = {
  monthly: 990,    // 9.9 元
  quarterly: 2590, // 25.9 元
  yearly: 8800,    // 88 元
};

/** 会员订阅计划常规价（分） */
const PLAN_REGULAR_PRICES: Record<'monthly' | 'quarterly' | 'yearly', number> = {
  monthly: 2990,   // 29.9 元
  quarterly: 7990, // 79.9 元
  yearly: 26900,   // 269 元
};

/** 获取当前生效的会员计划价格（促销开关控制） */
function getPlanPrice(plan: 'monthly' | 'quarterly' | 'yearly'): number {
  return isMembershipPromoActive() ? PLAN_PROMO_PRICES[plan] : PLAN_REGULAR_PRICES[plan];
}

router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const membership = await membershipRepository.findStatusByUser(userId);

    if (!membership) {
      res.json({
        success: true,
        data: {
          tier: 'free' as const,
          plan: null,
          status: 'none' as const,
          expiresAt: null,
        },
      });
      return;
    }

    const isExpired =
      membership.status === 'active' &&
      membership.expires_at &&
      new Date(membership.expires_at) < new Date();

    const effectiveStatus = isExpired ? 'expired' : membership.status;

    if (isExpired) {
      await membershipRepository.markExpired(membership.id);
    }

    res.json({
      success: true,
      data: {
        tier: effectiveStatus === 'active' ? membership.tier : 'free',
        plan: membership.plan,
        status: effectiveStatus,
        price: membership.price,
        expiresAt: membership.expires_at,
        startedAt: membership.started_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询会员状态异常';
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /subscribe - 创建会员订阅支付订单
 *
 * 兼容旧前端调用：仍接受 { plan } 参数，但返回支付参数而非直接激活会员
 * 前端拿到 payment 参数后调起 wx.requestPayment，支付完成后等待回调激活
 *
 * 推荐前端迁移到 /api/payment/membership/order（语义更清晰）
 */
router.post('/subscribe', authMiddleware, validate({ body: createOrderSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { plan } = req.body as { plan: 'monthly' | 'quarterly' | 'yearly' };

    const price = getPlanPrice(plan);
    const description = `星河宠记会员订阅-${plan === 'monthly' ? '月度' : plan === 'quarterly' ? '季度' : '年度'}`;

    // 查询用户 openid（JSAPI 支付必需）
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

    res.json({
      success: true,
      data: {
        order_id: orderId,
        plan,
        price,
        payment: paymentParams,
        message: '订单已创建，请完成支付',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '订阅异常';
    res.status(500).json({ success: false, message });
  }
});

router.post('/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const cancelled = await membershipRepository.cancelActive(userId);

    if (!cancelled) {
      res.status(404).json({ success: false, message: '未找到活跃的会员订阅' });
      return;
    }

    res.json({
      success: true,
      data: {
        message: '会员已取消，到期前仍可继续使用',
        expiresAt: cancelled.expires_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '取消订阅异常';
    res.status(500).json({ success: false, message });
  }
});

router.get('/usage', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const today = new Date().toISOString().split('T')[0];

    const quota = await usageQuotaRepository.findTodayUsage(userId, today);

    if (!quota) {
      res.json({
        success: true,
        data: {
          foodQueriesCount: 0,
          symptomChecksCount: 0,
          trendDaysViewed: 0,
          foodQueriesLimit: 5,
          symptomChecksLimit: 3,
          trendDaysLimit: 1,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        foodQueriesCount: quota.food_queries_count,
        symptomChecksCount: quota.symptom_checks_count,
        trendDaysViewed: quota.trend_days_viewed,
        foodQueriesLimit: 5,
        symptomChecksLimit: 3,
        trendDaysLimit: 1,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询使用配额异常';
    res.status(500).json({ success: false, message });
  }
});

export default router;
