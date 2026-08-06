/**
 * 健康趋势路由 - 宠物健康数据分析
 * 提供趋势图数据和月度健康报告
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { trendQuerySchema, trendReportQuerySchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { TrendRepository, type TrendType } from '../repositories/trendRepository.js';

const router = Router();

const petRepository = new PetRepository();
const trendRepository = new TrendRepository();

// 注意：本路由已挂载在 app.use('/api/pets', ...) 下，这里使用相对路径，
// 避免拼出 /api/pets/api/pets/... 导致 404
router.get('/:petId/trends', authMiddleware, validate({ query: trendQuerySchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await petRepository.isOwner(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const type = req.query.type as TrendType;
    const days = req.query.days as unknown as number;

    const rows = await trendRepository.findTrendPoints(petId, userId, type, days);

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

router.get('/:petId/trends/report', authMiddleware, validate({ query: trendReportQuerySchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await petRepository.isOwner(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const now = new Date();
    const year = (req.query.year as number | undefined) ?? now.getFullYear();
    const month = (req.query.month as number | undefined) ?? (now.getMonth() + 1);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const row = await trendRepository.findMonthlyReport(petId, userId, startDate, endDate);
    const currentWeight = await petRepository.findWeightByIdAndUser(petId, userId);

    res.json({
      success: true,
      data: {
        year,
        month,
        entry_count: row ? (parseInt(row.entry_count, 10) || 0) : 0,
        summary: {
          avg_weight: row?.avg_weight ? Math.round(parseFloat(row.avg_weight) * 100) / 100 : null,
          avg_appetite: row?.avg_appetite ? Math.round(parseFloat(row.avg_appetite) * 100) / 100 : null,
          avg_poop: row?.avg_poop ? Math.round(parseFloat(row.avg_poop) * 100) / 100 : null,
          avg_spirit: row?.avg_spirit ? Math.round(parseFloat(row.avg_spirit) * 100) / 100 : null,
          avg_exercise: row?.avg_exercise ? Math.round(parseFloat(row.avg_exercise) * 100) / 100 : null,
          min_weight: row?.min_weight ? parseFloat(row.min_weight) : null,
          max_weight: row?.max_weight ? parseFloat(row.max_weight) : null,
          current_weight: currentWeight,
          anomaly_count: row ? (parseInt(row.anomaly_count, 10) || 0) : 0,
        },
      },
    });
  } catch (err) {
    console.error('[Trends Report Error]', err);
    res.status(500).json({ success: false, message: '获取月度报告失败' });
  }
});

export default router;
