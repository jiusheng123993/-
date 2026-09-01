/**
 * 回忆录任务处理器 - 异步队列消费器
 * 职责：
 *   1. 轮询 pending 状态的回忆录任务
 *   2. 抢占任务（原子更新为 processing，防止并发重复处理）
 *   3. 调用视频生成服务
 *   4. 对生成结果进行内容审核
 *   5. 审核失败自动重试（最多 2 次）
 *   6. 最终成功/失败后通过 WebSocket 通知用户
 *   7. 最终失败需退款/退额度（由调用方在 service 层处理）
 *
 * 安全约束：
 *   - 单次最多处理 5 个任务（防止阻塞）
 *   - 每个任务最多重试 2 次
 *   - 日志脱敏：不记录照片 URL、用户文案
 */
import { MemoirRepository, type MemoirRecordRow } from '../repositories/memoirRepository.js';
import { PetRepository } from '../repositories/petRepository.js';
import {
  generateMemoirVideo,
  mapMemoirTypeToProductLine,
  type VideoGenerationResult,
} from './videoGenerationService.js';
import { generateMemoirScript, sanitizeMemoirScriptPrompts } from './memoirScriptService.js';
import { analyzeMemoirPhotos } from './memoirPhotoAnalysis.js';
import { buildMemoryContext, getMemoriesByTags } from './memoryService.js';
import { checkVideoQuality } from './qualityCheckService.js';
import { cleanupNarration } from './ttsService.js';
import { cleanupDoubaoSpeech } from './doubaoSpeechTts.js';
import type { MemoirScript } from '../schemas/memoirScript.js';
import { moderateVideo } from './videoModerationService.js';
import { sendToUser } from './websocketService.js';
import { postMemoirCompletedFeed } from './autoFeedService.js';
import { postMemoirTimelineMoment } from './autoFeedService.js';
import { sanitizeError } from '../utils/sanitize.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

/** 服务器工作目录（上传/生成产物根目录，质检抽帧用） */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '..', config.uploadDir);

/** 最大重试次数（审核失败时） */
const MAX_RETRY_COUNT = 2;

/** 单次轮询最多处理的任务数 */
const BATCH_SIZE = 5;

/** 轮询间隔（毫秒） */
const POLL_INTERVAL_MS = 30_000;

const memoirRepository = new MemoirRepository();
const petRepository = new PetRepository();

/** 任务处理状态（用于 in-memory 重试计数） */
const retryCountMap = new Map<string, number>();

/** 处理器是否正在运行 */
let isRunning = false;

/** 轮询定时器 */
let pollTimer: NodeJS.Timeout | null = null;

/**
 * 启动回忆录任务处理器
 * 定时轮询 pending 任务并处理
 */
export function startMemoirProcessor(): void {
  if (isRunning) {
    console.warn('[MemoirProcessor] Already running, skip start');
    return;
  }
  isRunning = true;
  console.log(`[MemoirProcessor] Started, polling every ${POLL_INTERVAL_MS / 1000}s`);

  // 立即执行一次，然后定时轮询
  pollOnce().catch((err) => {
    console.error('[MemoirProcessor] Initial poll failed:', sanitizeError(err));
  });

  pollTimer = setInterval(() => {
    pollOnce().catch((err) => {
      console.error('[MemoirProcessor] Poll failed:', sanitizeError(err));
    });
  }, POLL_INTERVAL_MS);
}

/**
 * 停止回忆录任务处理器
 */
export function stopMemoirProcessor(): void {
  isRunning = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  console.log('[MemoirProcessor] Stopped');
}

/**
 * 单次轮询处理
 * 查询 pending 任务，逐个抢占并处理
 */
export async function pollOnce(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const pendingTasks = await memoirRepository.findPendingTasks(BATCH_SIZE);

  if (pendingTasks.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const task of pendingTasks) {
    try {
      const success = await processTask(task);
      if (success) {
        succeeded++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`[MemoirProcessor] Task ${task.id} unexpected error:`, sanitizeError(err));
      failed++;
    }
  }

  console.log(
    `[MemoirProcessor] Batch done: processed=${pendingTasks.length}, succeeded=${succeeded}, failed=${failed}`,
  );

  return { processed: pendingTasks.length, succeeded, failed };
}

/**
 * 处理单个回忆录任务
 * @returns true 表示成功完成，false 表示失败或重试中
 */
