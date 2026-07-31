/**
 * 视频生成服务 - 回忆录视频生成的核心引擎
 * 双产品线隔离：
 *   1. 日常回忆录（daily）：静图动效技术，5-30 秒短视频
 *   2. 纪念Vlog（memorial）：多段静图动效合集 + 叙事编排，60-90 秒完整叙事视频
 *
 * 外部 API 集成预留：
 *   - 日常回忆录：调用图像动效 API（如可灵/即梦），单张图片 → 3-5 秒动效片段
 *   - 纪念Vlog：多张图片分别生成动效片段 → 拼接 + 转场 + BGM + 字幕 → 完整视频
 *
 * 安全约束：
 *   - 所有生成的视频必须经过内容审核
 *   - 审核失败自动重试（最多 2 次）
 *   - 最终失败需返回错误，调用方负责退款/退额度
 */
import { config } from '../config.js';
import { sanitizeError } from '../utils/sanitize.js';

/** 视频生成产品线类型 */
export type VideoProductLine = 'daily' | 'memorial';

/** 视频生成请求参数 */
export interface VideoGenerationParams {
  /** 任务 ID（用于日志追踪） */
  taskId: string;
  /** 产品线类型 */
  productLine: VideoProductLine;
  /** 源照片 URL 数组（日常 1-3 张，纪念 8-15 张） */
  sourcePhotos: string[];
  /** 用户提供的文案（可选，用于字幕/叙事） */
  sourceText?: string | null;
  /** 音乐风格 */
  musicStyle?: string | null;
  /** 目标时长（秒），日常 5-30，纪念 60-90 */
  duration?: number | null;
  /** 风格预设 */
  stylePreset?: string | null;
}

/** 视频生成结果 */
export interface VideoGenerationResult {
  /** 最终视频 URL */
  videoUrl: string;
  /** 预览视频 URL（较短或低分辨率） */
  previewUrl: string;
  /** 实际视频时长（秒） */
  actualDuration: number;
  /** 生成方式（用于审计） */
  engine: string;
}

/** 产品线配置常量 */
export const PRODUCT_LINE_CONFIG = {
  daily: {
    minPhotos: 1,
    maxPhotos: 3,
    minDuration: 5,
    maxDuration: 30,
    defaultDuration: 15,
  },
  memorial: {
    minPhotos: 8,
    maxPhotos: 15,
    minDuration: 60,
    maxDuration: 90,
    defaultDuration: 75,
  },
} as const;

/**
 * 根据 memoir_type 映射到产品线
 */
export function mapMemoirTypeToProductLine(memoirType: string): VideoProductLine {
  // memorial 类型走纪念 Vlog 产品线
  if (memoirType === 'memorial') {
    return 'memorial';
  }
  // daily/seasonal/milestone/custom 走日常回忆录产品线
  return 'daily';
}

/**
 * 校验源照片数量是否符合产品线要求
 * @returns null 表示通过，否则返回错误消息
 */
export function validatePhotoCount(
  productLine: VideoProductLine,
  photoCount: number,
): string | null {
  const cfg = PRODUCT_LINE_CONFIG[productLine];
  if (photoCount < cfg.minPhotos || photoCount > cfg.maxPhotos) {
    return `${productLine === 'memorial' ? '纪念Vlog' : '日常回忆录'}照片数量需 ${cfg.minPhotos}-${cfg.maxPhotos} 张，当前 ${photoCount} 张`;
  }
  return null;
}

/**
 * 校验目标时长是否符合产品线要求
 * @returns null 表示通过，否则返回错误消息
 */
export function validateDuration(
  productLine: VideoProductLine,
  duration: number | null | undefined,
): string | null {
  if (duration === null || duration === undefined) return null;
  const cfg = PRODUCT_LINE_CONFIG[productLine];
  if (duration < cfg.minDuration || duration > cfg.maxDuration) {
    return `${productLine === 'memorial' ? '纪念Vlog' : '日常回忆录'}时长需 ${cfg.minDuration}-${cfg.maxDuration} 秒，当前 ${duration} 秒`;
  }
  return null;
}

/**
 * 生成回忆录视频
 * 根据产品线调用不同的生成策略：
 *   - daily：单段静图动效
 *   - memorial：多段动效合集 + 叙事编排
 *
 * 外部 API 未配置时回退为 mock 模式（仅用于开发/测试环境）
 */
