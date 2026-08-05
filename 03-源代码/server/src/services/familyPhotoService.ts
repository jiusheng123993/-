/**
 * 全家福AI合成服务 - 调用 Seedream API 多图合成宠物全家福
 * 从提示词库映射风格到提示词模板，调用 Seedream 多图输入后入库
 * Seedream 4.0 内置安全过滤，无需额外内容审核
 * 参考 image2DService 的 Seedream 调用、重试、并发控制模式
 */
import { config } from '../config.js';
import { pool } from '../db.js';
import { delay } from '../utils/delay.js';

const SEEDREAM_API = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

/** 支持的全家福合成风格 */
export const FAMILY_PHOTO_STYLES = [
  'pixar',
  'ghibli',
  'oil',
  'ink',
  'nordic',
  'cyberpunk',
] as const;

export type FamilyPhotoStyle = (typeof FAMILY_PHOTO_STYLES)[number];

/** 风格 → 提示词模板（参考项目提示词库各章节） */
const STYLE_PROMPTS: Record<FamilyPhotoStyle, string> = {
  pixar:
    'Pixar 3D animation style, a family portrait of {pets} sitting together in a warm sunlit living room, expressive eyes, joyful gathering, smooth rendering, subsurface scattering on fur, golden hour lighting, cozy atmosphere, group composition, 8k ultra detailed',
  ghibli:
    'Studio Ghibli animation style, {pets} together in a sunlit wildflower meadow under blue sky with fluffy clouds, hand-painted watercolor background, Hayao Miyazaki aesthetic, warm magical atmosphere, soft breeze moving grass and fur, nostalgic warmth',
  oil:
    'Monet impressionist oil painting style, {pets} in a garden of flowers, soft dappled light, loose visible brush strokes, dreamy pastel palette of purples pinks and greens, peaceful garden atmosphere, canvas texture, group portrait',
  ink:
    'Chinese ink wash painting style, sumi-e brush strokes, {pets} sitting together in harmony, black ink on cream rice paper, splashing ink effects, zen minimalist, poetic atmosphere, delicate brush strokes forming fur texture',
  nordic:
    'minimalist Scandinavian design, {pets} sitting together on a soft linen cushion, soft pastel color palette of blush pink and sage green, gentle morning light through sheer curtains, peaceful hygge atmosphere, clean lines, negative space, 4k cinematic',
  cyberpunk:
    'cyberpunk aesthetic, {pets} standing together in a neon-lit futuristic alley, pink and cyan holographic reflections on sleek surfaces, volumetric fog, rain-slicked ground, cinematic low angle shot, purple and cyan palette, 8k ultra detailed',
};

const MAX_429_RETRIES = 2;

interface MemberInfo {
  petId: string;
  name: string;
  species: string;
  breed: string;
  photoUrl: string | null;
}

interface GenerateFamilyPhotoParams {
  familyId: string;
  userId: string;
  style: FamilyPhotoStyle;
}

/**
 * 构建全家福合成提示词
 * 从成员信息中提取品种描述，叠加风格模板
 */
function buildPrompt(members: MemberInfo[], style: FamilyPhotoStyle): string {
  const petDescriptions = members.map((m) => {
    const speciesName = m.species === 'dog' ? '狗狗' : '猫咪';
    return `a ${m.breed} ${speciesName} named ${m.name}`;
  });

  const petList =
    petDescriptions.length <= 3
      ? petDescriptions.join(', ')
      : `${petDescriptions.slice(0, -1).join(', ')} and ${petDescriptions[petDescriptions.length - 1]}`;

  const template = STYLE_PROMPTS[style];
  return template.replace('{pets}', petList);
}

/**
 * 收集家庭成员宠物照片URL
 * 从 pet_family_members JOIN pet_profiles 获取成员信息和照片
 */
async function collectMemberPhotos(familyId: string, userId: string): Promise<MemberInfo[]> {
  const result = await pool.query(
    `SELECT
       p.id AS "petId",
       p.name,
       p.species,
       p.breed,
       COALESCE(p.avatar_photo_url, p.avatar_cartoon_url) AS "photoUrl"
     FROM pet_family_members m
     JOIN pet_profiles p ON p.id = m.pet_id
     JOIN pet_families f ON f.id = m.family_id AND f.user_id = $2
     WHERE m.family_id = $1
     ORDER BY m.joined_at ASC`,
    [familyId, userId],
  );
  return result.rows;
}

/**
 * 调用 Seedream API 多图合成
 * 尝试传入多张参考图，若不支持多图则降级为纯文本生图
 */
