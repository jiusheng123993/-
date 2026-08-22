/**
 * 回忆录分镜脚本生成器（回忆录 2.0 M1 模块）
 * 职责：调用 DeepSeek 生成结构化分镜脚本（CREST 叙事 + Seedance 2.5 prompt contract）
 *
 * 方法论来源（已吸收最新版）：
 * - OpenMontage Seedance 2.5 技能（十段 prompt contract + Locks 连续性锁）
 * - OpenMontage Storytelling（Anti-Subjective 规则：写情绪的视觉成因，不写情绪词）
 * - 《回忆录2.0-设计规格-2026-08-22.md》§4（本模块的实现依据）
 *
 * 安全/健壮性：
 * - LLM 输出必须过 zod 校验，失败自动重试（最多 2 次重试）
 * - 全部失败用内置兜底模板，保证功能可用（质量降级但不断服）
 * - 输入不包含密钥，日志脱敏
 */
import { chat } from './aiService.js';
import {
  MemoirScriptSchema,
  type MemoirScript,
  type MemoirSegmentScript,
} from '../schemas/memoirScript.js';

/** 产品线类型（与 videoGenerationService 保持一致） */
export type MemoirProductLine = 'daily' | 'memorial';

/** 分镜生成输入（由 memoirProcessor 在生成视频前调用） */
export interface MemoirScriptInput {
  /** 宠物档案关键字段（来自 pet_profiles 表） */
  petProfile: {
    name: string;
    species: string;
    breed: string;
    gender?: string | null;
    birth_date?: string | null;
    notes?: string | null;
    is_deceased?: boolean;
  };
  /** AI 记忆摘要（memory-body 生成，可空） */
  memorySummary?: string;
  /** 照片数量（决定镜头数） */
  photoCount: number;
  /** 产品线：纪念Vlog / 日常回忆录 */
  productLine: MemoirProductLine;
  /** 目标时长（秒） */
  targetDuration: number;
  /** 用户写的回忆文字（可空） */
  sourceText?: string | null;
  /** 用户选择的音乐风格（可空） */
  musicStyle?: string | null;
}

/** 产品线配置（与 videoGenerationService.PRODUCT_LINE_CONFIG 对齐） */
const PRODUCT_LINE_META: Record<
  MemoirProductLine,
  { label: string; durationText: string; curve: string; minPhotos: number; maxPhotos: number }
> = {
  memorial: {
    label: '纪念Vlog',
    durationText: '60-90秒',
    curve: 'CREST六段式：背景→铺垫→冲突→留白→释怀→主题',
    minPhotos: 8,
    maxPhotos: 15,
  },
  daily: {
    label: '日常回忆录',
    durationText: '5-30秒',
    curve: '温暖片段：一个完整的小情绪弧线',
    minPhotos: 1,
    maxPhotos: 3,
  },
};

/** 最大尝试次数（1 次正常 + 2 次重试） */
const MAX_ATTEMPTS = 3;

/** 分镜生成参数（chat 调用配置） */
const SCRIPT_CHAT_OPTIONS = {
  temperature: 0.8, // 创意生成需要一定随机性
  max_tokens: 4000, // 12 镜 JSON 约 2500-3500 tokens
  // 关闭思考模式：否则 reasoning_content 会吃掉 max_tokens，导致 content 为空/JSON 截断
  thinking: 'disabled' as const,
} as const;

/**
 * 构建导演系统提示词
 * 核心规则：Anti-Subjective（写视觉成因）、身份锚点、CREST 情感曲线、Seedance 2.5 十段结构
 * @returns 系统提示词（不随输入变化，可缓存）
 */
