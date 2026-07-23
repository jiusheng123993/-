import { Router, type Request, type Response } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

async function verifyPetOwnership(petId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM pet_profiles WHERE id = $1 AND user_id = $2',
    [petId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

type TrendType = 'weight' | 'appetite' | 'poop';

const validTrendTypes: TrendType[] = ['weight', 'appetite', 'poop'];

const trendFieldMap: Record<TrendType, string> = {
  weight: 'weight',
  appetite: 'appetite_level',
  poop: 'poop_level',
};

router.get('/api/pets/:petId/trends', authMiddleware, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await verifyPetOwnership(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const type = (req.query.type as string) || 'weight';
    if (!validTrendTypes.includes(type as TrendType)) {
      res.status(400).json({ success: false, message: 'type 必须为 weight, appetite 或 poop' });
      return;
    }

    const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));
    const fieldName = trendFieldMap[type as TrendType];

    const result = await pool.query(
      `SELECT
         created_at::date AS record_date,
         ${fieldName} AS value
       FROM pet_health_entries
       WHERE pet_id = $1 AND user_id = $2
         AND created_at >= NOW() - ($3 || ' days')::INTERVAL
         AND ${fieldName} IS NOT NULL
       ORDER BY record_date ASC`,
      [petId, userId, days]
    );

    const rows = result.rows;

    const dailyAgg: Record<string, { sum: number; count: number }> = {};
    for (const row of rows) {
      const dateStr = row.record_date instanceof Date
        ? row.record_date.toISOString().slice(0, 10)
        : String(row.record_date).slice(0, 10);
      const val = parseFloat(row.value);
      if (!isNaN(val)) {
        if (!dailyAgg[dateStr]) {
          dailyAgg[dateStr] = { sum: 0, count: 0 };
        }
        dailyAgg[dateStr].sum += val;
        dailyAgg[dateStr].count += 1;
      }
    }

    const data = Object.entries(dailyAgg)
      .map(([date, { sum, count }]) => ({
        date,
        value: Math.round((sum / count) * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const values = data.map((d) => d.value);
    const trend = {
      current: values.length > 0 ? values[values.length - 1] : null,
      previous: values.length > 1 ? values[values.length - 2] : null,
      avg: values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
        : null,
      min: values.length > 0 ? Math.min(...values) : null,
      max: values.length > 0 ? Math.max(...values) : null,
    };

    res.json({
      success: true,
      data: {
        type,
        days,
        points: data,
        trend,
      },
    });
  } catch (err) {
    console.error('[Trends Get Error]', err);
    res.status(500).json({ success: false, message: '获取趋势数据失败' });
  }
});

router.get('/api/pets/:petId/trends/report', authMiddleware, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await verifyPetOwnership(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const now = new Date();
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const result = await pool.query(
      `SELECT
         COUNT(*) AS entry_count,
         AVG(weight) AS avg_weight,
         AVG(appetite_level) AS avg_appetite,
         AVG(poop_level) AS avg_poop,
         AVG(spirit_level) AS avg_spirit,
         AVG(exercise_level) AS avg_exercise,
         MIN(weight) AS min_weight,
         MAX(weight) AS max_weight,
         COUNT(*) FILTER (WHERE has_anomaly = true) AS anomaly_count
       FROM pet_health_entries
       WHERE pet_id = $1 AND user_id = $2
         AND created_at >= $3::DATE AND created_at < $4::DATE`,
      [petId, userId, startDate, endDate]
    );

    const row = result.rows[0];
    const bodyWeight = await pool.query(
      'SELECT weight FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [petId, userId]
    );
    const currentWeight = bodyWeight.rows[0]?.weight
      ? parseFloat(bodyWeight.rows[0].weight)
      : null;

    res.json({
      success: true,
      data: {
        year,
        month,
        entry_count: parseInt(row.entry_count, 10) || 0,
        summary: {
          avg_weight: row.avg_weight ? Math.round(parseFloat(row.avg_weight) * 100) / 100 : null,
          avg_appetite: row.avg_appetite ? Math.round(parseFloat(row.avg_appetite) * 100) / 100 : null,
          avg_poop: row.avg_poop ? Math.round(parseFloat(row.avg_poop) * 100) / 100 : null,
          avg_spirit: row.avg_spirit ? Math.round(parseFloat(row.avg_spirit) * 100) / 100 : null,
          avg_exercise: row.avg_exercise ? Math.round(parseFloat(row.avg_exercise) * 100) / 100 : null,
          min_weight: row.min_weight ? parseFloat(row.min_weight) : null,
          max_weight: row.max_weight ? parseFloat(row.max_weight) : null,
          current_weight: currentWeight,
          anomaly_count: parseInt(row.anomaly_count, 10) || 0,
        },
      },
    });
  } catch (err) {
    console.error('[Trends Report Error]', err);
    res.status(500).json({ success: false, message: '获取月度报告失败' });
  }
});

export default router;
