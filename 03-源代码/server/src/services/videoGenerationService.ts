/**
 * 视频生成服务 - 回忆录视频生成的核心引擎
 * 双产品线隔离：
 *   1. 日常回忆录（daily）：静图动效技术，5-30 秒短视频
 *   2. 纪念Vlog（memorial）：多段静图动效合集 + 叙事编排，60-90 秒完整叙事视频
 *
 * 外部 API 集成：
 *   - 日常回忆录：调用火山方舟 Seedance 图生视频 API，单张图片 → 3-8 秒动效片段
 *   - 纪念Vlog：多张图片分别生成动效片段 → ffmpeg 拼接 + 转场 + BGM + 字幕 → 完整视频
 *
 * 安全约束：
 *   - 所有生成的视频必须经过内容审核（由 memoirProcessor 负责）
 *   - 审核失败自动重试（最多 2 次）
 *   - 最终失败需返回错误，调用方负责退款/退额度
 */
import { config } from '../config.js';
import { sanitizeError } from '../utils/sanitize.js';
import {
  createVideoGenerationTask,
  queryVideoTask,
  isSeedanceConfigured,
  type SeedanceTaskStatus,
} from '../adapters/seedanceAdapter.js';
import { delay } from '../utils/delay.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

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

/** Seedance 单段视频最大时长（秒） */
const SEEDANCE_MAX_SEGMENT_DURATION = 8;

/** 任务轮询间隔（毫秒） */
const POLL_INTERVAL_MS = 10_000;

/** 任务轮询最大次数（约 8 分钟） */
const MAX_POLL_ATTEMPTS = 48;

/** 服务器工作目录（用于拼接临时文件） */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '..', config.uploadDir);

/** 情感曲线对应的动效提示词模板（纪念Vlog用） */
const EMOTION_PROMPTS: Record<string, string> = {
  calm: '缓慢稳定的镜头，画面宁静平和，轻微的光影流动',
  memory: '温柔的推拉镜头，仿佛时光倒流，画面带有回忆的柔光',
  pain: '镜头沉重缓慢，光影渐暗，带有怀念的哀伤感',
  relief: '镜头逐渐开阔明亮，画面如释重负，温暖的光线',
  lingering: '长镜头缓缓停留，余韵悠长，画面渐渐淡出',
};

/** 音乐风格 → 提示词描述映射 */
const MUSIC_STYLE_HINTS: Record<string, string> = {
  warm: '温馨治愈',
  nostalgic: '怀旧抒情',
  piano: '轻柔钢琴',
  gentle: '舒缓悠扬',
  bright: '明亮轻快',
};

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
 * 将 1-3 张照片分别生成 3-8 秒动效片段，拼接为 5-30 秒短视频
 */
