/**
 * 慢性病追踪路由 - 宠物慢性病记录 CRUD
 * 支持创建、列表、更新、删除，均校验宠物归属，杜绝越权
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createChronicRecordSchema, updateChronicRecordSchema, chronicAiAnalysisSchema, chronicRiskScanSchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { ChronicRepository } from '../repositories/chronicRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import { analyzeChronicAdvice } from '../services/chronicAiService.js';
import { scanChronicRisk } from '../services/chronicRiskService.js';

const router = Router();
router.use(authMiddleware);

const petRepository = new PetRepository();
const chronicRepository = new ChronicRepository();
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

/**
 * POST /api/pets/:petId/chronic/ai-analysis
 * AI 慢病管理建议（会员专属）
 * 慢病数据从服务端 pet_chronic_records 权威读取（不信任前端传参），
 * 注入宠物档案/打卡/记忆召回后调 LLM。
 * 安全：auth + 会员强制 + 宠物归属 + zod 校验 + 输出安全检测（服务内 fail-closed）
 */
router.post('/:petId/chronic/ai-analysis', checkPetOwnership, validate({ body: chronicAiAnalysisSchema }), async (req: Request, res: Response) => {
  try {
    // 会员强制校验（LLM 调用有成本，不能只靠前端隐藏）
    const { isMember } = await getUserMembership(req.userId!);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'AI 慢病管理建议仅限会员使用，请先开通会员' });
      return;
    }

    const result = await analyzeChronicAdvice(req.userId!, req.params.petId as string, {
      focus: req.body.focus || undefined,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Chronic AI Analysis Error]', err);
    res.status(500).json({ success: false, message: 'AI 慢病管理建议生成失败' });
  }
});

/**
 * POST /api/pets/:petId/chronic/scan-risk
 * 慢性病风险扫描（会员专属）
 * L2 规则预警（打卡数据确定性规则）+ L3 AI 疑似识别（LLM，仅"疑似/建议排查"）
 * 安全：auth + 会员强制 + 宠物归属 + zod 校验 + 输出安全检测（服务内）
 */
router.post('/:petId/chronic/scan-risk', checkPetOwnership, validate({ body: chronicRiskScanSchema }), async (req: Request, res: Response) => {
  try {
    // 会员强制校验
    const { isMember } = await getUserMembership(req.userId!);
    if (!isMember) {
      res.status(403).json({ success: false, message: '慢病风险扫描仅限会员使用，请先开通会员' });
      return;
    }

    const result = await scanChronicRisk(req.userId!, req.params.petId as string);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Chronic Risk Scan Error]', err);
    res.status(500).json({ success: false, message: '慢病风险扫描失败' });
  }
});

export default router;
