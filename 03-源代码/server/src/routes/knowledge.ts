/**
 * 知识图谱路由（Phase 3）
 * 1. GET  /api/knowledge/latest        - 图谱最新版本（公开，非敏感知识数据，前端启动/初筛时拉取）
 * 2. POST /api/knowledge/feedback      - 用户纠错提交（登录）
 * 3. GET  /api/admin/knowledge         - 管理端：查看当前图谱（Token）
 * 4. PUT  /api/admin/knowledge         - 管理端：保存新图谱（版本自动递增，Token）
 * 5. GET  /api/admin/feedback          - 管理端：反馈列表（Token）
 * 6. POST /api/admin/feedback/:id/review - 管理端：审核 approve/reject（Token）
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { knowledgeFeedbackSchema, adminKnowledgeSchema, adminReviewSchema } from '../schemas/index.js';
import { KnowledgeGraphRepository, KnowledgeFeedbackRepository } from '../repositories/knowledgeRepository.js';
import { config } from '../config.js';

const router = Router();

const graphRepository = new KnowledgeGraphRepository();
const feedbackRepository = new KnowledgeFeedbackRepository();

/**
 * 管理端 Token 校验（fail-closed：未配置 ADMIN_TOKEN 或令牌不匹配一律 403）
 * 密钥只存在于 .env（ADMIN_TOKEN），不写入代码
 */
function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = String(req.headers['x-admin-token'] || '').trim();
  if (!config.adminToken || token !== config.adminToken) {
    res.status(403).json({ success: false, message: '管理员令牌无效' });
    return;
  }
  next();
}

/**
 * 图谱结构最小校验（审查项修复）
 * 防止"空规则/缺来源"的坏数据上线：轻则 rule.sourceRef 渲染崩溃，重则紧急规则全灭导致全量 normal
 * @returns 结构合法则 true
 */
function isValidGraphShape(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== 'object') return false;
  const g = data as Record<string, unknown>;
  if (!Array.isArray(g.riskRules) || g.riskRules.length === 0) return false;
  if (!Array.isArray(g.diseases) || g.diseases.length === 0) return false;
  if (!Array.isArray(g.symptoms)) return false; // 症状注册表缺失则前端无法映射名称（审查项补充）
  const validLevels = ['normal', 'caution', 'warning', 'emergency'];
  return g.riskRules.every((r) => {
    if (!r || typeof r !== 'object') return false;
    const rule = r as { id?: unknown; name?: unknown; level?: string; sourceRef?: { sourceId?: unknown }; match?: { type?: unknown } };
    return (
      typeof rule.id === 'string' &&
      typeof rule.name === 'string' &&
      typeof rule.level === 'string' &&
      validLevels.includes(rule.level) &&
      typeof rule.sourceRef?.sourceId === 'string' &&
      typeof rule.match?.type === 'string'
    );
  });
}

/** 统一错误响应 */
function fail(res: Response, err: unknown, prefix: string): void {
  console.error(`[Knowledge] ${prefix}失败:`, err);
  res.status(500).json({ success: false, message: `${prefix}失败` });
}

// ===== 用户侧 =====

/** 获取最新图谱（公开；空表自动播种种子；异常返回 503 由前端静态兜底） */
router.get('/knowledge/latest', async (_req: Request, res: Response) => {
  try {
    const graph = await graphRepository.getLatestGraph();
    if (!graph) {
      res.status(503).json({ success: false, message: '知识图谱暂不可用' });
      return;
    }
    res.json({ success: true, data: graph });
  } catch (err) {
    fail(res, err, '获取知识图谱');
  }
});

/** 用户纠错提交（登录态；反馈入 knowledge_feedback 表等待人工审核） */
router.post('/knowledge/feedback', authMiddleware, validate({ body: knowledgeFeedbackSchema }), async (req: Request, res: Response) => {
  try {
    const row = await feedbackRepository.create({
      userId: req.userId!,
      petId: req.body.pet_id,
      checkId: req.body.check_id,
      entityType: req.body.entity_type,
      entityName: req.body.entity_name,
      suggestion: req.body.suggestion,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    fail(res, err, '提交纠错反馈');
  }
});

// ===== 管理端（Token） =====

/** 查看当前图谱（仓库异常/无数据时返回 503，避免 200+null 掩盖故障） */
router.get('/admin/knowledge', adminAuth, async (_req: Request, res: Response) => {
  try {
    const graph = await graphRepository.getLatestGraph();
    if (!graph) {
      res.status(503).json({ success: false, message: '知识图谱暂不可用' });
      return;
    }
    res.json({ success: true, data: graph });
  } catch (err) {
    fail(res, err, '查询图谱');
  }
});

/** 保存新图谱（管理端人工核查后覆盖；版本自动递增；结构校验防止坏数据上线） */
router.put('/admin/knowledge', adminAuth, validate({ body: adminKnowledgeSchema }), async (req: Request, res: Response) => {
  try {
    const data = req.body.data as Record<string, unknown>;
    // 结构校验（审查项修复）：空规则/缺来源的图谱禁止上线
    if (!isValidGraphShape(data)) {
      res.status(400).json({ success: false, message: '图谱结构不合法：riskRules 非空且每条含 id/name/level/sourceRef' });
      return;
    }
    const version = await graphRepository.saveGraph(data);
    res.json({ success: true, data: { version } });
  } catch (err) {
    fail(res, err, '保存图谱');
  }
});

/** 反馈列表（可按状态过滤） */
router.get('/admin/feedback', adminAuth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const rows = await feedbackRepository.list(status);
    res.json({ success: true, data: { list: rows } });
  } catch (err) {
    fail(res, err, '查询反馈');
  }
});

/** 审核反馈（approve 后管理员需另存图谱以落地修改；reject 记录备注） */
router.post('/admin/feedback/:id/review', adminAuth, validate({ body: adminReviewSchema }), async (req: Request, res: Response) => {
  try {
    const row = await feedbackRepository.review(req.params.id as string, req.body.action, req.body.note);
    if (!row) {
      res.status(404).json({ success: false, message: '反馈不存在' });
      return;
    }
    res.json({ success: true, data: row });
  } catch (err) {
    fail(res, err, '审核反馈');
  }
});

export default router;
