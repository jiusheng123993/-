/**
 * Seedance 视频生成适配器单元测试
 * 覆盖：创建任务、查询任务状态、错误处理、未配置 key 的兜底
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 使用可变 config 对象，测试中可直接修改
vi.mock('../config.js', () => {
  const config = {
    seedance: { apiKey: '', model: 'doubao-seedance-1-5-pro-251215' },
    seedream: { apiKey: '' },
  };
  return { config };
});

import { config } from '../config.js';
import {
  createVideoGenerationTask,
  queryVideoTask,
  isSeedanceConfigured,
} from './seedanceAdapter.js';

describe('Seedance 视频生成适配器', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // 默认清空 key，每个用例自行设置
    config.seedance.apiKey = '';
    config.seedream.apiKey = '';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('isSeedanceConfigured', () => {
    it('seedance 与 seedream 都未配置时返回 false', () => {
      expect(isSeedanceConfigured()).toBe(false);
    });

    it('seedance 配置后返回 true', () => {
      config.seedance.apiKey = 'test-key';
      expect(isSeedanceConfigured()).toBe(true);
    });

    it('仅 seedream 配置时返回 true（兼容复用）', () => {
      config.seedream.apiKey = 'test-key';
      expect(isSeedanceConfigured()).toBe(true);
    });
  });

  describe('createVideoGenerationTask', () => {
    it('未配置 API Key 时返回错误而非抛出', async () => {
      const result = await createVideoGenerationTask({ imageUrl: 'https://example.com/photo.jpg' });
      expect(result.taskId).toBeNull();
      expect(result.error).toContain('not configured');
    });

    it('成功创建任务返回 taskId，请求体包含图片与提示词', async () => {
      config.seedance.apiKey = 'test-seedance-key';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'task-123' }),
      } as Response);

      const result = await createVideoGenerationTask({
        imageUrl: 'https://example.com/photo.jpg',
        prompt: '缓慢推拉镜头',
        duration: 5,
      });

      expect(result.taskId).toBe('task-123');
      expect(result.error).toBeNull();

      // 验证请求体包含图片 URL 与提示词
      const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/contents/generations/tasks');
      const body = JSON.parse(String(init.body));
      expect(
        body.content.some(
          (c: { type: string; role?: string }) => c.type === 'image_url' && c.role === 'first_frame',
        ),
      ).toBe(true);
      expect(body.content.some((c: { type: string; text: string }) => c.type === 'text' && c.text === '缓慢推拉镜头')).toBe(true);
      expect(body.duration).toBe(5);
      expect(body.model).toBe('doubao-seedance-1-5-pro-251215');
    });

    it('复用 seedream key 时可创建任务', async () => {
      config.seedream.apiKey = 'test-seedream-key';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'task-456' }),
      } as Response);

      const result = await createVideoGenerationTask({ imageUrl: 'https://example.com/photo.jpg' });
      expect(result.taskId).toBe('task-456');
      expect(result.error).toBeNull();
    });

    it('API 返回错误时返回 error 而非抛出', async () => {
      config.seedance.apiKey = 'test-seedance-key';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const result = await createVideoGenerationTask({ imageUrl: 'https://example.com/photo.jpg' });
      expect(result.taskId).toBeNull();
      expect(result.error).toContain('401');
    });

    it('网络异常时返回 error 而非抛出', async () => {
      config.seedance.apiKey = 'test-seedance-key';
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down'));

      const result = await createVideoGenerationTask({ imageUrl: 'https://example.com/photo.jpg' });
      expect(result.taskId).toBeNull();
      expect(result.error).toContain('network down');
    });

    it('响应缺少 task id 时返回 error', async () => {
      config.seedance.apiKey = 'test-seedance-key';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const result = await createVideoGenerationTask({ imageUrl: 'https://example.com/photo.jpg' });
      expect(result.taskId).toBeNull();
      expect(result.error).toContain('empty task id');
    });
  });

  describe('queryVideoTask', () => {
    it('任务成功后返回视频 URL', async () => {
      config.seedance.apiKey = 'test-seedance-key';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'task-123',
          status: 'succeeded',
          content: { video_url: 'https://cdn.example.com/video.mp4' },
        }),
      } as Response);

      const result = await queryVideoTask('task-123');
      expect(result.status).toBe('succeeded');
      expect(result.videoUrl).toBe('https://cdn.example.com/video.mp4');
      expect(result.error).toBeNull();
    });

    it('任务失败时返回错误信息', async () => {
      config.seedance.apiKey = 'test-seedance-key';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'task-123',
          status: 'failed',
          error: { code: 'bad_request', message: '生成失败' },
        }),
      } as Response);

      const result = await queryVideoTask('task-123');
      expect(result.status).toBe('failed');
      expect(result.videoUrl).toBeNull();
      expect(result.error).toBe('生成失败');
    });

    it('任务排队中时返回 queued 且无视频 URL', async () => {
      config.seedance.apiKey = 'test-seedance-key';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'task-123', status: 'queued' }),
      } as Response);

      const result = await queryVideoTask('task-123');
      expect(result.status).toBe('queued');
      expect(result.videoUrl).toBeNull();
    });

    it('未配置 key 时返回错误', async () => {
      const result = await queryVideoTask('task-123');
      expect(result.status).toBeNull();
      expect(result.error).toContain('not configured');
    });
  });
});
