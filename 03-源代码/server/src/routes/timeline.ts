/**
 * 回忆时间线路由 - 宠物回忆/日记的管理
 * 创建和查询回忆记录（按宠物/家庭/用户），上传回忆照片
 * 补充：回忆补记（happenedAt）、AI 生成/润色回忆文案、删除回忆
 */
import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatLimiter, uploadLimiter } from '../middleware/rateLimit.js';
import {
  createTimelineEventSchema,
  timelineMomentsQuerySchema,
  timelineAiPolishSchema,
} from '../schemas/index.js';
import { config } from '../config.js';
import { PetRepository } from '../repositories/petRepository.js';
import { FamilyRepository, FamilyMemberRepository } from '../repositories/familyRepository.js';
import { TimelineRepository } from '../repositories/timelineRepository.js';
import { analyzeImage } from '../services/visionService.js';
import { chat } from '../services/aiService.js';

const router = Router();

const petRepository = new PetRepository();
const familyRepository = new FamilyRepository();
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
    const { petId, type, content, photos, happenedAt } = req.body;

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
      // 补记：happenedAt 是合法日期字符串时透传，否则交给数据库默认 now()
      typeof happenedAt === 'string' && happenedAt ? happenedAt : undefined,
    );

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('[Timeline CreateMoment Error]', err);
    res.status(500).json({ success: false, message: '保存回忆失败' });
  }
});

/**
 * AI 生成回忆描述：上传 1 张照片 → 视觉模型生成温暖的中文回忆文案
 * 安全：uploadLimiter 限流（视觉调用成本高），不落库，前端确认后再保存
 */
router.post('/ai-describe', authMiddleware, uploadLimiter, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: '请上传照片' });
      return;
    }

    const mimeType = req.file.mimetype || 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;

    const systemPrompt = `你是"星河宠记"的回忆文案助手。用户上传了一张宠物照片，请用温暖、有画面感的语言写一段 50~120 字的回忆描述。
要求：
1. 以"今天"或"这一天"开头，第一人称"我"，仿佛主人亲笔记录
2. 描述照片中能看到的宠物状态、动作、环境细节
3. 只描述照片可见内容，不要编造照片里没有的信息（如疾病、经历）
4. 语气温柔自然，像朋友圈日记，不要用"AI""生成"等字眼，不要用 emoji
5. 直接输出描述文字，不要加引号、标题或任何其他内容`;

    const result = await analyzeImage({
      imageUrl: imageDataUrl,
      prompt: systemPrompt,
      maxTokens: 400,
    });

    // 视觉 key 未配置时降级：返回占位提示（前端可隐藏 AI 按钮）
    if (!result) {
      res.status(503).json({ success: false, message: 'AI 视觉能力未配置，无法生成描述' });
      return;
    }

    res.json({ success: true, data: { description: result.trim() } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 生成描述失败';
    console.error('[Timeline AiDescribe Error]', message);
    res.status(500).json({ success: false, message: 'AI 生成描述失败，请重试' });
  }
});

/**
 * AI 润色回忆文案：用户写的简短文字 → 扩写/润色成温暖的回忆文案
 * 安全：chatLimiter 限流（对话算力），不落库，前端确认后再保存
 */
router.post('/ai-polish', authMiddleware, chatLimiter, validate({ body: timelineAiPolishSchema }), async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    const systemPrompt = `你是"星河宠记"的回忆文案助手。用户写了一段关于宠物的回忆草稿，请润色成温暖、自然、有画面感的回忆文案。
要求：
1. 保留用户表达的核心事实，不编造新内容
2. 语气温柔自然，像主人亲笔记录的日记，不超过 150 字
3. 不要用"AI""生成"等字眼，不要加引号、标题、列表
4. 直接输出润色后的文字`;

    const result = await chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      { temperature: 0.7, max_tokens: 400 },
    );

    // 拦截未配置降级：aiService 无 key 时 chat 返回非空占位串（非 null），
    // 必须显式识别，否则会以 200 把占位文案当润色结果返回给用户
    if (!result || !result.trim()) {
      res.status(503).json({ success: false, message: 'AI 润色失败，请重试' });
      return;
    }
    if (result.includes('AI 服务暂未配置')) {
      res.status(503).json({ success: false, message: 'AI 服务暂未配置，无法润色' });
      return;
    }

    res.json({ success: true, data: { text: result.trim() } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 润色失败';
    console.error('[Timeline AiPolish Error]', message);
    res.status(500).json({ success: false, message: 'AI 润色失败，请重试' });
  }
});

/**
 * 删除回忆：校验归属（只能删自己的回忆）
 */
router.delete('/moments/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    // Express 5 中 params 值类型为 string | string[]，路由参数实际恒为 string，这里显式转换
    const momentId = String(req.params.id);

    // 先查归属，防止越权删除他人回忆
    const moment = await timelineRepository.findById(momentId);
    if (!moment) {
      res.status(404).json({ success: false, message: '回忆不存在' });
      return;
    }
    if (moment.user_id !== userId) {
      res.status(403).json({ success: false, message: '无权删除此回忆' });
      return;
    }

    await timelineRepository.deleteById(momentId);
    res.json({ success: true, data: { id: momentId } });
  } catch (err) {
    console.error('[Timeline DeleteMoment Error]', err);
    res.status(500).json({ success: false, message: '删除回忆失败' });
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
      // 按家庭查询：先校验家庭归属（防 IDOR：知晓他人 family_id 即可读取其家庭回忆）
      const isFamilyOwner = await familyRepository.isOwner(familyId, userId);
      if (!isFamilyOwner) {
        res.status(403).json({ success: false, message: '无权查看此家庭的回忆' });
        return;
      }
      // 获取家庭成员宠物ID，再查回忆
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
