/**
 * 慢性病追踪路由 - 宠物慢性病记录 CRUD
 * 支持创建、列表、更新、删除，均校验宠物归属，杜绝越权
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createChronicRecordSchema, updateChronicRecordSchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { ChronicRepository } from '../repositories/chronicRepository.js';

const router = Router();
router.use(authMiddleware);

const petRepository = new PetRepository();
const chronicRepository = new ChronicRepository();

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
    console.error('[Chronic Ownership Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
}

/** 创建慢性病记录 */
router.post('/:petId/chronic', checkPetOwnership, validate({ body: createChronicRecordSchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const {
      condition, diagnosed_date, severity, status,
      medications, vet_name, vet_contact, next_checkup_date, notes, symptoms,
    } = req.body;

    const id = uuidv4();
    const row = await chronicRepository.create(id, petId, req.userId!, {
      condition,
      diagnosed_date,
      severity,
      status,
      medications,
      vet_name,
      vet_contact,
      next_checkup_date,
      notes,
      symptoms,
    });

    res.status(201).json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Chronic Create Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/** 查询宠物慢性病记录列表 */
router.get('/:petId/chronic', checkPetOwnership, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const rows = await chronicRepository.findByPet(petId, req.userId!);
    res.json({ success: true, data: toCamelCaseArray(rows as unknown as Record<string, unknown>[]) });
  } catch (err) {
    console.error('[Chronic List Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/** 更新慢性病记录 */
router.put('/:petId/chronic/:recordId', checkPetOwnership, validate({ body: updateChronicRecordSchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const recordId = req.params.recordId as string;

    const {
      condition, diagnosed_date, severity, status,
      medications, vet_name, vet_contact, next_checkup_date, notes, symptoms,
    } = req.body;

    const row = await chronicRepository.update(recordId, petId, req.userId!, {
      condition,
      diagnosed_date,
      severity,
      status,
      medications,
      vet_name,
      vet_contact,
      next_checkup_date,
      notes,
      symptoms,
    });

    if (!row) {
      res.status(404).json({ success: false, message: '慢性病记录不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Chronic Update Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/** 删除慢性病记录 */
router.delete('/:petId/chronic/:recordId', checkPetOwnership, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const recordId = req.params.recordId as string;

    const removed = await chronicRepository.remove(recordId, petId, req.userId!);
    if (!removed) {
      res.status(404).json({ success: false, message: '慢性病记录不存在' });
      return;
    }

    res.json({ success: true, message: '已删除' });
  } catch (err) {
    console.error('[Chronic Delete Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