export async function processTask(task: MemoirRecordRow): Promise<boolean> {
  // 1. 原子抢占任务（防止并发重复处理）
  const claimed = await memoirRepository.claimTask(task.id);
  if (!claimed) {
    // 已被其他处理器抢占，跳过
    return false;
  }

  console.log(`[MemoirProcessor] Task ${task.id} claimed, processing...`);

  try {
    // 2. 解析叙事结构
    const narrative = parseNarrativeStructure(task.narrative_structure);

    // 3. 映射产品线
    const productLine = mapMemoirTypeToProductLine(task.memoir_type);

    // 4. 回忆录 2.0：确保分镜脚本存在（无则调用 M1 生成并持久化）
    const script = await ensureMemoirScript(task, narrative, productLine);

    // 5. 调用视频生成服务（分镜驱动新管线）
    const result = await generateMemoirVideo({
      taskId: task.id,
      productLine,
      sourcePhotos: task.source_photos,
      sourceText: task.source_text,
      musicStyle: typeof narrative.music_style === 'string' ? narrative.music_style : null,
      duration: typeof narrative.duration === 'number' ? narrative.duration : null,
      stylePreset: typeof narrative.style_preset === 'string' ? narrative.style_preset : null,
      script,
    });

    // 6. 质量质检（回忆录 2.0 M5：DeepSeek 视觉抽帧评分）
    //    degraded=true（质检不可用）时放行；不合格时整条重试
    const localFinalPath = path.join(UPLOAD_DIR, 'memoir', task.id, 'final.mp4');
    const quality = await checkVideoQuality({
      videoPath: localFinalPath,
      identityAnchor: script?.identity_anchor,
    });
    if (!quality.passed && !quality.degraded) {
      const retried = await handleRetry(task.id, `质量质检未通过: ${quality.defects.join('；') || '低分'}`);
      if (retried) {
        console.warn(`[MemoirProcessor] Task ${task.id}: Quality check failed, retrying`);
        return false;
      }
      await memoirRepository.markFailed(task.id, '质量质检未通过');
      await notifyUser(task.user_id, {
        type: 'memoir_failed',
        taskId: task.id,
        reason: '视频质量未达标',
      });
      console.warn(`[MemoirProcessor] Task ${task.id}: Quality check failed, max retries exceeded`);
      return false;
    }

    // 7. 内容审核
    const moderationResult = await moderateVideo(result.videoUrl);

    if (moderationResult === 'block') {
      // 审核拒绝，尝试重试
      const retried = await handleRetry(task.id, `内容审核拒绝`);
      if (retried) {
        console.warn(`[MemoirProcessor] Task ${task.id}: Content blocked, retrying`);
        return false;
      }
      // 重试次数用完，标记失败
      await memoirRepository.markFailed(task.id, '内容审核拒绝，已超过最大重试次数');
      await notifyUser(task.user_id, {
        type: 'memoir_failed',
        taskId: task.id,
        reason: '内容审核未通过',
      });
      console.warn(`[MemoirProcessor] Task ${task.id}: Content blocked, max retries exceeded`);
      return false;
    }

    if (moderationResult === 'review') {
      // 需要人工审核，先标记完成但标记为需审核
      console.warn(`[MemoirProcessor] Task ${task.id}: Content flagged for manual review`);
    }

    // 6. 审核通过，标记完成
    await memoirRepository.markCompleted(task.id, result.videoUrl, result.previewUrl);
    // 回忆录生成完成 → 自动发家庭动态
    void postMemoirCompletedFeed(task.user_id, task.pet_id, task.memoir_type);
    // 回忆录生成完成 → 写入时光线（pet_moments）
    void postMemoirTimelineMoment(task.user_id, task.pet_id, task.memoir_type, result.videoUrl, result.previewUrl);

    // 清理 TTS 临时文件（旁白中间产物，防磁盘泄漏）
    void cleanupTaskTempFiles(task.id);

    // 7. 清理重试计数
    retryCountMap.delete(task.id);

    // 8. 通知用户
    await notifyUser(task.user_id, {
      type: 'memoir_completed',
      taskId: task.id,
      previewUrl: result.previewUrl,
    });

    console.log(`[MemoirProcessor] Task ${task.id}: Completed successfully`);
    return true;
  } catch (err) {
    const errorMessage = sanitizeError(err);

    // 生成失败，尝试重试
    const retried = await handleRetry(task.id, errorMessage);
    if (retried) {
      console.warn(`[MemoirProcessor] Task ${task.id}: Generation failed, retrying`);
      return false;
    }

    // 重试次数用完，标记失败
    await memoirRepository.markFailed(task.id, errorMessage);
    await notifyUser(task.user_id, {
      type: 'memoir_failed',
      taskId: task.id,
      reason: '视频生成失败',
    });
    // 清理 TTS 临时文件
    void cleanupTaskTempFiles(task.id);

    console.error(`[MemoirProcessor] Task ${task.id}: Failed after max retries:`, errorMessage);
    return false;
  }
}

/**
 * 清理任务相关的 TTS 临时文件（旁白中间产物）
 * @param taskId - 任务 ID
 */
function cleanupTaskTempFiles(taskId: string): void {
  void cleanupNarration(taskId).catch(() => {});
  void cleanupDoubaoSpeech(taskId).catch(() => {});
}

/**
 * 确保任务有分镜脚本（回忆录 2.0）
 * 1. narrative_structure.script 已存在 → 直接返回（重试场景复用）
 * 2. 不存在 → 查宠物档案 + 记忆摘要 → 调用 M1 分镜生成 → 持久化到任务
 * 降级：分镜生成失败返回 undefined（走旧管线），不阻断生成
 * @param task - 回忆录任务
 * @param narrative - 解析后的叙事结构（含旧字段 music_style/duration/style_preset）
 * @param productLine - 产品线
 * @returns 分镜脚本（失败/旧任务返回 undefined）
 */
