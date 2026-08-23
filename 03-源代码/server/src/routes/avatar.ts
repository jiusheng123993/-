/**
 * 宠物形象生成路由 - AI 生成宠物头像、2D/3D 形象
 * 支持头像生成、照片上传、2D 形象包生成、3D 模型生成、任务进度查询
 * 通过 PetRepository、MembershipRepository、AvatarGenerationRepository 等访问数据库
 */
import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { generatePetImage, generatePetImageOptions, AVATAR_STYLE_OPTIONS, EXPRESSION_PROMPTS } from '../services/avatarService.js';
import { uploadPetPhoto } from '../services/photoUploadService.js';
import { createTask, getTask, getLatestTaskByPet } from '../services/taskQueue.js';
import { generate2DAvatarPack } from '../services/image2DService.js';
import { generate3DModel } from '../services/model3DService.js';
import { v4 as uuidv4 } from 'uuid';
import { PetRepository } from '../repositories/petRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import {
  AvatarGenerationRepository,
  Avatar2DImageRepository,
  Avatar3DModelRepository,
  AvatarLibraryRepository,
} from '../repositories/avatarRepository.js';
import { AvatarTaskRepository, type AvatarTaskType } from '../repositories/avatarTaskRepository.js';

const router = Router();

const petRepository = new PetRepository();
const membershipRepository = new MembershipRepository();
const avatarGenerationRepository = new AvatarGenerationRepository();
const avatar2DImageRepository = new Avatar2DImageRepository();
const avatar3DModelRepository = new Avatar3DModelRepository();
const avatarTaskRepository = new AvatarTaskRepository();
const avatarLibraryRepository = new AvatarLibraryRepository();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const photoUploadLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: { success: false, message: '上传请求过于频繁，请稍后再试' },
});

const generateLimiter = rateLimit({
  windowMs: 60000,
  max: 5,
  message: { success: false, message: '生成请求过于频繁，请稍后再试' },
});

// 会员每月可生成的 2D 形象包数量（照片生成属会员专享）
const FREE_2D_MONTHLY_LIMIT = 1;
// 会员每月可生成的"照片专属多风格头像"次数
const MEMBER_PHOTO_OPTIONS_MONTHLY_LIMIT = 3;
// 会员每月可生成的 3D 模型数量
const MEMBER_3D_MONTHLY_LIMIT = 3;
// 允许的风格白名单
const VALID_STYLES = ['cartoon', 'realistic'] as const;
type AvatarStyle = (typeof VALID_STYLES)[number];

// Supabase 公共 URL 前缀（用于校验 referencePhotoUrl 归属）
// 环境变量在进程生命周期内不变，模块加载时计算一次即可
const SUPABASE_URL_PREFIX = (() => {
  const url = process.env.SUPABASE_URL || '';
  return url ? `${url}/storage/v1/object/public/` : '';
})();

// 校验 URL 是否为合法 http(s) URL
function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// 校验 referencePhotoUrl 是否归属当前用户
function isOwnedPhotoUrl(url: string, userId: string): boolean {
  if (!SUPABASE_URL_PREFIX) return true;
  if (!url.startsWith(SUPABASE_URL_PREFIX)) return false;
  const rest = url.slice(SUPABASE_URL_PREFIX.length);
  const parts = rest.split('/');
  // 期望: [bucket, userId, petId, file]
  return parts.length >= 4 && parts[1] === userId;
}

// 查询用户当月已成功的指定类型任务数（用于配额校验）
async function countMonthlyTasks(userId: string, taskType: AvatarTaskType): Promise<number> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return avatarTaskRepository.countMonthlyCompleted(userId, taskType, monthStart);
}

// 查询用户会员状态（用于配额校验和会员限制）
async function getUserMembership(userId: string): Promise<{ isMember: boolean; status: string }> {
  const row = await membershipRepository.findTierAndStatus(userId);
  if (!row) return { isMember: false, status: 'none' };
  // 过期检查
  if (row.status === 'active' && row.expires_at && new Date(row.expires_at) < new Date()) {
    return { isMember: false, status: 'expired' };
  }
  return { isMember: row.tier !== 'free' && row.status === 'active', status: row.status };
}

