/**
 * 2D 形象包生成服务 - 调用 Seedream API 批量生成宠物多角度表情包
 * 包含表情、角度、动作三种维度，支持 429 重试和并发控制
 */
import { config } from '../config.js';
import { pool } from '../db.js';
import { updateTaskProgress, updateTaskStatus, updateTaskResult } from './taskQueue.js';
import { delay } from '../utils/delay.js';

const SEEDREAM_API = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

// [SYNC] 以下常量 key 必须与前端 constants/index.ts 中 AVATAR_EXPRESSIONS/AVATAR_ANGLES/AVATAR_ACTIONS 保持一致
// 修改时需同步更新前端，否则 2D 图片的 expression/angle 字段与前端选择器不匹配
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

const ACTION_ANGLES = ANGLES.slice(0, 3);

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

/** 并发批次大小（控制 API 并发数，避免触发限流） */
const CONCURRENCY = 5;

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
  let failed = 0;

  /** 构建所有生成任务 */
  const tasks: Array<{ itemKey: string; itemLabel: string; angleKey: string; angleLabel: string; sortOrder: number }> = [];
  let sortOrder = 0;
  for (const item of items) {
    for (const angle of angleList) {
      tasks.push({ itemKey: item.key, itemLabel: item.label, angleKey: angle.key, angleLabel: angle.label, sortOrder });
      sortOrder++;
    }
  }

  /** 分批并发执行 */
  for (let batchStart = 0; batchStart < tasks.length; batchStart += CONCURRENCY) {
    const batch = tasks.slice(batchStart, batchStart + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(task => {
        const prompt = isAction
          ? `一只${breed}${speciesName}，正在${task.itemLabel}，${task.angleLabel}视角，${styleText}，高质量，干净背景，参考照片中的宠物外貌`
          : `一只${breed}${speciesName}，${task.itemLabel}的表情，${task.angleLabel}视角，${styleText}，高质量，干净背景，参考照片中的宠物外貌`;

        return callSeedream(prompt, referencePhotoUrl, apiKey).then(imageUrl => {
          if (imageUrl) {
            return pool.query(
              `INSERT INTO avatar_2d_images (task_id, angle, expression, image_url, sort_order)
               VALUES ($1, $2, $3, $4, $5)`,
              [taskId, task.angleKey, task.itemKey, imageUrl, task.sortOrder],
            ).then(() => true);
          }
          return false;
        }).catch(() => {
          console.warn(`[Image2D] Failed to generate: ${task.itemKey} ${task.angleKey}`);
          return false;
        });
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && !result.value) {
        failed++;
      } else if (result.status === 'rejected') {
        failed++;
      }
      completed++;
      const progress = progressStart + Math.floor((completed / total) * (progressEnd - progressStart));
      await updateTaskProgress(taskId, progress);
    }

    // 批次间延迟，避免 API 限流
    await delay(isAction ? 300 : 200);
  }

  if (failed > 0) {
    console.warn(`[Image2D] Batch completed: ${total} total, ${failed} failed, ${total - failed} success`);
  }
}

const MAX_429_RETRIES = 2;

async function callSeedream(prompt: string, referenceImageUrl: string, apiKey: string, retryCount = 0): Promise<string | null> {
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
      image: referenceImageUrl,
    }),
  });

  if (!response.ok) {
    if (response.status === 429 && retryCount < MAX_429_RETRIES) {
      const backoff = 5000 * (retryCount + 1);
      await delay(backoff);
      return callSeedream(prompt, referenceImageUrl, apiKey, retryCount + 1);
    }
    return null;
  }

  const data = (await response.json()) as { data: Array<{ url: string }> };
  return data.data?.[0]?.url || null;
}

export { EXPRESSIONS, ANGLES, ACTIONS, ACTION_ANGLES };