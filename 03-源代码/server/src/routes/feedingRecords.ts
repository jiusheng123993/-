/**
 * 喂养记录路由 - 宠物喂养记录 CRUD
 * 支持创建、列表、更新、删除，均校验宠物归属，杜绝越权
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createFeedingRecordSchema, updateFeedingRecordSchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { FeedingRecordRepository } from '../repositories/feedingRecordRepository.js';

const router = Router();
router.use(authMiddleware);

const petRepository = new PetRepository();
const feedingRecordRepository = new FeedingRecordRepository();

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
    const owns = await petRepository.isOwner(petId, req.userId!);
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

export default router;