router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { petId, style } = req.body;
    const userId = req.userId!;

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: 'petId 参数不能为空' });
      return;
    }

    // style 白名单校验
    const safeStyle: AvatarStyle = VALID_STYLES.includes(style) ? style : 'cartoon';

    const pet = await petRepository.findByIdAndUser(petId, userId);

    if (!pet) {
      res.status(404).json({ success: false, message: '宠物不存在或无权访问' });
      return;
    }

    // AI 形象生成（文字描述）为会员专享：服务端强制，不能只靠前端隐藏（与 generate-options 口径一致）
    const { isMember } = await getUserMembership(userId);
    if (!isMember) {
      res.status(403).json({
        success: false,
        message: 'AI 形象生成仅限会员使用，请先开通会员',
        code: 'MEMBER_ONLY',
      });
      return;
    }

    const generationId = uuidv4();

    await avatarGenerationRepository.createGeneration({
      id: generationId,
      user_id: userId,
      pet_id: petId,
      prompt: `为${pet.breed}生成${safeStyle}风格形象`,
      style: safeStyle,
    });

    const result = await generatePetImage({
      petId: pet.id,
      species: pet.species,
      breed: pet.breed,
      gender: pet.gender ?? '',
      photoUrl: pet.avatar_photo_url || undefined,
      style: safeStyle,
    });

    if (result.isPlaceholder) {
      await avatarGenerationRepository.markFailed(generationId, 'Image generation service unavailable');

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

    await petRepository.updateAvatarGenerated(petId, result.url, safeStyle);
    await avatarGenerationRepository.markCompleted(generationId, result.url);

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
    console.error('[Avatar generate] Error:', error);
    res.status(500).json({ success: false, message: '形象生成失败，请稍后重试' });
  }
});

// 生成多风格候选形象（5 种画风：Q版萌系/日系治愈/美式卡通/水彩手绘/黏土萌宠）
router.post('/generate-options', authMiddleware, generateLimiter, async (req: Request, res: Response) => {
  try {
    const { petId, referenceImageUrl, style, description, styleKey, expression } = req.body;
    const userId = req.userId!;

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: 'petId 参数不能为空' });
      return;
    }

    // 文字描述（可选）：必须是字符串，截断 100 字防超长
    const safeDescription = typeof description === 'string' ? description.trim().slice(0, 100) : '';

    // 指定画风（可选）：必须是 AVATAR_STYLE_OPTIONS 里的 key，否则视为不指定（生成全部）
    const validStyleKeys: string[] = AVATAR_STYLE_OPTIONS.map((i) => i.key);
    const safeStyleKey = typeof styleKey === 'string' && validStyleKeys.includes(styleKey) ? styleKey : undefined;

    // 表情（可选）：必须是 EXPRESSION_PROMPTS 里的 key，否则忽略
    const safeExpression = typeof expression === 'string' && EXPRESSION_PROMPTS[expression] ? expression : undefined;

    // style 白名单校验（写实/卡通基础基调）
    const safeStyle: AvatarStyle = VALID_STYLES.includes(style) ? style : 'cartoon';

    // 校验宠物归属
    const pet = await petRepository.findByIdAndUser(petId, userId);
    if (!pet) {
      res.status(404).json({ success: false, message: '宠物不存在或无权访问' });
      return;
    }

    // AI 形象生成（文字/照片）均为会员专享：服务端强制，不能只靠前端隐藏。
    // 放在参考照片处理之前，堵住"无照片路径绕过会员校验"的口子（此前无照片路径可被非会员白嫖）
    const { isMember } = await getUserMembership(userId);
    if (!isMember) {
      res.status(403).json({
        success: false,
        message: 'AI 形象生成仅限会员使用，请先开通会员',
        code: 'MEMBER_ONLY',
      });
      return;
    }

    // 参考照片：仅当用户显式传入时才使用（照片生成是会员专享功能）。
    // 注意：不要自动回退到宠物档案里已存的照片，否则免费用户"文字生成"会被误判成照片生成
    let photoUrl: string | undefined;
    if (referenceImageUrl) {
      if (!isValidHttpUrl(referenceImageUrl) || !isOwnedPhotoUrl(referenceImageUrl, userId)) {
        res.status(400).json({ success: false, message: '参考照片地址不合法' });
        return;
      }
      photoUrl = referenceImageUrl;
    }

    // 参照自家宠物照片生成 = 会员每月限次（服务端强制；会员校验已在上面统一完成）
    if (photoUrl) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const usedCount = await avatarGenerationRepository.countMonthlyOptionsByUser(userId, monthStart);
      if (usedCount >= MEMBER_PHOTO_OPTIONS_MONTHLY_LIMIT) {
        res.status(403).json({
          success: false,
          message: `本月照片生成次数已用完（${MEMBER_PHOTO_OPTIONS_MONTHLY_LIMIT} 次/月），请下月再试`,
          code: 'QUOTA_EXCEEDED',
        });
        return;
      }
    }

    const generationId = uuidv4();
    await avatarGenerationRepository.createGeneration({
      id: generationId,
      user_id: userId,
      pet_id: petId,
      prompt: `为${pet.breed}生成${safeStyleKey ? ` ${safeStyleKey}画风` : ' 多种风格'}候选形象${safeDescription ? `；用户描述：${safeDescription}` : ''}${safeExpression ? `；表情：${safeExpression}` : ''}`,
      // 配额口径：文字生成（单画风）与照片生成分开记 style——
      // 文字 = options-<基调>-text-<画风>（不计入照片 3 次/月额度，countMonthlyOptionsByUser 排除 %-text-%）
      // 照片 = options-<基调>-photo / 老格式 options-<基调>（计入照片额度）
      style: `options-${safeStyle}${safeStyleKey ? `-text-${safeStyleKey}` : '-photo'}`,
    });

    const options = await generatePetImageOptions({
      petId: pet.id,
      species: pet.species,
      breed: pet.breed,
      gender: pet.gender ?? '',
      photoUrl,
      style: safeStyle,
      description: safeDescription,
      styleKey: safeStyleKey,
      expression: safeExpression,
    });

    // 生成失败时明确报错，绝不返回丑陋占位图
    if (!options || options.length === 0) {
      await avatarGenerationRepository.markFailed(generationId, 'Image generation service unavailable');
      res.status(503).json({ success: false, message: 'AI 形象生成服务暂不可用，请稍后重试' });
      return;
    }

    await avatarGenerationRepository.markCompleted(generationId, options[0].url);

    res.json({
      success: true,
      data: {
        generationId,
        options,
      },
    });
  } catch (error) {
    console.error('[Avatar generate-options] Error:', error);
    res.status(500).json({ success: false, message: '形象生成失败，请稍后重试' });
  }
});

