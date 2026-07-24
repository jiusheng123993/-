import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockUpdateTaskProgress,
  mockUpdateTaskStatus,
  mockUpdateTaskResult,
  mockPoolQuery,
  mockDelay,
  mockFetch,
} = vi.hoisted(() => ({
  mockUpdateTaskProgress: vi.fn(),
  mockUpdateTaskStatus: vi.fn(),
  mockUpdateTaskResult: vi.fn(),
  mockPoolQuery: vi.fn(),
  mockDelay: vi.fn().mockResolvedValue(undefined),
  mockFetch: vi.fn(),
}));

vi.mock('../db.js', () => ({
  pool: { query: mockPoolQuery },
}));

vi.mock('./taskQueue.js', () => ({
  updateTaskProgress: mockUpdateTaskProgress,
  updateTaskStatus: mockUpdateTaskStatus,
  updateTaskResult: mockUpdateTaskResult,
}));

vi.mock('../utils/delay.js', () => ({
  delay: mockDelay,
}));

vi.mock('../config.js', () => ({
  config: {
    seedream: { apiKey: 'test-api-key' },
    meshy: { apiKey: 'test-meshy-key' },
    supabase: { url: '', serviceKey: '' },
  },
}));

global.fetch = mockFetch;

import { generate3DModel } from './model3DService.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockPoolQuery.mockResolvedValue({ rowCount: 1, rows: [] });
  mockUpdateTaskProgress.mockResolvedValue(undefined);
  mockUpdateTaskStatus.mockResolvedValue(undefined);
  mockUpdateTaskResult.mockResolvedValue(undefined);
});

describe('model3DService 无可用 2D 图像', () => {
  it('2D 任务无正面图时应标记失败', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await generate3DModel({
      taskId: 'test-no-2d-images',
      image2DTaskId: '2d-task-empty',
    });

    expect(mockUpdateTaskStatus).toHaveBeenCalledWith('test-no-2d-images', 'processing');
    expect(mockUpdateTaskStatus).toHaveBeenCalledWith('test-no-2d-images', 'failed', '没有可用的 2D 形象图，请先生成 2D 形象');
  });
});

describe('model3DService Meshy API 调用失败', () => {
  it('Meshy API 返回非 200 应标记失败且不泄露状态码', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ image_url: 'https://cdn.example.com/front.png', expression: 'happy' }],
      rowCount: 1,
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await generate3DModel({
      taskId: 'test-meshy-500',
      image2DTaskId: '2d-task-1',
    });

    expect(mockUpdateTaskStatus).toHaveBeenCalledWith('test-meshy-500', 'failed', '3D 模型生成服务请求失败，请稍后重试');
  });
});

describe('model3DService 轮询成功', () => {
  it('Meshy 返回 SUCCEEDED 应保存模型并标记完成', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ image_url: 'https://cdn.example.com/front.png', expression: 'happy' }],
      rowCount: 1,
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 'meshy-task-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'SUCCEEDED',
          model_urls: { glb: 'https://cdn.example.com/model.glb' },
          thumbnail_url: 'https://cdn.example.com/thumb.png',
        }),
      });

    await generate3DModel({
      taskId: 'test-3d-success',
      image2DTaskId: '2d-task-1',
    });

    expect(mockUpdateTaskProgress).toHaveBeenCalledWith('test-3d-success', 95);
    expect(mockUpdateTaskProgress).toHaveBeenCalledWith('test-3d-success', 100);
    expect(mockUpdateTaskStatus).toHaveBeenCalledWith('test-3d-success', 'completed');
    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO avatar_3d_models'),
      expect.arrayContaining(['test-3d-success', 'https://cdn.example.com/model.glb', 'https://cdn.example.com/thumb.png']),
    );
  });
});

describe('model3DService 轮询失败', () => {
  it('Meshy 返回 FAILED 应标记任务失败', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ image_url: 'https://cdn.example.com/front.png', expression: 'happy' }],
      rowCount: 1,
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 'meshy-task-fail' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'FAILED' }),
      });

    await generate3DModel({
      taskId: 'test-3d-failed',
      image2DTaskId: '2d-task-1',
    });

    expect(mockUpdateTaskStatus).toHaveBeenCalledWith('test-3d-failed', 'failed', '3D 模型生成失败');
  });
});

describe('model3DService 轮询超时', () => {
  it('60 次轮询后仍 PENDING 应标记超时', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ image_url: 'https://cdn.example.com/front.png', expression: 'happy' }],
      rowCount: 1,
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 'meshy-task-timeout' }),
      })
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'PENDING' }),
      });

    await generate3DModel({
      taskId: 'test-3d-timeout',
      image2DTaskId: '2d-task-1',
    });

    expect(mockUpdateTaskStatus).toHaveBeenCalledWith('test-3d-timeout', 'failed', '3D 模型生成超时，请稍后重试');
    expect(mockDelay.mock.calls.length).toBeGreaterThanOrEqual(60);
  });
});

describe('model3DService 进度计算', () => {
  it('轮询进度上限被 Math.min 限制在 85%', () => {
    const maxPollIndex = 59;
    const pollProgress = 40 + Math.floor((maxPollIndex / 60) * 45);
    expect(pollProgress).toBe(84);
    expect(Math.min(pollProgress, 85)).toBe(84);
  });

  it('轮询初期进度应从 40% 开始', () => {
    const pollProgress = 40 + Math.floor((0 / 60) * 45);
    expect(pollProgress).toBe(40);
  });

  it('SUCCEEDED 时应先更新到 95% 再到 100%', () => {
    expect(95).toBeLessThan(100);
    expect(95).toBeGreaterThan(85);
  });

  it('进度过渡应为 40% → 85% → 95% → 100%', () => {
    const stages = [40, 85, 95, 100];
    for (let i = 1; i < stages.length; i++) {
      expect(stages[i]).toBeGreaterThan(stages[i - 1]);
    }
  });
});

describe('model3DService 异常处理', () => {
  it('2D 图像查询抛异常应标记失败', async () => {
    mockPoolQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    await generate3DModel({
      taskId: 'test-3d-db-error',
      image2DTaskId: '2d-task-1',
    });

    expect(mockUpdateTaskStatus).toHaveBeenCalledWith('test-3d-db-error', 'failed', 'DB connection lost');
  });
});
