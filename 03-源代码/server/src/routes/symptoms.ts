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

router.post('/api/pets/:petId/symptom-check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await verifyPetOwnership(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const { symptoms, duration, severity, additional_info } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      res.status(400).json({ success: false, message: '请提供症状列表' });
      return;
    }

    const validRiskLevels = ['normal', 'caution', 'warning', 'emergency'];
    const risk_level = validRiskLevels.includes(req.body.risk_level)
      ? req.body.risk_level
      : 'normal';

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO pet_symptom_checks (id, pet_id, user_id, symptoms, duration, severity, additional_info, risk_level, possible_conditions, ai_advice, recommended_actions, knowledge_match)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        id,
        petId,
        userId,
        symptoms,
        duration || null,
        severity || null,
        JSON.stringify(additional_info || {}),
        risk_level,
        req.body.possible_conditions || [],
        req.body.ai_advice || null,
        req.body.recommended_actions || [],
        req.body.knowledge_match ? JSON.stringify(req.body.knowledge_match) : null,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Symptom Check Error]', err);
    res.status(500).json({ success: false, message: '提交症状初筛失败' });
  }
});

router.get('/api/pets/:petId/symptom-check/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await verifyPetOwnership(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM pet_symptom_checks WHERE pet_id = $1 AND user_id = $2',
      [petId, userId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      'SELECT * FROM pet_symptom_checks WHERE pet_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [petId, userId, pageSize, offset]
    );

    res.json({
      success: true,
      data: {
        list: result.rows,
        total,
        page,
        pageSize,
      },
    });
  } catch (err) {
    console.error('[Symptom History Error]', err);
    res.status(500).json({ success: false, message: '获取初筛历史失败' });
  }
});

export default router;
