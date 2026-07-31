/**
 * 主题套装生成服务 - 管理和执行主题套装（节日/季节）的 AI 图像生成
 * 包含配额管理、内容审核、失败重试、提示词构建
 */
import { pool } from '../db.js';
import { config } from '../config.js';
import * as suiteRepo from '../repositories/themeSuiteRepository.js';
import * as wardrobeRepo from '../repositories/wardrobeRepository.js';
import { getUserMembership, WardrobeError } from './wardrobeService.js';
import { sanitizeLog, sanitizeError, sanitizeUrl } from '../utils/sanitize.js';
import type { ThemeSuiteRow, ThemeSuiteTaskRow } from '../repositories/themeSuiteRepository.js';

const FREE_MONTHLY_QUOTA = 3;
const MEMBER_MONTHLY_QUOTA = 10;
const MAX_RETRY_COUNT = 3;

export interface ThemeSuiteOverview {
  suites: ThemeSuiteRow[];
  recentTasks: ThemeSuiteTaskRow[];
  monthlyQuota: { used: number; limit: number };
}

export async function getThemeSuiteOverview(userId: string): Promise<ThemeSuiteOverview> {
  const [suites, recentTasks, membership, usedCount] = await Promise.all([
    suiteRepo.findAllActiveThemeSuites(),
    suiteRepo.findThemeSuiteTasksByUser(userId, 10),
    getUserMembership(userId),
    suiteRepo.countMonthlyThemeSuiteTasks(userId),
  ]);

  const limit = membership.isMember ? MEMBER_MONTHLY_QUOTA : FREE_MONTHLY_QUOTA;

  return {
    suites,
    recentTasks,
    monthlyQuota: { used: usedCount, limit },
  };
}

export async function generateThemeSuite(
  userId: string,
  petId: string,
  suiteId: string
): Promise<ThemeSuiteTaskRow> {
  const petResult = await pool.query(
    'SELECT id, species, breed, name FROM pet_profiles WHERE id = $1 AND user_id = $2',
    [petId, userId]
  );
  if (petResult.rowCount === 0) {
    throw new WardrobeError('PET_NOT_FOUND', '宠物不存在或无权访问');
  }
  const pet = petResult.rows[0] as { id: string; species: string; breed: string; name: string };

  const suite = await suiteRepo.findThemeSuiteById(suiteId);
  if (!suite) {
    throw new WardrobeError('SUITE_NOT_FOUND', '主题套装不存在');
  }

  await pool.query('BEGIN');

  try {
    const activeTask = await suiteRepo.findActiveTaskByPetForUpdate(petId);
    if (activeTask) {
      await pool.query('ROLLBACK');
      throw new WardrobeError('TASK_IN_PROGRESS', '该宠物已有进行中的生成任务');
    }

    const membership = await getUserMembership(userId);
    const limit = membership.isMember ? MEMBER_MONTHLY_QUOTA : FREE_MONTHLY_QUOTA;
    const usedCount = await suiteRepo.countMonthlyThemeSuiteTasks(userId);
    if (usedCount >= limit) {
      await pool.query('ROLLBACK');
      throw new WardrobeError('QUOTA_EXCEEDED', `本月生成次数已用完（${limit}次/月）`);
    }

    const task = await suiteRepo.insertThemeSuiteTask(userId, petId, suiteId);
    await pool.query('COMMIT');

    processThemeSuiteGeneration(task.id, pet, suite).catch(err =>
      console.error('[ThemeSuite] Generation error:', sanitizeError(err))
    );

    return task;
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

export async function getThemeSuiteTaskStatus(taskId: string, userId: string): Promise<ThemeSuiteTaskRow | null> {
  return suiteRepo.findThemeSuiteTask(taskId, userId);
}

async function processThemeSuiteGeneration(
  taskId: string,
  pet: { id: string; species: string; breed: string; name: string },
  suite: ThemeSuiteRow
): Promise<void> {
  try {
    await suiteRepo.updateThemeSuiteTaskStatus(taskId, 'processing');

    const prompt = buildThemePrompt(pet, suite);
    const resultUrl = await callSeedreamApi(prompt);

    if (!resultUrl) {
      await handleTaskFailure(taskId, 'AI 图像生成服务暂不可用');
      return;
    }

    const moderationResult = await moderateContent(resultUrl);

    if (moderationResult === 'block') {
      await suiteRepo.updateThemeSuiteTaskStatus(taskId, 'failed', resultUrl, 'block');
      return;
    }

    await suiteRepo.updateThemeSuiteTaskStatus(taskId, 'completed', resultUrl, moderationResult);

    await wardrobeRepo.updatePetOutfitSummary(pet.id, null, resultUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成失败';
    await handleTaskFailure(taskId, message);
  }
}

const MAX_PET_NAME_LENGTH = 20;
const MAX_PET_BREED_LENGTH = 30;
const SANITIZE_PATTERN = /[^\u4e00-\u9fa5a-zA-Z0-9\s·\-]/g;

function sanitizePromptInput(input: string, maxLength: number): string {
  const sanitized = input.replace(SANITIZE_PATTERN, '').trim();
  return sanitized.substring(0, maxLength);
}

function buildThemePrompt(
  pet: { id: string; species: string; breed: string; name: string },
  suite: ThemeSuiteRow
): string {
  const speciesLabel = pet.species === 'dog' ? '狗狗' : '猫咪';
  const safeName = sanitizePromptInput(pet.name, MAX_PET_NAME_LENGTH);
  const safeBreed = sanitizePromptInput(pet.breed, MAX_PET_BREED_LENGTH);
  const base = `一只可爱的${safeBreed}${speciesLabel}${safeName ? '「' + safeName + '」' : ''}`;
  return `${base}，${suite.promptTemplate}，高质量，细节丰富，可爱温馨，适合作为宠物头像`;
}

async function callSeedreamApi(prompt: string): Promise<string | null> {
  const apiKey = config.seedream.apiKey;
  if (!apiKey) {
    console.warn('[ThemeSuite] SEEDREAM_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
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
      }),
    });

    if (!response.ok) {
      console.error('[ThemeSuite] Seedream API error: status', response.status);
      return null;
    }

    const data = (await response.json()) as { data: Array<{ url: string }> };
    if (data.data && data.data.length > 0 && data.data[0].url) {
      return data.data[0].url;
    }
    return null;
  } catch (error) {
    console.error('[ThemeSuite] Seedream call failed:', sanitizeError(error));
    return null;
  }
}

