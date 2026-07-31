/**
 * 排行榜与角色路由 - 家庭排行榜查询 + 宠物角色管理
 * 提供排行榜模块完整接口
 * 所有接口需登录认证，均做家庭归属校验防越权
 *
 * 路由清单：
 *   GET    /:id/leaderboard            获取家庭排行
 *   GET    /:id/roles                  获取角色分配
 *   POST   /:id/roles                  分配角色
 *   PUT    /:id/roles/:roleId          更新角色
 *   DELETE /:id/roles/:roleId          移除角色
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { leaderboardQuerySchema, assignRoleSchema, updateRoleSchema } from '../schemas/index.js';
import {
  getLeaderboard,
  listRoles,
  assignRole,
  updateRole,
  deleteRole,
  LeaderboardError,
} from '../services/leaderboardService.js';

const router = Router();

router.use(authMiddleware);

/**
 * 统一处理 Service 抛出的业务错误
 */
function handleServiceError(res: Response, err: unknown): void {
  if (err instanceof LeaderboardError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  console.error('[Leaderboard Service Error]', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
}

/**
 * GET /:id/leaderboard - 获取家庭排行
 */
router.get(
  '/:id/leaderboard',
  validate({ query: leaderboardQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const familyId = req.params.id as string;
      const query = req.query as unknown as { period: 'weekly' | 'monthly' | 'all_time' };
      const result = await getLeaderboard(userId, familyId, query.period);
      res.json({ success: true, data: result });
    } catch (err) {
      handleServiceError(res, err);
    }
  },
);

/**
 * GET /:id/roles - 获取角色分配
 */
router.get('/:id/roles', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const result = await listRoles(userId, familyId);
    res.json({ success: true, data: result });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * POST /:id/roles - 分配角色
 */
router.post('/:id/roles', validate({ body: assignRoleSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const result = await assignRole(userId, familyId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * PUT /:id/roles/:roleId - 更新角色
 */
router.put(
  '/:id/roles/:roleId',
  validate({ body: updateRoleSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const familyId = req.params.id as string;
      const roleId = req.params.roleId as string;
      const result = await updateRole(userId, familyId, roleId, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      handleServiceError(res, err);
    }
  },
);

/**
 * DELETE /:id/roles/:roleId - 移除角色
 */
router.delete('/:id/roles/:roleId', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const roleId = req.params.roleId as string;
    await deleteRole(userId, familyId, roleId);
    res.json({ success: true, message: '角色已移除' });
  } catch (err) {
    handleServiceError(res, err);
  }
});

export default router;
