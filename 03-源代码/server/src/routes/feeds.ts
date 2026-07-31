/**
 * 家庭动态墙路由 - 家庭动态的发布、编辑、删除、列表、精选
 * 提供家庭动态墙完整 CRUD 接口
 * 所有接口需登录认证，均做家庭归属校验防越权
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createFeedSchema, updateFeedSchema, feedQuerySchema } from '../schemas/index.js';
import {
  listFeeds,
  createFeed,
  updateFeed,
  deleteFeed,
  listHighlights,
  FeedError,
} from '../services/feedService.js';

const router = Router();

router.use(authMiddleware);

/**
 * 统一处理 Service 抛出的业务错误
 * FeedError 返回对应状态码，其他异常返回 500
 */
function handleServiceError(res: Response, err: unknown): void {
  if (err instanceof FeedError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  console.error('[Feeds Service Error]', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
}

/**
 * GET /:id/feeds/highlight - 获取精选动态
 * 注意：此路由必须在 /:id/feeds/:feedId 之前注册，避免 highlight 被识别为 feedId
 */
router.get('/:id/feeds/highlight', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const items = await listHighlights(userId, familyId);
    res.json({ success: true, data: items });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * GET /:id/feeds - 获取动态列表（分页）
 */
router.get('/:id/feeds', validate({ query: feedQuerySchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const query = req.query as unknown as { page: number; page_size: number; feed_type?: string; pet_id?: string };
    const result = await listFeeds(userId, familyId, query);
    res.json({ success: true, data: result });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * POST /:id/feeds - 发布动态
 */
router.post('/:id/feeds', validate({ body: createFeedSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const feed = await createFeed(userId, familyId, req.body);
    res.status(201).json({ success: true, data: feed });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * PUT /:id/feeds/:feedId - 编辑动态
 */
router.put('/:id/feeds/:feedId', validate({ body: updateFeedSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const feedId = req.params.feedId as string;
    const feed = await updateFeed(userId, familyId, feedId, req.body);
    res.json({ success: true, data: feed });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * DELETE /:id/feeds/:feedId - 删除动态
 */
router.delete('/:id/feeds/:feedId', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const feedId = req.params.feedId as string;
    await deleteFeed(userId, familyId, feedId);
    res.json({ success: true, message: '动态已删除' });
  } catch (err) {
    handleServiceError(res, err);
  }
});

export default router;
