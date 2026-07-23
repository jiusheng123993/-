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

async function verifyPetOwnership(petId: string, userId: string): Promise<boolean> {
  const { rows } = await pool.query(
    'SELECT id FROM pet_profiles WHERE id = $1 AND user_id = $2',
    [petId, userId]
  );
  return rows.length > 0;
}

router.post('/:petId/checkins', async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const owns = await verifyPetOwnership(petId, req.userId!);
    if (!owns) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    const {
      poop_level, appetite_level, spirit_level, exercise_level,
      weight, has_anomaly, anomaly_items, ai_feedback, risk_level, note,
    } = req.body;

    if (
      poop_level === undefined || appetite_level === undefined ||
      spirit_level === undefined || exercise_level === undefined ||
      !risk_level
    ) {
      res.status(400).json({
        success: false,
        message: '缺少必填字段: poop_level, appetite_level, spirit_level, exercise_level, risk_level',
      });
      return;
    }

    const id = uuidv4();
    const { rows } = await pool.query(
      `INSERT INTO pet_health_entries
        (id, pet_id, user_id, poop_level, appetite_level, spirit_level,
         exercise_level, weight, has_anomaly, anomaly_items, ai_feedback, risk_level, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        id, petId, req.userId, poop_level, appetite_level, spirit_level,
        exercise_level, weight ?? null, has_anomaly ?? false, anomaly_items ?? [],
        ai_feedback ?? null, risk_level, note ?? null,
      ]
    );

    res.status(201).json({ success: true, data: toCamelCase(rows[0]) });
  } catch (err) {
    console.error('[Checkins Create Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/:petId/checkins', async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const owns = await verifyPetOwnership(petId, req.userId!);
    if (!owns) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { rows } = await pool.query(
      `SELECT * FROM pet_health_entries
       WHERE pet_id = $1 AND user_id = $2 AND created_at >= $3
       ORDER BY created_at DESC`,
      [petId, req.userId, since.toISOString()]
    );

    res.json({ success: true, data: toCamelCaseArray(rows) });
  } catch (err) {
    console.error('[Checkins List Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/:petId/checkins/today', async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const owns = await verifyPetOwnership(petId, req.userId!);
    if (!owns) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const { rows } = await pool.query(
      `SELECT * FROM pet_health_entries
       WHERE pet_id = $1 AND user_id = $2 AND created_at::date = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [petId, req.userId, today]
    );

    res.json({ success: true, data: rows.length > 0 ? toCamelCase(rows[0]) : null });
  } catch (err) {
    console.error('[Checkins Today Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
