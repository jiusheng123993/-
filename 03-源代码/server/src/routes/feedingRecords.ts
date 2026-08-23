/**
 * 喂养记录路由 - 宠物喂养记录 CRUD
 * 支持创建、列表、更新、删除，均校验宠物归属，杜绝越权
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createFeedingRecordSchema, updateFeedingRecordSchema, feedingAiAnalysisSchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { FeedingRecordRepository } from '../repositories/feedingRecordRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import { analyzeFeedingAdvice } from '../services/feedingAiService.js';

const router = Router();
router.use(authMiddleware);

const petRepository = new PetRepository();
const feedingRecordRepository = new FeedingRecordRepository();
const membershipRepository = new MembershipRepository();

/** 查询用户会员状态（AI 分析会员强制校验，不能只靠前端隐藏——LLM 调用有成本） */
async function getUserMembership(userId: string): Promise<{ isMember: boolean; status: string }> {
  const row = await membershipRepository.findTierAndStatus(userId);
  if (!row) return { isMember: false, status: 'none' };
  const isExpired = row.expires_at && new Date(row.expires_at) < new Date();
  if (isExpired) return { isMember: false, status: 'expired' };
  return { isMember: row.tier !== 'free' && row.status === 'active', status: row.status };
}

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

/** 校验宠物归属，不通过则中断请求 */
async function checkPetOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const petId = req.params.petId as string;
    const owns = await petRepository.canAccess(petId, req.userId!);
    if (!owns) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }
    next();
  } catch (err) {
    console.error('[Feeding Ownership Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
}

/** 创建喂养记录 */
router.post('/:petId/feeding-records', checkPetOwnership, validate({ body: createFeedingRecordSchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const {
      date, food_type, brand, amount, unit,
      meal_time, appetite, stool, energy, notes,
    } = req.body;

    const id = uuidv4();
    const row = await feedingRecordRepository.create(id, petId, req.userId!, {
      record_date: date,
      food_type,
      brand,
      amount,
      unit,
      meal_time,
      appetite,
      stool,
      energy,
      notes,
    });

    res.status(201).json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Feeding Create Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/** 查询宠物喂养记录列表 */
router.get('/:petId/feeding-records', checkPetOwnership, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const rows = await feedingRecordRepository.findByPet(petId, req.userId!);
    res.json({ success: true, data: toCamelCaseArray(rows as unknown as Record<string, unknown>[]) });
  } catch (err) {
    console.error('[Feeding List Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/** 更新喂养记录 */
router.put('/:petId/feeding-records/:recordId', checkPetOwnership, validate({ body: updateFeedingRecordSchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const recordId = req.params.recordId as string;

    const {
      date, food_type, brand, amount, unit,
      meal_time, appetite, stool, energy, notes,
    } = req.body;

    const row = await feedingRecordRepository.update(recordId, petId, req.userId!, {
      record_date: date,
      food_type,
      brand,
      amount,
      unit,
      meal_time,
      appetite,
      stool,
      energy,
      notes,
    });

    if (!row) {
      res.status(404).json({ success: false, message: '喂养记录不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Feeding Update Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/** 删除喂养记录 */
router.delete('/:petId/feeding-records/:recordId', checkPetOwnership, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const recordId = req.params.recordId as string;

    const removed = await feedingRecordRepository.remove(recordId, petId, req.userId!);
    if (!removed) {
      res.status(404).json({ success: false, message: '喂养记录不存在' });
      return;
    }

    res.json({ success: true, message: '已删除' });
  } catch (err) {
    console.error('[Feeding Delete Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/pets/:petId/feeding-records/ai-analysis
 * AI 个性化喂食建议（会员专属）
 * 请求体 = 前端规则引擎产出的喂养画像；服务端注入宠物档案/喂养记录/记忆召回后调 LLM
 * 安全：auth + 会员强制 + 宠物归属 + zod 校验 + 输出安全检测（服务内 fail-closed）
 */
router.post('/:petId/feeding-records/ai-analysis', checkPetOwnership, validate({ body: feedingAiAnalysisSchema }), async (req: Request, res: Response) => {
  try {
    // 会员强制校验（LLM 调用有成本，不能只靠前端隐藏）
    const { isMember } = await getUserMembership(req.userId!);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'AI 喂养建议仅限会员使用，请先开通会员' });
      return;
    }

    const result = await analyzeFeedingAdvice(req.userId!, req.params.petId as string, {
      petName: req.body.pet_name,
      species: req.body.species,
      breed: req.body.breed || '',
      ageMonths: req.body.age_months ?? 0,
      weight: req.body.weight ?? 0,
      bodyCondition: req.body.body_condition || 'normal',
      isPuppyKitten: req.body.is_puppy_kitten ?? false,
      isSenior: req.body.is_senior ?? false,
      isNeutered: req.body.is_neutered ?? false,
      chronicConditions: req.body.chronic_conditions || [],
      allergies: req.body.allergies || [],
      recentAppetite: req.body.recent_appetite || undefined,
      recentStool: req.body.recent_stool || undefined,
      currentAdvice: req.body.current_advice || '',
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Feeding AI Analysis Error]', err);
    res.status(500).json({ success: false, message: 'AI 喂养建议生成失败' });
  }
});

export default router;
