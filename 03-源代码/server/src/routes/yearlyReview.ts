/**
 * 年度回忆图集路由 - 宠物年度回忆的创建、查询、更新、视频生成
 * 提供年度回忆模块完整接口
 * 所有接口需登录认证，均做宠物归属校验防越权
 *
 * 路由清单：
 *   POST   /:petId/yearly-review                       创建年度回忆
 *   GET    /:petId/yearly-review/list                  获取年度列表
 *   GET    /:petId/yearly-review/:year                 获取年度回忆详情
 *   PUT    /:petId/yearly-review/:reviewId             更新年度回忆
 *   POST   /:petId/yearly-review/:reviewId/generate-video  生成年度视频
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createYearlyReviewSchema,
  updateYearlyReviewSchema,
  yearlyReviewListQuerySchema,
} from '../schemas/index.js';
import {
  createYearlyReview,
  getYearlyReviewByYear,
  listYearlyReviews,
  updateYearlyReview,
  generateYearlyVideo,
  YearlyReviewError,
} from '../services/yearlyReviewService.js';

const router = Router();

router.use(authMiddleware);

/**
 * 统一处理 Service 抛出的业务错误
 */
function handleServiceError(res: Response, err: unknown): void {
  if (err instanceof YearlyReviewError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  console.error('[YearlyReview Service Error]', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
}

/**
 * POST /:petId/yearly-review - 创建年度回忆
 */
router.post(
  '/:petId/yearly-review',
  validate({ body: createYearlyReviewSchema }),
  async (req: Request, res: Response) => {
    try {
      const petId = req.params.petId as string;
      const userId = req.userId!;
      const result = await createYearlyReview(userId, petId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      handleServiceError(res, err);
    }
  },
);

/**
 * GET /:petId/yearly-review/list - 获取年度列表（必须在 /:year 之前注册避免冲突）
 */
router.get(
  '/:petId/yearly-review/list',
  validate({ query: yearlyReviewListQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const petId = req.params.petId as string;
      const userId = req.userId!;
      const query = req.query as unknown as { page: number; page_size: number };
      const result = await listYearlyReviews(userId, petId, query.page, query.page_size);
      res.json({ success: true, data: result });
    } catch (err) {
      handleServiceError(res, err);
    }
  },
);

/**
 * GET /:petId/yearly-review/:year - 获取年度回忆详情
 */
router.get(
  '/:petId/yearly-review/:year',
  async (req: Request, res: Response) => {
    try {
      const petId = req.params.petId as string;
      const userId = req.userId!;
      const year = parseInt(req.params.year as string, 10);
      if (Number.isNaN(year) || year < 2000 || year > 2100) {
        res.status(400).json({ success: false, message: 'year 不合法' });
        return;
      }
      const result = await getYearlyReviewByYear(userId, petId, year);
      res.json({ success: true, data: result });
    } catch (err) {
      handleServiceError(res, err);
    }
  },
);

/**
 * PUT /:petId/yearly-review/:reviewId - 更新年度回忆
 */
router.put(
  '/:petId/yearly-review/:reviewId',
  validate({ body: updateYearlyReviewSchema }),
  async (req: Request, res: Response) => {
    try {
      const petId = req.params.petId as string;
      const userId = req.userId!;
      const reviewId = req.params.reviewId as string;
      const result = await updateYearlyReview(userId, petId, reviewId, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      handleServiceError(res, err);
    }
  },
);

/**
 * POST /:petId/yearly-review/:reviewId/generate-video - 生成年度视频
 */
router.post(
  '/:petId/yearly-review/:reviewId/generate-video',
  async (req: Request, res: Response) => {
    try {
      const petId = req.params.petId as string;
      const userId = req.userId!;
      const reviewId = req.params.reviewId as string;
      const result = await generateYearlyVideo(userId, petId, reviewId);
      res.json({ success: true, data: result });
    } catch (err) {
      handleServiceError(res, err);
    }
  },
);

export default router;
