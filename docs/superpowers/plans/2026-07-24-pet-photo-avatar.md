# 宠物照片上传生成形象 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现用户拍照/上传宠物照片，AI 生成 12 表情 × 6 角度 + 8 动作 × 3 角度的 2D 形象包，以及基于多视图的 3D 模型生成、预览和下载。

**Architecture:** 分步异步方案。前端新增 PhotoUploader、ImageGallery、Model3DViewer、GenerationProgress 四个组件，改造 avatar-customize 为双 Tab 页。后端新增照片上传、任务队列、2D/3D 生成服务，扩展 avatar 路由。

**Tech Stack:** Taro 3 + React 18 + TypeScript + Zustand + Supabase + Seedream API + Meshy API + three.js

**Source paths:**
- 前端: `e:\星寰海\03-源代码\小程序\miniapp\src\`
- 后端: `e:\星寰海\03-源代码\server\src\`

---

## 模块 1: 后端 - 数据库与配置

### Task 1: 后端配置新增 Meshy API

**Files:**
- Modify: `e:\星寰海\03-源代码\server\src\config.ts`

- [ ] **Step 1: 新增 Meshy 配置项**

在 `config` 对象中新增 `meshy` 配置块：

```ts
meshy: {
  apiKey: process.env.MESHY_API_KEY || '',
  baseUrl: 'https://api.meshy.ai',
},
supabase: {
  url: process.env.SUPABASE_URL || '',
  serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
},
```

修改后的 `config.ts`：

```ts
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/xinghuanhai',
  jwtSecret: process.env.JWT_SECRET || 'change-me-to-a-random-string-at-least-32-chars',
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL || 'https://api.deepseek.com/v1',
    model: process.env.AI_MODEL || 'deepseek-chat',
  },
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },
  seedream: {
    apiKey: process.env.SEEDREAM_API_KEY || '',
  },
  meshy: {
    apiKey: process.env.MESHY_API_KEY || '',
    baseUrl: 'https://api.meshy.ai',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  uploadDir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads'),
};
```

- [ ] **Step 2: 验证**

```bash
cd "e:\星寰海\03-源代码\server" ; npx tsc --noEmit
```

---

### Task 2: 数据库迁移 SQL

**Files:**
- Create: `e:\星寰海\03-源代码\server\migrations\003_avatar_generation_tables.sql`

- [ ] **Step 1: 创建迁移文件**

```sql
-- 003_avatar_generation_tables.sql
-- 宠物形象生成相关表

-- 生成任务表
CREATE TABLE IF NOT EXISTS avatar_generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pet_id UUID NOT NULL,
  task_type VARCHAR(10) NOT NULL CHECK (task_type IN ('2d', '3d')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  reference_photo_url TEXT,
  result_data JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_tasks_user_id ON avatar_generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_tasks_pet_id ON avatar_generation_tasks(pet_id);
CREATE INDEX IF NOT EXISTS idx_avatar_tasks_status ON avatar_generation_tasks(status);

-- 2D 形象图片表
CREATE TABLE IF NOT EXISTS avatar_2d_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES avatar_generation_tasks(id) ON DELETE CASCADE,
  angle VARCHAR(10) NOT NULL,
  expression VARCHAR(20) NOT NULL,
  image_url TEXT NOT NULL,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_2d_task_id ON avatar_2d_images(task_id);

-- 3D 模型表
CREATE TABLE IF NOT EXISTS avatar_3d_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES avatar_generation_tasks(id) ON DELETE CASCADE,
  model_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_3d_task_id ON avatar_3d_models(task_id);
```

- [ ] **Step 2: 执行迁移**

```bash
cd "e:\星寰海\03-源代码\server" ; psql $DATABASE_URL -f migrations/003_avatar_generation_tables.sql
```

---

## 模块 2: 后端 - 照片上传服务

### Task 3: photoUploadService.ts

**Files:**
- Create: `e:\星寰海\03-源代码\server\src\services\photoUploadService.ts`

- [ ] **Step 1: 创建照片上传服务**

```ts
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

const BUCKET_NAME = 'pet-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export interface UploadPhotoParams {
  userId: string;
  petId: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface UploadPhotoResult {
  success: boolean;
  url: string;
  error?: string;
}

export async function uploadPetPhoto(params: UploadPhotoParams): Promise<UploadPhotoResult> {
  if (!ALLOWED_TYPES.includes(params.mimeType)) {
    return { success: false, url: '', error: '不支持的图片格式，请上传 JPG/PNG/WebP 格式' };
  }

  if (params.fileBuffer.length > MAX_FILE_SIZE) {
    return { success: false, url: '', error: '图片大小不能超过 10MB' };
  }

  const ext = params.fileName.split('.').pop() || 'jpg';
  const objectKey = `${params.userId}/${params.petId}/${uuidv4()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(objectKey, params.fileBuffer, {
      contentType: params.mimeType,
      upsert: false,
    });

  if (error) {
    console.error('[PhotoUpload] Upload error:', error.message);
    return { success: false, url: '', error: '照片上传失败，请重试' };
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(objectKey);

  return { success: true, url: urlData.publicUrl };
}
```

- [ ] **Step 2: 验证编译**

```bash
cd "e:\星寰海\03-源代码\server" ; npx tsc --noEmit
```

---

## 模块 3: 后端 - 任务队列服务

### Task 4: taskQueue.ts

**Files:**
- Create: `e:\星寰海\03-源代码\server\src\services\taskQueue.ts`

- [ ] **Step 1: 创建任务队列服务**

```ts
import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export type TaskType = '2d' | '3d';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationTask {
  id: string;
  userId: string;
  petId: string;
  taskType: TaskType;
  status: TaskStatus;
  progress: number;
  referencePhotoUrl: string | null;
  resultData: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createTask(
  userId: string,
  petId: string,
  taskType: TaskType,
  referencePhotoUrl?: string,
): Promise<GenerationTask> {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO avatar_generation_tasks (id, user_id, pet_id, task_type, status, progress, reference_photo_url)
     VALUES ($1, $2, $3, $4, 'pending', 0, $5)
     RETURNING *`,
    [id, userId, petId, taskType, referencePhotoUrl || null],
  );
  return mapTaskRow(result.rows[0]);
}

export async function updateTaskProgress(taskId: string, progress: number): Promise<void> {
  await pool.query(
    `UPDATE avatar_generation_tasks SET progress = $1, updated_at = now() WHERE id = $2`,
    [Math.min(100, Math.max(0, progress)), taskId],
  );
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, error?: string): Promise<void> {
  await pool.query(
    `UPDATE avatar_generation_tasks SET status = $1, error = $2, updated_at = now() WHERE id = $3`,
    [status, error || null, taskId],
  );
}

export async function updateTaskResult(taskId: string, resultData: Record<string, unknown>): Promise<void> {
  await pool.query(
    `UPDATE avatar_generation_tasks SET result_data = $1, updated_at = now() WHERE id = $2`,
    [JSON.stringify(resultData), taskId],
  );
}

export async function getTask(taskId: string, userId: string): Promise<GenerationTask | null> {
  const result = await pool.query(
    `SELECT * FROM avatar_generation_tasks WHERE id = $1 AND user_id = $2`,
    [taskId, userId],
  );
  if (result.rowCount === 0) return null;
  return mapTaskRow(result.rows[0]);
}

export async function getLatestTaskByPet(
  userId: string,
  petId: string,
  taskType: TaskType,
): Promise<GenerationTask | null> {
  const result = await pool.query(
    `SELECT * FROM avatar_generation_tasks
     WHERE user_id = $1 AND pet_id = $2 AND task_type = $3
     ORDER BY created_at DESC LIMIT 1`,
    [userId, petId, taskType],
  );
  if (result.rowCount === 0) return null;
  return mapTaskRow(result.rows[0]);
}

