import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      'SELECT id, tier, plan, status, price, expires_at, started_at FROM memberships WHERE user_id = $1',
      [userId],
    );

    if (result.rowCount === 0) {
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

    const membership = result.rows[0] as {
      id: string;
      tier: string;
      plan: string | null;
      status: string;
      price: number | null;
      expires_at: string | null;
      started_at: string | null;
    };

    const isExpired =
      membership.status === 'active' &&
      membership.expires_at &&
      new Date(membership.expires_at) < new Date();

    const effectiveStatus = isExpired ? 'expired' : membership.status;

    if (isExpired) {
      await pool.query(
        'UPDATE memberships SET status = $1, updated_at = now() WHERE id = $2',
        ['expired', membership.id],
      );
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

router.post('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { plan } = req.body;

    const validPlans = ['monthly', 'quarterly', 'yearly'] as const;
    if (!plan || !validPlans.includes(plan)) {
      res.status(400).json({ success: false, message: 'plan 参数无效，可选值：monthly, quarterly, yearly' });
      return;
    }

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

    await pool.query('BEGIN');

    try {
      await pool.query(
        `INSERT INTO payment_orders (id, user_id, plan, amount, status, channel)
         VALUES ($1, $2, $3, $4, 'pending', 'wechat')`,
        [orderId, userId, plan, price],
      );

      const existingMember = await pool.query(
        'SELECT id FROM memberships WHERE user_id = $1',
        [userId],
      );

      if (existingMember.rowCount === 0) {
        await pool.query(
          `INSERT INTO memberships (user_id, tier, plan, status, price, expires_at, started_at)
           VALUES ($1, 'member', $2, 'active', $3, $4, now())`,
          [userId, plan, price, expiresAt],
        );
      } else {
        await pool.query(
          `UPDATE memberships SET tier = 'member', plan = $1, status = 'active', price = $2,
           expires_at = $3, started_at = now(), updated_at = now()
           WHERE user_id = $4`,
          [plan, price, expiresAt, userId],
        );
      }

      await pool.query(
        `UPDATE payment_orders SET status = 'paid', paid_at = now() WHERE id = $1`,
        [orderId],
      );

      await pool.query('COMMIT');

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
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '订阅异常';
    res.status(500).json({ success: false, message });
  }
});

router.post('/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `UPDATE memberships SET status = 'cancelled', cancelled_at = now(), updated_at = now()
       WHERE user_id = $1 AND status = 'active'
       RETURNING id, tier, plan, expires_at`,
      [userId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: '未找到活跃的会员订阅' });
      return;
    }

    res.json({
      success: true,
      data: {
        message: '会员已取消，到期前仍可继续使用',
        expiresAt: result.rows[0].expires_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '取消订阅异常';
    res.status(500).json({ success: false, message });
  }
});

router.get('/usage', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT food_queries_count, symptom_checks_count, trend_days_viewed
       FROM usage_quotas WHERE user_id = $1 AND date = $2`,
      [userId, today],
    );

    if (result.rowCount === 0) {
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

    const quota = result.rows[0] as {
      food_queries_count: number;
      symptom_checks_count: number;
      trend_days_viewed: number;
    };

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
