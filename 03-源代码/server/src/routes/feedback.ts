/**
 * 用户反馈路由 - NPS 满意度调查、意见反馈
 */
import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import https from 'https';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { pool } from '../db.js';
import { sanitizeError } from '../utils/sanitize.js';
import { config } from '../config.js';

const router = Router();

const npsSubmitSchema = z.object({
  score: z.number().int().min(0).max(10),
  feedback: z.string().max(500).optional().default(''),
  trigger_event: z.string().max(64).optional(),
});

const feedbackLimiter = rateLimit({
  windowMs: 60000,
  max: 5,
  message: { success: false, message: '提交过于频繁，请稍后再试' },
});

/** PushPlus 微信推送：反馈提交后实时通知运营（fire-and-forget，失败只记日志） */
function notifyPushplus(title: string, content: string): void {
  const token = config.pushplus.token;
  if (!token) return;
  const body = JSON.stringify({ token, title, content, template: 'txt' });
  const req = https.request(
    'https://www.pushplus.plus/send',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 10_000,
    },
    (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.code !== 200) console.warn('[pushplus] 推送失败:', data.slice(0, 200));
        } catch {
          console.warn('[pushplus] 响应异常:', data.slice(0, 200));
        }
      });
    },
  );
  req.on('error', (err) => console.warn('[pushplus] 请求失败:', err.message));
  req.on('timeout', () => req.destroy());
  req.write(body);
  req.end();
}

/** POST /api/feedback/nps - 提交 NPS 满意度调查 */
router.post('/nps', authMiddleware, feedbackLimiter, validate({ body: npsSubmitSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { score, feedback, trigger_event } = req.body;

    await pool.query(
      `INSERT INTO user_feedback (user_id, feedback_type, score, content, trigger_event, created_at)
       VALUES ($1, 'nps', $2, $3, $4, NOW())`,
      [userId, score, feedback || null, trigger_event || null],
    );

    // 实时通知运营微信（标题带产品名，便于区分来源）
    notifyPushplus(
      '【星河宠记】收到新反馈',
      '满意度：' + score + '/10' +
        '\n内容：' + (feedback?.trim() || '未填写') +
        '\n场景：' + (trigger_event || 'manual_feedback')
    );

    res.json({ success: true, message: '感谢您的反馈' });
  } catch (error) {
    console.error('[Feedback] NPS submit error:', sanitizeError(error));
    res.status(500).json({ success: false, message: '提交失败，请稍后重试' });
  }
});

/** GET /api/feedback/my - 获取用户反馈历史 */
router.get('/my', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { rows } = await pool.query(
      `SELECT id, feedback_type, score, content, trigger_event, created_at
       FROM user_feedback WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [userId],
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Feedback] Get history error:', sanitizeError(error));
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

export default router;
