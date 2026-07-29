import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  return { mockPool: pool };
});

vi.mock('../db.js', () => ({ pool: mockPool }));

vi.mock('../config.js', () => ({
  config: {
    jwtSecret: 'test-jwt-secret',
    wechat: { appId: 'test-app-id', secret: 'test-secret' },
    port: 3000,
    databaseUrl: 'postgresql://localhost/test',
    ai: { apiKey: '', baseUrl: '', model: '' },
    seedream: { apiKey: '' },
    meshy: { apiKey: '' },
    moderate: { apiKey: '' },
    uploadDir: './uploads',
  },
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    _req.userId = 'test-user-id';
    next();
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-food'),
}));

import foodRouter from '../routes/food.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/food', foodRouter);
  return app;
}

const mockFoodQuery = {
  id: 'food-001',
  user_id: 'test-user-id',
  food_name: '巧克力',
  safety_level: 'danger',
  detail: '巧克力对宠物有毒，请勿喂食',
  created_at: '2026-07-25T00:00:00Z',
};

const mockPlaceholderFood = {
  id: 'mock-uuid-food',
  user_id: 'test-user-id',
  food_name: '奇怪食物',
  safety_level: 'caution',
  detail: '请咨询兽医确认该食物对宠物的安全性',
  created_at: '2026-07-25T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /food/query - 查询食物', () => {
  it('查询已知食物（数据库匹配），返回数据', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockFoodQuery], rowCount: 1 });

    const res = await request(createApp())
      .get('/food/query?keyword=巧克力');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.source).toBe('database');
    expect(res.body.data[0].foodName).toBe('巧克力');
    expect(res.body.data[0].safetyLevel).toBe('danger');
  });

  it('查询未知食物（数据库无匹配），返回 placeholder', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [mockPlaceholderFood], rowCount: 1 });

    const res = await request(createApp())
      .get('/food/query?keyword=奇怪食物');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.source).toBe('placeholder');
    expect(res.body.message).toContain('暂无该食物数据');
    expect(res.body.data.safetyLevel).toBe('caution');
  });

  it('参数校验：缺少 keyword，返回 400', async () => {
    const res = await request(createApp())
      .get('/food/query');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('keyword');
  });

  it('模糊匹配：部分匹配关键词', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockFoodQuery], rowCount: 1 });

    const res = await request(createApp())
      .get('/food/query?keyword=巧');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.source).toBe('database');

    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('ILIKE');
    expect(params[0]).toContain('%巧%');
  });

  it('多个匹配结果时返回前 5 条', async () => {
    const foods = [
      { ...mockFoodQuery, id: 'f1', food_name: '巧克力蛋糕' },
      { ...mockFoodQuery, id: 'f2', food_name: '白巧克力' },
      { ...mockFoodQuery, id: 'f3', food_name: '黑巧克力' },
      { ...mockFoodQuery, id: 'f4', food_name: '巧克力饼干' },
      { ...mockFoodQuery, id: 'f5', food_name: '巧克力冰激凌' },
    ];
    mockPool.query.mockResolvedValueOnce({ rows: foods, rowCount: 5 });

    const res = await request(createApp())
      .get('/food/query?keyword=巧克力');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/food/query?keyword=巧克力');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /food/history - 查询历史', () => {
  it('正常获取历史记录', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockFoodQuery], rowCount: 1 });

    const res = await request(createApp())
      .get('/food/history');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].foodName).toBe('巧克力');
  });

  it('无历史记录时返回空数组', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/food/history');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('历史记录按 user_id 隔离', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await request(createApp()).get('/food/history');

    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('WHERE user_id');
    expect(params[0]).toBe('test-user-id');
  });

  it('历史记录最多返回 50 条', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await request(createApp()).get('/food/history');

    const [sql] = mockPool.query.mock.calls[0];
    expect(sql).toContain('LIMIT 50');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/food/history');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});