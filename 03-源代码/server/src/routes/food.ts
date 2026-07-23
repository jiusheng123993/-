import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

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

router.get('/query', async (req: Request, res: Response) => {
  try {
    const keyword = req.query.keyword as string;

    if (!keyword) {
      res.status(400).json({ success: false, message: '缺少查询关键词 keyword' });
      return;
    }

    const { rows } = await pool.query(
      'SELECT * FROM pet_food_queries WHERE food_name ILIKE $1 ORDER BY created_at DESC LIMIT 5',
      [`%${keyword}%`]
    );

    if (rows.length > 0) {
      res.json({ success: true, data: toCamelCaseArray(rows), source: 'database' });
      return;
    }

    const id = uuidv4();
    const { rows: inserted } = await pool.query(
      `INSERT INTO pet_food_queries (id, user_id, food_name, safety_level, detail)
       VALUES ($1, $2, $3, 'caution', $4)
       RETURNING *`,
      [id, req.userId, keyword, '请咨询兽医确认该食物对宠物的安全性']
    );

    res.json({
      success: true,
      data: toCamelCase(inserted[0]),
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
    const { rows } = await pool.query(
      'SELECT * FROM pet_food_queries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );

    res.json({ success: true, data: toCamelCaseArray(rows) });
  } catch (err) {
    console.error('[Food History Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