function mapTaskRow(row: Record<string, unknown>): GenerationTask {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    petId: row.pet_id as string,
    taskType: row.task_type as TaskType,
    status: row.status as TaskStatus,
    progress: row.progress as number,
    referencePhotoUrl: row.reference_photo_url as string | null,
    resultData: row.result_data as Record<string, unknown> | null,
    error: row.error as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
```

- [ ] **Step 2: 验证编译**

```bash
cd "e:\星寰海\03-源代码\server" ; npx tsc --noEmit
```

---

## 模块 4: 后端 - 2D 形象生成服务

### Task 5: image2DService.ts

**Files:**
- Create: `e:\星寰海\03-源代码\server\src\services\image2DService.ts`

- [ ] **Step 1: 创建 2D 形象生成服务**

```ts
import { config } from '../config.js';
import { pool } from '../db.js';
import { updateTaskProgress, updateTaskStatus, updateTaskResult } from './taskQueue.js';

const SEEDREAM_API = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

const EXPRESSIONS = [
  { key: 'happy', label: '开心', emoji: '😊' },
  { key: 'sad', label: '难过', emoji: '😢' },
  { key: 'excited', label: '兴奋', emoji: '🤩' },
  { key: 'sleepy', label: '困倦', emoji: '😴' },
  { key: 'love', label: '爱心', emoji: '🥰' },
  { key: 'cool', label: '得意', emoji: '😎' },
  { key: 'angry', label: '生气', emoji: '😤' },
  { key: 'thinking', label: '思考', emoji: '🤔' },
  { key: 'surprised', label: '惊讶', emoji: '😱' },
  { key: 'crying', label: '哭泣', emoji: '😭' },
  { key: 'celebrate', label: '庆祝', emoji: '🥳' },
  { key: 'naughty', label: '调皮', emoji: '😜' },
];

const ANGLES = [
  { key: 'front', label: '正面' },
  { key: 'left', label: '左侧' },
  { key: 'right', label: '右侧' },
  { key: 'back', label: '背面' },
  { key: 'left45', label: '45°左' },
  { key: 'right45', label: '45°右' },
];

const ACTIONS = [
  { key: 'sit', label: '坐着', emoji: '🧘' },
  { key: 'stand', label: '站着', emoji: '🧍' },
  { key: 'lie', label: '趴着', emoji: '🛌' },
  { key: 'jump', label: '跳跃', emoji: '🦘' },
  { key: 'wave', label: '招手', emoji: '🐾' },
  { key: 'eat', label: '吃东西', emoji: '🍖' },
  { key: 'play', label: '玩球', emoji: '🎾' },
  { key: 'sleep', label: '睡觉', emoji: '💤' },
];

const ACTION_ANGLES = ANGLES.slice(0, 3); // 动作只用正面/左侧/右侧

interface Generate2DParams {
  taskId: string;
  species: string;
  breed: string;
  referencePhotoUrl: string;
  style: string;
}

export async function generate2DAvatarPack(params: Generate2DParams): Promise<void> {
  const { taskId, species, breed, referencePhotoUrl, style } = params;
  const apiKey = config.seedream.apiKey;

  if (!apiKey) {
    await updateTaskStatus(taskId, 'failed', 'AI 图像生成服务未配置');
    return;
  }

  await updateTaskStatus(taskId, 'processing');

  const speciesName = species === 'dog' ? '狗' : '猫';
  const styleText = style === 'realistic' ? '写实风格' : '可爱卡通风格';

  try {
    // 第 1 批: 4 核心表情 × 6 角度 = 24 张
    const coreExpressions = EXPRESSIONS.slice(0, 4);
    await generateBatch(taskId, coreExpressions, ANGLES, speciesName, breed, styleText, referencePhotoUrl, apiKey, 0, 25);

    // 第 2 批: 8 扩展表情 × 6 角度 = 48 张
    const extExpressions = EXPRESSIONS.slice(4);
    await generateBatch(taskId, extExpressions, ANGLES, speciesName, breed, styleText, referencePhotoUrl, apiKey, 25, 75);

    // 第 3 批: 8 动作 × 3 角度 = 24 张
    await generateBatch(taskId, ACTIONS, ACTION_ANGLES, speciesName, breed, styleText, referencePhotoUrl, apiKey, 75, 100, true);

    await updateTaskResult(taskId, {
      expressions: EXPRESSIONS,
      angles: ANGLES,
      actions: ACTIONS,
      totalCount: (EXPRESSIONS.length * ANGLES.length) + (ACTIONS.length * ACTION_ANGLES.length),
    });
    await updateTaskStatus(taskId, 'completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : '2D 形象生成失败';
    await updateTaskStatus(taskId, 'failed', message);
  }
}

async function generateBatch(
  taskId: string,
  items: Array<{ key: string; label: string; emoji?: string }>,
  angleList: Array<{ key: string; label: string }>,
  speciesName: string,
  breed: string,
  styleText: string,
  referencePhotoUrl: string,
  apiKey: string,
  progressStart: number,
  progressEnd: number,
  isAction: boolean = false,
): Promise<void> {
  const total = items.length * angleList.length;
  let completed = 0;

  for (const item of items) {
    for (const angle of angleList) {
      const prompt = isAction
        ? `一只${breed}${speciesName}，正在${item.label}，${angle.label}视角，${styleText}，高质量，干净背景，参考照片中的宠物外貌`
        : `一只${breed}${speciesName}，${item.label}的表情，${angle.label}视角，${styleText}，高质量，干净背景，参考照片中的宠物外貌`;

      try {
        const imageUrl = await callSeedream(prompt, referencePhotoUrl, apiKey);
        if (imageUrl) {
          await pool.query(
            `INSERT INTO avatar_2d_images (task_id, angle, expression, image_url, sort_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [taskId, angle.key, item.key, imageUrl, completed],
          );
        }
      } catch {
        // 单张失败跳过，继续生成其他
        console.warn(`[Image2D] Failed to generate: ${item.key} ${angle.key}`);
      }

      completed++;
      const progress = progressStart + Math.floor((completed / total) * (progressEnd - progressStart));
      await updateTaskProgress(taskId, progress);

      // API 速率限制: 每次请求间隔 200ms
      await delay(200);
    }
  }
}

async function callSeedream(prompt: string, referenceImageUrl: string, apiKey: string): Promise<string | null> {
  const response = await fetch(SEEDREAM_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'doubao-seedream-4-0-250828',
      prompt,
      size: '1024x1024',
      n: 1,
      image: referenceImageUrl, // 以图生图参考图
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      // 限流，等待后重试
      await delay(5000);
    }
    return null;
  }

  const data = (await response.json()) as { data: Array<{ url: string }> };
  return data.data?.[0]?.url || null;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { EXPRESSIONS, ANGLES, ACTIONS, ACTION_ANGLES };
```

- [ ] **Step 2: 验证编译**

```bash
cd "e:\星寰海\03-源代码\server" ; npx tsc --noEmit
```

---

## 模块 5: 后端 - 3D 模型生成服务

### Task 6: model3DService.ts

**Files:**
- Create: `e:\星寰海\03-源代码\server\src\services\model3DService.ts`

- [ ] **Step 1: 创建 3D 模型生成服务**

```ts
import { config } from '../config.js';
import { pool } from '../db.js';
import { updateTaskProgress, updateTaskStatus, updateTaskResult } from './taskQueue.js';

const MESHY_API = 'https://api.meshy.ai/openapi/v2/image-to-3d';

interface Generate3DParams {
  taskId: string;
  image2DTaskId: string;
}

export async function generate3DModel(params: Generate3DParams): Promise<void> {
  const { taskId, image2DTaskId } = params;
  const apiKey = config.meshy.apiKey;

  if (!apiKey) {
    await updateTaskStatus(taskId, 'failed', '3D 模型生成服务未配置');
    return;
  }

  await updateTaskStatus(taskId, 'processing');
  await updateTaskProgress(taskId, 10);

  try {
    // 获取 4 张正面表情的 2D 图作为多视图输入
    const imageResult = await pool.query(
      `SELECT DISTINCT ON (expression) image_url, expression
       FROM avatar_2d_images
       WHERE task_id = $1 AND angle = 'front'
       ORDER BY expression, sort_order
       LIMIT 4`,
      [image2DTaskId],
    );

    if (imageResult.rowCount === 0) {
      await updateTaskStatus(taskId, 'failed', '没有可用的 2D 形象图，请先生成 2D 形象');
      return;
    }

    const imageUrls = imageResult.rows.map((r: { image_url: string }) => r.image_url);

    await updateTaskProgress(taskId, 30);

    // 调用 Meshy Image-to-3D API
    const response = await fetch(MESHY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        image_url: imageUrls[0],
        enable_pbr: false,
        topology: 'quad',
        target_polycount: 30000,
      }),
    });

    if (!response.ok) {
      await updateTaskStatus(taskId, 'failed', `Meshy API 请求失败: ${response.status}`);
      return;
    }

    const data = (await response.json()) as { result: string };
    const meshyTaskId = data.result;

    await updateTaskProgress(taskId, 40);

    // 轮询 Meshy 任务状态
    let modelUrl = '';
    for (let i = 0; i < 60; i++) {
      await delay(5000); // 每 5 秒轮询一次

      const statusRes = await fetch(`https://api.meshy.ai/openapi/v2/image-to-3d/${meshyTaskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!statusRes.ok) continue;

      const statusData = (await statusRes.json()) as {
        status: string;
        model_urls?: { glb?: string };
        thumbnail_url?: string;
      };

      const pollProgress = 40 + Math.floor((i / 60) * 50);
      await updateTaskProgress(taskId, Math.min(pollProgress, 90));

      if (statusData.status === 'SUCCEEDED') {
        modelUrl = statusData.model_urls?.glb || '';
        const thumbnailUrl = statusData.thumbnail_url || '';

        await pool.query(
          `INSERT INTO avatar_3d_models (task_id, model_url, thumbnail_url)
           VALUES ($1, $2, $3)`,
          [taskId, modelUrl, thumbnailUrl],
        );

        await updateTaskResult(taskId, { modelUrl, thumbnailUrl });
        await updateTaskProgress(taskId, 100);
        await updateTaskStatus(taskId, 'completed');
        return;
      }

      if (statusData.status === 'FAILED') {
        await updateTaskStatus(taskId, 'failed', '3D 模型生成失败');
        return;
      }
    }

    await updateTaskStatus(taskId, 'failed', '3D 模型生成超时，请稍后重试');
  } catch (error) {
    const message = error instanceof Error ? error.message : '3D 模型生成异常';
    await updateTaskStatus(taskId, 'failed', message);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

- [ ] **Step 2: 验证编译**

```bash
cd "e:\星寰海\03-源代码\server" ; npx tsc --noEmit
```

---

## 模块 6: 后端 - API 路由扩展

### Task 7: 更新 avatar 路由

**Files:**
- Modify: `e:\星寰海\03-源代码\server\src\routes\avatar.ts`

- [ ] **Step 1: 新增照片上传、2D/3D 生成、任务查询路由**

在现有路由文件末尾追加以下路由（在 `export default router;` 之前）：

```ts
import multer from 'multer';
import { uploadPetPhoto } from '../services/photoUploadService.js';
import { createTask, getTask, getLatestTaskByPet } from '../services/taskQueue.js';
import { generate2DAvatarPack } from '../services/image2DService.js';
import { generate3DModel } from '../services/model3DService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// 上传宠物参考照片
router.post('/photo/upload', authMiddleware, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { petId } = req.body;
    const userId = req.userId!;

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: 'petId 参数不能为空' });
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
    const message = error instanceof Error ? error.message : '照片上传失败';
    res.status(500).json({ success: false, message });
  }
});

// 生成 2D 形象包
router.post('/generate-2d', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { petId, referencePhotoUrl, style } = req.body;
    const userId = req.userId!;

    if (!petId || !referencePhotoUrl) {
      res.status(400).json({ success: false, message: 'petId 和 referencePhotoUrl 不能为空' });
      return;
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

    // 异步执行生成，不阻塞响应
    generate2DAvatarPack({
      taskId: task.id,
      species: pet.species,
      breed: pet.breed,
      referencePhotoUrl,
      style: style || 'cartoon',
    }).catch(err => console.error('[2D Generation] Error:', err));

    res.json({
      success: true,
      data: {
        taskId: task.id,
        status: 'pending',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建 2D 生成任务失败';
    res.status(500).json({ success: false, message });
  }
});

// 查询任务进度
router.get('/task/:taskId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId!;

    const task = await getTask(taskId, userId);
    if (!task) {
      res.status(404).json({ success: false, message: '任务不存在' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询任务失败';
    res.status(500).json({ success: false, message });
  }
});

// 生成 3D 模型
router.post('/generate-3d', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { petId, image2DTaskId } = req.body;
    const userId = req.userId!;

    if (!petId || !image2DTaskId) {
      res.status(400).json({ success: false, message: 'petId 和 image2DTaskId 不能为空' });
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
    const message = error instanceof Error ? error.message : '创建 3D 生成任务失败';
    res.status(500).json({ success: false, message });
  }
});

// 获取 2D 形象列表
router.get('/images/:petId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { petId } = req.params;
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

    res.json({
      success: true,
      data: {
        task,
        images: result.rows,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询形象失败';
    res.status(500).json({ success: false, message });
  }
});

// 获取 3D 模型
router.get('/model/:petId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { petId } = req.params;
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

    res.json({
      success: true,
      data: {
        task,
        model: result.rows[0] || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询模型失败';
    res.status(500).json({ success: false, message });
  }
});
```

- [ ] **Step 2: 验证编译**

```bash
cd "e:\星寰海\03-源代码\server" ; npx tsc --noEmit
```

---

## 模块 7: 前端 - 类型与常量

### Task 8: 更新 avatarTypes.ts

**Files:**
- Modify: `e:\星寰海\03-源代码\小程序\miniapp\src\types\avatarTypes.ts`

- [ ] **Step 1: 新增类型定义**

在文件末尾追加：

```ts
// 2D 形象生成相关类型
export type AvatarAngle = 'front' | 'left' | 'right' | 'back' | 'left45' | 'right45'

export type AvatarExpression =
  | 'happy' | 'sad' | 'excited' | 'sleepy'
  | 'love' | 'cool' | 'angry' | 'thinking'
  | 'surprised' | 'crying' | 'celebrate' | 'naughty'

export type AvatarAction =
  | 'sit' | 'stand' | 'lie' | 'jump'
  | 'wave' | 'eat' | 'play' | 'sleep'

export interface ExpressionOption {
  key: AvatarExpression
  label: string
  emoji: string
}

export interface AngleOption {
  key: AvatarAngle
  label: string
}

export interface ActionOption {
  key: AvatarAction
  label: string
  emoji: string
}

export interface Avatar2DImage {
  id: string
  angle: AvatarAngle
  expression: string
  imageUrl: string
  isSelected: boolean
  sortOrder: number
}

export interface Avatar2DPack {
  task: GenerationTask | null
  images: Avatar2DImage[]
}

export interface Avatar3DModel {
  id: string
  modelUrl: string
  thumbnailUrl: string | null
  createdAt: string
}

export interface Avatar3DResult {
  task: GenerationTask | null
  model: Avatar3DModel | null
}

export type TaskType = '2d' | '3d'
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface GenerationTask {
  id: string
  userId: string
  petId: string
  taskType: TaskType
  status: TaskStatus
  progress: number
  referencePhotoUrl: string | null
  resultData: Record<string, unknown> | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface UploadPhotoResult {
  success: boolean
  data?: { url: string }
  message?: string
}

export interface Generate2DResult {
  success: boolean
  data?: { taskId: string; status: string }
  message?: string
}

export interface Generate3DResult {
  success: boolean
  data?: { taskId: string; status: string }
  message?: string
}
```

---

### Task 9: 更新常量文件

**Files:**
- Modify: `e:\星寰海\03-源代码\小程序\miniapp\src\constants\index.ts`

- [ ] **Step 1: 新增表情、角度、动作常量**

在文件末尾追加：

```ts
export const AVATAR_EXPRESSIONS = [
  { key: 'happy', label: '开心', emoji: '😊' },
  { key: 'sad', label: '难过', emoji: '😢' },
  { key: 'excited', label: '兴奋', emoji: '🤩' },
  { key: 'sleepy', label: '困倦', emoji: '😴' },
  { key: 'love', label: '爱心', emoji: '🥰' },
  { key: 'cool', label: '得意', emoji: '😎' },
  { key: 'angry', label: '生气', emoji: '😤' },
  { key: 'thinking', label: '思考', emoji: '🤔' },
  { key: 'surprised', label: '惊讶', emoji: '😱' },
  { key: 'crying', label: '哭泣', emoji: '😭' },
  { key: 'celebrate', label: '庆祝', emoji: '🥳' },
  { key: 'naughty', label: '调皮', emoji: '😜' },
] as const;

export const AVATAR_ACTIONS = [
  { key: 'sit', label: '坐着', emoji: '🧘' },
  { key: 'stand', label: '站着', emoji: '🧍' },
  { key: 'lie', label: '趴着', emoji: '🛌' },
  { key: 'jump', label: '跳跃', emoji: '🦘' },
  { key: 'wave', label: '招手', emoji: '🐾' },
  { key: 'eat', label: '吃东西', emoji: '🍖' },
  { key: 'play', label: '玩球', emoji: '🎾' },
  { key: 'sleep', label: '睡觉', emoji: '💤' },
] as const;

export const AVATAR_ANGLES = [
  { key: 'front', label: '正面' },
  { key: 'left', label: '左侧' },
  { key: 'right', label: '右侧' },
  { key: 'back', label: '背面' },
  { key: 'left45', label: '45°左' },
  { key: 'right45', label: '45°右' },
] as const;

export const AVATAR_PHOTO_FREE_COUNT = 1;
export const AVATAR_3D_MONTHLY_LIMIT = 3;

export const STORAGE_KEYS = {
  AVATAR_2D_TASK_ID: 'xhh_avatar_2d_task_id',
  AVATAR_3D_TASK_ID: 'xhh_avatar_3d_task_id',
  AVATAR_PHOTO_COUNT: 'xhh_avatar_photo_count',
  AVATAR_3D_COUNT: 'xhh_avatar_3d_count',
  AVATAR_3D_COUNT_DATE: 'xhh_avatar_3d_count_date',
} as const;
```

---

## 模块 8: 前端 - PhotoUploader 组件

### Task 10: PhotoUploader.tsx

**Files:**
- Create: `e:\星寰海\03-源代码\小程序\miniapp\src\components\PetAvatar\PhotoUploader.tsx`

- [ ] **Step 1: 创建照片上传组件**

```tsx
import { View, Text, Image } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro from '@tarojs/taro'

interface PhotoUploaderProps {
  value: string | null
  onChange: (url: string) => void
  disabled?: boolean
}

export default function PhotoUploader({ value, onChange, disabled = false }: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleChooseImage = useCallback(async () => {
    if (disabled || isUploading) return

    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      if (!res.tempFilePaths.length) return

      setIsUploading(true)
      onChange(res.tempFilePaths[0])
    } catch (err) {
      if ((err as { errMsg?: string }).errMsg?.includes('cancel')) {
        return
      }
      Taro.showToast({ title: '选择照片失败', icon: 'none' })
    } finally {
      setIsUploading(false)
    }
  }, [disabled, isUploading, onChange])

  const handleRemove = useCallback(() => {
    onChange('')
  }, [onChange])

  if (value) {
    return (
      <View className='photo-uploader photo-uploader--has-image'>
        <Image
          className='photo-uploader__preview'
          src={value}
          mode='aspectFill'
        />
        <View className='photo-uploader__actions'>
          <View className='photo-uploader__btn' onClick={handleChooseImage}>
            <Text className='photo-uploader__btn-text'>重新选择</Text>
          </View>
          <View className='photo-uploader__btn photo-uploader__btn--remove' onClick={handleRemove}>
            <Text className='photo-uploader__btn-text'>删除</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className='photo-uploader photo-uploader--empty' onClick={handleChooseImage}>
      <View className='photo-uploader__placeholder'>
        <Text className='photo-uploader__icon'>📷</Text>
        <Text className='photo-uploader__label'>点击上传宠物照片</Text>
        <Text className='photo-uploader__hint'>支持拍照或从相册选择</Text>
      </View>
    </View>
  )
}
```

---

## 模块 9: 前端 - GenerationProgress 组件

### Task 11: GenerationProgress.tsx

**Files:**
- Create: `e:\星寰海\03-源代码\小程序\miniapp\src\components\PetAvatar\GenerationProgress.tsx`

- [ ] **Step 1: 创建生成进度组件**

```tsx
import { View, Text } from '@tarojs/components'

interface GenerationProgressProps {
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  type: '2d' | '3d'
  error?: string | null
}

export default function GenerationProgress({ progress, status, type, error }: GenerationProgressProps) {
  const label = type === '2d' ? '2D 形象' : '3D 模型'

  if (status === 'failed') {
    return (
      <View className='generation-progress generation-progress--failed'>
        <Text className='generation-progress__icon'>❌</Text>
        <Text className='generation-progress__text'>{error || `${label}生成失败`}</Text>
      </View>
    )
  }

  if (status === 'completed') {
    return (
      <View className='generation-progress generation-progress--completed'>
        <Text className='generation-progress__icon'>✅</Text>
        <Text className='generation-progress__text'>{label}生成完成</Text>
      </View>
    )
  }

  return (
    <View className='generation-progress'>
      <View className='generation-progress__header'>
        <Text className='generation-progress__label'>正在生成{label}...</Text>
        <Text className='generation-progress__percent'>{progress}%</Text>
      </View>
      <View className='generation-progress__bar'>
        <View
          className='generation-progress__fill'
          style={{ width: `${progress}%` }}
        />
      </View>
      <Text className='generation-progress__hint'>
        {type === '2d' ? '正在绘制多角度形象，请耐心等待' : '正在构建 3D 模型，可能需要 2-5 分钟'}
      </Text>
    </View>
  )
}
```

---

## 模块 10: 前端 - ImageGallery 组件

### Task 12: ImageGallery.tsx

**Files:**
- Create: `e:\星寰海\03-源代码\小程序\miniapp\src\components\PetAvatar\ImageGallery.tsx`

- [ ] **Step 1: 创建 2D 形象画廊组件**

```tsx
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useMemo } from 'react'
import { AVATAR_EXPRESSIONS, AVATAR_ANGLES, AVATAR_ACTIONS } from '../../constants'
import type { Avatar2DImage } from '../../types/avatarTypes'

interface ImageGalleryProps {
  images: Avatar2DImage[]
  onSaveAsAvatar?: (image: Avatar2DImage) => void
  onGenerate3D?: () => void
  isGenerating3D?: boolean
}

type TabType = 'expression' | 'action'

export default function ImageGallery({ images, onSaveAsAvatar, onGenerate3D, isGenerating3D }: ImageGalleryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('expression')
  const [selectedAngle, setSelectedAngle] = useState(AVATAR_ANGLES[0].key)
  const [selectedKey, setSelectedKey] = useState(AVATAR_EXPRESSIONS[0].key)

  const currentItems = useMemo(() => {
    return activeTab === 'expression' ? AVATAR_EXPRESSIONS : AVATAR_ACTIONS
  }, [activeTab])

  const currentImage = useMemo(() => {
    return images.find(
      img => img.angle === selectedAngle && img.expression === selectedKey,
    )
  }, [images, selectedAngle, selectedKey])

  const handleSelectKey = (key: string) => {
    setSelectedKey(key)
  }

  const handleSelectAngle = (key: string) => {
    setSelectedAngle(key)
  }

  return (
    <View className='image-gallery'>
      {/* 角度选择器 */}
      <View className='image-gallery__angles'>
        <ScrollView scrollX className='image-gallery__angles-scroll'>
          {AVATAR_ANGLES.map(angle => (
            <View
              key={angle.key}
              className={`image-gallery__angle-item ${selectedAngle === angle.key ? 'image-gallery__angle-item--active' : ''}`}
              onClick={() => handleSelectAngle(angle.key)}
            >
              <Text className='image-gallery__angle-label'>{angle.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 预览区 */}
      <View className='image-gallery__preview'>
        {currentImage ? (
          <Image
            className='image-gallery__preview-img'
            src={currentImage.imageUrl}
            mode='aspectFit'
          />
        ) : (
          <View className='image-gallery__preview-empty'>
            <Text className='image-gallery__preview-empty-text'>暂无形象图</Text>
          </View>
        )}
      </View>

      {/* 标签切换 */}
      <View className='image-gallery__tabs'>
        <View
          className={`image-gallery__tab ${activeTab === 'expression' ? 'image-gallery__tab--active' : ''}`}
          onClick={() => { setActiveTab('expression'); setSelectedKey(AVATAR_EXPRESSIONS[0].key) }}
        >
          <Text className='image-gallery__tab-text'>表情</Text>
        </View>
        <View
          className={`image-gallery__tab ${activeTab === 'action' ? 'image-gallery__tab--active' : ''}`}
          onClick={() => { setActiveTab('action'); setSelectedKey(AVATAR_ACTIONS[0].key) }}
        >
          <Text className='image-gallery__tab-text'>动作</Text>
        </View>
      </View>

      {/* 表情/动作选择器 */}
      <View className='image-gallery__selector'>
        <ScrollView scrollX className='image-gallery__selector-scroll'>
          {currentItems.map(item => (
            <View
              key={item.key}
              className={`image-gallery__selector-item ${selectedKey === item.key ? 'image-gallery__selector-item--active' : ''}`}
              onClick={() => handleSelectKey(item.key)}
            >
              <Text className='image-gallery__selector-emoji'>{item.emoji}</Text>
              <Text className='image-gallery__selector-label'>{item.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 操作按钮 */}
      {currentImage && (
        <View className='image-gallery__actions'>
          <View className='image-gallery__btn' onClick={() => onSaveAsAvatar?.(currentImage)}>
            <Text className='image-gallery__btn-text'>保存为头像</Text>
          </View>
          <View
            className={`image-gallery__btn image-gallery__btn--3d ${isGenerating3D ? 'image-gallery__btn--disabled' : ''}`}
            onClick={onGenerate3D}
          >
            <Text className='image-gallery__btn-text'>
              {isGenerating3D ? '生成中...' : '生成 3D 模型'}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
```

---

## 模块 11: 前端 - Model3DViewer 组件

### Task 13: Model3DViewer.tsx

**Files:**
- Create: `e:\星寰海\03-源代码\小程序\miniapp\src\components\PetAvatar\Model3DViewer.tsx`

- [ ] **Step 1: 创建 3D 模型预览组件**

由于微信小程序对 three.js 的支持需要 canvas 适配，此处使用简化方案：先显示缩略图 + 下载按钮，3D 交互预览通过 webview 或后续版本迭代。

```tsx
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'

interface Model3DViewerProps {
  modelUrl: string
  thumbnailUrl?: string | null
}

export default function Model3DViewer({ modelUrl, thumbnailUrl }: Model3DViewerProps) {
  const handleDownload = async () => {
    try {
      Taro.showLoading({ title: '下载中...' })
      const res = await Taro.downloadFile({
        url: modelUrl,
      })

      if (res.statusCode === 200) {
        await Taro.saveFile({
          tempFilePath: res.tempFilePath,
        })
        Taro.hideLoading()
        Taro.showToast({ title: '模型已保存', icon: 'success' })
      } else {
        Taro.hideLoading()
        Taro.showToast({ title: '下载失败', icon: 'none' })
      }
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '下载失败，请稍后重试', icon: 'none' })
    }
  }

  const handlePreview = () => {
    if (thumbnailUrl) {
      Taro.previewImage({
        urls: [thumbnailUrl],
        current: thumbnailUrl,
      })
    }
  }

  return (
    <View className='model-3d-viewer'>
      <View className='model-3d-viewer__preview' onClick={handlePreview}>
        {thumbnailUrl ? (
          <Image
            className='model-3d-viewer__thumbnail'
            src={thumbnailUrl}
            mode='aspectFit'
          />
        ) : (
          <View className='model-3d-viewer__placeholder'>
            <Text className='model-3d-viewer__placeholder-icon'>🧊</Text>
            <Text className='model-3d-viewer__placeholder-text'>3D 模型已生成</Text>
            <Text className='model-3d-viewer__placeholder-hint'>点击查看大图</Text>
          </View>
        )}
      </View>
      <View className='model-3d-viewer__actions'>
        <Button className='model-3d-viewer__btn' onClick={handleDownload}>
          下载 .glb 模型
        </Button>
      </View>
    </View>
  )
}
```

---

## 模块 12: 前端 - 服务与状态更新

### Task 14: 更新 avatarService.ts

**Files:**
- Modify: `e:\星寰海\03-源代码\小程序\miniapp\src\services\avatarService.ts`

- [ ] **Step 1: 新增照片上传、2D/3D 生成、任务查询接口**

在文件末尾追加：

```ts
import type {
  UploadPhotoResult,
  Generate2DResult,
  Generate3DResult,
  GenerationTask,
  Avatar2DPack,
  Avatar3DResult,
} from '../types/avatarTypes'

export async function uploadPetPhoto(
  petId: string,
  tempFilePath: string,
): Promise<UploadPhotoResult> {
  try {
    const token = Taro.getStorageSync('xhh_token')
    const res = await Taro.uploadFile({
      url: `${CONFIG.API_BASE_URL}/api/pet/photo/upload`,
      filePath: tempFilePath,
      name: 'photo',
      formData: { petId },
      header: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    const data = JSON.parse(res.data) as UploadPhotoResult
    return data
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : '上传失败' }
  }
}

export async function generate2DAvatar(
  petId: string,
  referencePhotoUrl: string,
  style: string,
): Promise<Generate2DResult> {
  const token = Taro.getStorageSync('xhh_token')
  const res = await Taro.request({
    url: `${CONFIG.API_BASE_URL}/api/pet/avatar/generate-2d`,
    method: 'POST',
    data: { petId, referencePhotoUrl, style },
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  return res.data as Generate2DResult
}

export async function getTaskProgress(taskId: string): Promise<GenerationTask | null> {
  const token = Taro.getStorageSync('xhh_token')
  const res = await Taro.request({
    url: `${CONFIG.API_BASE_URL}/api/pet/avatar/task/${taskId}`,
    method: 'GET',
    header: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = res.data as { success: boolean; data: GenerationTask }
  return data.success ? data.data : null
}

export async function generate3DAvatar(
  petId: string,
  image2DTaskId: string,
): Promise<Generate3DResult> {
  const token = Taro.getStorageSync('xhh_token')
  const res = await Taro.request({
    url: `${CONFIG.API_BASE_URL}/api/pet/avatar/generate-3d`,
    method: 'POST',
    data: { petId, image2DTaskId },
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  return res.data as Generate3DResult
}

export async function getAvatar2DImages(petId: string): Promise<Avatar2DPack> {
  const token = Taro.getStorageSync('xhh_token')
  const res = await Taro.request({
    url: `${CONFIG.API_BASE_URL}/api/pet/avatar/images/${petId}`,
    method: 'GET',
    header: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = res.data as { success: boolean; data: Avatar2DPack }
  return data.success ? data.data : { task: null, images: [] }
}

export async function getAvatar3DModel(petId: string): Promise<Avatar3DResult> {
  const token = Taro.getStorageSync('xhh_token')
  const res = await Taro.request({
    url: `${CONFIG.API_BASE_URL}/api/pet/avatar/model/${petId}`,
    method: 'GET',
    header: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = res.data as { success: boolean; data: Avatar3DResult }
  return data.success ? data.data : { task: null, model: null }
}

export function getPhotoGenerationCount(): number {
  const count = Taro.getStorageSync('xhh_avatar_photo_count')
  return typeof count === 'number' ? count : 0
}

export function canGeneratePhoto(isMember: boolean): boolean {
  if (isMember) return true
  return getPhotoGenerationCount() < AVATAR_PHOTO_FREE_COUNT
}

export function incrementPhotoGenerationCount(): void {
  const count = getPhotoGenerationCount()
  Taro.setStorageSync('xhh_avatar_photo_count', count + 1)
}

export function get3DGenerationCount(): number {
  const dateKey = Taro.getStorageSync('xhh_avatar_3d_count_date')
  const today = new Date().toISOString().slice(0, 7) // YYYY-MM
  if (dateKey !== today) {
    Taro.setStorageSync('xhh_avatar_3d_count', 0)
    Taro.setStorageSync('xhh_avatar_3d_count_date', today)
    return 0
  }
  const count = Taro.getStorageSync('xhh_avatar_3d_count')
  return typeof count === 'number' ? count : 0
}

export function canGenerate3D(isMember: boolean): boolean {
  if (!isMember) return false
  return get3DGenerationCount() < AVATAR_3D_MONTHLY_LIMIT
}

export function increment3DGenerationCount(): void {
  const count = get3DGenerationCount()
  Taro.setStorageSync('xhh_avatar_3d_count', count + 1)
}
```

注意：需要在文件顶部添加 `CONFIG` 的导入（如已存在则跳过）和新增常量导入：

```ts
import { CONFIG } from '../config'
import { AVATAR_PHOTO_FREE_COUNT, AVATAR_3D_MONTHLY_LIMIT } from '../constants'
```

---

### Task 15: 更新 petStore.ts

**Files:**
- Modify: `e:\星寰海\03-源代码\小程序\miniapp\src\stores\petStore.ts`

- [ ] **Step 1: 新增形象生成相关状态**

在 `PetState` 接口中新增字段：

```ts
interface PetState {
  // ... existing fields ...
  avatar2DTaskId: string | null
  avatar3DTaskId: string | null
  setAvatar2DTaskId: (taskId: string | null) => void
  setAvatar3DTaskId: (taskId: string | null) => void
}
```

在 `create` 回调中新增：

```ts
avatar2DTaskId: null,
avatar3DTaskId: null,

setAvatar2DTaskId: (taskId) => {
  set({ avatar2DTaskId: taskId })
  if (taskId) {
    Taro.setStorageSync('xhh_avatar_2d_task_id', taskId)
  } else {
    Taro.removeStorageSync('xhh_avatar_2d_task_id')
  }
},

setAvatar3DTaskId: (taskId) => {
  set({ avatar3DTaskId: taskId })
  if (taskId) {
    Taro.setStorageSync('xhh_avatar_3d_task_id', taskId)
  } else {
    Taro.removeStorageSync('xhh_avatar_3d_task_id')
  }
},
```

---

## 模块 13: 前端 - 页面改造

### Task 16: 改造 avatar-customize 页面

**Files:**
- Modify: `e:\星寰海\03-源代码\小程序\miniapp\src\pagesPet\avatar-customize\index.tsx`
- Modify: `e:\星寰海\03-源代码\小程序\miniapp\src\pagesPet\avatar-customize\index.scss`

- [ ] **Step 1: 重构为双 Tab 结构**

完整重写页面组件：

```tsx
import { View, Text, Image } from '@tarojs/components'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { safeNavigateBack } from '../../utils/navigation'
import PetAvatar from '../../components/PetAvatar'
import PhotoUploader from '../../components/PetAvatar/PhotoUploader'
import ImageGallery from '../../components/PetAvatar/ImageGallery'
import Model3DViewer from '../../components/PetAvatar/Model3DViewer'
import GenerationProgress from '../../components/PetAvatar/GenerationProgress'
import {
  generateAvatarImage,
  getAvatarCustomization,
  saveAvatarCustomization,
  canGenerateAvatar,
  getGenerationCount,
  uploadPetPhoto,
  generate2DAvatar,
  getTaskProgress,
  generate3DAvatar,
  getAvatar2DImages,
  getAvatar3DModel,
  canGeneratePhoto,
  getPhotoGenerationCount,
  canGenerate3D,
  get3DGenerationCount,
  incrementPhotoGenerationCount,
  increment3DGenerationCount,
} from '../../services/avatarService'
import { usePetStore } from '../../stores/petStore'
import { useMembership } from '../../hooks/useMembership'
import { useAnalytics } from '../../hooks/useAnalytics'
import type { ExpressionContext, PetSpecies, Avatar2DImage, Avatar2DPack, Avatar3DResult } from '../../types/avatarTypes'
import { api } from '../../services/api'
import './index.scss'

const STYLE_OPTIONS: Array<{ value: 'cartoon' | 'realistic'; label: string; desc: string }> = [
  { value: 'cartoon', label: '卡通风格', desc: '可爱萌趣' },
  { value: 'realistic', label: '写实风格', desc: '真实细腻' },
]

const BASE_COLORS = [
  { value: '#FFD93D', label: '暖阳金' },
  { value: '#FF8C42', label: '活力橙' },
  { value: '#6BCB77', label: '清新绿' },
  { value: '#4D96FF', label: '天空蓝' },
  { value: '#FF6B6B', label: '甜蜜粉' },
  { value: '#9B8EC4', label: '梦幻紫' },
  { value: '#FFF8E7', label: '奶白色' },
  { value: '#2C3E50', label: '酷黑色' },
]

type TabType = 'text' | 'photo'

export default function AvatarCustomizePage() {
  const { currentPet } = usePetStore()
  const { isMember } = useMembership()
  const { trackPageView, trackEvent } = useAnalytics()

  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabType>('text')

  // 文字描述生成状态（现有功能）
  const [selectedStyle, setSelectedStyle] = useState<'cartoon' | 'realistic'>('cartoon')
  const [selectedColor, setSelectedColor] = useState('#FFD93D')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [genCount, setGenCount] = useState(getGenerationCount())

  // 照片生成状态（新增）
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [photoStyle, setPhotoStyle] = useState<'cartoon' | 'realistic'>('cartoon')
  const [photoColor, setPhotoColor] = useState('#FFD93D')

  // 2D 生成任务状态
  const [task2DId, setTask2DId] = useState<string | null>(null)
  const [task2DProgress, setTask2DProgress] = useState(0)
  const [task2DStatus, setTask2DStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')
  const [task2DError, setTask2DError] = useState<string | null>(null)
  const [avatar2DPack, setAvatar2DPack] = useState<Avatar2DPack>({ task: null, images: [] })

  // 3D 生成任务状态
  const [task3DId, setTask3DId] = useState<string | null>(null)
  const [task3DProgress, setTask3DProgress] = useState(0)
  const [task3DStatus, setTask3DStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')
  const [task3DError, setTask3DError] = useState<string | null>(null)
  const [avatar3DResult, setAvatar3DResult] = useState<Avatar3DResult>({ task: null, model: null })
  const [isGenerating3D, setIsGenerating3D] = useState(false)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const species = (currentPet?.species || 'dog') as PetSpecies
  const petName = currentPet?.name || '毛孩子'
  const petId = currentPet?.id || ''

  useEffect(() => {
    trackPageView('avatar_customize')
  }, [trackPageView])

  const expressionContext = useMemo((): ExpressionContext => ({
    todayEntry: null,
    hasAnomaly: false,
    anomalyCount: 0,
    riskLevel: null,
    streakDays: 0,
    isBirthday: false,
    isVaccineComplete: false,
    isRecovery: false,
    isDeceased: false,
  }), [])

  const canGenerate = useMemo(() => canGenerateAvatar(isMember), [isMember, genCount])
  const canGenPhoto = useMemo(() => canGeneratePhoto(isMember), [isMember])

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // 2D 任务轮询
  const start2DPolling = useCallback((taskId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      const task = await getTaskProgress(taskId)
      if (!task) {
        clearInterval(pollingRef.current!)
        return
      }

      setTask2DProgress(task.progress)
      setTask2DStatus(task.status)

      if (task.status === 'completed') {
        clearInterval(pollingRef.current!)
        const pack = await getAvatar2DImages(petId)
        setAvatar2DPack(pack)
        Taro.showToast({ title: '2D 形象生成完成', icon: 'success' })
      } else if (task.status === 'failed') {
        clearInterval(pollingRef.current!)
        setTask2DError(task.error)
      }
    }, 2000)
  }, [petId])

  // 3D 任务轮询
  const start3DPolling = useCallback((taskId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      const task = await getTaskProgress(taskId)
      if (!task) {
        clearInterval(pollingRef.current!)
        return
      }

      setTask3DProgress(task.progress)
      setTask3DStatus(task.status)

      if (task.status === 'completed') {
        clearInterval(pollingRef.current!)
        const result = await getAvatar3DModel(petId)
        setAvatar3DResult(result)
        setIsGenerating3D(false)
        Taro.showToast({ title: '3D 模型生成完成', icon: 'success' })
      } else if (task.status === 'failed') {
        clearInterval(pollingRef.current!)
        setTask3DError(task.error)
        setIsGenerating3D(false)
      }
    }, 3000)
  }, [petId])

  // 上传照片
  const handlePhotoChange = useCallback(async (path: string) => {
    setPhotoUrl(path)
    if (!path) {
      setUploadedPhotoUrl(null)
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadPetPhoto(petId, path)
      if (result.success && result.data?.url) {
        setUploadedPhotoUrl(result.data.url)
      } else {
        Taro.showToast({ title: result.message || '上传失败', icon: 'none' })
        setPhotoUrl(null)
      }
    } catch {
      Taro.showToast({ title: '上传失败，请重试', icon: 'none' })
      setPhotoUrl(null)
    } finally {
      setIsUploading(false)
    }
  }, [petId])

  // 生成 2D 形象包
  const handleGenerate2D = useCallback(async () => {
    if (!uploadedPhotoUrl || !canGenPhoto) return

    trackEvent('generate_2d_avatar_photo', { style: photoStyle })
    try {
      const result = await generate2DAvatar(petId, uploadedPhotoUrl, photoStyle)
      if (result.success && result.data?.taskId) {
        setTask2DId(result.data.taskId)
        setTask2DStatus('pending')
        setTask2DProgress(0)
        incrementPhotoGenerationCount()
        start2DPolling(result.data.taskId)
      } else {
        Taro.showToast({ title: result.message || '创建生成任务失败', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    }
  }, [uploadedPhotoUrl, canGenPhoto, petId, photoStyle, trackEvent, start2DPolling])

  // 生成 3D 模型
  const handleGenerate3D = useCallback(async () => {
    if (!task2DId || !canGenerate3D(isMember) || isGenerating3D) return

    trackEvent('generate_3d_model')
    setIsGenerating3D(true)
    try {
      const result = await generate3DAvatar(petId, task2DId)
      if (result.success && result.data?.taskId) {
        setTask3DId(result.data.taskId)
        setTask3DStatus('pending')
        setTask3DProgress(0)
        increment3DGenerationCount()
        start3DPolling(result.data.taskId)
      } else {
        Taro.showToast({ title: result.message || '创建 3D 任务失败', icon: 'none' })
        setIsGenerating3D(false)
      }
    } catch {
      Taro.showToast({ title: '3D 生成失败，请重试', icon: 'none' })
      setIsGenerating3D(false)
    }
  }, [task2DId, isMember, isGenerating3D, petId, trackEvent, start3DPolling])

  // 保存为头像
  const handleSaveAsAvatar = useCallback(async (image: Avatar2DImage) => {
    trackEvent('save_photo_avatar')
    try {
      await saveAvatarCustomization({
        species,
        style: photoStyle,
        baseColor: photoColor,
        generatedAt: new Date().toISOString(),
        cartoonUrl: image.imageUrl,
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => safeNavigateBack(), 1500)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [species, photoStyle, photoColor, trackEvent])

  // 文字描述生成（现有逻辑）
  const handleTextGenerate = useCallback(async () => {
    if (!canGenerate || isGenerating) return
    trackEvent('generate_avatar', { style: selectedStyle, species })
    setIsGenerating(true)
    try {
      const result = await generateAvatarImage(species, petName, selectedStyle, undefined, selectedColor)
      if (result?.success && result.imageUrl) {
        setGeneratedUrl(result.imageUrl)
        setGenCount(getGenerationCount())
        trackEvent('generate_avatar_success', { style: selectedStyle })
        Taro.showToast({ title: '生成成功', icon: 'success' })
      } else if (!canGenerateAvatar(isMember)) {
        Taro.showModal({
          title: '生成次数已用完',
          content: '免费用户仅可生成1次，开通会员可无限生成',
          confirmText: '开通会员',
          success: (res) => {
            if (res.confirm) Taro.switchTab({ url: '/pages/member/index' })
          },
        })
      } else {
        Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
      }
    } catch {
      trackEvent('generate_avatar_failure')
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setIsGenerating(false)
    }
  }, [canGenerate, isGenerating, species, petName, selectedStyle, selectedColor, isMember, trackEvent])

  const handleTextSave = useCallback(async () => {
    if (!generatedUrl) return
    trackEvent('save_avatar')
    try {
      await saveAvatarCustomization({
        species,
        style: selectedStyle,
        baseColor: selectedColor,
        generatedAt: new Date().toISOString(),
        cartoonUrl: generatedUrl,
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => safeNavigateBack(), 1500)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [generatedUrl, species, selectedStyle, selectedColor, trackEvent])

  const existingCustom = useMemo(() => getAvatarCustomization(), [])

  const is2DProcessing = task2DStatus === 'pending' || task2DStatus === 'processing'
  const is2DComplete = task2DStatus === 'completed'
  const is3DProcessing = task3DStatus === 'pending' || task3DStatus === 'processing'
  const is3DComplete = task3DStatus === 'completed'

  return (
    <View className='avatar-customize'>
      {/* Tab 切换 */}
      <View className='avatar-customize__tabs'>
        <View
          className={`avatar-customize__tab ${activeTab === 'text' ? 'avatar-customize__tab--active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          <Text className='avatar-customize__tab-text'>文字描述生成</Text>
        </View>
        <View
          className={`avatar-customize__tab ${activeTab === 'photo' ? 'avatar-customize__tab--active' : ''}`}
          onClick={() => setActiveTab('photo')}
        >
          <Text className='avatar-customize__tab-text'>照片生成</Text>
        </View>
      </View>

      {/* Tab 1: 文字描述生成（现有功能） */}
      {activeTab === 'text' && (
        <>
          <View className='avatar-customize__preview'>
            {isGenerating ? (
              <View className='avatar-customize__generating'>
                <View className='avatar-customize__generating-spinner' />
                <Text className='avatar-customize__generating-text'>AI 正在为你生成专属形象...</Text>
              </View>
            ) : generatedUrl ? (
              <Image className='avatar-customize__generated-img' src={generatedUrl} mode='aspectFit' />
            ) : (
              <PetAvatar species={species} petName={petName} expressionContext={expressionContext} size={160} showLabel />
            )}
          </View>

          <View className='avatar-customize__section'>
            <Text className='avatar-customize__section-title'>风格选择</Text>
            <View className='avatar-customize__style-options'>
              {STYLE_OPTIONS.map(opt => (
                <View
                  key={opt.value}
                  className={`avatar-customize__style-item ${selectedStyle === opt.value ? 'avatar-customize__style-item--active' : ''}`}
                  onClick={() => setSelectedStyle(opt.value)}
                >
                  <Text className='avatar-customize__style-label'>{opt.label}</Text>
                  <Text className='avatar-customize__style-desc'>{opt.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='avatar-customize__section'>
            <Text className='avatar-customize__section-title'>基础配色</Text>
            <View className='avatar-customize__color-options'>
              {BASE_COLORS.map(color => (
                <View
                  key={color.value}
                  className={`avatar-customize__color-item ${selectedColor === color.value ? 'avatar-customize__color-item--active' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                >
                  {selectedColor === color.value && <Text className='avatar-customize__color-check'>✓</Text>}
                </View>
              ))}
            </View>
          </View>

          <View className='avatar-customize__quota'>
            <Text className='avatar-customize__quota-text'>
              {isMember ? '会员无限生成' : `剩余次数：${Math.max(0, 1 - genCount)}/1`}
            </Text>
          </View>

          <View className='avatar-customize__actions'>
            {!generatedUrl ? (
              <View
                className={`avatar-customize__btn ${!canGenerate ? 'avatar-customize__btn--disabled' : ''}`}
                onClick={handleTextGenerate}
              >
                <Text className='avatar-customize__btn-text'>生成头像</Text>
              </View>
            ) : (
              <View className='avatar-customize__btn-group'>
                <View className='avatar-customize__btn avatar-customize__btn--secondary' onClick={() => setGeneratedUrl(null)}>
                  <Text className='avatar-customize__btn-text'>重新生成</Text>
                </View>
                <View className='avatar-customize__btn' onClick={handleTextSave}>
                  <Text className='avatar-customize__btn-text'>保存头像</Text>
                </View>
              </View>
            )}
          </View>
        </>
      )}

      {/* Tab 2: 照片生成（新增） */}
      {activeTab === 'photo' && (
        <>
          {/* 照片上传 */}
          <View className='avatar-customize__section'>
            <Text className='avatar-customize__section-title'>上传宠物照片</Text>
            <PhotoUploader
              value={photoUrl}
              onChange={handlePhotoChange}
              disabled={isUploading}
            />
          </View>

          {/* 风格选择 */}
          <View className='avatar-customize__section'>
            <Text className='avatar-customize__section-title'>风格选择</Text>
            <View className='avatar-customize__style-options'>
              {STYLE_OPTIONS.map(opt => (
                <View
                  key={opt.value}
                  className={`avatar-customize__style-item ${photoStyle === opt.value ? 'avatar-customize__style-item--active' : ''}`}
                  onClick={() => setPhotoStyle(opt.value)}
                >
                  <Text className='avatar-customize__style-label'>{opt.label}</Text>
                  <Text className='avatar-customize__style-desc'>{opt.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 生成按钮 */}
          {!is2DProcessing && !is2DComplete && (
            <View className='avatar-customize__quota'>
              <Text className='avatar-customize__quota-text'>
                {isMember ? '会员无限生成' : `剩余照片生成次数：${Math.max(0, 1 - getPhotoGenerationCount())}/1`}
              </Text>
            </View>
          )}

          {!is2DProcessing && !is2DComplete && (
            <View className='avatar-customize__actions'>
              <View
                className={`avatar-customize__btn ${(!uploadedPhotoUrl || !canGenPhoto) ? 'avatar-customize__btn--disabled' : ''}`}
                onClick={handleGenerate2D}
              >
                <Text className='avatar-customize__btn-text'>生成 2D 形象包</Text>
              </View>
            </View>
          )}

          {/* 2D 生成进度 */}
          {is2DProcessing && (
            <GenerationProgress
              progress={task2DProgress}
              status={task2DStatus === 'pending' ? 'processing' : task2DStatus}
              type='2d'
              error={task2DError}
            />
          )}

          {/* 2D 形象画廊 */}
          {is2DComplete && avatar2DPack.images.length > 0 && (
            <ImageGallery
              images={avatar2DPack.images}
              onSaveAsAvatar={handleSaveAsAvatar}
              onGenerate3D={handleGenerate3D}
              isGenerating3D={isGenerating3D}
            />
          )}

          {/* 3D 生成进度 */}
          {is3DProcessing && (
            <GenerationProgress
              progress={task3DProgress}
              status={task3DStatus === 'pending' ? 'processing' : task3DStatus}
              type='3d'
              error={task3DError}
            />
          )}

          {/* 3D 模型预览 */}
          {is3DComplete && avatar3DResult.model && (
            <Model3DViewer
              modelUrl={avatar3DResult.model.modelUrl}
              thumbnailUrl={avatar3DResult.model.thumbnailUrl}
            />
          )}

          {/* 当前头像 */}
          {existingCustom && !is2DComplete && !is3DComplete && (
            <View className='avatar-customize__existing'>
              <Text className='avatar-customize__existing-label'>当前头像</Text>
              <Image
                className='avatar-customize__existing-img'
                src={existingCustom.cartoonUrl || ''}
                mode='aspectFit'
                lazyLoad
              />
            </View>
          )}
        </>
      )}
    </View>
  )
}
```

- [ ] **Step 2: 更新样式文件**

在 `index.scss` 中追加新增组件的样式：

```scss
// Tab 切换
.avatar-customize__tabs {
  display: flex;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px;
  margin: 16px 20px;
}

.avatar-customize__tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 10px;
  transition: all 0.3s;

  &--active {
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

.avatar-customize__tab-text {
  font-size: 14px;
  font-weight: 500;
  color: #666;

  .avatar-customize__tab--active & {
    color: #4D96FF;
  }
}

// PhotoUploader
.photo-uploader {
  margin: 12px 0;

  &--empty {
    border: 2px dashed #ddd;
    border-radius: 16px;
    padding: 40px 20px;
    text-align: center;
    background: #fafafa;
    transition: border-color 0.3s;

    &:active {
      border-color: #4D96FF;
    }
  }

  &--has-image {
    position: relative;
  }

  &__preview {
    width: 100%;
    height: 300px;
    border-radius: 16px;
    object-fit: cover;
  }

  &__placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  &__icon {
    font-size: 48px;
  }

  &__label {
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }

  &__hint {
    font-size: 12px;
    color: #999;
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  &__btn {
    flex: 1;
    text-align: center;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 8px;

    &--remove {
      background: #fff0f0;
    }

    &-text {
      font-size: 14px;
      color: #333;
    }
  }
}

// GenerationProgress
.generation-progress {
  padding: 20px;
  background: #f8f9ff;
  border-radius: 12px;
  margin: 16px 0;

  &--completed {
    background: #f0fff4;
  }

  &--failed {
    background: #fff0f0;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__label {
    font-size: 14px;
    color: #333;
  }

  &__percent {
    font-size: 14px;
    font-weight: 600;
    color: #4D96FF;
  }

  &__bar {
    height: 8px;
    background: #e8e8e8;
    border-radius: 4px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, #4D96FF, #6BCB77);
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  &__hint {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
  }

  &__icon {
    font-size: 24px;
    text-align: center;
    display: block;
    margin-bottom: 4px;
  }

  &__text {
    font-size: 14px;
    color: #333;
    text-align: center;
    display: block;
  }
}

// ImageGallery
.image-gallery {
  margin-top: 16px;

  &__angles {
    margin-bottom: 12px;
  }

  &__angles-scroll {
    white-space: nowrap;
  }

  &__angle-item {
    display: inline-block;
    padding: 6px 16px;
    margin-right: 8px;
    background: #f5f5f5;
    border-radius: 20px;
    font-size: 13px;
    color: #666;
    transition: all 0.3s;

    &--active {
      background: #4D96FF;
      color: #fff;
    }
  }

  &__preview {
    width: 100%;
    height: 300px;
    background: #fafafa;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__preview-img {
    width: 100%;
    height: 100%;
  }

  &__preview-empty {
    text-align: center;
  }

  &__preview-empty-text {
    font-size: 14px;
    color: #ccc;
  }

  &__tabs {
    display: flex;
    margin: 12px 0;
    border-bottom: 1px solid #eee;
  }

  &__tab {
    flex: 1;
    text-align: center;
    padding: 10px;
    font-size: 14px;
    color: #999;
    border-bottom: 2px solid transparent;

    &--active {
      color: #4D96FF;
      border-bottom-color: #4D96FF;
    }
  }

  &__selector-scroll {
    white-space: nowrap;
    padding: 8px 0;
  }

  &__selector-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 12px;
    margin-right: 8px;
    background: #f5f5f5;
    border-radius: 12px;
    min-width: 56px;
    transition: all 0.3s;

    &--active {
      background: #e8f0ff;
      border: 1px solid #4D96FF;
    }
  }

  &__selector-emoji {
    font-size: 24px;
  }

  &__selector-label {
    font-size: 11px;
    color: #666;
    margin-top: 2px;
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  &__btn {
    flex: 1;
    text-align: center;
    padding: 14px;
    background: #4D96FF;
    border-radius: 12px;

    &--3d {
      background: #6BCB77;
    }

    &--disabled {
      opacity: 0.5;
    }
  }

  &__btn-text {
    font-size: 15px;
    font-weight: 500;
    color: #fff;
  }
}

// Model3DViewer
.model-3d-viewer {
  margin-top: 16px;

  &__preview {
    width: 100%;
    height: 300px;
    background: #f0f0f0;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__thumbnail {
    width: 100%;
    height: 100%;
  }

  &__placeholder {
    text-align: center;
  }

  &__placeholder-icon {
    font-size: 48px;
    display: block;
  }

  &__placeholder-text {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-top: 8px;
  }

  &__placeholder-hint {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }

  &__actions {
    margin-top: 12px;
  }

  &__btn {
    width: 100%;
    padding: 14px;
    background: #6BCB77;
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
  }
}
```

---

## 模块 14: 集成验证

### Task 17: 类型检查与构建验证

- [ ] **Step 1: 后端编译检查**

```bash
cd "e:\星寰海\03-源代码\server" ; npx tsc --noEmit
```

- [ ] **Step 2: 小程序编译检查**

```bash
cd "e:\星寰海\03-源代码\小程序\miniapp" ; npm run typecheck
```

- [ ] **Step 3: 小程序开发构建**

```bash
cd "e:\星寰海\03-源代码\小程序\miniapp" ; npm run dev:weapp
```

---

## 执行顺序

模块按顺序串行执行：1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14

每个模块完成后必须通过 TypeScript 编译检查，再进入下一模块。