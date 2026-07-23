import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
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

async function verifyVaccinationOwnership(vaccineId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM pet_vaccinations WHERE id = $1 AND user_id = $2',
    [vaccineId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

router.get('/api/pets/:petId/vaccines', authMiddleware, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await verifyPetOwnership(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const result = await pool.query(
      'SELECT * FROM pet_vaccinations WHERE pet_id = $1 AND user_id = $2 ORDER BY date DESC, created_at DESC',
      [petId, userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Vaccines Get Error]', err);
    res.status(500).json({ success: false, message: '获取疫苗计划失败' });
  }
});

router.post('/api/pets/:petId/vaccines', authMiddleware, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await verifyPetOwnership(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const { type, category, date, next_date, status, hospital, doctor, notes, reminder_enabled } = req.body;

    if (!type || !['vaccine', 'deworm'].includes(type)) {
      res.status(400).json({ success: false, message: '类型必须为 vaccine 或 deworm' });
      return;
    }

    if (!category) {
      res.status(400).json({ success: false, message: '请提供类别' });
      return;
    }

    if (!date || !next_date) {
      res.status(400).json({ success: false, message: '请提供日期和下次日期' });
      return;
    }

    const validStatuses = ['completed', 'pending', 'overdue'];
    const recordStatus = validStatuses.includes(status) ? status : 'pending';

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO pet_vaccinations (id, pet_id, user_id, type, category, date, next_date, status, hospital, doctor, notes, reminder_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        id,
        petId,
        userId,
        type,
        category,
        date,
        next_date,
        recordStatus,
        hospital || null,
        doctor || null,
        notes || null,
        reminder_enabled !== undefined ? reminder_enabled : true,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Vaccines Post Error]', err);
    res.status(500).json({ success: false, message: '添加疫苗记录失败' });
  }
});

router.put('/api/pets/:petId/vaccines/:vaccineId/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const vaccineId = req.params.vaccineId as string;
    const userId = req.userId!;

    const isOwner = await verifyVaccinationOwnership(vaccineId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此记录' });
      return;
    }

    const result = await pool.query(
      `UPDATE pet_vaccinations SET status = 'completed', updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [vaccineId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: '记录不存在' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Vaccines Complete Error]', err);
    res.status(500).json({ success: false, message: '标记完成失败' });
  }
});

router.put('/api/pets/:petId/vaccines/:vaccineId/reminder', authMiddleware, async (req: Request, res: Response) => {
  try {
    const vaccineId = req.params.vaccineId as string;
    const userId = req.userId!;

    const isOwner = await verifyVaccinationOwnership(vaccineId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此记录' });
      return;
    }

    const { reminder_enabled } = req.body;

    if (typeof reminder_enabled !== 'boolean') {
      res.status(400).json({ success: false, message: '请提供 reminder_enabled 布尔值' });
      return;
    }

    const result = await pool.query(
      `UPDATE pet_vaccinations SET reminder_enabled = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [reminder_enabled, vaccineId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: '记录不存在' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Vaccines Reminder Error]', err);
    res.status(500).json({ success: false, message: '设置提醒失败' });
  }
});

export default router;
