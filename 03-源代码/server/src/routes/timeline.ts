/**
 * 回忆时间线路由 - 宠物回忆/日记的管理
 * 创建和查询回忆记录（按宠物/家庭/用户），上传回忆照片
 */
import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTimelineEventSchema, timelineMomentsQuerySchema } from '../schemas/index.js';
import { config } from '../config.js';
import { PetRepository } from '../repositories/petRepository.js';
import { FamilyMemberRepository } from '../repositories/familyRepository.js';
import { TimelineRepository } from '../repositories/timelineRepository.js';

const router = Router();

const petRepository = new PetRepository();
const familyMemberRepository = new FamilyMemberRepository();
const timelineRepository = new TimelineRepository();

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
router.post('/moments', authMiddleware, validate({ body: createTimelineEventSchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { petId, type, content, photos } = req.body;

    // 校验宠物归属
    const isOwner = await petRepository.isOwner(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const momentId = crypto.randomUUID();
    const momentType = type || 'memory';
    const momentContent = content || {};
    const momentPhotos = Array.isArray(photos) ? photos : [];

    const row = await timelineRepository.createMoment(
      momentId,
      userId,
      petId,
      momentType,
      JSON.stringify(momentContent),
      momentPhotos,
    );

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('[Timeline CreateMoment Error]', err);
    res.status(500).json({ success: false, message: '保存回忆失败' });
  }
});

// 获取回忆列表
router.get('/moments', authMiddleware, validate({ query: timelineMomentsQuerySchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const petId = req.query.pet_id as string | undefined;
    const familyId = req.query.family_id as string | undefined;
    const limit = req.query.limit as unknown as number;

    let rows;

    if (familyId) {
      // 按家庭查询：获取家庭成员宠物ID，再查回忆
      const petIds = await familyMemberRepository.findPetIdsByFamilyId(familyId);
      if (petIds.length === 0) {
        res.json({ success: true, data: [] });
        return;
      }
      rows = await timelineRepository.findByPetIds(petIds, limit);
    } else if (petId) {
      rows = await timelineRepository.findByPetAndUser(petId, userId, limit);
    } else {
      // 查询当前用户所有回忆
      rows = await timelineRepository.findByUser(userId, limit);
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

/**
 * 旧时光提醒（F5）：查询"去年今天"的回忆
 * 前端时光页展示 + 后续订阅消息推送
 */
router.get('/last-year', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const now = new Date();
    // 去年今天（月日相同，年份-1）
    const lastYear = now.getFullYear() - 1;
    const moments = await timelineRepository.findLastYearMoments(
      userId,
      lastYear,
      now.getMonth() + 1,
      now.getDate(),
    );

    res.json({
      success: true,
      data: {
        lastYear: `${lastYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        count: moments.length,
        moments: moments.map((m) => ({
          id: m.id,
          pet_id: m.pet_id,
          content: m.content,
          photos: m.photos,
          created_at: m.created_at,
        })),
      },
    });
  } catch (err) {
    console.error('[Timeline LastYear Error]', err);
    res.status(500).json({ success: false, message: '查询去年今天失败' });
  }
});

export default router;