function buildSystemPrompt(): string {
  return `你是一位宠物纪念视频导演兼编剧。根据素材为一个宠物家庭生成情感克制的分镜脚本。
禁止煽情过度、禁止虚构不存在的经历，只能基于素材合理延展氛围。

【产品线说明】
- 纪念Vlog：60-90秒，CREST六段式（背景→铺垫→冲突→留白→释怀→主题）
- 日常回忆录：5-30秒，温暖片段

【硬性要求】
1. 严格输出 JSON（结构见下），不要输出任何其他文字。
2. Anti-Subjective 规则（最重要）：描述"情绪的视觉成因"，禁止用主观情绪词。
   例：不写"氛围温馨感人"，写"黄昏暖光从窗台洒入，猫在光斑里眯眼"；
   不写"悲伤的回忆"，写"空了的猫窝，窗帘被风轻轻吹动"。
   旁白和 prompt 都必须遵守：每个情绪点都要对应一个看得见的具体画面。
3. 角色锚点（anchors，多宠物/多人场景核心）：照片里**每一个需要保持一致的在场角色**（宠物和人）各提取
   3-6 个"能一眼认出它/他/她"的物理特征（宠物：毛色/花纹/体型/五官/特殊标记；人：发型/身高体型/服装/眼镜
   等稳定特征，不用表情），写进 JSON 顶部的 anchors 数组（每项 {id, type: pet/human, desc}）。
   每个锚点的 desc 在它出现的每一镜 seedance_prompt 里**逐字重复**（Seedance 一致性核心）。
   每镜的 characters_present 声明本镜在场角色 id（这镜只有猫就只写猫的 id）。
4. 每镜 seedance_prompt 用中文，按十段结构组装：
   GLOBAL STYLE（类型/调色/必须不出现的东西，如"只出现本镜声明的角色"）
   → SCENE（一句话）→ CHARACTERS（角色=参考图+本镜在场角色锚点逐字重复）
   → LOCATION（位置与道具，防止多镜漂移）→ FIRST FRAME（开场构图 x/y 百分比）
   → Shot 1（景别+动作，1-2 句）→ OPTICS（焦段/机位）→ PHYSICS（毛发等柔软细节）
   → LIGHTING（一个光源方案）→ AUDIO（环境声；无音乐）。
   动作细节只写"从照片能推断"的（如"耳朵在光里透出粉色""尾巴尖轻轻摆动"），
   不编造照片里没有的场景。人物动作克制写实（不美化不丑化）。
5. 旁白文案：口语化、克制、有画面感，每镜 1-2 句话（20-50 字），
   写具体细节（"它总在黄昏蹲在窗台第三块砖上"），避免"永远爱你"式空话。
6. 字幕：短句（≤15 字），可含时间节点（"2018 年冬天 · 第一次下雪"）。
7. 情感曲线遵循产品线说明：开头平静留白，中段温暖回忆，转折点到为止
   （不渲染痛苦），结尾释怀与感激。
8. **结尾全家福镜头（必须）**：最后一镜必须是"全家福合影动效"——用角色最多的照片
   （照片里有最多宠物/人物同框的那张）做缓慢推近或拉远 + 柔和光效 + 轻微动效
   （尾巴/耳朵/衣角轻动），旁白写"一家人/一大家子在一起"的释怀收尾，字幕如"我们一家"。
   如果所有照片都是单角色，则用最后一张照片做温暖收尾（推近+光效）。
9. 避免：同镜超过 3 个动作、可读文字/水印、冲突光线（一个光源方案只选一个）。

【输出 JSON 结构】
{
  "title": "视频标题（≤30字）",
  "theme": "主题词（≤15字）",
  "emotion_curve": ["calm","memory","pain","relief","lingering"],
  "narration_voice": "zh_female_vv_uranus_bigtts",
  "music_mood": "nostalgic 或 warm/piano/gentle/bright",
  "anchors": [
    {"id": "doubao", "type": "pet", "desc": "橘色短毛猫，白色胸脯，右耳缺一小角，绿眼睛"},
    {"id": "mama", "type": "human", "desc": "女性，长发，米色毛衣，圆框眼镜"}
  ],
  "segments": [
    {
      "photo_index": 0,
      "shot_type": "push_in 或 pan_left/tilt_up/zoom_slow/static_drift/dolly_in",
      "camera": "close_up 或 medium/wide/over_shoulder",
      "lighting": "golden_hour 或 soft_afternoon/warm_indoor/moonlight",
      "transition": "revealing 或 disappearing/switching/cut",
      "atmosphere": "氛围（供理解，不进prompt）",
      "characters_present": ["doubao", "mama"],
      "duration_sec": 5,
      "seedance_prompt": "完整十段中文提示词（CHARACTERS 段含本镜在场锚点逐字重复）",
      "narration": "旁白文案",
      "subtitle": "字幕",
      "music_mood": "本镜音乐情绪（可省略）"
    }
  ]
}`;
}

