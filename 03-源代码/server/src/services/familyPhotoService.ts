/**
 * 全家福AI合成服务 - 调用 Seedream API 多图合成宠物全家福
 * 从提示词库映射风格到提示词模板，调用 Seedream 多图输入后入库
 * Seedream 4.0 内置安全过滤，无需额外内容审核
 * 参考 image2DService 的 Seedream 调用、重试、并发控制模式
 */
import { config } from '../config.js';
import { pool } from '../db.js';
import { delay } from '../utils/delay.js';
// 宠物提示词公共模块：主体描述（品种兜底 + 绝不写名字）统一从这里取
import { petSubjectText, petSpeciesLabel } from './petPrompt.js';

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

/**
 * 风格 → 提示词模板
 * 基于项目提示词库《宠物回忆录-提示词库.md》§六「通用视觉风格库」的官方风格关键词，
 * 按「生图场景」裁剪并中英混排（pixar=§6.4 皮克斯 / ghibli=§6.3 吉卜力 / oil=§6.7 油画 /
 * ink=§6.6 水墨 / nordic=§6.9 极简北欧 / cyberpunk=§6.1 赛博朋克），
 * 不再使用此前硬编码的简版英文模板
 */
const STYLE_PROMPTS: Record<FamilyPhotoStyle, string> = {
  pixar:
    '皮克斯3D动画风格, Pixar style, Disney 3D animation, cartoon render, smooth textures, expressive eyes, exaggerated proportions, subsurface scattering',
  ghibli:
    '吉卜力动画风格, Studio Ghibli style, hand-drawn animation, soft watercolor backgrounds, cel-shaded, Hayao Miyazaki aesthetic',
  oil:
    '印象派油画风格, oil painting, impasto, thick brush strokes, canvas texture, Monet, impressionist, palette knife',
  ink:
    '中国水墨画风格, Chinese ink wash painting, sumi-e, brush strokes, rice paper texture, zen aesthetic, black ink on cream paper',
  nordic:
    '极简北欧风格, minimalist, Scandinavian design, clean lines, negative space, muted tones, geometric, zen',
  cyberpunk:
    '赛博朋克风格, cyberpunk, neon lights, rain-slicked streets, holographic, dystopian, LED, futuristic city, purple and cyan',
};

const MAX_429_RETRIES = 2;

/** 家庭成员宠物信息（导出供单测构造提示词用例） */
export interface MemberInfo {
  petId: string;
  name: string;
  species: string;
  /** 品种可能为空（档案未填），构建提示词时必须兜底，不能出现空串/undefined */
  breed: string | null;
  photoUrl: string | null;
}

interface GenerateFamilyPhotoParams {
  familyId: string;
  userId: string;
  style: FamilyPhotoStyle;
}

/**
 * 构建宠物列表描述与数量汇总
 * ⚠️ 关键：绝不把宠物名字写进提示词！
 * 名字对文生图模型是噪声甚至灾难——猫咪叫「烧鸡」就会被模型画成一只烧鸡，
 * 且会把多张参考猫图全部覆盖成一只鸡。外貌一致性靠参考照片保证，
 * 提示词只写「品种 + 物种」，名字只用于入库记录（member_names），不进 prompt。
 */
function buildPetList(members: MemberInfo[]): { list: string; summary: string } {
  // 逐只描述：一只英短猫咪、一只美短猫咪……（主体描述统一走公共模块，含品种兜底）
  const list = members.map((m) => petSubjectText(m.breed, m.species)).join('、');

  // 数量汇总：如「4只猫咪」或「3只猫咪和1只狗狗」，明确告诉模型画几只
  const catCount = members.filter((m) => m.species !== 'dog').length;
  const dogCount = members.length - catCount;
  const parts: string[] = [];
  if (catCount > 0) parts.push(`${catCount}只猫咪`);
  if (dogCount > 0) parts.push(`${dogCount}只狗狗`);

  return { list, summary: parts.join('和') };
}

/**
 * 构建全家福合成提示词
 * 结构 = 风格（提示词库 §六） + 数量/物种 + 宠物列表 + 角色一致性 + 主体锁定
 * 角色一致性与主体锁定对应提示词库 §0.6「全局角色锁定表」与 §四「角色一致性模板」：
 * 多图合成时外观以参考照片为准，禁止模型自由发挥、增减数量或混入其他主体
 */
export function buildPrompt(members: MemberInfo[], style: FamilyPhotoStyle): string {
  const { list, summary } = buildPetList(members);
  const total = members.length;
  // 有任一成员照片才声明"以参考照片为准"，否则提示词会"说谎"（无图可参考却要求完全一致）
  const hasReference = members.some((m) => m.photoUrl);

  const parts = [
    STYLE_PROMPTS[style],
    `一张温馨的全家福合影，画面中共有${summary}：${list}。`,
    '所有宠物并排坐在一起，表情自然温馨，构图完整。',
  ];
  if (hasReference) {
    parts.push('以参考照片为准：保持每只宠物的毛色、花纹、体型、五官与参考图完全一致，不改变外貌，不增减数量。');
  }
  parts.push(`画面中只出现这${total}只宠物，不要出现其他动物、人物或食物。`, '高质量，细节丰富。');
  return parts.join(' ');
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