/**
 * 喂养记录路由集成测试
 * 覆盖：创建、列表、更新、删除、参数校验、归属校验
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
      return `mock-feeding-${String(callCount).padStart(4, '0')}`;
    }),
  };
});

import feedingRecordsRouter from '../routes/feedingRecords.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/pets', feedingRecordsRouter);
  return app;
}

const mockFeedingRecord = {
  id: 'feeding-001',
  pet_id: 'pet-001',
  user_id: 'test-user-id',
  record_date: '2026-07-25',
  food_type: '皇家成犬粮',
  brand: '皇家',
  amount: '120',
  unit: 'g',
  meal_time: '早餐',
  appetite: 'good',
  stool: 'normal',
  energy: 'high',
  notes: '进食正常',
  created_at: '2026-07-25T08:00:00Z',
  updated_at: '2026-07-25T08:00:00Z',
};

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('POST /pets/:petId/feeding-records - 创建喂养记录', () => {
  it('正常创建记录，返回 201 且字段转为 camelCase', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockFeedingRecord], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records')
      .send({
        date: '2026-07-25',
        food_type: '皇家成犬粮',
        brand: '皇家',
        amount: 120,
        unit: 'g',
        meal_time: '早餐',
        appetite: 'good',
        stool: 'normal',
        energy: 'high',
        notes: '进食正常',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.foodType).toBe('皇家成犬粮');
    expect(res.body.data.recordDate).toBe('2026-07-25');
    expect(res.body.data.petId).toBe('pet-001');
    expect(res.body.data.mealTime).toBe('早餐');
  });

  it('参数校验：food_type 为空，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records')
      .send({ date: '2026-07-25', food_type: '' });

    expect(res.status).toBe(400);
  });

  it('参数校验：date 格式错误，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records')
      .send({ date: '2026/07/25', food_type: '皇家成犬粮' });

    expect(res.status).toBe(400);
  });

  it('参数校验：appetite 非法值，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records')
      .send({ date: '2026-07-25', food_type: '皇家成犬粮', appetite: 'excellent' });

    expect(res.status).toBe(400);
  });

  it('宠物不存在（或不属于当前用户），返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/pets/pet-999/feeding-records')
      .send({ date: '2026-07-25', food_type: '皇家成犬粮' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockRejectedValueOnce(new Error('DB down'));

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records')
      .send({ date: '2026-07-25', food_type: '皇家成犬粮' });

    expect(res.status).toBe(500);
  });
});

describe('GET /pets/:petId/feeding-records - 查询喂养记录列表', () => {
  it('正常返回列表（camelCase 字段）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockFeedingRecord], rowCount: 1 });

    const res = await request(createApp()).get('/pets/pet-001/feeding-records');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].petId).toBe('pet-001');
    expect(res.body.data[0].foodType).toBe('皇家成犬粮');
  });

  it('宠物不存在（或不属于当前用户），返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp()).get('/pets/pet-999/feeding-records');

    expect(res.status).toBe(404);
  });
});

describe('PUT /pets/:petId/feeding-records/:recordId - 更新喂养记录', () => {
  it('正常更新记录', async () => {
    const updated = { ...mockFeedingRecord, appetite: 'poor', notes: '食欲下降' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

    const res = await request(createApp())
      .put('/pets/pet-001/feeding-records/feeding-001')
      .send({ appetite: 'poor', notes: '食欲下降' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appetite).toBe('poor');
  });

  it('记录不存在（或不属于当前用户），返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/pets/pet-001/feeding-records/feeding-999')
      .send({ appetite: 'poor' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('喂养记录不存在');
  });

  it('参数校验：food_type 超长，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

    const res = await request(createApp())
      .put('/pets/pet-001/feeding-records/feeding-001')
      .send({ food_type: 'x'.repeat(51) });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /pets/:petId/feeding-records/:recordId - 删除喂养记录', () => {
  it('正常删除记录', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(createApp()).delete('/pets/pet-001/feeding-records/feeding-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('记录不存在，返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(createApp()).delete('/pets/pet-001/feeding-records/feeding-999');

    expect(res.status).toBe(404);
  });
});
