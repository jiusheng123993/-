import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { pool } from '../db.js';
import { generatePetImage } from '../services/avatarService.js';
import { uploadPetPhoto } from '../services/photoUploadService.js';
import { createTask, getTask, getLatestTaskByPet } from '../services/taskQueue.js';
import { generate2DAvatarPack } from '../services/image2DService.js';
import { generate3DModel } from '../services/model3DService.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

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

// 免费用户每月可生成的 2D 形象包数量
const FREE_2D_MONTHLY_LIMIT = 1;
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

// 查询用户当月已成功的 2D 任务数
async function countMonthlyTasks(userId: string, taskType: '2d' | '3d'): Promise<number> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM avatar_generation_tasks
     WHERE user_id = $1 AND task_type = $2 AND status = 'completed' AND created_at >= $3`,
    [userId, taskType, monthStart],
  );
  return result.rows[0]?.count ?? 0;
}

// 查询用户会员状态
async function getUserMembership(userId: string): Promise<{ isMember: boolean; status: string }> {
  const result = await pool.query(
    'SELECT tier, status, expires_at FROM memberships WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId],
  );
  if (result.rowCount === 0) return { isMember: false, status: 'none' };
  const row = result.rows[0] as { tier: string; status: string; expires_at: string | null };
  // 过期检查
  if (row.status === 'active' && row.expires_at && new Date(row.expires_at) < new Date()) {
    return { isMember: false, status: 'expired' };
  }
  return { isMember: row.tier !== 'free' && row.status === 'active', status: row.status };
}

router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { petId, style } = req.body;
    const userId = req.userId;

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: 'petId 参数不能为空' });
      return;
    }

    // style 白名单校验
    const safeStyle: AvatarStyle = VALID_STYLES.includes(style) ? style : 'cartoon';

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
      [generationId, userId, petId, `为${pet.breed}生成${safeStyle}风格形象`, safeStyle],
    );

    const result = await generatePetImage({
      petId: pet.id,
      species: pet.species,
      breed: pet.breed,
      gender: pet.gender,
      photoUrl: pet.avatar_photo_url || undefined,
      style: safeStyle,
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
      [result.url, safeStyle, petId],
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
    console.error('[Avatar generate] Error:', error);
    res.status(500).json({ success: false, message: '形象生成失败，请稍后重试' });
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
    const petCheck = await pool.query(
      'SELECT id FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [petId, userId],
    );
    if (petCheck.rowCount === 0) {
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

    // 服务端配额校验：免费用户每月 1 次，会员无限
    const { isMember } = await getUserMembership(userId);
    if (!isMember) {
      const usedCount = await countMonthlyTasks(userId, '2d');
      if (usedCount >= FREE_2D_MONTHLY_LIMIT) {
        res.status(403).json({
          success: false,
          message: '免费用户每月仅可生成 1 次 2D 形象，开通会员可无限生成',
          code: 'QUOTA_EXCEEDED',
        });
        return;
      }
    }

    const petResult = await pool.query(
      'SELECT id, species, breed FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [petId, userId],
    );

    if (petResult.rowCount === 0) {
      res.status(404).json({ success: false, message: '宠物不存在或无权访问' });
      return;
    }

    const pet = petResult.rows[0] as { id: string; species: string; breed: string };

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
    const petResult = await pool.query(
      'SELECT id FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [petId, userId],
    );
    if (petResult.rowCount === 0) {
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

    const result = await pool.query(
      `SELECT id, angle, expression, image_url, is_selected, sort_order
       FROM avatar_2d_images
       WHERE task_id = $1
       ORDER BY sort_order`,
      [task.id],
    );

    const images = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      angle: row.angle,
      expression: row.expression,
      imageUrl: row.image_url,
      isSelected: row.is_selected,
      sortOrder: row.sort_order,
    }));

    res.json({
      success: true,
      data: {
        task,
        images,
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

    const result = await pool.query(
      `SELECT id, model_url, thumbnail_url, created_at
       FROM avatar_3d_models
       WHERE task_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [task.id],
    );

    const raw = result.rows[0] as Record<string, unknown> | null;
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