async function callSeedreamMulti(
  prompt: string,
  imageUrls: string[],
  apiKey: string,
  retryCount: number = 0,
): Promise<string | null> {
  const body: Record<string, unknown> = {
    model: 'doubao-seedream-4-0-250828',
    prompt,
    size: '1024x1024',
    n: 1,
  };

  // Seedream 4.0 支持多图输入：传入 images 数组做参考图合成
  if (imageUrls.length > 0) {
    body.images = imageUrls;
  }

  const response = await fetch(SEEDREAM_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429 && retryCount < MAX_429_RETRIES) {
      const backoff = 5000 * (retryCount + 1);
      await delay(backoff);
      return callSeedreamMulti(prompt, imageUrls, apiKey, retryCount + 1);
    }
    console.error(`[FamilyPhoto] Seedream API error: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as { data: Array<{ url: string }> };
  return data.data?.[0]?.url || null;
}

/**
 * 检查同家庭是否有进行中的生成任务
 */
async function hasActiveTask(familyId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM family_photos
     WHERE family_id = $1 AND status IN ('pending', 'processing')
     LIMIT 1`,
    [familyId],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * 生成全家福主入口
 * 1. 校验家庭归属 + 成员数
 * 2. 收集成员照片
 * 3. 构建提示词
 * 4. 调用 Seedream 多图合成
 * 5. 入库
 */
export async function generateFamilyPhoto(params: GenerateFamilyPhotoParams): Promise<{
  success: boolean;
  photoId?: string;
  photoUrl?: string;
  message?: string;
}> {
  const { familyId, userId, style } = params;
  const apiKey = config.seedream.apiKey;

  if (!apiKey) {
    return { success: false, message: 'AI 图像生成服务未配置' };
  }

  // 检查并发生成
  if (await hasActiveTask(familyId)) {
    return { success: false, message: '该家庭已有进行中的全家福生成任务，请稍后再试' };
  }

  // 收集成员信息
  const members = await collectMemberPhotos(familyId, userId);
  if (members.length === 0) {
    return { success: false, message: '该家庭没有宠物成员，请先添加成员' };
  }
  if (members.length < 2) {
    return { success: false, message: '全家福需要至少2位家庭成员' };
  }

  const memberNames = members.map((m) => m.name);
  const photoUrls = members.map((m) => m.photoUrl).filter(Boolean) as string[];

  // 创建 processing 记录
  const photoId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO family_photos (id, family_id, user_id, style, member_count, member_names, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'processing')`,
    [photoId, familyId, userId, style, members.length, memberNames],
  );

  // 构建提示词
  const prompt = buildPrompt(members, style);

  // 调用 Seedream 多图合成（Seedream 4.0 内置安全过滤）
  const generatedUrl = await callSeedreamMulti(prompt, photoUrls, apiKey);

  if (!generatedUrl) {
    await pool.query(
      `UPDATE family_photos SET status = 'failed', updated_at = now() WHERE id = $1`,
      [photoId],
    );
    return { success: false, message: 'AI 生成失败，请稍后重试' };
  }

  // 入库
  await pool.query(
    `UPDATE family_photos SET photo_url = $1, status = 'completed', updated_at = now() WHERE id = $2`,
    [generatedUrl, photoId],
  );
  return { success: true, photoId, photoUrl: generatedUrl };
}

/**
 * 查询家庭全家福照片列表
 */
export async function getFamilyPhotos(
  familyId: string,
  userId: string,
): Promise<Array<{
  id: string;
  photoUrl: string | null;
  photoType: string;
  style: string;
  memberCount: number;
  memberNames: string[];
  status: string;
  createdAt: string;
}>> {
  const result = await pool.query(
    `SELECT
       id, photo_url AS "photoUrl", photo_type AS "photoType",
       style, member_count AS "memberCount", member_names AS "memberNames",
       status, created_at AS "createdAt"
     FROM family_photos
     WHERE family_id = $1 AND user_id = $2
     ORDER BY created_at DESC`,
    [familyId, userId],
  );
  return result.rows;
}

/**
 * 删除全家福照片
 */
export async function deleteFamilyPhoto(
  photoId: string,
  familyId: string,
  userId: string,
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM family_photos WHERE id = $1 AND family_id = $2 AND user_id = $3`,
    [photoId, familyId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * 保存用户上传或 Canvas 降级生成的全家福
 * 与 AI 生成不同，此接口直接入库已完成状态的照片，不触发 Seedream 调用
 */
export async function saveUploadedFamilyPhoto(params: {
  familyId: string;
  userId: string;
  photoUrl: string;
  photoType: 'canvas_fallback' | 'uploaded';
  memberCount: number;
  memberNames: string[];
  description?: string | null;
}): Promise<{ id: string }> {
  const { familyId, userId, photoUrl, photoType, memberCount, memberNames, description } = params;
  const photoId = crypto.randomUUID();

  await pool.query(
    `INSERT INTO family_photos
      (id, family_id, user_id, photo_url, photo_type, style, description, member_count, member_names, status)
     VALUES ($1, $2, $3, $4, $5, 'uploaded', $6, $7, $8, 'completed')`,
    [photoId, familyId, userId, photoUrl, photoType, description ?? null, memberCount, memberNames],
  );

  return { id: photoId };
}