/**
 * 家族图谱路由 - 家族图谱的查询、关系管理、血缘管理、快照管理
 * 提供家族图谱模块完整接口
 * 所有接口需登录认证，均做家庭归属校验防越权
 *
 * 路由清单：
 *   GET    /:id/tree                       获取家族图谱（nodes + edges）
 *   POST   /:id/relationships              创建宠物关系
 *   PUT    /:id/relationships/:relId       更新关系标签
 *   DELETE /:id/relationships/:relId       删除关系
 *   POST   /:id/lineage                    添加血缘关系
 *   GET    /:id/lineage/:petId             获取某宠物的血亲树
 *   POST   /:id/tree/snapshot              保存图谱快照
 *   GET    /:id/tree/snapshots             获取历史快照列表
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createRelationshipSchema,
  updateRelationshipSchema,
  createLineageSchema,
  createSnapshotSchema,
  snapshotQuerySchema,
} from '../schemas/index.js';
import {
  getTree,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  createLineage,
  getLineage,
  createSnapshot,
  listSnapshots,
  FamilyTreeError,
} from '../services/familyTreeService.js';

const router = Router();

router.use(authMiddleware);

/**
 * 统一处理 Service 抛出的业务错误
 * FamilyTreeError 返回对应状态码，其他异常返回 500
 */
function handleServiceError(res: Response, err: unknown): void {
  if (err instanceof FamilyTreeError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  console.error('[FamilyTree Service Error]', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
}

/**
 * GET /:id/tree - 获取家族图谱（nodes + edges）
 */
router.get('/:id/tree', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const tree = await getTree(userId, familyId);
    res.json({ success: true, data: tree });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * POST /:id/tree/snapshot - 保存图谱快照
 * 注意：必须在 GET /:id/tree 之外注册，路径不同不冲突
 */
router.post('/:id/tree/snapshot', validate({ body: createSnapshotSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const snapshot = await createSnapshot(userId, familyId, req.body);
    res.status(201).json({ success: true, data: snapshot });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * GET /:id/tree/snapshots - 获取历史快照列表（分页）
 */
router.get('/:id/tree/snapshots', validate({ query: snapshotQuerySchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const query = req.query as unknown as { page: number; page_size: number };
    const result = await listSnapshots(userId, familyId, query);
    res.json({ success: true, data: result });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * POST /:id/relationships - 创建宠物关系
 */
router.post('/:id/relationships', validate({ body: createRelationshipSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const rel = await createRelationship(userId, familyId, req.body);
    res.status(201).json({ success: true, data: rel });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * PUT /:id/relationships/:relId - 更新关系标签
 */
router.put('/:id/relationships/:relId', validate({ body: updateRelationshipSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const relId = req.params.relId as string;
    const rel = await updateRelationship(userId, familyId, relId, req.body);
    res.json({ success: true, data: rel });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * DELETE /:id/relationships/:relId - 删除关系
 */
router.delete('/:id/relationships/:relId', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const relId = req.params.relId as string;
    await deleteRelationship(userId, familyId, relId);
    res.json({ success: true, message: '关系已删除' });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * POST /:id/lineage - 添加血缘关系
 */
router.post('/:id/lineage', validate({ body: createLineageSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const lineage = await createLineage(userId, familyId, req.body);
    res.status(201).json({ success: true, data: lineage });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * GET /:id/lineage/:petId - 获取某宠物的血亲树
 */
router.get('/:id/lineage/:petId', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const petId = req.params.petId as string;
    const lineage = await getLineage(userId, familyId, petId);
    res.json({ success: true, data: lineage });
  } catch (err) {
    handleServiceError(res, err);
  }
});

export default router;
