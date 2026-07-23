import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { pool } from '../db.js';
import { generatePetImage } from '../services/avatarService.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { petId, style } = req.body;
    const userId = req.userId;

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: 'petId 参数不能为空' });
      return;
    }

    const petResult = await pool.query(
      'SELECT id, species, breed, gender, avatar_photo_url FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [petId, userId],
    );

    if (petResult.rowCount === 0) {
      res.status(404).json({ success: false, message: '宠物不存在或无权访问' });
      return;
    }

    const pet = petResult.rows[0] as {
      id: string;
      species: string;
      breed: string;
      gender: string;
      avatar_photo_url: string | null;
    };

    const generationId = uuidv4();

    await pool.query(
      `INSERT INTO avatar_generations (id, user_id, pet_id, prompt, style, status)
       VALUES ($1, $2, $3, $4, $5, 'processing')`,
      [generationId, userId, petId, `为${pet.breed}生成${style || 'cartoon'}风格形象`, style || 'cartoon'],
    );

    const result = await generatePetImage({
      petId: pet.id,
      species: pet.species,
      breed: pet.breed,
      gender: pet.gender,
      photoUrl: pet.avatar_photo_url || undefined,
      style: style || 'cartoon',
    });

    if (result.isPlaceholder) {
      await pool.query(
        `UPDATE avatar_generations SET status = 'failed', error = 'Image generation service unavailable'
         WHERE id = $1`,
        [generationId],
      );

      res.json({
        success: true,
        data: {
          generationId,
          url: result.url,
          status: 'failed',
          isPlaceholder: true,
        },
      });
      return;
    }

    await pool.query(
      `UPDATE pet_profiles SET avatar_cartoon_url = $1, avatar_style = $2, avatar_generated_at = now()
       WHERE id = $3`,
      [result.url, style || 'cartoon', petId],
    );

    await pool.query(
      `UPDATE avatar_generations SET status = 'completed', result_url = $1, completed_at = now()
       WHERE id = $2`,
      [result.url, generationId],
    );

    res.json({
      success: true,
      data: {
        generationId,
        url: result.url,
        status: 'completed',
        isPlaceholder: false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '形象生成异常';
    res.status(500).json({ success: false, message });
  }
});

export default router;
