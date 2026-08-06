/**
 * 疫苗和驱虫路由集成测试
 * 覆盖：疫苗列表、添加记录、标记完成、参数校验、归属校验
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

import vaccinesRouter from '../routes/vaccines.js';

function createApp() {
  const app = express();
  app.use(express.json());
  // 与 index.ts 保持一致：路由挂载在 /api/pets 前缀下（路由内部使用相对路径）
  app.use('/api/pets', vaccinesRouter);
  return app;
}

const mockVaccine = {
  id: 'vaccine-001',
  pet_id: 'pet-001',
  user_id: 'test-user-id',
  type: 'vaccine',
  category: '狂犬疫苗',
  date: '2026-07-25',
  next_date: '2027-07-25',
  status: 'pending',
  hospital: '宠爱医院',
  doctor: '李医生',
  notes: '年度疫苗',
  reminder_enabled: true,
  created_at: '2026-07-25T00:00:00Z',
};

const mockVaccine2 = {
  ...mockVaccine,
  id: 'vaccine-002',
  category: '多联疫苗',
  type: 'vaccine',
  date: '2026-01-15',
  next_date: '2027-01-15',
  status: 'completed',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/pets/:petId/vaccines - 获取疫苗计划', () => {
  it('正常获取疫苗计划列表', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockVaccine, mockVaccine2], rowCount: 2 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/vaccines');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].category).toBe('狂犬疫苗');
  });

  it('无疫苗计划时返回空数组', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/vaccines');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('宠物不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/other-pet/vaccines');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('无权操作此宠物');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/api/pets/pet-001/vaccines');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/pets/:petId/vaccines - 添加疫苗记录', () => {
  it('正常添加疫苗记录', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockVaccine], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/vaccines')
      .send({
        type: 'vaccine',
        category: '狂犬疫苗',
        date: '2026-07-25',
        next_date: '2027-07-25',
        status: 'pending',
        hospital: '宠爱医院',
        doctor: '李医生',
        notes: '年度疫苗',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('vaccine');
    expect(res.body.data.category).toBe('狂犬疫苗');
  });

  it('参数校验：type 不是 vaccine 或 deworm，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/vaccines')
      .send({
        type: 'invalid',
        category: '测试',
        date: '2026-07-25',
        next_date: '2027-07-25',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('vaccine 或 deworm');
  });

  it('参数校验：缺少 category，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/vaccines')
      .send({
        type: 'vaccine',
        date: '2026-07-25',
        next_date: '2027-07-25',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('类别');
  });

  it('参数校验：缺少 date 和 next_date，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/vaccines')
      .send({
        type: 'vaccine',
        category: '狂犬疫苗',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('日期');
  });

  it('status 白名单校验：无效值回退为 pending', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ ...mockVaccine, status: 'pending' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/vaccines')
      .send({
        type: 'vaccine',
        category: '狂犬疫苗',
        date: '2026-07-25',
        next_date: '2027-07-25',
        status: 'invalid_status',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');
  });

  it('添加驱虫记录（type=deworm）', async () => {
    const dewormRecord = { ...mockVaccine, type: 'deworm', category: '体内驱虫' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [dewormRecord], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/vaccines')
      .send({
        type: 'deworm',
        category: '体内驱虫',
        date: '2026-07-25',
        next_date: '2026-10-25',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe('deworm');
  });

  it('宠物不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/pets/other-pet/vaccines')
      .send({
        type: 'vaccine',
        category: '狂犬疫苗',
        date: '2026-07-25',
        next_date: '2027-07-25',
      });

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/pets/:petId/vaccines/:vaccineId/complete - 标记完成', () => {
  it('正常标记疫苗为已完成', async () => {
    const completedVaccine = { ...mockVaccine, status: 'completed' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'vaccine-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [completedVaccine], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/pets/pet-001/vaccines/vaccine-001/complete')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('completed');
  });

  it('记录不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/api/pets/pet-001/vaccines/other-vaccine/complete')
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('无权操作此记录');
  });

  it('记录不存在，返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'vaccine-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/api/pets/pet-001/vaccines/vaccine-001/complete')
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('记录不存在');
  });
});
