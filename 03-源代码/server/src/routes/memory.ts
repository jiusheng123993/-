/**
 * 记忆管理路由 - 用户查看/修正 AI 记忆（memory-body 记忆引擎的"可编辑记忆"能力）
 *
 * 接口清单：
 *   1. GET /api/memory?petId=xxx - 查看记忆列表（按宠物过滤，登录态）
 *   2. PUT /api/memory/:id       - 修正记忆内容（登录态 + 归属校验）
 *
 * 设计来源：参考 Pet_agent 的"记忆可编辑/可见"设计（memoryDialog + /api/memory），
 *   让用户查看/修正 AI 记住的宠物数据，可纠错、可审计，防止 AI 记住错误信息无法修正。
 *
 * 安全约束：
 *   - 全部接口需登录
 *   - 修正操作做归属校验（记忆必须属于当前用户），防横向越权
 *   - 修正后 source 标记为 manual，防止被后续自动提取覆盖
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { memoryListQuerySchema, memoryUpdateSchema } from '../schemas/index.js';
import { listUserMemories, updateUserMemory } from '../services/memoryService.js';

const router = Router();

/**
 * GET /api/memory?petId=xxx
 * 查看当前用户的记忆列表（可按宠物过滤）
 */
router.get(
  '/',
  authMiddleware,
  validate({ query: memoryListQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const petId = (req.query.petId as string | undefined) || null;

      const memories = await listUserMemories(userId, petId);

      res.json({
        success: true,
        data: {
          list: memories,
          total: memories.length,
        },
      });
    } catch (err) {
      console.error('[Memory Route] 查询记忆失败:', err);
      res.status(500).json({ success: false, message: '查询记忆失败' });
    }
  },
);

/**
 * PUT /api/memory/:id
 * 修正记忆内容（用户手动纠错）
 */
router.put(
  '/:id',
  authMiddleware,
  validate({ body: memoryUpdateSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const memoryId = Number(req.params.id);
      if (!Number.isInteger(memoryId) || memoryId <= 0) {
        res.status(400).json({ success: false, message: '记忆ID格式错误' });
        return;
      }

      const content = (req.body as { content: string }).content;
      const updated = await updateUserMemory(userId, memoryId, content);
      if (!updated) {
        res.status(404).json({ success: false, message: '记忆不存在' });
        return;
      }

      res.json({ success: true, data: { id: memoryId, content } });
    } catch (err) {
      console.error('[Memory Route] 修正记忆失败:', err);
      res.status(500).json({ success: false, message: '修正记忆失败' });
    }
  },
);

export default router;
