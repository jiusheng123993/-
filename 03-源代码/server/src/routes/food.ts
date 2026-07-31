/**
 * 食物安全查询路由 - 查询食物对宠物的安全性
 * 支持关键词模糊匹配、历史查询记录、查询统计
 * 数据访问全部通过 FoodRepository，禁止直接拼接 SQL
 */
import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { foodQuerySchema } from '../schemas/index.js';
import { FoodRepository } from '../repositories/foodRepository.js';

const router = Router();
router.use(authMiddleware);

const foodRepository = new FoodRepository();

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function toCamelCaseArray(arr: Record<string, unknown>[]): Record<string, unknown>[] {
  return arr.map(toCamelCase);
}

router.get('/query', validate({ query: foodQuerySchema }), async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query as { keyword: string };

    const rows = await foodRepository.searchByKeyword(keyword);

    if (rows.length > 0) {
      res.json({ success: true, data: toCamelCaseArray(rows), source: 'database' });
      return;
    }

    const id = uuidv4();
    const inserted = await foodRepository.insertPlaceholder(
      id,
      req.userId!,
      keyword,
      '请咨询兽医确认该食物对宠物的安全性',
    );

    res.json({
      success: true,
      data: toCamelCaseArray([inserted]),
      source: 'placeholder',
      message: '本地知识库暂无该食物数据，已记录查询',
    });
  } catch (err) {
    console.error('[Food Query Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const rows = await foodRepository.findHistoryByUser(req.userId!);
    res.json({ success: true, data: toCamelCaseArray(rows) });
  } catch (err) {
    console.error('[Food History Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [totalQueries, todayQueries] = await Promise.all([
      foodRepository.countByUser(req.userId!),
      foodRepository.countTodayByUser(req.userId!, today),
    ]);

    res.json({
      success: true,
      data: {
        totalQueries,
        todayQueries,
      },
    });
  } catch (err) {
    console.error('[Food Stats Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/today-count', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const count = await foodRepository.countTodayByUser(req.userId!, today);

    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('[Food Today Count Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
