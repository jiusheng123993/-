/**
 * 症状初筛路由 - 宠物症状分析与风险评估
 * 提交症状检查记录，查询历史初筛结果（含分页）
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { symptomLimiter } from '../middleware/rateLimit.js';
import { symptomCheckSchema, symptomHistoryQuerySchema, aiSymptomAnalysisSchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { SymptomRepository } from '../repositories/symptomRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import { recordHealthMemory } from '../services/memoryService.js';
import { deepAnalyzeSymptom } from '../services/symptomAiService.js';

const router = Router();

const petRepository = new PetRepository();
const symptomRepository = new SymptomRepository();
const membershipRepository = new MembershipRepository();

/** 查询用户会员状态（AI 深度分析会员强制校验，不能只靠前端隐藏） */
async function getUserMembership(userId: string): Promise<{ isMember: boolean; status: string }> {
  const row = await membershipRepository.findTierAndStatus(userId);
  if (!row) return { isMember: false, status: 'none' };
  const isExpired = row.expires_at && new Date(row.expires_at) < new Date();
  if (isExpired) return { isMember: false, status: 'expired' };
  return { isMember: row.tier !== 'free' && row.status === 'active', status: row.status };
}

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

// 注意：本路由已挂载在 app.use('/api/pets', ...) 下，这里使用相对路径，
// 避免拼出 /api/pets/api/pets/... 导致 404
router.post('/:petId/symptom-check', authMiddleware, validate({ body: symptomCheckSchema }), checkPetOwnership, async (req: Request, res: Response) => {
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

    // 健康事件自动记忆（F1）：症状初筛 → 自动沉淀医疗记忆（异步，不影响主流程）
    try {
      const importance =
        risk_level === 'emergency' ? 10 : risk_level === 'warning' ? 9 : risk_level === 'caution' ? 8 : 7;
      const riskText: Record<string, string> = {
        emergency: '紧急需就医',
        warning: '需尽快就医',
        caution: '需观察',
        normal: '一般',
      };
      const symptomText = Array.isArray(symptoms) ? (symptoms as string[]).join('、') : String(symptoms ?? '');
      const adviceText = req.body.ai_advice ? `，建议：${String(req.body.ai_advice).slice(0, 80)}` : '';
      void recordHealthMemory({
        userId,
        petId,
        category: 'medical',
        content: `${new Date().toLocaleDateString('zh-CN')} 症状初筛：${symptomText}（${duration || '时长未知'}），评估：${riskText[risk_level || 'normal']}${adviceText}`,
        importance,
        evidence: `symptom:${id}`,
      });
    } catch (err) {
      console.warn('[SymptomCheck] 健康事件记忆失败:', err);
    }
  } catch (err) {
    console.error('[Symptom Check Error]', err);
    res.status(500).json({ success: false, message: '提交症状初筛失败' });
  }
});

router.get('/:petId/symptom-check/history', authMiddleware, validate({ query: symptomHistoryQuerySchema }), async (req: Request, res: Response) => {
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

/**
 * POST /api/pets/:petId/symptom-check/ai-analysis
 * AI 深度分析（会员专属，Phase 2）
 * 请求体 = 前端本地初筛结论（规则+图谱依据），服务端注入宠物档案/打卡/记忆闸门召回后调 LLM
 * 安全：auth + 症状限流(10次/分钟) + 宠物归属 + 会员强制 + zod 校验 + 输出安全检测（服务内）
 */
router.post('/:petId/symptom-check/ai-analysis', authMiddleware, symptomLimiter, validate({ body: aiSymptomAnalysisSchema }), checkPetOwnership, async (req: Request, res: Response) => {
  try {
    // 会员强制校验（服务端，不能只靠前端隐藏——LLM 调用有成本）
    const { isMember } = await getUserMembership(req.userId!);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'AI 深度分析仅限会员使用，请先开通会员' });
      return;
    }

    const result = await deepAnalyzeSymptom(req.userId!, req.params.petId as string, {
      symptoms: req.body.symptoms,
      symptomNames: req.body.symptom_names,
      riskLevel: req.body.risk_level,
      possibleConditions: req.body.possible_conditions || [],
      conclusions: req.body.conclusions || [],
      duration: req.body.duration,
      severity: req.body.severity,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Symptom AI Analysis Error]', err);
    res.status(500).json({ success: false, message: 'AI 深度分析失败' });
  }
});

export default router;
