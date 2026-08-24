/**
 * 品种知识库路由（热更新）
 * 复刻 knowledge.ts 模式：
 * 1. GET  /api/breeds/knowledge  - 最新品种库版本（公开，非敏感科普数据，小程序启动/品种页拉取）
 * 2. GET  /api/admin/breeds      - 管理端：查看当前品种库（Token）
 * 3. PUT  /api/admin/breeds      - 管理端：保存新版本（人工校对后覆盖，版本自动递增，Token）
 */
import { Router, type Request, type Response } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { validate } from '../middleware/validate.js';
import { adminBreedSchema } from '../schemas/index.js';
import { BreedKnowledgeRepository } from '../repositories/breedRepository.js';

const router = Router();

const breedRepository = new BreedKnowledgeRepository();

/** 品种条目最小结构（用于热更新响应与管理端提交的结构校验） */
interface BreedShape {
  id?: unknown;
  name?: unknown;
  species?: unknown;
  sources?: unknown;
}

/**
 * 品种库结构最小校验
 * 防止坏数据上线：空列表、缺 id/name/species/sources 的条目会导致前端渲染崩溃或来源标注失效。
 * species 仅接受 cat/dog（与前端 BreedItem 联合类型一致）。
 * @returns 结构合法则 true
 */
export function isValidBreedData(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.breeds) || d.breeds.length === 0) return false;
  const validSpecies = ['cat', 'dog'];
  return (d.breeds as BreedShape[]).every((b) => {
    if (!b || typeof b !== 'object') return false;
    return (
      typeof b.id === 'string' &&
      typeof b.name === 'string' &&
      typeof b.species === 'string' &&
      validSpecies.includes(b.species) &&
      Array.isArray(b.sources) &&
      b.sources.length > 0 &&
      b.sources.every((s) => typeof s === 'string')
    );
  });
}

/** 统一错误响应 */
function fail(res: Response, err: unknown, prefix: string): void {
  console.error(`[Breeds] ${prefix}失败:`, err);
  res.status(500).json({ success: false, message: `${prefix}失败` });
}

// ===== 用户侧 =====

/** 获取最新品种库（公开；空表自动播种种子；异常返回 503 由前端静态兜底 BREED_DATA） */
router.get('/breeds/knowledge', async (_req: Request, res: Response) => {
  try {
    const breeds = await breedRepository.getLatestBreeds();
    if (!breeds) {
      res.status(503).json({ success: false, message: '品种知识库暂不可用' });
      return;
    }
    res.json({ success: true, data: breeds });
  } catch (err) {
    fail(res, err, '获取品种知识库');
  }
});

// ===== 管理端（Token） =====

/** 查看当前品种库（仓库异常/无数据时返回 503，避免 200+null 掩盖故障） */
router.get('/admin/breeds', adminAuth, async (_req: Request, res: Response) => {
  try {
    const breeds = await breedRepository.getLatestBreeds();
    if (!breeds) {
      res.status(503).json({ success: false, message: '品种知识库暂不可用' });
      return;
    }
    res.json({ success: true, data: breeds });
  } catch (err) {
    fail(res, err, '查询品种库');
  }
});

/** 保存新品种库（管理端校对后覆盖；版本自动递增；结构校验防止坏数据上线） */
router.put('/admin/breeds', adminAuth, validate({ body: adminBreedSchema }), async (req: Request, res: Response) => {
  try {
    const data = req.body.data as Record<string, unknown>;
    // 结构校验：空列表/缺关键字段/缺来源标注的品种库禁止上线
    if (!isValidBreedData(data)) {
      res.status(400).json({ success: false, message: '品种库结构不合法：breeds 非空且每条含 id/name/species(cat|dog)/sources' });
      return;
    }
    const version = await breedRepository.saveBreeds(data);
    res.json({ success: true, data: { version } });
  } catch (err) {
    fail(res, err, '保存品种库');
  }
});

export default router;
