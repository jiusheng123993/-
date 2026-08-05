/**
 * AI 建议记录路由集成测试（效果追踪模块）
 * 覆盖：创建、列表、采纳/取消采纳、删除、参数校验、归属校验
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

vi.mock('uuid', () => {
  let callCount = 0;
  return {
    v4: vi.fn(() => {
      callCount++;
      return `mock-suggestion-${String(callCount).padStart(4, '0')}`;
    }),
  };
});

import suggestionRecordsRouter from '../routes/suggestionRecords.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/pets', suggestionRecordsRouter);
  return app;
}

const mockSuggestion = {
  id: 'suggestion-001',
  pet_id: 'pet-001',
  user_id: 'test-user-id',
  type: 'feeding',
  title: '个性化喂养建议',
  content: '建议调整每日喂食量并增加饮水量',
  priority: 'medium',
  adopted: false,
  adopted_at: null,
  created_at: '2026-07-25T08:00:00Z',
  updated_at: '2026-07-25T08:00:00Z',
};

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('POST /pets/:petId/suggestions - 创建建议记录', () => {
  it('正常创建记录，返回 201 且字段转为 camelCase', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockSuggestion], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/suggestions')
      .send({
        type: 'feeding',
        title: '个性化喂养建议',
        content: '建议调整每日喂食量并增加饮水量',
        priority: 'medium',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('feeding');
    expect(res.body.data.petId).toBe('pet-001');
    expect(res.body.data.adoptedAt).toBeNull();
  });

  it('参数校验：type 非法值，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/suggestions')
      .send({ type: 'unknown', title: '测试', content: '内容' });

    expect(res.status).toBe(400);
  });

  it('参数校验：title 为空，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/suggestions')
      .send({ type: 'feeding', title: '', content: '内容' });

    expect(res.status).toBe(400);
  });

  it('参数校验：content 超长，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/suggestions')
      .send({ type: 'feeding', title: '测试', content: 'x'.repeat(1001) });

    expect(res.status).toBe(400);
  });

  it('宠物不存在（或不属于当前用户），返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/pets/pet-999/suggestions')
      .send({ type: 'feeding', title: '测试', content: '内容' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockRejectedValueOnce(new Error('DB down'));

    const res = await request(createApp())
      .post('/pets/pet-001/suggestions')
      .send({ type: 'feeding', title: '测试', content: '内容' });

    expect(res.status).toBe(500);
  });
});

describe('GET /pets/:petId/suggestions - 查询建议记录列表', () => {
  it('正常返回列表（camelCase 字段）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockSuggestion], rowCount: 1 });

    const res = await request(createApp()).get('/pets/pet-001/suggestions');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].petId).toBe('pet-001');
    expect(res.body.data[0].adoptedAt).toBeNull();
  });

  it('宠物不存在（或不属于当前用户），返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp()).get('/pets/pet-999/suggestions');

    expect(res.status).toBe(404);
  });
});

describe('PATCH /pets/:petId/suggestions/:recordId/adoption - 更新采纳状态', () => {
  it('正常采纳建议', async () => {
    const adopted = { ...mockSuggestion, adopted: true, adopted_at: '2026-07-25T09:00:00Z' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [adopted], rowCount: 1 });

    const res = await request(createApp())
      .patch('/pets/pet-001/suggestions/suggestion-001/adoption')
      .send({ adopted: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.adopted).toBe(true);
    expect(res.body.data.adoptedAt).toBe('2026-07-25T09:00:00Z');
  });

  it('正常取消采纳', async () => {
    const cancelled = { ...mockSuggestion, adopted: false, adopted_at: null };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [cancelled], rowCount: 1 });

    const res = await request(createApp())
      .patch('/pets/pet-001/suggestions/suggestion-001/adoption')
      .send({ adopted: false });

    expect(res.status).toBe(200);
    expect(res.body.data.adopted).toBe(false);
    expect(res.body.data.adoptedAt).toBeNull();
  });

  it('记录不存在（或不属于当前用户），返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .patch('/pets/pet-001/suggestions/suggestion-999/adoption')
      .send({ adopted: true });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('建议记录不存在');
  });

  it('参数校验：adopted 非布尔值，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .patch('/pets/pet-001/suggestions/suggestion-001/adoption')
      .send({ adopted: 'yes' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /pets/:petId/suggestions/:recordId - 删除建议记录', () => {
  it('正常删除记录', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(createApp()).delete('/pets/pet-001/suggestions/suggestion-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('记录不存在，返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(createApp()).delete('/pets/pet-001/suggestions/suggestion-999');

    expect(res.status).toBe(404);
  });
});
