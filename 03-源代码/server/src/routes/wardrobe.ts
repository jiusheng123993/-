/**
 * 宠物衣橱路由 - 配饰装备/卸下、主题套装管理
 * 包括衣橱总览、配饰查询、装备/卸下、试穿快照、解锁配饰、主题套装生成
 */
import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  wardrobeOverviewQuerySchema,
  wardrobeAccessoriesQuerySchema,
  wardrobeEquipSchema,
  wardrobeUnequipSchema,
  wardrobeTryOnSchema,
  wardrobeUnlockSchema,
  themeSuiteGenerateSchema,
} from '../schemas/index.js';
import * as wardrobeService from '../services/wardrobeService.js';
import * as themeSuiteService from '../services/themeSuiteService.js';
import { WardrobeError } from '../services/wardrobeService.js';
import { sanitizeError } from '../utils/sanitize.js';
import { recordAuditLog, getClientIp } from '../services/auditService.js';

const router = Router();

const equipLimiter = rateLimit({
  windowMs: 10000,
  max: 20,
  message: { success: false, message: '操作过于频繁，请稍后再试' },
});

const generateLimiter = rateLimit({
  windowMs: 60000,
  max: 5,
  message: { success: false, message: '生成请求过于频繁，请稍后再试' },
});

const VALID_SLOTS = ['head', 'neck', 'back', 'body', 'feet'];
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function handleWardrobeError(res: Response, error: unknown): void {
  if (error instanceof WardrobeError) {
    const statusMap: Record<string, number> = {
      INVALID_SLOT: 400,
      SLOT_MISMATCH: 400,
      ACCESSORY_NOT_FOUND: 404,
      NOT_OWNED: 403,
      PET_NOT_FOUND: 404,
      PAYMENT_REQUIRED: 402,
      MEMBER_ONLY: 403,
      ACHIEVEMENT_LOCKED: 403,
      SUITE_NOT_FOUND: 404,
      TASK_IN_PROGRESS: 409,
      QUOTA_EXCEEDED: 429,
    };
    const status = statusMap[error.code] || 400;
    res.status(status).json({ success: false, message: error.message, code: error.code });
    return;
  }
  console.error('[Wardrobe] Unexpected error:', sanitizeError(error));
  res.status(500).json({ success: false, message: '操作失败，请稍后重试' });
}

router.get('/overview', authMiddleware, validate({ query: wardrobeOverviewQuerySchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.query.petId as string;

    const overview = await wardrobeService.getWardrobeOverview(userId, petId);
    res.json({ success: true, data: overview });
  } catch (error) {
    handleWardrobeError(res, error);
  }
});

router.get('/accessories', authMiddleware, validate({ query: wardrobeAccessoriesQuerySchema }), async (req: Request, res: Response) => {
  try {
    const slot = req.query.slot as string | undefined;

    if (slot) {
      const accessories = await wardrobeService.getAccessoriesBySlot(slot);
      res.json({ success: true, data: { accessories } });
      return;
    }

    const accessories = await wardrobeService.getAccessoriesBySlot('');
    res.json({ success: true, data: { accessories } });
  } catch (error) {
    handleWardrobeError(res, error);
  }
});

router.post('/equip', authMiddleware, equipLimiter, validate({ body: wardrobeEquipSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { petId, slot, accessoryId } = req.body;

    const result = await wardrobeService.equipAccessory(userId, petId, slot, accessoryId);
    res.json({ success: true, data: result });

    recordAuditLog({
      userId,
      action: 'equip',
      resourceType: 'accessory',
      resourceId: accessoryId,
      detail: { petId, slot },
      ipAddress: getClientIp(req),
    }).catch(() => {});
  } catch (error) {
    handleWardrobeError(res, error);
  }
});

router.post('/unequip', authMiddleware, equipLimiter, validate({ body: wardrobeUnequipSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { petId, slot } = req.body;

    const result = await wardrobeService.unequipAccessory(userId, petId, slot);
    res.json({ success: true, data: result });

    recordAuditLog({
      userId,
      action: 'unequip',
      resourceType: 'accessory',
      resourceId: slot,
      detail: { petId },
      ipAddress: getClientIp(req),
    }).catch(() => {});
  } catch (error) {
    handleWardrobeError(res, error);
  }
});

router.post('/try-on', authMiddleware, equipLimiter, validate({ body: wardrobeTryOnSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { petId, outfitSnapshot } = req.body;

    const result = await wardrobeService.saveTryOnSnapshot(userId, petId, outfitSnapshot);
    res.json({ success: true, data: result });

    recordAuditLog({
      userId,
      action: 'try-on',
      resourceType: 'outfit',
      resourceId: petId,
      detail: { slotCount: Object.keys(outfitSnapshot as Record<string, unknown>).length },
      ipAddress: getClientIp(req),
    }).catch(() => {});
  } catch (error) {
    handleWardrobeError(res, error);
  }
});

router.post('/unlock', authMiddleware, validate({ body: wardrobeUnlockSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { accessoryId, source } = req.body;

    const result = await wardrobeService.unlockAccessory(userId, accessoryId, source || 'default');
    res.json({ success: true, data: result });

    recordAuditLog({
      userId,
      action: 'unlock',
      resourceType: 'accessory',
      resourceId: accessoryId,
      detail: { source },
      ipAddress: getClientIp(req),
    }).catch(() => {});
  } catch (error) {
    handleWardrobeError(res, error);
  }
});

router.get('/theme-suites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const overview = await themeSuiteService.getThemeSuiteOverview(userId);
    res.json({ success: true, data: overview });
  } catch (error) {
    handleWardrobeError(res, error);
  }
});

router.post('/theme-suites/generate', authMiddleware, generateLimiter, validate({ body: themeSuiteGenerateSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { petId, suiteId } = req.body;

    const task = await themeSuiteService.generateThemeSuite(userId, petId, suiteId);
    res.json({ success: true, data: { taskId: task.id, status: task.status } });

    recordAuditLog({
      userId,
      action: 'generate-theme',
      resourceType: 'theme-suite',
      resourceId: suiteId,
      detail: { petId, taskId: task.id },
      ipAddress: getClientIp(req),
    }).catch(() => {});
  } catch (error) {
    handleWardrobeError(res, error);
  }
});

router.get('/theme-suites/task/:taskId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { taskId } = req.params as { taskId: string };

    const task = await themeSuiteService.getThemeSuiteTaskStatus(taskId, userId);
    if (!task) {
      res.status(404).json({ success: false, message: '任务不存在' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    handleWardrobeError(res, error);
  }
});

export default router;
