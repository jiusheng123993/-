import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();

// 照片上传配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG/PNG/WebP/HEIC 格式'));
    }
  },
});

// 创建回忆
router.post('/moments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { petId, type, content, photos } = req.body;

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: '请提供宠物ID' });
      return;
    }

    // 校验宠物归属
    const petResult = await pool.query(
      'SELECT 1 FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [petId, userId]
    );
    if (petResult.rowCount === 0) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const momentId = crypto.randomUUID();
    const momentType = type || 'memory';
    const momentContent = content || {};
    const momentPhotos = Array.isArray(photos) ? photos : [];

    const result = await pool.query(
      `INSERT INTO pet_moments (id, user_id, pet_id, type, content, photos)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [momentId, userId, petId, momentType, JSON.stringify(momentContent), momentPhotos]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Timeline CreateMoment Error]', err);
    res.status(500).json({ success: false, message: '保存回忆失败' });
  }
});

// 获取回忆列表
router.get('/moments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.query.pet_id as string;
    const familyId = req.query.family_id as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    let rows: any[];

    if (familyId) {
      // 按家庭查询：获取家庭成员宠物ID，再查回忆
      const memberResult = await pool.query(
        'SELECT pet_id FROM pet_family_members WHERE family_id = $1',
        [familyId]
      );
      const petIds = memberResult.rows.map((r: { pet_id: string }) => r.pet_id);
      if (petIds.length === 0) {
        res.json({ success: true, data: [] });
        return;
      }
      const placeholders = petIds.map((_: string, i: number) => `$${i + 1}`).join(',');
      const result = await pool.query(
        `SELECT * FROM pet_moments WHERE pet_id IN (${placeholders})
         ORDER BY created_at DESC LIMIT $${petIds.length + 1}`,
        [...petIds, limit]
      );
      rows = result.rows;
    } else if (petId) {
      const result = await pool.query(
        `SELECT * FROM pet_moments WHERE pet_id = $1 AND user_id = $2
         ORDER BY created_at DESC LIMIT $3`,
        [petId, userId, limit]
      );
      rows = result.rows;
    } else {
      // 查询当前用户所有回忆
      const result = await pool.query(
        `SELECT * FROM pet_moments WHERE user_id = $1
         ORDER BY created_at DESC LIMIT $2`,
        [userId, limit]
      );
      rows = result.rows;
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Timeline GetMoments Error]', err);
    res.status(500).json({ success: false, message: '获取回忆失败' });
  }
});

// 上传回忆照片
router.post('/photo/upload', authMiddleware, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: '请选择照片' });
      return;
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const dirPath = path.join(config.uploadDir, 'moment-photos', userId);
    const filePath = path.join(dirPath, filename);

    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, file.buffer);

    const publicUrl = `/uploads/moment-photos/${userId}/${filename}`;
    res.json({ success: true, data: { url: publicUrl } });
  } catch (err) {
    console.error('[Timeline UploadPhoto Error]', err);
    res.status(500).json({ success: false, message: '上传照片失败' });
  }
});

export default router;