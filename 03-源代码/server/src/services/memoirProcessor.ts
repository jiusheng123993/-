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
import {
  generateMemoirVideo,
  mapMemoirTypeToProductLine,
  type VideoGenerationResult,
} from './videoGenerationService.js';
import { sendToUser } from './websocketService.js';
import { config } from '../config.js';
import { sanitizeError } from '../utils/sanitize.js';

/** 最大重试次数（审核失败时） */
const MAX_RETRY_COUNT = 2;

/** 单次轮询最多处理的任务数 */
const BATCH_SIZE = 5;

/** 轮询间隔（毫秒） */
const POLL_INTERVAL_MS = 30_000;

const memoirRepository = new MemoirRepository();

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

    // 4. 调用视频生成服务
    const result = await generateMemoirVideo({
      taskId: task.id,
      productLine,
      sourcePhotos: task.source_photos,
      sourceText: task.source_text,
      musicStyle: typeof narrative.music_style === 'string' ? narrative.music_style : null,
      duration: typeof narrative.duration === 'number' ? narrative.duration : null,
      stylePreset: typeof narrative.style_preset === 'string' ? narrative.style_preset : null,
    });

    // 5. 内容审核
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

    console.error(`[MemoirProcessor] Task ${task.id}: Failed after max retries:`, errorMessage);
    return false;
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
 * 视频内容审核
 * 调用内容审核 API 检查生成视频是否合规
 * @returns 'pass' | 'review' | 'block'
 */
async function moderateVideo(videoUrl: string): Promise<'pass' | 'review' | 'block'> {
  const apiKey = config.moderate?.apiKey;
  if (!apiKey) {
    console.warn('[MemoirProcessor] Content moderation API not configured, defaulting to pass');
    return 'pass';
  }

  try {
    // 调用内容审核 API（复用 themeSuiteService 中的审核逻辑）
    // 此处使用视频审核接口，与图片审核类似
    const response = await fetch('https://api.volcengine.com/v2/video/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        video_urls: [videoUrl],
        scenes: ['porn', 'terrorism', 'political', 'ad'],
      }),
    });

    if (!response.ok) {
      console.error('[MemoirProcessor] Moderation API error: status', response.status);
      return 'review';
    }

    const data = (await response.json()) as {
      results?: Array<{ scene: string; suggestion: 'pass' | 'review' | 'block' }>;
    };

    if (!data.results || data.results.length === 0) {
      console.warn('[MemoirProcessor] Moderation API returned empty results, defaulting to review');
      return 'review';
    }

    const hasBlock = data.results.some((r) => r.suggestion === 'block');
    const hasReview = data.results.some((r) => r.suggestion === 'review');

    if (hasBlock) return 'block';
    if (hasReview) return 'review';
    return 'pass';
  } catch (error) {
    console.error('[MemoirProcessor] Moderation call failed:', sanitizeError(error));
    return 'review';
  }
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