export async function generateMemoirVideo(
  params: VideoGenerationParams,
): Promise<VideoGenerationResult> {
  const { taskId, productLine, sourcePhotos, sourceText, musicStyle, duration, stylePreset } = params;

  // 参数校验
  const photoError = validatePhotoCount(productLine, sourcePhotos.length);
  if (photoError) {
    throw new Error(`[VideoGen] ${photoError}`);
  }

  const durationError = validateDuration(productLine, duration);
  if (durationError) {
    throw new Error(`[VideoGen] ${durationError}`);
  }

  const cfg = PRODUCT_LINE_CONFIG[productLine];
  const targetDuration = duration ?? cfg.defaultDuration;

  // 根据产品线选择生成策略
  if (productLine === 'memorial') {
    return generateMemorialVlog(taskId, sourcePhotos, sourceText, musicStyle, targetDuration, stylePreset);
  }
  return generateDailyMemoir(taskId, sourcePhotos, sourceText, musicStyle, targetDuration, stylePreset);
}

/**
 * 日常回忆录生成 - 静图动效技术
 * 将 1-3 张照片分别生成 3-5 秒动效片段，拼接为 5-30 秒短视频
 */
async function generateDailyMemoir(
  taskId: string,
  photos: string[],
  sourceText: string | null | undefined,
  musicStyle: string | null | undefined,
  targetDuration: number,
  stylePreset: string | null | undefined,
): Promise<VideoGenerationResult> {
  const apiKey = config.seedream?.apiKey;

  // 外部 API 未配置时使用 mock（开发/测试环境）
  if (!apiKey) {
    console.warn(`[VideoGen] Task ${taskId}: API key not configured, using mock mode (daily)`);
    return mockGenerationResult(taskId, 'daily', photos, targetDuration);
  }

  try {
    // 1. 为每张照片生成动效片段
    const segmentUrls = await Promise.all(
      photos.map((photo, index) =>
        generateSingleAnimationSegment(taskId, photo, index, stylePreset),
      ),
    );

    // 2. 拼接片段 + 添加 BGM + 字幕
    const finalVideo = await stitchSegmentsWithBgm(
      taskId,
      segmentUrls,
      musicStyle ?? 'warm',
      sourceText,
      targetDuration,
    );

    return {
      videoUrl: finalVideo.videoUrl,
      previewUrl: finalVideo.previewUrl,
      actualDuration: finalVideo.actualDuration,
      engine: 'daily-static-animation',
    };
  } catch (error) {
    throw new Error(`[VideoGen] Daily memoir generation failed: ${sanitizeError(error)}`);
  }
}

/**
 * 纪念Vlog生成 - 多段静图动效合集 + 叙事编排
 * 8-15 张照片分别生成动效 → 拼接 → 转场 → BGM → 字幕 → 60-90 秒完整叙事视频
 * 情感曲线设计：平静 → 回忆 → 痛感 → 释怀 → 余韵
 */
async function generateMemorialVlog(
  taskId: string,
  photos: string[],
  sourceText: string | null | undefined,
  musicStyle: string | null | undefined,
  targetDuration: number,
  stylePreset: string | null | undefined,
): Promise<VideoGenerationResult> {
  const apiKey = config.seedream?.apiKey;

  // 外部 API 未配置时使用 mock
  if (!apiKey) {
    console.warn(`[VideoGen] Task ${taskId}: API key not configured, using mock mode (memorial)`);
    return mockGenerationResult(taskId, 'memorial', photos, targetDuration);
  }

  try {
    // 1. 按情感曲线分配照片权重
    const narrativePlan = buildNarrativePlan(photos, targetDuration);

    // 2. 为每张照片生成动效片段（带情感参数）
    const segmentUrls = await Promise.all(
      narrativePlan.segments.map((seg, index) =>
        generateNarrativeAnimationSegment(taskId, seg.photoUrl, seg.emotion, index, stylePreset),
      ),
    );

    // 3. 拼接 + 转场效果 + BGM + 字幕（叙事编排）
    const finalVideo = await stitchNarrativeSegments(
      taskId,
      segmentUrls,
      narrativePlan,
      musicStyle ?? 'nostalgic',
      sourceText,
    );

    return {
      videoUrl: finalVideo.videoUrl,
      previewUrl: finalVideo.previewUrl,
      actualDuration: finalVideo.actualDuration,
      engine: 'memorial-narrative-vlog',
    };
  } catch (error) {
    throw new Error(`[VideoGen] Memorial Vlog generation failed: ${sanitizeError(error)}`);
  }
}

// ===== 内部辅助类型 =====

interface NarrativeSegment {
  photoUrl: string;
  emotion: 'calm' | 'memory' | 'pain' | 'relief' | 'lingering';
  duration: number;
  transition: 'fade' | 'dissolve' | 'cut';
}

interface NarrativePlan {
  segments: NarrativeSegment[];
  totalDuration: number;
  bgmCues: Array<{ timestamp: number; intensity: 'low' | 'medium' | 'high' }>;
}

interface StitchResult {
  videoUrl: string;
  previewUrl: string;
  actualDuration: number;
}

// ===== 内部实现 =====