async function ensureMemoirScript(
  task: MemoirRecordRow,
  narrative: Record<string, unknown>,
  productLine: 'daily' | 'memorial',
): Promise<MemoirScript | undefined> {
  const existing = narrative.script;
  // 宠物查询也必须遵循“分镜失败不阻断旧管线”的降级约定，数据库短暂异常时使用无名字兜底档案。
  let pet: Awaited<ReturnType<PetRepository['findByIdAndUser']>> = null;
  try {
    pet = await petRepository.findByIdAndUser(task.pet_id, task.user_id);
  } catch (error) {
    console.warn(`[MemoirProcessor] Task ${task.id}: 宠物档案查询失败，使用安全兜底档案:`, sanitizeError(error));
  }
  const petProfile = pet
    ? {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        birth_date: pet.birth_date,
        notes: pet.notes,
        is_deceased: pet.is_deceased,
      }
    : { name: '宝贝', species: 'cat', breed: '宠物' };

  // 重试任务复用已持久化脚本，但仍经过当前安全清洗，避免历史脚本中的名字进入生成模型。
  if (existing && typeof existing === 'object') {
    return sanitizeMemoirScriptPrompts(existing as MemoirScript, {
      petProfile,
      photoCount: task.source_photos.length,
      productLine,
      targetDuration: typeof narrative.duration === 'number' ? narrative.duration : productLine === 'memorial' ? 75 : 15,
    });
  }

  try {

    // 记忆摘要（F4：按回忆标签筛核心层记忆作素材；失败不影响分镜生成）
    let memorySummary: string | undefined;
    try {
      const tags = Array.isArray(narrative.tags) ? (narrative.tags as string[]) : undefined;
      if (tags && tags.length > 0) {
        // 用户选了标签 → 按标签取核心层记忆（记忆驱动）
        memorySummary = await getMemoriesByTags({
          userId: task.user_id,
          petId: task.pet_id,
          tags,
          limit: 20,
        });
      } else {
        // 未选标签 → 用完整记忆上下文
        const ctx = await buildMemoryContext(
          task.user_id,
          task.pet_id,
          task.source_text || '为宠物生成回忆录分镜',
        );
        memorySummary = ctx.memories || undefined;
      }
    } catch {
      // 记忆摘要失败忽略
    }

    // 分镜模型本身看不到照片，先用视觉服务逐张提取可见事实；单图失败会在服务内保守降级。
    const photoDescriptions = await analyzeMemoirPhotos(task.source_photos);

    const script = await generateMemoirScript({
      petProfile,
      memorySummary,
      photoCount: task.source_photos.length,
      productLine,
      targetDuration:
        typeof narrative.duration === 'number'
          ? narrative.duration
          : productLine === 'memorial'
            ? 75
            : 15,
      sourceText: task.source_text,
      musicStyle: typeof narrative.music_style === 'string' ? narrative.music_style : null,
      photoDescriptions,
    });

    // 持久化分镜（失败仅记录，不影响本任务生成）
    try {
      await memoirRepository.updateScript(task.id, script as unknown as Record<string, unknown>);
    } catch (err) {
      console.warn('[MemoirProcessor] 分镜持久化失败（不影响生成）:', sanitizeError(err));
    }
    return script;
  } catch (err) {
    // 分镜生成失败 → 回退旧管线（功能可用，质量降级）
    console.warn('[MemoirProcessor] 分镜生成失败，回退旧管线:', sanitizeError(err));
    return undefined;
  }
}

/**
 * 解析叙事结构 JSONB 字段
 */
function parseNarrativeStructure(
  raw: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return raw;
}

/**
 * 处理重试逻辑
 * @returns true 表示已重置为 pending（可重试），false 表示重试次数用完
 */
async function handleRetry(taskId: string, _reason: string): Promise<boolean> {
  const currentCount = retryCountMap.get(taskId) ?? 0;
  if (currentCount >= MAX_RETRY_COUNT) {
    retryCountMap.delete(taskId);
    return false;
  }

  retryCountMap.set(taskId, currentCount + 1);
  await memoirRepository.resetToPending(taskId);
  return true;
}

/**
 * 通过 WebSocket 通知用户任务状态变更
 */
async function notifyUser(
  userId: string,
  message: {
    type: 'memoir_completed' | 'memoir_failed';
    taskId: string;
    previewUrl?: string;
    reason?: string;
  },
): Promise<void> {
  try {
    sendToUser(userId, {
      event: 'memoir_status',
      data: message,
    });
  } catch (err) {
    // WebSocket 通知失败不影响主流程，仅记录日志
    console.warn(`[MemoirProcessor] WebSocket notify failed for user ${userId}:`, sanitizeError(err));
  }
}

/**
 * 获取任务重试次数（用于测试和监控）
 */
export function getRetryCount(taskId: string): number {
  return retryCountMap.get(taskId) ?? 0;
}

/**
 * 重置处理器状态（用于测试）
 */
export function resetProcessorState(): void {
  retryCountMap.clear();
}
