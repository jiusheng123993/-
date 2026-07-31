/**
 * 视频生成服务单元测试
 * 覆盖：
 *   1. 产品线参数校验（照片数量、时长）
 *   2. mock 模式（未配置 API key 时回退）
 *   3. 真实模式（配置 key 时调用 Seedance API）
 *   4. 产品线映射
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 可变 config mock
vi.mock('../config.js', () => {
  const config = {
    seedance: { apiKey: '', model: 'doubao-seedance-1-5-pro-251215' },
    seedream: { apiKey: '' },
    uploadDir: './uploads',
    publicBaseUrl: '',
  };
  return { config };
});

vi.mock('../adapters/seedanceAdapter.js', () => ({
  createVideoGenerationTask: vi.fn(),
  queryVideoTask: vi.fn(),
  isSeedanceConfigured: vi.fn(),
}));

// 避免真实 ffmpeg 调用
vi.mock('node:child_process', () => ({
  execFile: vi.fn().mockImplementation(
    (cmd: string, _args: string[], cb: (err: Error | null) => void) => {
      if (cmd === 'ffmpeg') {
        cb(null);
      }
    },
  ),
}));

// 轮询间隔 mock 为立即执行，避免测试超时
vi.mock('../utils/delay.js', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rm: vi.fn().mockResolvedValue(undefined),
}));

import { config } from '../config.js';
import {
  createVideoGenerationTask,
  queryVideoTask,
  isSeedanceConfigured,
} from '../adapters/seedanceAdapter.js';
import {
  generateMemoirVideo,
  mapMemoirTypeToProductLine,
  validatePhotoCount,
  validateDuration,
  PRODUCT_LINE_CONFIG,
} from './videoGenerationService.js';

const mockedCreate = vi.mocked(createVideoGenerationTask);
const mockedQuery = vi.mocked(queryVideoTask);
const mockedIsConfigured = vi.mocked(isSeedanceConfigured);

describe('视频生成服务', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.seedance.apiKey = '';
    config.seedream.apiKey = '';
    config.publicBaseUrl = 'https://api.example.com';

    // mock 全局 fetch（下载视频片段时使用），返回空字节
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('mapMemoirTypeToProductLine', () => {
    it('memorial 类型映射到纪念Vlog产品线', () => {
      expect(mapMemoirTypeToProductLine('memorial')).toBe('memorial');
    });

    it('daily/seasonal/milestone/custom 映射到日常回忆录产品线', () => {
      expect(mapMemoirTypeToProductLine('daily')).toBe('daily');
      expect(mapMemoirTypeToProductLine('seasonal')).toBe('daily');
      expect(mapMemoirTypeToProductLine('milestone')).toBe('daily');
      expect(mapMemoirTypeToProductLine('custom')).toBe('daily');
    });
  });

  describe('validatePhotoCount', () => {
    it('日常回忆录照片数量在 1-3 之间通过', () => {
      expect(validatePhotoCount('daily', 1)).toBeNull();
      expect(validatePhotoCount('daily', 3)).toBeNull();
    });

    it('日常回忆录照片数量 0 或 4 拒绝', () => {
      expect(validatePhotoCount('daily', 0)).toContain('1-3');
      expect(validatePhotoCount('daily', 4)).toContain('1-3');
    });

    it('纪念Vlog照片数量在 8-15 之间通过', () => {
      expect(validatePhotoCount('memorial', 8)).toBeNull();
      expect(validatePhotoCount('memorial', 15)).toBeNull();
    });

    it('纪念Vlog照片数量 7 或 16 拒绝', () => {
      expect(validatePhotoCount('memorial', 7)).toContain('8-15');
      expect(validatePhotoCount('memorial', 16)).toContain('8-15');
    });
  });

  describe('validateDuration', () => {
    it('日常回忆录时长在 5-30 之间通过', () => {
      expect(validateDuration('daily', 5)).toBeNull();
      expect(validateDuration('daily', 30)).toBeNull();
    });

    it('日常回忆录时长 4 或 31 拒绝', () => {
      expect(validateDuration('daily', 4)).toContain('5-30');
      expect(validateDuration('daily', 31)).toContain('5-30');
    });

    it('纪念Vlog时长在 60-90 之间通过', () => {
      expect(validateDuration('memorial', 60)).toBeNull();
      expect(validateDuration('memorial', 90)).toBeNull();
    });

    it('纪念Vlog时长 59 或 91 拒绝', () => {
      expect(validateDuration('memorial', 59)).toContain('60-90');
      expect(validateDuration('memorial', 91)).toContain('60-90');
    });

    it('时长为空时通过（使用默认值）', () => {
      expect(validateDuration('daily', null)).toBeNull();
      expect(validateDuration('daily', undefined)).toBeNull();
    });
  });

  describe('generateMemoirVideo - mock 模式', () => {
    it('未配置 API key 时返回 mock 结果（日常回忆录）', async () => {
      mockedIsConfigured.mockReturnValue(false);
      const result = await generateMemoirVideo({
        taskId: 'task-001',
        productLine: 'daily',
        sourcePhotos: ['https://example.com/p1.jpg', 'https://example.com/p2.jpg'],
        musicStyle: 'warm',
        duration: 15,
      });

      expect(result.engine).toBe('mock-daily');
      expect(result.videoUrl).toContain('task-001');
      expect(result.actualDuration).toBe(15);
    });

    it('未配置 API key 时返回 mock 结果（纪念Vlog）', async () => {
      mockedIsConfigured.mockReturnValue(false);
      const photos = Array.from({ length: 8 }, (_, i) => `https://example.com/p${i + 1}.jpg`);
      const result = await generateMemoirVideo({
        taskId: 'task-002',
        productLine: 'memorial',
        sourcePhotos: photos,
        musicStyle: 'nostalgic',
        duration: 75,
      });

      expect(result.engine).toBe('mock-memorial');
      expect(result.actualDuration).toBe(75);
    });
  });

  describe('generateMemoirVideo - 真实模式', () => {
    beforeEach(() => {
      config.seedance.apiKey = 'test-seedance-key';
      mockedIsConfigured.mockReturnValue(true);
    });

    it('日常回忆录调用 Seedance 生成片段并拼接', async () => {
      mockedCreate.mockResolvedValue({ taskId: 'seedance-task-1', error: null });
      mockedCreate.mockResolvedValueOnce({ taskId: 'seedance-task-1', error: null });
      mockedCreate.mockResolvedValueOnce({ taskId: 'seedance-task-2', error: null });
      mockedQuery.mockResolvedValue({
        status: 'succeeded',
        videoUrl: 'https://cdn.example.com/seg1.mp4',
        error: null,
      });

      // 2 张照片，目标时长 10 秒（每段 5 秒）
      const result = await generateMemoirVideo({
        taskId: 'task-real-001',
        productLine: 'daily',
        sourcePhotos: ['https://example.com/p1.jpg', 'https://example.com/p2.jpg'],
        musicStyle: 'warm',
        duration: 10,
      });

      expect(result.engine).toBe('seedance-daily-static-animation');
      expect(result.videoUrl).toContain('/uploads/memoir/task-real-001/final.mp4');
      expect(mockedCreate).toHaveBeenCalledTimes(2);
    });

    it('日常回忆录单张照片且无字幕时直接托管单段视频', async () => {
      mockedCreate.mockResolvedValue({ taskId: 'seedance-task-3', error: null });
      mockedQuery.mockResolvedValue({
        status: 'succeeded',
        videoUrl: 'https://cdn.example.com/seg1.mp4',
        error: null,
      });

      const result = await generateMemoirVideo({
        taskId: 'task-real-002',
        productLine: 'daily',
        sourcePhotos: ['https://example.com/p1.jpg'],
        duration: 8,
      });

      expect(result.engine).toBe('seedance-daily-static-animation');
      expect(result.videoUrl).toContain('/uploads/memoir/task-real-002/final.mp4');
      expect(mockedCreate).toHaveBeenCalledTimes(1);
    });

    it('Seedance 创建任务失败时抛出错误', async () => {
      mockedCreate.mockResolvedValue({ taskId: null, error: 'Seedance API error: 401' });

      await expect(
        generateMemoirVideo({
          taskId: 'task-fail-001',
          productLine: 'daily',
          sourcePhotos: ['https://example.com/p1.jpg'],
          duration: 8,
        }),
      ).rejects.toThrow();
    });

    it('Seedance 任务查询失败时抛出错误', async () => {
      mockedCreate.mockResolvedValue({ taskId: 'seedance-task-x', error: null });
      mockedQuery.mockResolvedValue({ status: null, videoUrl: null, error: 'query failed' });

      await expect(
        generateMemoirVideo({
          taskId: 'task-fail-002',
          productLine: 'daily',
          sourcePhotos: ['https://example.com/p1.jpg'],
          duration: 8,
        }),
      ).rejects.toThrow();
    });
  });

  describe('generateMemoirVideo - 参数校验', () => {
    it('照片数量不满足产品线要求时抛出', async () => {
      mockedIsConfigured.mockReturnValue(false);
      await expect(
        generateMemoirVideo({
          taskId: 'task-003',
          productLine: 'memorial',
          sourcePhotos: ['https://example.com/p1.jpg'],
        }),
      ).rejects.toThrow('8-15');
    });

    it('时长不满足产品线要求时抛出', async () => {
      mockedIsConfigured.mockReturnValue(false);
      await expect(
        generateMemoirVideo({
          taskId: 'task-004',
          productLine: 'daily',
          sourcePhotos: ['https://example.com/p1.jpg'],
          duration: 100,
        }),
      ).rejects.toThrow('5-30');
    });
  });

  describe('PRODUCT_LINE_CONFIG 一致性', () => {
    it('产品线配置与校验函数一致', () => {
      expect(PRODUCT_LINE_CONFIG.daily.minPhotos).toBe(1);
      expect(PRODUCT_LINE_CONFIG.daily.maxPhotos).toBe(3);
      expect(PRODUCT_LINE_CONFIG.memorial.minPhotos).toBe(8);
      expect(PRODUCT_LINE_CONFIG.memorial.maxPhotos).toBe(15);
    });
  });
});
