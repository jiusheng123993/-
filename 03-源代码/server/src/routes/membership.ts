/**
 * 会员管理路由 - 会员订阅与用量配额管理
 * 查询会员状态、订阅/取消会员、查询当日使用配额
 * 通过 MembershipRepository、PaymentOrderRepository、UsageQuotaRepository 访问数据库
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema } from '../schemas/index.js';
import { v4 as uuidv4 } from 'uuid';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import { PaymentOrderRepository } from '../repositories/paymentOrderRepository.js';
import { UsageQuotaRepository } from '../repositories/usageQuotaRepository.js';

const router = Router();

const membershipRepository = new MembershipRepository();
const paymentOrderRepository = new PaymentOrderRepository();
const usageQuotaRepository = new UsageQuotaRepository();

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

router.post('/subscribe', authMiddleware, validate({ body: createOrderSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { plan } = req.body;

    const planPrices: Record<string, number> = {
      monthly: 2990,
      quarterly: 7990,
      yearly: 26900,
    };

    const planDurations: Record<string, number> = {
      monthly: 30,
      quarterly: 90,
      yearly: 365,
    };

    const price = planPrices[plan];
    const durationDays = planDurations[plan];
    const orderId = uuidv4();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await membershipRepository.subscribeWithTransaction(
      { id: orderId, userId, plan, amount: price },
      { plan, price, expiresAt },
      paymentOrderRepository,
    );

    res.json({
      success: true,
      data: {
        orderId,
        plan,
        price,
        expiresAt: expiresAt.toISOString(),
        status: 'active',
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
