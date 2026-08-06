/**
 * 埋点事件上报路由
 *
 * 接收小程序端批量上报的用户行为事件（page_view / checkin_submit / member_subscribe 等），
 * 作为北极星指标与核心漏斗的数据源。
 * 允许未登录用户上报（注册前的激活事件同样需要采集），因此不强制鉴权，仅做频率限制。
 */
import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { pool } from '../db.js';
import { sanitizeError } from '../utils/sanitize.js';

const router = Router();

/** 单条埋点事件 schema（与小程序端 AnalyticsEvent 结构对齐） */
const eventSchema = z.object({
  eventName: z.string().min(1).max(64),
  userId: z.string().uuid().nullable().optional(),
  petId: z.string().uuid().nullable().optional(),
  // zod v4 的 record 需要显式传入 key/value 两个 schema
  properties: z.record(z.string(), z.unknown()).optional().default({}),
  timestamp: z.string().datetime().optional(),
  platform: z.string().max(32).optional().default('weapp'),
});

/** 批量上报 schema：单次最多 50 条，防止单请求撑爆接口 */
const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(50),
});

/** 上报限流：每分钟最多 120 次批量请求，防刷 */
const analyticsLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  message: { success: false, message: '上报过于频繁，请稍后再试' },
});

/** POST /api/analytics/events - 批量写入埋点事件 */
router.post(
  '/events',
  analyticsLimiter,
  validate({ body: batchSchema }),
  async (req: Request, res: Response) => {
    const { events } = req.body;
    try {
      // 逐条写入：当前量级下足够，避免引入批量 COPY 的复杂度
      for (const ev of events) {
        await pool.query(
          `INSERT INTO analytics_events (user_id, pet_id, event_name, properties, platform, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            ev.userId || null,
            ev.petId || null,
            ev.eventName,
            JSON.stringify(ev.properties || {}),
            ev.platform || 'weapp',
            ev.timestamp ? new Date(ev.timestamp) : new Date(),
          ],
        );
      }
      res.json({ success: true });
    } catch (error) {
      console.error('[Analytics] 批量写入失败:', sanitizeError(error));
      res.status(500).json({ success: false, message: '上报失败，请稍后重试' });
    }
  },
);

export default router;
