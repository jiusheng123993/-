/**
 * 症状初筛路由集成测试
 * 覆盖：症状提交、历史查询（分页）、参数校验、归属校验
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

vi.mock('crypto', () => ({
  default: {
    randomUUID: vi.fn(() => 'mock-crypto-uuid'),
  },
  randomUUID: vi.fn(() => 'mock-crypto-uuid'),
}));

import symptomsRouter from '../routes/symptoms.js';

function createApp() {
  const app = express();
  app.use(express.json());
  // 与 index.ts 保持一致：路由挂载在 /api/pets 前缀下（路由内部使用相对路径）
  app.use('/api/pets', symptomsRouter);
  return app;
}

const mockSymptomCheck = {
  id: 'symptom-001',
  pet_id: 'pet-001',
  user_id: 'test-user-id',
  symptoms: ['呕吐', '食欲不振'],
  duration: '2天',
  severity: 'medium',
  additional_info: '{}',
  risk_level: 'warning',
  possible_conditions: ['肠胃炎'],
  ai_advice: '建议尽快就医',
  recommended_actions: ['带宠物去看兽医'],
  knowledge_match: null,
  created_at: '2026-07-25T00:00:00Z',
};

beforeEach(() => {
  // 必须用 mockReset（清空 once 队列），避免 validate 提前后 400 用例的 mock 泄漏到后续用例
  mockPool.query.mockReset();
});

describe('POST /api/pets/:petId/symptom-check - 提交症状初筛', () => {
  it('正常提交症状初筛', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockSymptomCheck], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check')
      .send({
        symptoms: ['呕吐', '食欲不振'],
        duration: '2天',
        severity: 'medium',
        risk_level: 'warning',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.risk_level).toBe('warning');
  });

  it('参数校验：缺少 symptoms，返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check')
      .send({ duration: '2天', severity: 'medium' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('症状列表');
  });

  it('参数校验：symptoms 为空数组，返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check')
      .send({ symptoms: [], duration: '2天' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('症状列表');
  });

  it('参数校验：symptoms 不是数组，返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check')
      .send({ symptoms: '呕吐', duration: '2天' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('risk_level 白名单校验：无效值返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check')
      .send({
        symptoms: ['呕吐'],
        risk_level: 'invalid_level',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('宠物不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/pets/other-pet/symptom-check')
      .send({ symptoms: ['呕吐'], duration: '2天' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('无权操作此宠物');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check')
      .send({ symptoms: ['呕吐'], duration: '2天' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/pets/:petId/symptom-check/history - 获取初筛历史', () => {
  it('正常获取初筛历史（分页）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockSymptomCheck], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/symptom-check/history');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.list).toBeInstanceOf(Array);
    expect(res.body.data.list).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.pageSize).toBe(20);
  });

  it('无历史记录时返回空列表', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/symptom-check/history');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.list).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  it('自定义分页参数', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/symptom-check/history?page=2&page_size=10');

    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe(2);
    expect(res.body.data.pageSize).toBe(10);
  });

  it('宠物不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/other-pet/symptom-check/history');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('无权操作此宠物');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/api/pets/pet-001/symptom-check/history');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
