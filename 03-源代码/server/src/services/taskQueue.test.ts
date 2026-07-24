import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPool, mockClient } = vi.hoisted(() => {
  const client = {
    query: vi.fn(),
    release: vi.fn(),
  };
  const pool = {
    query: vi.fn(),
    connect: vi.fn(() => Promise.resolve(client)),
  };
  return { mockPool: pool, mockClient: client };
});

vi.mock('../db.js', () => ({
  pool: mockPool,
}));

vi.mock('uuid', () => ({
  default: {
    v4: vi.fn(() => 'mock-uuid-1234'),
  },
  v4: vi.fn(() => 'mock-uuid-1234'),
}));

import {
  createTask,
  updateTaskProgress,
  updateTaskStatus,
  updateTaskResult,
  getTask,
  getLatestTaskByPet,
  cleanStaleTasks,
  type GenerationTask,
} from './taskQueue.js';

const sampleRow = {
  id: 'task-001',
  user_id: 'user-001',
  pet_id: 'pet-001',
  task_type: '2d',
  status: 'pending',
  progress: 0,
  reference_photo_url: 'https://example.com/photo.jpg',
  result_data: null,
  error: null,
  created_at: '2026-07-24T00:00:00Z',
  updated_at: '2026-07-24T00:00:00Z',
};

const expectedTask: GenerationTask = {
  id: 'task-001',
  userId: 'user-001',
  petId: 'pet-001',
  taskType: '2d',
  status: 'pending',
  progress: 0,
  referencePhotoUrl: 'https://example.com/photo.jpg',
  resultData: null,
  error: null,
  createdAt: '2026-07-24T00:00:00Z',
  updatedAt: '2026-07-24T00:00:00Z',
};

beforeEach(() => {
  mockPool.query.mockReset();
  mockClient.query.mockReset();
  mockClient.release.mockReset();
  mockPool.connect.mockReset();
  mockPool.connect.mockResolvedValue(mockClient);
});

describe('taskQueue.createTask', () => {
  it('正常创建任务并返回映射后的对象', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [sampleRow], rowCount: 1 });

    const task = await createTask('user-001', 'pet-001', '2d', 'https://example.com/photo.jpg');

    expect(task).toEqual(expectedTask);
    expect(mockPool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('INSERT INTO avatar_generation_tasks');
    expect(params).toEqual([
      'mock-uuid-1234',
      'user-001',
      'pet-001',
      '2d',
      'https://example.com/photo.jpg',
    ]);
  });

  it('未传 referencePhotoUrl 时应写入 null', async () => {
    const nullPhotoRow = { ...sampleRow, reference_photo_url: null };
    mockPool.query.mockResolvedValueOnce({ rows: [nullPhotoRow], rowCount: 1 });

    const task = await createTask('user-001', 'pet-001', '3d');

    expect(task.referencePhotoUrl).toBeNull();
    const params = mockPool.query.mock.calls[0][1];
    expect(params[4]).toBeNull();
  });
});

describe('taskQueue.updateTaskProgress', () => {
  it('进度应为 0-100 之间', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    await updateTaskProgress('task-001', 150);

    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('UPDATE avatar_generation_tasks SET progress');
    expect(params[0]).toBe(100);
    expect(params[1]).toBe('task-001');
  });

  it('负进度应被截断为 0', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    await updateTaskProgress('task-001', -20);

    expect(mockPool.query.mock.calls[0][1][0]).toBe(0);
  });
});

describe('taskQueue.updateTaskStatus', () => {
  it('正常更新状态和错误信息', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    await updateTaskStatus('task-001', 'failed', '生成失败');

    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('UPDATE avatar_generation_tasks SET status');
    expect(params[0]).toBe('failed');
    expect(params[1]).toBe('生成失败');
    expect(params[2]).toBe('task-001');
  });

  it('未传 error 时应写入 null', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    await updateTaskStatus('task-001', 'completed');

    expect(mockPool.query.mock.calls[0][1][1]).toBeNull();
  });
});

describe('taskQueue.updateTaskResult', () => {
  it('应将 resultData 序列化为 JSON 字符串', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    const data = { url: 'https://example.com/model.glb', size: 1024 };
    await updateTaskResult('task-001', data);

    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('UPDATE avatar_generation_tasks SET result_data');
    expect(params[0]).toBe(JSON.stringify(data));
    expect(params[1]).toBe('task-001');
  });
});

describe('taskQueue.getTask（权限隔离核心）', () => {
  it('应通过 userId 过滤，确保数据归属隔离', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [sampleRow], rowCount: 1 });

    const task = await getTask('task-001', 'user-001');

    expect(task).toEqual(expectedTask);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('WHERE id = $1 AND user_id = $2');
    expect(params).toEqual(['task-001', 'user-001']);
  });

  it('未找到任务时返回 null', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const task = await getTask('nonexistent', 'user-001');

    expect(task).toBeNull();
  });

  it('访问他人任务应返回 null（横向越权防护）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const task = await getTask('task-001', 'other-user');

    expect(task).toBeNull();
    expect(mockPool.query.mock.calls[0][1][1]).toBe('other-user');
  });
});

describe('taskQueue.getLatestTaskByPet', () => {
  it('应按 user_id + pet_id + task_type 过滤并返回最新任务', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [sampleRow], rowCount: 1 });

    const task = await getLatestTaskByPet('user-001', 'pet-001', '2d');

    expect(task).toEqual(expectedTask);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('ORDER BY created_at DESC LIMIT 1');
    expect(params).toEqual(['user-001', 'pet-001', '2d']);
  });

  it('无任务时返回 null', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const task = await getLatestTaskByPet('user-001', 'pet-001', '3d');

    expect(task).toBeNull();
  });
});

describe('taskQueue.cleanStaleTasks', () => {
  it('无过期任务时应返回零计数', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce(undefined);

    const result = await cleanStaleTasks();

    expect(result).toEqual({ images: 0, models: 0, tasks: 0 });
    expect(mockClient.query).toHaveBeenCalledTimes(3);
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('有过期任务时应按顺序删除关联数据', async () => {
    const staleIds = ['task-old-1', 'task-old-2'];

    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: staleIds.map(id => ({ id })), rowCount: 2 })
      .mockResolvedValueOnce({ rowCount: 10 })
      .mockResolvedValueOnce({ rowCount: 2 })
      .mockResolvedValueOnce({ rowCount: 2 })
      .mockResolvedValueOnce(undefined);

    const result = await cleanStaleTasks();

    expect(result).toEqual({ images: 10, models: 2, tasks: 2 });

    const calls = mockClient.query.mock.calls;
    expect(calls[0][0]).toBe('BEGIN');
    expect(calls[1][0]).toContain("status = 'failed'");
    expect(calls[2][0]).toContain('DELETE FROM avatar_2d_images');
    expect(calls[3][0]).toContain('DELETE FROM avatar_3d_models');
    expect(calls[4][0]).toContain('DELETE FROM avatar_generation_tasks');
    expect(calls[5][0]).toBe('COMMIT');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('事务失败时应 ROLLBACK 并抛出错误', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('DB connection lost'));

    mockClient.query.mockResolvedValueOnce(undefined);

    await expect(cleanStaleTasks()).rejects.toThrow('DB connection lost');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('应使用参数化查询防止 SQL 注入', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ id: 'task-1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce(undefined);

    await cleanStaleTasks();

    const deleteCalls = mockClient.query.mock.calls.slice(2, 5);
    for (const call of deleteCalls) {
      expect(call[1]).toBeDefined();
      expect(Array.isArray(call[1][0])).toBe(true);
    }
  });
});
