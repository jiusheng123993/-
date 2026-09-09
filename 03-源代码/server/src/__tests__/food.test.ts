/**
 * 食物安全查询路由集成测试
 * 覆盖：食物查询、历史记录、模糊匹配、数据隔离
 */
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

/** 权威知识库行（pet_food_safety_knowledge，safety_level 枚举含 toxic/dangerous） */
const mockKnowledgeFood = {
  id: 'seed_西瓜',
  food_name: '西瓜',
  aliases: ['西瓜肉', '无籽西瓜', 'watermelon'],
  safety_level: 'safe',
  species_applicable: ['dog', 'cat'],
  detail: '西瓜去籽后少量果肉喂食是安全的，含水量高补水好。必须去籽（籽可造成梗阻）。',
  dangerous_compounds: [],
  toxic_doses: '',
  symptoms: [],
  first_aid: '',
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
  it('优先查权威知识库：命中时返回单条对象（不再返回数组）', async () => {
    // 第一个查询 = searchKnowledge（权威表）
    mockPool.query.mockResolvedValueOnce({ rows: [mockKnowledgeFood], rowCount: 1 });

    const res = await request(createApp())
      .get('/food/query?keyword=西瓜');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.source).toBe('knowledge_base');
    // 契约修复：data 是单个对象而非数组
    expect(Array.isArray(res.body.data)).toBe(false);
    expect(res.body.data.foodName).toBe('西瓜');
    expect(res.body.data.safetyLevel).toBe('safe');
    expect(res.body.data.userId).toBe('test-user-id');
  });

  it('权威库未命中：查询历史/占位表兜底，且把 danger 映射为 dangerous', async () => {
    // searchKnowledge 空 → searchByKeyword 命中历史行
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [mockFoodQuery], rowCount: 1 });

    const res = await request(createApp())
      .get('/food/query?keyword=巧克力');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.source).toBe('database');
    expect(Array.isArray(res.body.data)).toBe(false);
    expect(res.body.data.foodName).toBe('巧克力');
    // 历史表枚举是 'danger'，前端 PetFoodQuery 需要 'dangerous'，此处已归一化
    expect(res.body.data.safetyLevel).toBe('dangerous');
  });

  it('权威库与历史均无命中，插入占位（caution）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [mockPlaceholderFood], rowCount: 1 });

    const res = await request(createApp())
      .get('/food/query?keyword=奇怪食物');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.source).toBe('placeholder');
    expect(res.body.message).toContain('暂无该食物数据');
    expect(Array.isArray(res.body.data)).toBe(false);
    expect(res.body.data.safetyLevel).toBe('caution');
  });

  it('参数校验：缺少 keyword，返回 400', async () => {
    const res = await request(createApp())
      .get('/food/query');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('keyword');
  });

  it('知识库命中：模糊匹配关键词含 ILIKE 且参数为 % 包裹', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockKnowledgeFood], rowCount: 1 });

    const res = await request(createApp())
      .get('/food/query?keyword=西瓜');

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('knowledge_base');
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('pet_food_safety_knowledge');
    expect(sql).toContain('ILIKE');
    expect(params[0]).toContain('%西瓜%');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/food/query?keyword=西瓜');

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