/**
 * POST /api/avatar/library
 * 保存一个形象到形象库（用户多次生成的收藏，按风格/表情分类）
 */
router.post('/library', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { petId, style, expression, imageUrl } = req.body;
    const userId = req.userId!;

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: 'petId 参数不能为空' });
      return;
    }
    // 画风白名单 + 图片 URL 必须 http(s)（防存脏数据/外链探测）
    const validStyleKeys: string[] = AVATAR_STYLE_OPTIONS.map((i) => i.key);
    if (typeof style !== 'string' || !validStyleKeys.includes(style)) {
      res.status(400).json({ success: false, message: 'style 参数不合法' });
      return;
    }
    if (typeof imageUrl !== 'string' || !isValidHttpUrl(imageUrl)) {
      res.status(400).json({ success: false, message: 'imageUrl 参数不合法' });
      return;
    }
    // 表情白名单（与 generate-options 的 EXPRESSION_PROMPTS 口径一致），防脏数据破坏筛选
    const safeExpression =
      typeof expression === 'string' && EXPRESSION_PROMPTS[expression] ? expression : null;

    // 校验宠物归属
    const pet = await petRepository.findByIdAndUser(petId, userId);
    if (!pet) {
      res.status(404).json({ success: false, message: '宠物不存在或无权访问' });
      return;
    }

    const libraryId = uuidv4();
    await avatarLibraryRepository.save({
      id: libraryId,
      petId,
      userId,
      style,
      expression: safeExpression,
      imageUrl,
    });

    res.json({ success: true, data: { id: libraryId } });
  } catch (error) {
    console.error('[Avatar library save] Error:', error);
    res.status(500).json({ success: false, message: '保存形象失败，请稍后重试' });
  }
});

/**
 * GET /api/avatar/library?petId=xx
 * 查询某宠物的形象库（时间倒序，最新在前）
 */
router.get('/library', authMiddleware, async (req: Request, res: Response) => {
  try {
    const petId = typeof req.query.petId === 'string' ? req.query.petId : '';
    const userId = req.userId!;

    if (!petId) {
      res.status(400).json({ success: false, message: 'petId 参数不能为空' });
      return;
    }

    // 校验宠物归属
    const pet = await petRepository.findByIdAndUser(petId, userId);
    if (!pet) {
      res.status(404).json({ success: false, message: '宠物不存在或无权访问' });
      return;
    }

    const items = await avatarLibraryRepository.findByPet(petId, userId);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('[Avatar library list] Error:', error);
    res.status(500).json({ success: false, message: '获取形象库失败' });
  }
});

