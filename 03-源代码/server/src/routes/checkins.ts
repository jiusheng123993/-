/**
 * 健康打卡路由 - 宠物健康状态记录
 * 每日打卡记录精神、食欲、排便、运动等健康指标
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCheckinSchema, checkinHistoryQuerySchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { CheckinRepository } from '../repositories/checkinRepository.js';
import { recordHealthMemory } from '../services/memoryService.js';
import { computeStreakDays, maybePostCheckinFeed } from '../services/autoFeedService.js';

const router = Router();
router.use(authMiddleware);

const petRepository = new PetRepository();
const checkinRepository = new CheckinRepository();

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function toCamelCaseArray(arr: Record<string, unknown>[]): Record<string, unknown>[] {
  return arr.map(toCamelCase);
}

async function checkPetOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const petId = req.params.petId as string;
    const owns = await petRepository.isOwner(petId, req.userId!);
    if (!owns) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }
    next();
  } catch (err) {
    console.error('[Checkins Create Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
}

router.post('/:petId/checkins', checkPetOwnership, validate({ body: createCheckinSchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;

    const {
      poop_level, appetite_level, spirit_level, exercise_level,
      weight, has_anomaly, anomaly_items, ai_feedback, risk_level, note,
    } = req.body;

    const id = uuidv4();
    const row = await checkinRepository.createCheckin(id, petId, req.userId!, {
      poop_level,
      appetite_level,
      spirit_level,
      exercise_level,
      weight: weight ?? null,
      has_anomaly: has_anomaly ?? false,
      anomaly_items: anomaly_items ?? [],
      ai_feedback: ai_feedback ?? null,
      risk_level,
      note: note ?? null,
    });

    // 自动家庭动态：连续打卡里程碑 / 异常预警（异步，不影响主流程）
    try {
      const streakDays = await computeStreakDays(petId, req.userId!);
      void maybePostCheckinFeed(req.userId!, petId, risk_level, streakDays);
    } catch (err) {
      console.warn('[Checkins] 自动动态计算失败:', err);
    }

    // 健康事件自动记忆（F1）：异常打卡 → 自动沉淀健康事件（异步，不影响主流程）
    try {
      const hasAbnormal = has_anomaly === true || (Array.isArray(anomaly_items) && anomaly_items.length > 0);
      if (hasAbnormal) {
        const items = Array.isArray(anomaly_items) && anomaly_items.length > 0
          ? (anomaly_items as string[]).join('、')
          : '有异常';
        const importance = risk_level === 'high' ? 9 : risk_level === 'medium' ? 8 : 7;
        void recordHealthMemory({
          userId: req.userId!,
          petId,
          category: 'health',
          content: `${new Date().toLocaleDateString('zh-CN')} 打卡异常：${items}${note ? `（${note}）` : ''}`,
          importance,
          evidence: `checkin:${id}`,
        });
      }
    } catch (err) {
      console.warn('[Checkins] 健康事件记忆失败:', err);
    }

    res.status(201).json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Checkins Create Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/:petId/checkins', validate({ query: checkinHistoryQuerySchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const owns = await petRepository.isOwner(petId, req.userId!);
    if (!owns) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    const days = req.query.days as unknown as number;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await checkinRepository.findHistoryByDays(petId, req.userId!, since.toISOString());

    res.json({ success: true, data: toCamelCaseArray(rows as unknown as Record<string, unknown>[]) });
  } catch (err) {
    console.error('[Checkins List Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/:petId/checkins/today', async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const owns = await petRepository.isOwner(petId, req.userId!);
    if (!owns) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const row = await checkinRepository.findTodayCheckin(petId, req.userId!, today);

    res.json({ success: true, data: row ? toCamelCase(row as unknown as Record<string, unknown>) : null });
  } catch (err) {
    console.error('[Checkins Today Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
