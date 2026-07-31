/**
 * 症状初筛路由 - 宠物症状分析与风险评估
 * 提交症状检查记录，查询历史初筛结果（含分页）
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { symptomCheckSchema, symptomHistoryQuerySchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { SymptomRepository } from '../repositories/symptomRepository.js';

const router = Router();

const petRepository = new PetRepository();
const symptomRepository = new SymptomRepository();

async function checkPetOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;
    const isOwner = await petRepository.isOwner(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }
    next();
  } catch (err) {
    console.error('[Symptom Check Error]', err);
    res.status(500).json({ success: false, message: '提交症状初筛失败' });
  }
}

router.post('/api/pets/:petId/symptom-check', authMiddleware, validate({ body: symptomCheckSchema }), checkPetOwnership, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const { symptoms, duration, severity, additional_info, risk_level } = req.body;

    const id = crypto.randomUUID();
    const row = await symptomRepository.createSymptomCheck(id, petId, userId, {
      symptoms,
      duration: duration || null,
      severity: severity || null,
      additional_info: JSON.stringify(additional_info || {}),
      // risk_level 已由 symptomCheckSchema 白名单校验（normal/caution/warning/emergency）
      risk_level: risk_level || 'normal',
      possible_conditions: req.body.possible_conditions || [],
      ai_advice: req.body.ai_advice || null,
      recommended_actions: req.body.recommended_actions || [],
      knowledge_match: req.body.knowledge_match ? JSON.stringify(req.body.knowledge_match) : null,
    });

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('[Symptom Check Error]', err);
    res.status(500).json({ success: false, message: '提交症状初筛失败' });
  }
});

router.get('/api/pets/:petId/symptom-check/history', authMiddleware, validate({ query: symptomHistoryQuerySchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await petRepository.isOwner(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const page = req.query.page as unknown as number;
    const pageSize = req.query.page_size as unknown as number;
    const offset = (page - 1) * pageSize;

    const total = await symptomRepository.countByPetAndUser(petId, userId);
    const list = await symptomRepository.findHistoryPage(petId, userId, pageSize, offset);

    res.json({
      success: true,
      data: {
        list,
        total,
        page,
        pageSize,
      },
    });
  } catch (err) {
    console.error('[Symptom History Error]', err);
    res.status(500).json({ success: false, message: '获取初筛历史失败' });
  }
});

export default router;