/**
 * 构建叙事计划 - 按情感曲线分配照片和时长
 * 平静(20%) → 回忆(30%) → 痛感(15%) → 释怀(20%) → 余韵(15%)
 */
function buildNarrativePlan(photos: string[], targetDuration: number): NarrativePlan {
  const emotions: NarrativeSegment['emotion'][] = [
    'calm', 'calm',
    'memory', 'memory', 'memory',
    'pain',
    'relief', 'relief',
    'lingering',
  ];

  // 分配照片到各情感段
  const segments: NarrativeSegment[] = [];
  const photosPerSegment = Math.ceil(photos.length / emotions.length);

  for (let i = 0; i < photos.length; i++) {
    const emotionIndex = Math.min(Math.floor(i / photosPerSegment), emotions.length - 1);
    const emotion = emotions[emotionIndex];

    // 根据情感分配时长
    const durationMap: Record<NarrativeSegment['emotion'], number> = {
      calm: targetDuration * 0.08,
      memory: targetDuration * 0.10,
      pain: targetDuration * 0.07,
      relief: targetDuration * 0.09,
      lingering: targetDuration * 0.06,
    };

    const transition: NarrativeSegment['transition'] =
      emotion === 'pain' ? 'cut' : emotion === 'calm' ? 'fade' : 'dissolve';

    segments.push({
      photoUrl: photos[i],
      emotion,
      duration: durationMap[emotion],
      transition,
    });
  }

  // BGM 强度提示点
  const bgmCues = [
    { timestamp: 0, intensity: 'low' as const },
    { timestamp: targetDuration * 0.2, intensity: 'medium' as const },
    { timestamp: targetDuration * 0.5, intensity: 'high' as const },
    { timestamp: targetDuration * 0.65, intensity: 'medium' as const },
    { timestamp: targetDuration * 0.85, intensity: 'low' as const },
  ];

  const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);

  return { segments, totalDuration, bgmCues };
}

/**
 * 调用外部 API 为单张照片生成动效片段（日常回忆录用）
 */
async function generateSingleAnimationSegment(
  taskId: string,
  photoUrl: string,
  index: number,
  stylePreset: string | null | undefined,
): Promise<string> {
  // 预留外部 API 集成位置
  // 实际实现将调用如可灵/即梦等图像动效 API
  // 此处返回 mock URL（API key 校验已在调用方完成）
  throw new Error(`[VideoGen] External animation API not yet integrated for task ${taskId}, segment ${index}`);
}

/**
 * 调用外部 API 为单张照片生成带情感参数的动效片段（纪念Vlog用）
 */
async function generateNarrativeAnimationSegment(
  taskId: string,
  photoUrl: string,
  emotion: NarrativeSegment['emotion'],
  index: number,
  stylePreset: string | null | undefined,
): Promise<string> {
  // 预留外部 API 集成位置
  // 实际实现将调用图像动效 API，传入 emotion 参数控制动效风格
  throw new Error(`[VideoGen] External narrative animation API not yet integrated for task ${taskId}, segment ${index}, emotion ${emotion}`);
}

/**
 * 拼接片段 + BGM + 字幕（日常回忆录用）
 */
async function stitchSegmentsWithBgm(
  taskId: string,
  segmentUrls: string[],
  musicStyle: string,
  sourceText: string | null | undefined,
  targetDuration: number,
): Promise<StitchResult> {
  // 预留视频拼接 API 集成位置
  throw new Error(`[VideoGen] Video stitching API not yet integrated for task ${taskId}`);
}

/**
 * 拼接叙事片段 + 转场 + BGM + 字幕（纪念Vlog用）
 */
async function stitchNarrativeSegments(
  taskId: string,
  segmentUrls: string[],
  narrativePlan: NarrativePlan,
  musicStyle: string,
  sourceText: string | null | undefined,
): Promise<StitchResult> {
  // 预留视频拼接 API 集成位置
  throw new Error(`[VideoGen] Narrative stitching API not yet integrated for task ${taskId}`);
}

/**
 * Mock 生成结果（开发/测试环境使用）
 * 当外部 API 未配置时返回模拟 URL，确保流程可验证
 */
function mockGenerationResult(
  taskId: string,
  productLine: VideoProductLine,
  photos: string[],
  targetDuration: number,
): VideoGenerationResult {
  const prefix = productLine === 'memorial' ? 'memorial' : 'daily';
  console.warn(
    `[VideoGen] Task ${taskId}: Mock ${prefix} video generated, photos=${photos.length}, duration=${targetDuration}s`,
  );

  return {
    videoUrl: `https://mock-cdn.example.com/${prefix}/${taskId}/video.mp4`,
    previewUrl: `https://mock-cdn.example.com/${prefix}/${taskId}/preview.mp4`,
    actualDuration: targetDuration,
    engine: `mock-${productLine}`,
  };
}
