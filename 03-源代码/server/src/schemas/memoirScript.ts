/**
 * 回忆录分镜脚本 Schema（zod 校验）
 * 对应《回忆录2.0-设计规格-2026-08-22.md》§4.2 的分镜 JSON 结构
 * 由 memoirScriptService 生成后强制校验，保证 LLM 输出符合管线契约
 */
import { z } from 'zod';

/** 运镜类型（Seedance 可明确执行的镜头运动） */
export const SHOT_TYPES = [
  'push_in',      // 缓慢推镜（靠近主体）
  'pan_left',     // 左摇
  'tilt_up',      // 上摇
  'zoom_slow',    // 缓慢变焦
  'static_drift', // 静止+轻微漂移（呼吸感）
  'dolly_in',     // 轨道推进
] as const;

/** 景别 */
export const CAMERA_SHOTS = ['close_up', 'medium', 'wide', 'over_shoulder'] as const;

/** 光线方案（每镜只选一个，避免冲突光线） */
export const LIGHTING_MODES = ['golden_hour', 'soft_afternoon', 'warm_indoor', 'moonlight'] as const;

/** 转场原语（OpenMontage 主体转场分类，M4 拼接时决定转场方式） */
export const TRANSITIONS = ['revealing', 'disappearing', 'switching', 'cut'] as const;

/** 情感曲线段（CREST 六段式） */
export const EMOTIONS = ['calm', 'memory', 'pain', 'relief', 'lingering'] as const;

/** 音乐情绪（映射 BGM 库，M3 使用） */
export const MUSIC_MOODS = ['warm', 'nostalgic', 'piano', 'gentle', 'bright'] as const;

/** 单镜分镜（LLM 输出的一镜） */
/** 单镜分镜（LLM 输出的一镜）
 * 容错设计：枚举字段加 .catch 默认值——LLM 输出超枚举值时落默认值而不是整体失败；
 * 核心字段（photo_index/prompt/narration）保持严格，缺失必须重试。
 */
export const MemoirSegmentScriptSchema = z.object({
  /** 对应第几张照片（0 起） */
  photo_index: z.number().int().min(0),
  /** 运镜 */
  shot_type: z.enum(SHOT_TYPES).catch('static_drift'),
  /** 景别 */
  camera: z.enum(CAMERA_SHOTS).catch('medium'),
  /** 光线方案 */
  lighting: z.enum(LIGHTING_MODES).catch('soft_afternoon'),
  /** 转场原语 */
  transition: z.enum(TRANSITIONS).catch('cut'),
  /** 氛围描述（仅脚本理解用，不直接进 prompt） */
  atmosphere: z.string().max(50).optional(),
  /** 本镜时长（秒，Seedance 单段 3-8 秒；超范围落 5 秒由 normalize 再修正） */
  duration_sec: z.number().int().min(3).max(8).catch(5),
  /** Seedance 提示词（十段结构，M2 会强制注入身份锚点；官方工程型字段较多，放宽兼容长度） */
  seedance_prompt: z.string().min(20).max(1500),
  /** 旁白文案（TTS 用，20-50 字） */
  narration: z.string().min(5).max(120),
  /** 字幕（≤15 字，可含时间节点） */
  subtitle: z.string().max(30),
  /** 本镜音乐情绪（可覆盖全局；无效值落 nostalgic） */
  music_mood: z.enum(MUSIC_MOODS).optional().catch('nostalgic'),
  /** 本镜在场角色 id 列表（对应脚本 anchors 的 id；多宠物/多人场景用，缺省=全部） */
  characters_present: z.array(z.string().min(1)).max(10).optional().catch([]),
  /**
   * 镜头来源：ai_video=Seedance 生成动效（默认）；static_photo=静态照片 ffmpeg zoompan 动效
   * （全家福合影等"多角色同框、不重建角色"的镜头用 static_photo，零 AI 成本零一致性风险）
   */
  source: z.enum(['ai_video', 'static_photo']).optional().catch('ai_video'),
});

/** 角色锚点（多宠物/多人场景：每个在场角色一个锚点，全片逐镜逐字重复） */
export const CharacterAnchorSchema = z.object({
  /** 角色唯一 id（如 doubao / mama），供 segments.characters_present 引用 */
  id: z.string().min(1).max(20),
  /** 角色类型：宠物 / 人 */
  type: z.enum(['pet', 'human']).catch('pet'),
  /** 3-6 个物理特征（毛色/体型/五官/服装/发型；人用稳定特征不用表情） */
  desc: z.string().min(4).max(150),
});

/** 完整分镜脚本（LLM 输出 + 校验修正后） */
export const MemoirScriptSchema = z.object({
  /** 视频标题（字幕开场用） */
  title: z.string().min(1).max(60),
  /** 主题词 */
  theme: z.string().min(1).max(30),
  /** 情感曲线（CREST） */
  emotion_curve: z.array(z.enum(EMOTIONS)).min(1).max(6),
  /** 旁白音色偏好（火山豆包 speaker ID；实际合成以 config.doubaoSpeech.voice 为准，脚本值可覆盖） */
  narration_voice: z.string().min(1).max(40).default('zh_female_vv_uranus_bigtts'),
  /** 全局音乐情绪（映射 BGM 库；无效值落 nostalgic） */
  music_mood: z.enum(MUSIC_MOODS).catch('nostalgic'),
  /**
   * 身份锚点（旧版单角色字段，兼容历史脚本）
   * 新版用 anchors 数组（多宠物/多人）；normalizeScript 会把 identity_anchor 归一化为 anchors
   */
  identity_anchor: z.string().min(1).max(120).optional(),
  /** 角色锚点数组（多宠物/多人场景：每个在场角色一个） */
  anchors: z.array(CharacterAnchorSchema).min(1).max(10).optional(),
  /** 镜头序列 */
  segments: z.array(MemoirSegmentScriptSchema).min(1).max(15),
});

/** 推导类型：角色锚点 */
export type CharacterAnchor = z.infer<typeof CharacterAnchorSchema>;

/** 推导类型：完整分镜脚本 */
export type MemoirScript = z.infer<typeof MemoirScriptSchema>;

/** 推导类型：单镜分镜 */
export type MemoirSegmentScript = z.infer<typeof MemoirSegmentScriptSchema>;