/**
 * 构建用户上下文（素材描述）
 * @param input - 分镜生成输入
 * @returns 用户消息内容
 */
function buildUserContext(input: MemoirScriptInput): string {
  const { petProfile, memorySummary, photoCount, productLine, targetDuration, sourceText, musicStyle } = input;
  const meta = PRODUCT_LINE_META[productLine];

  // 宠物档案描述
  const genderText =
    petProfile.gender === 'male' ? '公' : petProfile.gender === 'female' ? '母' : '';
  const ageText = petProfile.birth_date
    ? `（出生日期 ${petProfile.birth_date}）`
    : '';
  const deceasedText = petProfile.is_deceased ? '（已离世）' : '';

  // 照片信息（无内容描述，只有数量）
  const photoText = `${photoCount} 张照片，按时间排序`;

  return `【宠物档案】${petProfile.species === 'cat' ? '猫' : petProfile.species === 'dog' ? '狗' : petProfile.species}，
品种 ${petProfile.breed}，${genderText}${ageText}，名字「${petProfile.name}」${deceasedText}
${petProfile.notes ? `档案备注：${petProfile.notes}` : ''}

【记忆摘要】${memorySummary || '（暂无）'}

【用户文案】${sourceText || '（无，请基于档案与照片合理构思）'}

【照片信息】${photoText}

【产品线】${meta.label}（${meta.durationText}），情感曲线：${meta.curve}
目标时长：${targetDuration} 秒${musicStyle ? `，音乐风格偏好：${musicStyle}` : ''}`;
}

/**
 * 从 LLM 回复中提取 JSON 文本
 * 兼容 markdown 代码块包裹、前后杂音等常见情况
 * @param raw - LLM 原始回复
 * @returns 提取到的 JSON 字符串（失败返回原文本）
 */
