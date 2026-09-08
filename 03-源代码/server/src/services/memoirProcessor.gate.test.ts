/**
 * 回忆录处理器 · 剧本确认闸门分叉测试（立项 v0.2 P0-2，需求追踪 #12）
 * 验证核心资金安全语义：
 *   1. 任务此前无持久化剧本 → 处理器新生成剧本后必须暂停（awaiting_confirmation=true），绝不调用视频生成
 *   2. 任务已有剧本（用户确认后重新入队）→ 直接进入视频生成，保持原语义
 *   3. 暂停时通过 WebSocket 通知用户（memoir_script_ready）
 * 重依赖全部 mock：不触真实数据库/LLM/Seedance/TTS。
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// vi.mock 工厂会被提升到文件顶部，先于 const 声明执行 —— 必须用 vi.hoisted 共享 mock 实例
const mocks = vi.hoisted(() => ({
  claimTask: vi.fn(),
  pause: vi.fn(),
  generateVideo: vi.fn(),
  moderate: vi.fn(),
  markFailed: vi.fn(),
  incrementRetryCount: vi.fn(),
  resetToPending: vi.fn(),
}));

vi.mock('../repositories/memoirRepository.js', () => ({
  MemoirRepository: class {
    claimTask = mocks.claimTask;
    pauseForScriptConfirmation = mocks.pause;
    updateScript = vi.fn().mockResolvedValue(undefined);
    markFailed = mocks.markFailed;
    markCompleted = vi.fn().mockResolvedValue(undefined);
    // 重试路径会调用 incrementRetryCount（迁移 033 持久化计数）+ resetToPending（handleRetry）
    incrementRetryCount = mocks.incrementRetryCount;
    resetToPending = mocks.resetToPending;
  },
}));

vi.mock('../repositories/petRepository.js', () => ({
  PetRepository: class {
    findByIdAndUser = vi.fn().mockResolvedValue({
      name: '可乐', species: 'cat', breed: '英短', gender: 'female',
      birth_date: null, notes: null, is_deceased: false,
    });
  },
}));

vi.mock('../services/videoGenerationService.js', () => ({
  generateMemoirVideo: mocks.generateVideo,
  mapMemoirTypeToProductLine: (t: string) => (t === 'memorial' ? 'memorial' : 'daily'),
}));

vi.mock('../services/memoirScriptService.js', () => ({
  generateMemoirScript: vi.fn().mockResolvedValue({
    title: '分镜脚本', scenes: [{ index: 1 }], identity_anchor: { subject: 'cat' },
  }),
  sanitizeMemoirScriptPrompts: vi.fn((s: unknown) => s),
}));

vi.mock('../services/memoirPhotoAnalysis.js', () => ({
  analyzeMemoirPhotos: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/memoryService.js', () => ({
  buildMemoryContext: vi.fn().mockResolvedValue({ memories: '', facts: '' }),
  getMemoriesByTags: vi.fn().mockResolvedValue([]),
  getPetMomentsSummary: vi.fn().mockResolvedValue(''),
}));

vi.mock('../services/qualityCheckService.js', () => ({
  checkVideoQuality: vi.fn().mockResolvedValue({ passed: true, degraded: true, defects: [] }),
}));

vi.mock('../services/ttsService.js', () => ({ cleanupNarration: vi.fn() }));
vi.mock('../services/doubaoSpeechTts.js', () => ({ cleanupDoubaoSpeech: vi.fn() }));
vi.mock('../services/videoModerationService.js', () => ({
  moderateVideo: mocks.moderate,
}));
vi.mock('../services/websocketService.js', () => ({ sendToUser: vi.fn() }));
vi.mock('../services/autoFeedService.js', () => ({
  postMemoirCompletedFeed: vi.fn(),
  postMemoirTimelineMoment: vi.fn(),
}));

vi.mock('../config.js', () => ({
  config: { uploadDir: 'uploads-test', moderateApiKey: 'test-key' },
}));

import { processTask } from './memoirProcessor.js';
import { sendToUser } from './websocketService.js';
import { generateMemoirScript } from './memoirScriptService.js';
import type { MemoirRecordRow } from '../repositories/memoirRepository.js';

function makeTask(overrides: Partial<MemoirRecordRow> = {}): MemoirRecordRow {
  return {
    id: 'task-001',
    user_id: 'user-1',
    pet_id: 'pet-1',
    memoir_type: 'daily',
    status: 'pending',
    source_photos: ['/uploads/pet-photos/u1/p1/a.jpg'],
    source_text: null,
    narrative_structure: { music_style: 'warm', duration: 15 },
    video_url: null,
    preview_url: null,
    cost_credits: null,
    payment_id: null,
    error_message: null,
    created_at: '2026-09-08T00:00:00Z',
    completed_at: null,
    ...overrides,
  };
}

beforeEach(() => {
  mocks.claimTask.mockReset().mockResolvedValue(true);
  mocks.pause.mockReset().mockResolvedValue(undefined);
  mocks.generateVideo.mockReset().mockResolvedValue({
    videoUrl: 'https://cdn.example.com/final.mp4',
    previewUrl: 'https://cdn.example.com/preview.mp4',
  });
  // 处理器代码按字符串语义判断（=== 'block' / === 'review'）
  mocks.moderate.mockReset().mockResolvedValue('pass');
  mocks.markFailed.mockReset().mockResolvedValue(undefined);
  mocks.incrementRetryCount.mockReset().mockResolvedValue(1);
  mocks.resetToPending.mockReset().mockResolvedValue(undefined);
  vi.mocked(generateMemoirScript).mockClear();
  vi.mocked(sendToUser).mockClear();
});

describe('剧本确认闸门分叉（立项 v0.2 P0-2）', () => {
  it('新任务（无持久化剧本）：生成剧本后暂停等待确认，绝不触发视频生成', async () => {
    const result = await processTask(makeTask());

    // 暂停旗标写入；视频生成零调用（Seedance 成本未发生）
    expect(mocks.pause).toHaveBeenCalledWith('task-001');
    expect(mocks.generateVideo).not.toHaveBeenCalled();
    // 通知用户确认
    expect(sendToUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        event: 'memoir_status',
        data: expect.objectContaining({ type: 'memoir_script_ready', taskId: 'task-001' }),
      }),
    );
    expect(result).toBe(false);
  });

  it('用户确认后重新入队（narrative 已含 script）：直接进入视频生成', async () => {
    const confirmedTask = makeTask({
      narrative_structure: {
        music_style: 'warm',
        duration: 15,
        script: { title: '已确认剧本', scenes: [{ index: 1 }] },
      },
    });

    await processTask(confirmedTask);

    // 不再暂停；视频生成被调用（后续质检 degraded=true 放行，成功返回）
    expect(mocks.pause).not.toHaveBeenCalled();
    expect(mocks.generateVideo).toHaveBeenCalledTimes(1);
    expect(mocks.generateVideo.mock.calls[0][0]).toMatchObject({ taskId: 'task-001' });
    expect(sendToUser).not.toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ data: expect.objectContaining({ type: 'memoir_script_ready' }) }),
    );
  });

  it('重试计数持久化（迁移 033 / 审查⏳4）：retry_count 已达上限的坏任务不再重烧视频', async () => {
    // 审核拒绝（block），且该任务历史重试已用完（重启后计数仍持久在库）
    mocks.moderate.mockResolvedValue('block');
    const exhaustedTask = makeTask({
      retry_count: 2,
      narrative_structure: {
        music_style: 'warm',
        duration: 15,
        script: { title: '已确认剧本', scenes: [{ index: 1 }] },
      },
    });

    await processTask(exhaustedTask);

    // 本轮视频已烧（不可逆），但绝不再递增计数重置入队（防重启清零后反复烧钱）
    expect(mocks.generateVideo).toHaveBeenCalledTimes(1);
    expect(mocks.incrementRetryCount).not.toHaveBeenCalled();
    expect(mocks.resetToPending).not.toHaveBeenCalled();
    expect(mocks.markFailed).toHaveBeenCalledWith('task-001', '内容审核拒绝，已超过最大重试次数');
  });

  it('重试计数未达上限：递增计数（落库）后重置入队重试', async () => {
    mocks.moderate.mockResolvedValue('block');
    const retryableTask = makeTask({
      retry_count: 0,
      narrative_structure: {
        music_style: 'warm',
        duration: 15,
        script: { title: '已确认剧本', scenes: [{ index: 1 }] },
      },
    });

    const result = await processTask(retryableTask);

    expect(mocks.incrementRetryCount).toHaveBeenCalledWith('task-001');
    expect(mocks.resetToPending).toHaveBeenCalledWith('task-001');
    expect(mocks.markFailed).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