/**
 * DELETE /api/avatar/library/:id
 * 删除形象库中的一条（仅本人）
 */
router.delete('/library/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.userId!;
    const deleted = await avatarLibraryRepository.delete(id, userId);
    if (!deleted) {
      res.status(404).json({ success: false, message: '形象不存在或无权删除' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[Avatar library delete] Error:', error);
    res.status(500).json({ success: false, message: '删除形象失败' });
  }
});

// 上传宠物参考照片
router.post('/photo/upload', authMiddleware, photoUploadLimiter, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { petId } = req.body;
    const userId = req.userId!;

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: 'petId 参数不能为空' });
      return;
    }

    // 校验宠物归属
    const isOwner = await petRepository.canAccess(petId, userId);
    if (!isOwner) {
      res.status(404).json({ success: false, message: '宠物不存在或无权访问' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: '请上传照片' });
      return;
    }

    const result = await uploadPetPhoto({
      userId,
      petId,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    if (!result.success) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }

    res.json({ success: true, data: { url: result.url } });
  } catch (error) {
    console.error('[Avatar photo/upload] Error:', error);
    res.status(500).json({ success: false, message: '照片上传失败，请稍后重试' });
  }
});

// 生成 2D 形象包
router.post('/generate-2d', authMiddleware, generateLimiter, async (req: Request, res: Response) => {
  try {
    const { petId, referencePhotoUrl, style } = req.body;
    const userId = req.userId!;

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: 'petId 不能为空' });
      return;
    }

    if (!referencePhotoUrl || typeof referencePhotoUrl !== 'string') {
      res.status(400).json({ success: false, message: 'referencePhotoUrl 不能为空' });
      return;
    }

    // URL 合法性校验（防 SSRF）
    if (!isValidHttpUrl(referencePhotoUrl)) {
      res.status(400).json({ success: false, message: '参考照片 URL 不合法' });
      return;
    }

    // URL 归属校验（防止使用他人照片或内网 URL）
    if (!isOwnedPhotoUrl(referencePhotoUrl, userId)) {
      res.status(403).json({ success: false, message: '无权使用该参考照片' });
      return;
    }

    // style 白名单校验
    const safeStyle: AvatarStyle = VALID_STYLES.includes(style) ? style : 'cartoon';

    // 照片生成（参照自家宠物）为会员专享：服务端强制，不能只靠前端隐藏
    const { isMember } = await getUserMembership(userId);
    if (!isMember) {
      res.status(403).json({
        success: false,
        message: '照片生成专属形象仅限会员使用，请先开通会员',
        code: 'MEMBER_ONLY',
      });
      return;
    }

    // 会员每月限次（2D 形象包一次生成 96 张，成本较高）
    const usedCount = await countMonthlyTasks(userId, '2d');
    if (usedCount >= FREE_2D_MONTHLY_LIMIT) {
      res.status(403).json({
        success: false,
        message: `本月 2D 形象包生成次数已用完（${FREE_2D_MONTHLY_LIMIT} 次/月），请下月再试`,
        code: 'QUOTA_EXCEEDED',
      });
      return;
    }

    const pet = await petRepository.findByIdAndUser(petId, userId);

    if (!pet) {
      res.status(404).json({ success: false, message: '宠物不存在或无权访问' });
      return;
    }

    const task = await createTask(userId, petId, '2d', referencePhotoUrl);

    generate2DAvatarPack({
      taskId: task.id,
      species: pet.species,
      breed: pet.breed,
      referencePhotoUrl,
      style: safeStyle,
    }).catch(err => console.error('[2D Generation] Error:', err));

    res.json({
      success: true,
      data: {
        taskId: task.id,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('[Avatar generate-2d] Error:', error);
    res.status(500).json({ success: false, message: '创建 2D 生成任务失败，请稍后重试' });
  }
});

