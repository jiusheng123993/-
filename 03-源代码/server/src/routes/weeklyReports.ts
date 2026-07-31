/**
 * 家庭周报路由 - 家庭周报的列表、最新、详情、手动生成
 * 提供家庭周报完整查询与生成接口
 * 所有接口需登录认证，均做家庭归属校验防越权
 *
 * 路由顺序注意：latest 与 generate 必须在 :reportId 之前注册，
 * 否则会被 :reportId 参数路由匹配（Express 自上而下匹配）
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { weeklyReportQuerySchema } from '../schemas/index.js';
import {
  listReports,
  getLatest,
  getReport,
  generateReport,
  WeeklyReportError,
} from '../services/weeklyReportService.js';

const router = Router();

router.use(authMiddleware);

/**
 * 统一处理 Service 抛出的业务错误
 * WeeklyReportError 返回对应状态码，其他异常返回 500
 */
function handleServiceError(res: Response, err: unknown): void {
  if (err instanceof WeeklyReportError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  console.error('[WeeklyReports Service Error]', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
}

/**
 * GET /:id/weekly-reports/latest - 获取最新周报
 * 注意：此路由必须在 /:id/weekly-reports/:reportId 之前注册，避免 latest 被识别为 reportId
 */
router.get('/:id/weekly-reports/latest', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const report = await getLatest(userId, familyId);
    res.json({ success: true, data: report });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * POST /:id/weekly-reports/generate - 手动生成周报
 * 注意：此路由必须在 /:id/weekly-reports/:reportId 之前注册，避免 generate 被识别为 reportId
 */
router.post('/:id/weekly-reports/generate', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const report = await generateReport(userId, familyId);
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * GET /:id/weekly-reports - 获取周报列表（分页）
 */
router.get('/:id/weekly-reports', validate({ query: weeklyReportQuerySchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const query = req.query as unknown as { page: number; page_size: number; year?: number };
    const result = await listReports(userId, familyId, query);
    res.json({ success: true, data: result });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * GET /:id/weekly-reports/:reportId - 获取周报详情
 */
router.get('/:id/weekly-reports/:reportId', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const familyId = req.params.id as string;
    const reportId = req.params.reportId as string;
    const report = await getReport(userId, familyId, reportId);
    res.json({ success: true, data: report });
  } catch (err) {
    handleServiceError(res, err);
  }
});

export default router;