async function moderateContent(imageUrl: string): Promise<'pass' | 'review' | 'block'> {
  const apiKey = config.moderate?.apiKey;
  if (!apiKey) {
    console.warn('[ThemeSuite] Content moderation API not configured, defaulting to pass');
    return 'pass';
  }

  try {
    const response = await fetch('https://api.volcengine.com/v2/image/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        image_urls: [imageUrl],
        scenes: ['porn', 'terrorism', 'political', 'ad'],
      }),
    });

    if (!response.ok) {
      console.error('[ThemeSuite] Moderation API error: status', response.status);
      return 'review';
    }

    const data = (await response.json()) as {
      results?: Array<{ scene: string; suggestion: 'pass' | 'review' | 'block' }>;
    };

    if (!data.results || data.results.length === 0) {
      console.warn('[ThemeSuite] Moderation API returned empty results, defaulting to review');
      return 'review';
    }

    const hasBlock = data.results.some(r => r.suggestion === 'block');
    const hasReview = data.results.some(r => r.suggestion === 'review');

    if (hasBlock) {
      console.warn('[ThemeSuite] Content blocked by moderation:', sanitizeUrl(imageUrl));
      return 'block';
    }
    if (hasReview) {
      console.warn('[ThemeSuite] Content flagged for review:', sanitizeUrl(imageUrl));
      return 'review';
    }
    return 'pass';
  } catch (error) {
    console.error('[ThemeSuite] Moderation call failed:', sanitizeError(error));
    return 'review';
  }
}

async function handleTaskFailure(taskId: string, errorMessage: string): Promise<void> {
  const task = await suiteRepo.findThemeSuiteTask(taskId, '');
  if (task && task.retryCount < MAX_RETRY_COUNT) {
    await suiteRepo.incrementTaskRetryCount(taskId);
    await suiteRepo.updateThemeSuiteTaskStatus(taskId, 'pending');
  } else {
    await suiteRepo.updateThemeSuiteTaskStatus(taskId, 'failed');
  }
  console.error(`[ThemeSuite] Task ${taskId} failed: ${sanitizeLog(errorMessage)}`);
}