// 查询任务进度
router.get('/task/:taskId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params as { taskId: string };
    const userId = req.userId!;

    const task = await getTask(taskId, userId);
    if (!task) {
      res.status(404).json({ success: false, message: '任务不存在' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('[Avatar task/:taskId] Error:', error);
    res.status(500).json({ success: false, message: '查询任务失败，请稍后重试' });
  }
});

// 生成 3D 模型
router.post('/generate-3d', authMiddleware, generateLimiter, async (req: Request, res: Response) => {
  try {
    const { petId, image2DTaskId } = req.body;
    const userId = req.userId!;

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: 'petId 不能为空' });
      return;
    }

    if (!image2DTaskId || typeof image2DTaskId !== 'string') {
      res.status(400).json({ success: false, message: 'image2DTaskId 不能为空' });
      return;
    }

    // 校验 petId 归属
    const isOwner = await petRepository.canAccess(petId, userId);
    if (!isOwner) {
      res.status(404).json({ success: false, message: '宠物不存在或无权访问' });
      return;
    }

    // 校验 image2DTaskId 归属（防止横向越权）
    const task2D = await getTask(image2DTaskId, userId);
    if (!task2D || task2D.taskType !== '2d') {
      res.status(404).json({ success: false, message: '2D 形象任务不存在或无权访问' });
      return;
    }

    // 校验 2D 任务是否已完成（不能基于未完成/失败的 2D 任务生成 3D）
    if (task2D.status !== 'completed') {
      res.status(400).json({ success: false, message: '2D 形象尚未生成完成，请先等待 2D 任务完成' });
      return;
    }

    // 服务端会员 + 月度配额校验
    const { isMember } = await getUserMembership(userId);
    if (!isMember) {
      res.status(403).json({
        success: false,
        message: '3D 模型生成仅限会员使用，请先开通会员',
        code: 'MEMBER_ONLY',
      });
      return;
    }

    const used3DCount = await countMonthlyTasks(userId, '3d');
    if (used3DCount >= MEMBER_3D_MONTHLY_LIMIT) {
      res.status(403).json({
        success: false,
        message: `本月 3D 生成次数已用完（${MEMBER_3D_MONTHLY_LIMIT} 次/月），请下月再试`,
        code: 'QUOTA_EXCEEDED',
      });
      return;
    }

    const task = await createTask(userId, petId, '3d');

    generate3DModel({
      taskId: task.id,
      image2DTaskId,
    }).catch(err => console.error('[3D Generation] Error:', err));

    res.json({
      success: true,
      data: {
        taskId: task.id,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('[Avatar generate-3d] Error:', error);
    res.status(500).json({ success: false, message: '创建 3D 生成任务失败，请稍后重试' });
  }
});

// 获取 2D 形象列表
router.get('/images/:petId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { petId } = req.params as { petId: string };
    const userId = req.userId!;

    const task = await getLatestTaskByPet(userId, petId, '2d');
    if (!task) {
      res.json({ success: true, data: { images: [], task: null } });
      return;
    }

    const images = await avatar2DImageRepository.findByTaskId(task.id);

    res.json({
      success: true,
      data: {
        task,
        images: images.map((row) => ({
          id: row.id,
          angle: row.angle,
          expression: row.expression,
          imageUrl: row.image_url,
          isSelected: row.is_selected,
          sortOrder: row.sort_order,
        })),
      },
    });
  } catch (error) {
    console.error('[Avatar images/:petId] Error:', error);
    res.status(500).json({ success: false, message: '查询形象失败，请稍后重试' });
  }
});

// 获取 3D 模型
router.get('/model/:petId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { petId } = req.params as { petId: string };
    const userId = req.userId!;

    const task = await getLatestTaskByPet(userId, petId, '3d');
    if (!task) {
      res.json({ success: true, data: { model: null, task: null } });
      return;
    }

    const raw = await avatar3DModelRepository.findLatestByTaskId(task.id);
    const model = raw ? {
      id: raw.id,
      modelUrl: raw.model_url,
      thumbnailUrl: raw.thumbnail_url,
      createdAt: raw.created_at,
    } : null;

    res.json({
      success: true,
      data: {
        task,
        model,
      },
    });
  } catch (error) {
    console.error('[Avatar model/:petId] Error:', error);
    res.status(500).json({ success: false, message: '查询模型失败，请稍后重试' });
  }
});

// 获取用户配额信息
router.get('/quota', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const { isMember } = await getUserMembership(userId);
    const used2D = await countMonthlyTasks(userId, '2d');
    const used3D = await countMonthlyTasks(userId, '3d');

    res.json({
      success: true,
      data: {
        isMember,
        generation2D: {
          used: used2D,
          limit: isMember ? -1 : FREE_2D_MONTHLY_LIMIT,
        },
        generation3D: {
          used: used3D,
          limit: isMember ? MEMBER_3D_MONTHLY_LIMIT : 0,
        },
      },
    });
  } catch (error) {
    console.error('[Avatar quota] Error:', error);
    res.status(500).json({ success: false, message: '查询配额失败，请稍后重试' });
  }
});

export default router;
