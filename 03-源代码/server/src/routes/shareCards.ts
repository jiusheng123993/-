/**
 * 分享卡片路由 - 卡片的生成、列表、详情、删除、记录分享
 * 提供分享卡片完整 CRUD 接口
 * 所有接口需登录认证，均做数据归属校验（findByIdAndUser）防越权
 *
 * 路由顺序注意：generate 与 /:id/share 为固定路径，
 * 需在 /:id 之前/之后正确注册（Express 自上而下匹配）
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generateShareCardSchema, shareActionSchema, shareCardQuerySchema } from '../schemas/index.js';
import {
  generateCard,
  listCards,
  getCard,
  deleteCard,
  recordShare,
  ShareCardError,
  type ShareChannel,
} from '../services/shareCardService.js';

const router = Router();

router.use(authMiddleware);

/**
 * 统一处理 Service 抛出的业务错误
 * ShareCardError 返回对应状态码，其他异常返回 500
 */
function handleServiceError(res: Response, err: unknown): void {
  if (err instanceof ShareCardError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  console.error('[ShareCards Service Error]', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
}

/**
 * POST /generate - 生成分享卡片
 */
router.post('/generate', validate({ body: generateShareCardSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const card = await generateCard(userId, req.body);
    res.status(201).json({ success: true, data: card });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * GET / - 获取卡片列表（分页）
 */
router.get('/', validate({ query: shareCardQuerySchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const query = req.query as unknown as { page: number; page_size: number; card_type?: string };
    const result = await listCards(userId, query);
    res.json({ success: true, data: result });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * GET /:id - 获取卡片详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const cardId = req.params.id as string;
    const card = await getCard(userId, cardId);
    res.json({ success: true, data: card });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * DELETE /:id - 删除卡片
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const cardId = req.params.id as string;
    await deleteCard(userId, cardId);
    res.json({ success: true, message: '卡片已删除' });
  } catch (err) {
    handleServiceError(res, err);
  }
});

/**
 * POST /:id/share - 记录分享行为（share_count+1）
 */
router.post('/:id/share', validate({ body: shareActionSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const cardId = req.params.id as string;
    const channel = req.body.share_channel as ShareChannel;
    const card = await recordShare(userId, cardId, channel);
    res.json({ success: true, data: card });
  } catch (err) {
    handleServiceError(res, err);
  }
});

export default router;
