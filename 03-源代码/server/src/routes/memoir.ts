/**
 * 回忆录路由 - 宠物回忆录视频生成任务管理
 * 提供创建、状态查询、列表、删除、预览接口
 * 所有接口需登录认证，均做宠物归属校验防越权
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMemoirSchema, memoirListQuerySchema, memoirPreviewSchema } from '../schemas/index.js';
import { memoirLimiter } from '../middleware/rateLimit.js';
import {
  createMemoir,
  getStatus,
  listMemoirs,
  deleteMemoir,
  previewMemoir,
  confirmMemoirScript,
  rejectMemoirScript,
  MemoirError,
  MemoirBusinessError,
} from '../services/memoirService.js';
import { PetRepository } from '../repositories/petRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';

const petRepo = new PetRepository();
const membershipRepo = new MembershipRepository();
const router = Router();

router.use(authMiddleware);

/**
 * 统一处理 Service 抛出的业务错误
 * - MemoirBusinessError：返回状态码、错误码和额外信息（如付费金额）
 * - MemoirError：返回状态码和消息
 * - 其他异常：返回 500
 */
function handleServiceError(res: Response, err: unknown): void {
  if (err instanceof MemoirBusinessError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.extra ?? {}),
    });
    return;
  }
  if (err instanceof MemoirError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  console.error('[Memoir Service Error]', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
}

/**
 * POST /:petId/memoir - 创建回忆录任务
 * 限流：memoirLimiter 3次/分钟（2026-09 审查修复：回忆录为 15-200 元/单的最高成本接口，
 * 此前 memoirLimiter 定义后从未挂载，仅剩全局 120/分兜底；只挂创建端点，查询/列表不限）
 */
router.post('/:petId/memoir', memoirLimiter, validate({ body: createMemoirSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.params.petId as string;
    const result = await createMemoir(userId, petId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * GET /:petId/memoir/status - 查询回忆录状态（最新任务）
 * 立项 v0.2 P0-2：awaiting_confirmation=true 时响应携带待确认分镜 script，前端渲染确认 UI
 */
router.get('/:petId/memoir/status', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.params.petId as string;
    const result = await getStatus(userId, petId);
    res.json({ success: true, data: result });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * POST /:petId/memoir/:memoirId/confirm - 确认分镜脚本（立项 v0.2 P0-2 剧本确认闸门）
 * 确认后任务重新入队，处理器直接进入视频生成（Seedance 成本在确认后才发生）
 */
router.post('/:petId/memoir/:memoirId/confirm', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.params.petId as string;
    const memoirId = req.params.memoirId as string;
    await confirmMemoirScript(userId, petId, memoirId);
    res.json({ success: true, message: '剧本已确认，开始生成视频' });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * POST /:petId/memoir/:memoirId/reject - 放弃分镜脚本（立项 v0.2 P0-2 剧本确认闸门）
 * 拒绝发生在视频生成之前，无视频成本；任务置为 failed 终态，可另建新任务
 */
router.post('/:petId/memoir/:memoirId/reject', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.params.petId as string;
    const memoirId = req.params.memoirId as string;
    await rejectMemoirScript(userId, petId, memoirId);
    res.json({ success: true, message: '已放弃本次生成' });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * GET /:petId/memoir/list - 获取回忆录列表（分页）
 */
router.get('/:petId/memoir/list', validate({ query: memoirListQuerySchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.params.petId as string;
    const page = req.query.page as unknown as number;
    const pageSize = req.query.page_size as unknown as number;
    const result = await listMemoirs(userId, petId, page, pageSize);
    res.json({ success: true, data: result });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * DELETE /:petId/memoir/:memoirId - 删除回忆录
 */
router.delete('/:petId/memoir/:memoirId', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.params.petId as string;
    const memoirId = req.params.memoirId as string;
    await deleteMemoir(userId, petId, memoirId);
    res.json({ success: true, message: '回忆录已删除' });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * POST /:petId/memoir/preview - 获取预览视频
 */
router.post('/:petId/memoir/preview', validate({ body: memoirPreviewSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.params.petId as string;
    const memoirId = req.body.memoir_id as string;
    const result = await previewMemoir(userId, petId, memoirId);
    res.json({ success: true, data: result });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * GET /api/pets/:petId/membership
 * 查询与宠物关联的用户的会员状态（用于回忆录页面展示会员价）
 * 校验宠物归属，防止越权；返回会员层级、价格折扣信息
 */
router.get('/:petId/membership', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.params.petId as string;

    const owns = await petRepo.canAccess(petId, userId);
    if (!owns) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    const membership = await membershipRepo.findStatusByUser(userId);

    if (!membership) {
      res.json({
        success: true,
        data: {
          tier: 'free',
          plan: null,
          status: 'none',
          expiresAt: null,
          memoirPrice: 14900,
          memberPrice: 9900,
          isMember: false,
        },
      });
      return;
    }

    const isExpired =
      membership.status === 'active' &&
      membership.expires_at &&
      new Date(membership.expires_at) < new Date();

    const isMember = membership.status === 'active' && !isExpired;

    res.json({
      success: true,
      data: {
        tier: isMember ? membership.tier : 'free',
        plan: membership.plan,
        status: isExpired ? 'expired' : membership.status,
        expiresAt: membership.expires_at,
        memoirPrice: isMember ? 9900 : 14900,
        memberPrice: 9900,
        isMember,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询会员状态异常';
    res.status(500).json({ success: false, message });
  }
});

export default router;