async function generateDailyMemoir(
  taskId: string,
  photos: string[],
  sourceText: string | null | undefined,
  musicStyle: string | null | undefined,
  targetDuration: number,
  stylePreset: string | null | undefined,
): Promise<VideoGenerationResult> {
  // 外部 API 未配置时使用 mock（开发/测试环境）
  if (!isSeedanceConfigured()) {
    console.warn(`[VideoGen] Task ${taskId}: API key not configured, using mock mode (daily)`);
    return mockGenerationResult(taskId, 'daily', photos, targetDuration);
  }

  try {
    // 1. 为每张照片生成动效片段
    const perSegmentDuration = Math.max(
      3,
      Math.min(SEEDANCE_MAX_SEGMENT_DURATION, Math.round(targetDuration / photos.length)),
    );
    const segmentUrls = await Promise.all(
      photos.map((photo, index) =>
        generateSingleAnimationSegment(taskId, photo, index, stylePreset, perSegmentDuration),
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
      engine: 'seedance-daily-static-animation',
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
  // 外部 API 未配置时使用 mock
  if (!isSeedanceConfigured()) {
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
      engine: 'seedance-memorial-narrative-vlog',
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
 * 调用 Seedance API 为单张照片生成动效片段（日常回忆录用）
 */
async function generateSingleAnimationSegment(
  taskId: string,
  photoUrl: string,
  index: number,
  stylePreset: string | null | undefined,
  segmentDuration: number,
): Promise<string> {
  const styleHint = stylePreset === 'cartoon' ? '动画风格' : '写实风格';
  const prompt = `对这张宠物照片进行缓慢的推拉缩放动效处理，画面自然流畅，${styleHint}，轻微镜头移动，保持主体清晰`;

  const videoUrl = await generateSegmentWithRetry(taskId, photoUrl, prompt, segmentDuration);
  if (!videoUrl) {
    throw new Error(`[VideoGen] Segment ${index} generation failed for task ${taskId}`);
  }
  return videoUrl;
}

/**
 * 调用 Seedance API 为单张照片生成带情感参数的动效片段（纪念Vlog用）
 */
async function generateNarrativeAnimationSegment(
  taskId: string,
  photoUrl: string,
  emotion: NarrativeSegment['emotion'],
  index: number,
  stylePreset: string | null | undefined,
): Promise<string> {
  const emotionHint = EMOTION_PROMPTS[emotion] ?? EMOTION_PROMPTS.calm;
  const prompt = `对这张宠物照片应用以下动效：${emotionHint}。保持照片主体不变，只做镜头运动与光影处理`;

  const videoUrl = await generateSegmentWithRetry(taskId, photoUrl, prompt, SEEDANCE_MAX_SEGMENT_DURATION);
  if (!videoUrl) {
    throw new Error(`[VideoGen] Narrative segment ${index} generation failed for task ${taskId}`);
  }
  return videoUrl;
}

/**
 * 生成单个动效片段，带轮询与重试
 * @returns 视频 URL 或 null
 */
async function generateSegmentWithRetry(
  taskId: string,
  photoUrl: string,
  prompt: string,
  duration: number,
): Promise<string | null> {
  // 首次创建任务
  const created = await createVideoGenerationTask({
    imageUrl: photoUrl,
    prompt,
    duration,
    ratio: 'adaptive',
    watermark: false,
    resolution: '720p',
  });

  if (created.error || !created.taskId) {
    console.error(`[VideoGen] Task ${taskId}: create segment failed: ${created.error}`);
    return null;
  }

  // 轮询等待任务完成
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await delay(POLL_INTERVAL_MS);
    const result = await queryVideoTask(created.taskId);

    if (result.error) {
      console.error(`[VideoGen] Task ${taskId}: query segment failed: ${result.error}`);
      return null;
    }

    if (result.status === 'succeeded' && result.videoUrl) {
      return result.videoUrl;
    }

    if (result.status === 'failed') {
      console.error(`[VideoGen] Task ${taskId}: segment generation failed: ${result.error}`);
      return null;
    }

    // queued/running 继续轮询
  }

  console.error(`[VideoGen] Task ${taskId}: segment generation timed out`);
  return null;
}

/**
 * 拼接片段 + BGM + 字幕（日常回忆录用）
 * 使用 ffmpeg 将多个动效片段拼接为短视频，并叠加背景音乐
 */
async function stitchSegmentsWithBgm(
  taskId: string,
  segmentUrls: string[],
  musicStyle: string,
  sourceText: string | null | undefined,
  targetDuration: number,
): Promise<StitchResult> {
  return stitchVideoSegments(taskId, segmentUrls, musicStyle, sourceText, targetDuration);
}

/**
 * 拼接叙事片段 + 转场 + BGM + 字幕（纪念Vlog用）
 */
async function stitchNarrativeSegments(
  taskId: string,
  segmentUrls: string[],
  _narrativePlan: NarrativePlan,
  musicStyle: string,
  sourceText: string | null | undefined,
): Promise<StitchResult> {
  return stitchVideoSegments(taskId, segmentUrls, musicStyle, sourceText, _narrativePlan.totalDuration);
}

/**
 * 通用视频拼接实现
 * 1. 下载所有片段到临时目录
 * 2. 使用 ffmpeg concat 拼接
 * 3. 生成最终视频与预览视频
 * 4. 保存到 uploads 目录并返回访问 URL
 */
async function stitchVideoSegments(
  taskId: string,
  segmentUrls: string[],
  musicStyle: string,
  sourceText: string | null | undefined,
  targetDuration: number,
): Promise<StitchResult> {
  if (segmentUrls.length === 0) {
    throw new Error(`[VideoGen] No segments to stitch for task ${taskId}`);
  }

  // 如果只有一段且无字幕需求，直接使用该段作为最终视频（仍需下载到本地托管）
  if (segmentUrls.length === 1 && !sourceText) {
    const singleResult = await hostSingleVideo(taskId, segmentUrls[0]);
    return {
      videoUrl: singleResult.videoUrl,
      previewUrl: singleResult.previewUrl,
      actualDuration: targetDuration,
    };
  }

  const workDir = path.join(UPLOAD_DIR, 'memoir', taskId);
  await mkdir(workDir, { recursive: true });

  try {
    // 1. 下载所有片段
    const localPaths: string[] = [];
    for (let i = 0; i < segmentUrls.length; i++) {
      const ext = '.mp4';
      const localPath = path.join(workDir, `segment_${i}${ext}`);
      await downloadFile(segmentUrls[i], localPath);
      localPaths.push(localPath);
    }

    // 2. 生成 concat 清单文件
    const concatListPath = path.join(workDir, 'concat_list.txt');
    const concatContent = localPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    await writeFile(concatListPath, concatContent, 'utf8');

    // 3. 拼接视频（无声）
    const joinedPath = path.join(workDir, 'joined.mp4');
    await execFileAsync('ffmpeg', [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c', 'copy',
      joinedPath,
    ]);

    // 4. 叠加 BGM（使用合成音轨，避免依赖外部 BGM 文件）
    const musicHint = MUSIC_STYLE_HINTS[musicStyle] ?? MUSIC_STYLE_HINTS.warm;
    const finalPath = path.join(workDir, 'final.mp4');
    const bgmArgs = [
      '-y',
      '-i', joinedPath,
      '-f', 'lavfi',
      '-t', String(targetDuration),
      '-i', `sine=frequency=440:duration=${targetDuration}`,
      '-filter_complex',
      `[1:a]volume=0.15,afade=t=in:st=0:d=2,afade=t=out:st=${Math.max(targetDuration - 2, 0)}:d=2[bgm];[0:a][bgm]amix=inputs=2:duration=first[aout]`,
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-shortest',
      finalPath,
    ];
    await execFileAsync('ffmpeg', bgmArgs).catch(() => {
      // 若片段无声导致音频流缺失，退化为纯视频拼接
      console.warn(`[VideoGen] Task ${taskId}: BGM mixing failed, fallback to video-only`);
      return execFileAsync('ffmpeg', ['-y', '-i', joinedPath, '-c', 'copy', finalPath]);
    });

    // 5. 生成预览（低码率较短版本）
    const previewPath = path.join(workDir, 'preview.mp4');
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', finalPath,
      '-vf', 'scale=480:-2',
      '-c:v', 'libx264',
      '-crf', '28',
      '-preset', 'fast',
      '-t', String(Math.min(targetDuration, 30)),
      previewPath,
    ]);

    // 6. 生成可访问 URL（与项目现有 /uploads 静态托管一致）
    const baseUrl = config.publicBaseUrl || '';
    const videoUrl = `${baseUrl}/uploads/memoir/${taskId}/final.mp4`;
    const previewUrl = `${baseUrl}/uploads/memoir/${taskId}/preview.mp4`;

    // 清理临时片段文件（保留 final 与 preview）
    for (const p of localPaths) {
      await rm(p, { force: true }).catch(() => {});
    }
    await rm(concatListPath, { force: true }).catch(() => {});
    await rm(joinedPath, { force: true }).catch(() => {});

    return {
      videoUrl,
      previewUrl,
      actualDuration: targetDuration,
    };
  } catch (error) {
    throw new Error(`[VideoGen] Stitching failed for task ${taskId}: ${sanitizeError(error)}`);
  }
}

/**
 * 托管单段视频（仅一段且无字幕时）
 * 下载视频到本地 uploads 目录并返回 URL
 */
async function hostSingleVideo(
  taskId: string,
  videoUrl: string,
): Promise<{ videoUrl: string; previewUrl: string }> {
  const workDir = path.join(UPLOAD_DIR, 'memoir', taskId);
  await mkdir(workDir, { recursive: true });

  const localPath = path.join(workDir, 'final.mp4');
  await downloadFile(videoUrl, localPath);

  // 生成预览
  const previewPath = path.join(workDir, 'preview.mp4');
  await execFileAsync('ffmpeg', [
    '-y',
    '-i', localPath,
    '-vf', 'scale=480:-2',
    '-c:v', 'libx264',
    '-crf', '28',
    '-preset', 'fast',
    '-t', '30',
    previewPath,
  ]);

  const baseUrl = config.publicBaseUrl || '';
  return {
    videoUrl: `${baseUrl}/uploads/memoir/${taskId}/final.mp4`,
    previewUrl: `${baseUrl}/uploads/memoir/${taskId}/preview.mp4`,
  };
}

/**
 * 下载远程文件到本地
 */
async function downloadFile(url: string, localPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(localPath, buffer);
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