function extractJson(raw: string): string {
  // 去掉 ```json ... ``` / ``` ... ``` 代码块包裹
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  // 直接截取第一个 { 到最后一个 }（容忍前后杂音）
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

/**
 * 修正分镜脚本（LLM 输出校验通过后的规范化）
 * - segments 数量对齐照片数（多了截断、少了补最后一张的复刻）
 * - 每镜时长修正到 3-8 秒
 * - 总时长按产品线缩放（在 3-8 秒约束内尽量贴近目标）
 * @param script - zod 校验通过的脚本
 * @param input - 原始输入（照片数/产品线/目标时长）
 * @returns 修正后的脚本
 */
function normalizeScript(script: MemoirScript, input: MemoirScriptInput): MemoirScript {
  const { photoCount, productLine, targetDuration } = input;
  const meta = PRODUCT_LINE_META[productLine];

  // 0. 角色锚点归一化：优先 anchors（多角色）；旧脚本只有 identity_anchor 时转成单个 pet 锚点
  let anchors = script.anchors;
  if (!anchors || anchors.length === 0) {
    const legacy = script.identity_anchor?.trim();
    if (legacy) {
      anchors = [{ id: 'pet1', type: 'pet', desc: legacy }];
    } else {
      // 都没有 → 用宠物档案兜底（保证锚点存在）
      anchors = [{ id: 'pet1', type: 'pet', desc: `${input.petProfile.breed}${input.petProfile.name}` }];
    }
  }

  // 1. segments 数量对齐照片数
  let segments: MemoirSegmentScript[] = script.segments.slice(0, photoCount);
  // 照片数多于 LLM 输出的镜数时，用最后一镜的样式补足（保证每张照片都有镜头）
  while (segments.length < photoCount && segments.length > 0) {
    const last = segments[segments.length - 1];
    segments.push({
      ...last,
      photo_index: segments.length,
      duration_sec: Math.min(last.duration_sec, 8),
    });
  }

  // 2. 每镜时长修正到 3-8 秒
  segments = segments.map((seg) => ({
    ...seg,
    duration_sec: Math.min(8, Math.max(3, Math.round(seg.duration_sec))),
  }));

  // 3. 总时长按产品线缩放（3-8 秒约束内尽量贴近目标时长）
  const currentTotal = segments.reduce((sum, seg) => sum + seg.duration_sec, 0);
  if (currentTotal > 0 && segments.length > 0) {
    // 目标每镜时长（clamp 3-8）
    const targetPerSeg = Math.min(8, Math.max(3, Math.round(targetDuration / segments.length)));
    segments = segments.map((seg) => ({ ...seg, duration_sec: targetPerSeg }));
    // 如果还有剩余时长空间且允许，给第一镜加时长（累计到上限）
    const newTotal = segments.reduce((sum, seg) => sum + seg.duration_sec, 0);
    if (newTotal < targetDuration && targetPerSeg < 8 && segments.length > 0) {
      const headroom = Math.min(8 - targetPerSeg, targetDuration - newTotal);
      if (headroom >= 1) {
        segments[0] = { ...segments[0], duration_sec: segments[0].duration_sec + headroom };
      }
    }
  }

  // 4. 按 photo_index 排序，并强制重分配下标（防 LLM 输出重复/乱序 photo_index 导致取错照片）
  segments.sort((a, b) => a.photo_index - b.photo_index);
  segments = segments.map((seg, i) => ({ ...seg, photo_index: i }));

  return { ...script, anchors, segments };
}

/**
 * 内置兜底分镜模板（LLM 连续失败时使用，保证功能可用）
 * 基于产品线生成基础分镜：纪念=CREST 六段式，日常=温暖单镜/双镜
 * @param input - 分镜生成输入
 * @returns 基础分镜脚本
 */
function fallbackTemplate(input: MemoirScriptInput): MemoirScript {
  const { petProfile, photoCount, productLine, targetDuration, musicStyle } = input;
  const anchor = `${petProfile.breed}${petProfile.species === 'cat' ? '猫' : petProfile.species === 'dog' ? '狗' : ''}，名字「${petProfile.name}」`;

  // 按情感曲线给每镜分配情绪与基础 prompt（纪念用 CREST，日常用温暖）
  // 注意：这里是情感名（calm/memory/pain...），不是转场原语
  const emotionCycle: ReadonlyArray<'calm' | 'memory' | 'pain' | 'relief' | 'lingering'> =
    productLine === 'memorial'
      ? ['calm', 'calm', 'memory', 'memory', 'pain', 'relief', 'relief', 'lingering']
      : ['calm'];

  const lightingCycle: MemoirSegmentScript['lighting'][] = [
    'golden_hour',
    'soft_afternoon',
    'warm_indoor',
    'moonlight',
  ];

  const perSegDuration = Math.min(8, Math.max(3, Math.round(targetDuration / Math.max(1, photoCount))));

  const segments: MemoirSegmentScript[] = Array.from({ length: Math.max(1, photoCount) }, (_, i) => {
    const emotion = emotionCycle[i % emotionCycle.length] ?? 'calm';
    const lighting = lightingCycle[i % lightingCycle.length] ?? 'golden_hour';
    // 十段结构简化模板（身份锚点用占位，M2 会强制注入）
    const prompt = `GLOBAL STYLE：写实风格，柔和暖调；画面只出现这一只宠物，无其他动物/人物/文字/水印。
SCENE：${petProfile.name}的${emotion === 'pain' ? '安静时刻' : '日常一瞬'}。
CHARACTERS：角色=参考图1（${anchor}）。
LOCATION：日常熟悉的环境，窗边或沙发一角。
FIRST FRAME：主体位于画面中央偏下，静止。
Shot 1（${i === 0 ? 'wide' : 'close_up'}，缓慢推镜）：画面自然流畅，轻微镜头移动，保持主体清晰。
OPTICS：47°焦段，机位与宠物视线同高。
PHYSICS：毛发柔软，随微风轻微浮动。
LIGHTING：${lighting === 'moonlight' ? '柔和月光' : '温暖自然光'}，单一光源。
AUDIO：安静的室内环境声；无音乐。`;
    return {
      photo_index: i,
      shot_type: i === 0 ? 'push_in' : 'static_drift',
      camera: i === 0 ? 'wide' : 'close_up',
      lighting,
      transition: i === 0 ? 'revealing' : 'cut',
      duration_sec: perSegDuration,
      seedance_prompt: prompt,
      narration: `${petProfile.name}的${emotion === 'pain' ? '安静时刻' : '日常一瞬'}，值得被记住。`,
      subtitle: i === 0 ? `${petProfile.name} · 回忆录` : '',
    };
  });

  return {
    title: `${petProfile.name}的回忆录`,
    theme: '陪伴',
    emotion_curve: productLine === 'memorial' ? ['calm', 'memory', 'relief'] : ['calm'],
    narration_voice: 'zh_female_vv_uranus_bigtts',
    music_mood: (musicStyle as MemoirScript['music_mood']) ?? (productLine === 'memorial' ? 'nostalgic' : 'warm'),
    anchors: [{ id: 'pet1', type: 'pet', desc: anchor }],
    segments,
  };
}

/**
 * 生成回忆录分镜脚本（主入口）
 * 流程：组装 prompt → chat → 提取 JSON → zod 校验 → 修正 → 返回
 * 失败重试 MAX_ATTEMPTS 次，全部失败用兜底模板
 * @param input - 分镜生成输入
 * @returns 校验并修正后的分镜脚本
 */
export async function generateMemoirScript(input: MemoirScriptInput): Promise<MemoirScript> {
  const meta = PRODUCT_LINE_META[input.productLine];

  // 参数预校验：照片数量必须在产品线范围内
  if (input.photoCount < meta.minPhotos || input.photoCount > meta.maxPhotos) {
    throw new Error(
      `[MemoirScript] ${meta.label}照片数量需 ${meta.minPhotos}-${meta.maxPhotos} 张，当前 ${input.photoCount} 张`,
    );
  }

  // 组装消息（系统提示词固定 + 用户上下文动态）
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt() },
    { role: 'user' as const, content: buildUserContext(input) },
  ];

  let lastError: unknown = null;

  // 尝试生成（最多 MAX_ATTEMPTS 次）
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await chat(messages, SCRIPT_CHAT_OPTIONS);
      const jsonText = extractJson(raw);
      const parsed = JSON.parse(jsonText) as unknown;
      const script = MemoirScriptSchema.parse(parsed);
      // 校验通过 → 规范化后返回
      return normalizeScript(script, input);
    } catch (err) {
      lastError = err;
      console.warn(`[MemoirScript] 第 ${attempt}/${MAX_ATTEMPTS} 次生成失败:`, (err as Error).message);
    }
  }

  // 全部失败 → 兜底模板（记录日志，质量降级但不断服）
  console.warn(
    `[MemoirScript] LLM 生成失败 ${MAX_ATTEMPTS} 次，使用兜底模板（productLine=${input.productLine}）:`,
    (lastError as Error)?.message,
  );
  return fallbackTemplate(input);
}

// 导出内部函数供单测覆盖（不影响业务入口）
export { buildSystemPrompt, buildUserContext, extractJson, normalizeScript, fallbackTemplate };
