/**
 * 健康打卡路由集成测试
 * 覆盖：打卡创建、历史查询、今日打卡、参数校验、归属校验
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
      return `mock-checkin-${String(callCount).padStart(4, '0')}`;
    }),
  };
});

import checkinsRouter from '../routes/checkins.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/pets', checkinsRouter);
  return app;
}

const mockCheckin = {
  id: 'checkin-001',
  pet_id: 'pet-001',
  user_id: 'test-user-id',
  poop_level: 3,
  appetite_level: 4,
  spirit_level: 5,
  exercise_level: 4,
  weight: 12.5,
  has_anomaly: false,
  anomaly_items: [],
  ai_feedback: null,
  risk_level: 'normal',
  note: null,
  created_at: '2026-07-25T08:00:00Z',
};

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('POST /pets/:petId/checkins - 创建打卡', () => {
  it('正常创建打卡记录，返回 201', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCheckin], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/checkins')
      .send({
        poop_level: 3,
        appetite_level: 4,
        spirit_level: 5,
        exercise_level: 4,
        risk_level: 'normal',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.poopLevel).toBe(3);
    expect(res.body.data.appetiteLevel).toBe(4);
    expect(res.body.data.spiritLevel).toBe(5);
    expect(res.body.data.exerciseLevel).toBe(4);
    expect(res.body.data.riskLevel).toBe('normal');
  });

  it('参数校验：缺少 poop_level，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/checkins')
      .send({
        appetite_level: 4,
        spirit_level: 5,
        exercise_level: 4,
        risk_level: 'normal',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('poop_level');
  });

  it('参数校验：缺少 risk_level，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/checkins')
      .send({
        poop_level: 3,
        appetite_level: 4,
        spirit_level: 5,
        exercise_level: 4,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('risk_level');
  });

  it('宠物不存在（或不属于当前用户），返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/pets/other-pet/checkins')
      .send({
        poop_level: 3,
        appetite_level: 4,
        spirit_level: 5,
        exercise_level: 4,
        risk_level: 'normal',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('可选字段：包含 anomaly 和 note', async () => {
    const anomalyCheckin = {
      ...mockCheckin,
      has_anomaly: true,
      anomaly_items: ['呕吐'],
      note: '早上吐了',
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [anomalyCheckin], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/checkins')
      .send({
        poop_level: 3,
        appetite_level: 4,
        spirit_level: 5,
        exercise_level: 4,
        risk_level: 'warning',
        has_anomaly: true,
        anomaly_items: ['呕吐'],
        note: '早上吐了',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.hasAnomaly).toBe(true);
    expect(res.body.data.anomalyItems).toEqual(['呕吐']);
    expect(res.body.data.note).toBe('早上吐了');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .post('/pets/pet-001/checkins')
      .send({
        poop_level: 3,
        appetite_level: 4,
        spirit_level: 5,
        exercise_level: 4,
        risk_level: 'normal',
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /pets/:petId/checkins - 获取打卡历史', () => {
  it('正常获取打卡历史（默认 30 天）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCheckin], rowCount: 1 });

    const res = await request(createApp())
      .get('/pets/pet-001/checkins');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(1);
  });

  it('自定义 days 参数', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/pets/pet-001/checkins?days=7');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('无效的 days 参数返回 400（schema 拒绝非数字）', async () => {
    const res = await request(createApp())
      .get('/pets/pet-001/checkins?days=invalid');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('宠物不属于当前用户，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/pets/other-pet/checkins');

    expect(res.status).toBe(404);
  });
});

describe('GET /pets/:petId/checkins/today - 获取今日打卡', () => {
  it('今日已有打卡，返回打卡记录', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCheckin], rowCount: 1 });

    const res = await request(createApp())
      .get('/pets/pet-001/checkins/today');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.poopLevel).toBe(3);
  });

  it('今日没有打卡，返回 null', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/pets/pet-001/checkins/today');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
  });

  it('宠物不属于当前用户，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/pets/other-pet/checkins/today');

    expect(res.status).toBe(404);
  });

  it('同一天可创建多条打卡记录（取最新一条）', async () => {
    const checkin2 = { ...mockCheckin, id: 'checkin-002', poop_level: 5 };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [checkin2], rowCount: 1 });

    const res = await request(createApp())
      .get('/pets/pet-001/checkins/today');

    expect(res.status).toBe(200);
    expect(res.body.data.poopLevel).toBe(5);
  });
});