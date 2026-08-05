/**
 * AI 建议记录路由 - 效果追踪模块
 * 支持创建、列表、采纳/忽略、删除，均校验宠物归属，杜绝越权
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSuggestionRecordSchema, updateSuggestionAdoptionSchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { SuggestionRecordRepository } from '../repositories/suggestionRecordRepository.js';

const router = Router();
router.use(authMiddleware);

const petRepository = new PetRepository();
const suggestionRecordRepository = new SuggestionRecordRepository();

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
    console.error('[Suggestion Ownership Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
}

/** 创建建议记录 */
router.post('/:petId/suggestions', checkPetOwnership, validate({ body: createSuggestionRecordSchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const { type, title, content, priority } = req.body;

    const id = uuidv4();
    const row = await suggestionRecordRepository.create(id, petId, req.userId!, {
      type,
      title,
      content,
      priority,
    });

    res.status(201).json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Suggestion Create Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/** 查询某宠物的建议记录列表 */
router.get('/:petId/suggestions', checkPetOwnership, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const rows = await suggestionRecordRepository.findByPet(petId, req.userId!);
    res.json({ success: true, data: toCamelCaseArray(rows as unknown as Record<string, unknown>[]) });
  } catch (err) {
    console.error('[Suggestion List Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/** 更新建议采纳状态（采纳/取消采纳） */
router.patch('/:petId/suggestions/:recordId/adoption', checkPetOwnership, validate({ body: updateSuggestionAdoptionSchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const recordId = req.params.recordId as string;
    const { adopted } = req.body;

    const row = await suggestionRecordRepository.updateAdoption(recordId, petId, req.userId!, adopted);

    if (!row) {
      res.status(404).json({ success: false, message: '建议记录不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Suggestion Adoption Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/** 删除建议记录 */
router.delete('/:petId/suggestions/:recordId', checkPetOwnership, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const recordId = req.params.recordId as string;

    const removed = await suggestionRecordRepository.remove(recordId, petId, req.userId!);
    if (!removed) {
      res.status(404).json({ success: false, message: '建议记录不存在' });
      return;
    }

    res.json({ success: true, message: '已删除' });
  } catch (err) {
    console.error('[Suggestion Delete Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
