/**
 * 慢性病追踪路由集成测试
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
      return `mock-chronic-${String(callCount).padStart(4, '0')}`;
    }),
  };
});

import chronicRouter from '../routes/chronic.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/pets', chronicRouter);
  return app;
}

const mockChronicRecord = {
  id: 'chronic-001',
  pet_id: 'pet-001',
  user_id: 'test-user-id',
  condition: '慢性肾病',
  diagnosed_date: '2025-01-01',
  severity: 'moderate',
  status: 'active',
  medications: ['处方粮'],
  vet_name: '李医生',
  vet_contact: '13800138000',
  next_checkup_date: '2026-08-01',
  notes: '',
  symptoms: ['多饮'],
  created_at: '2026-07-25T08:00:00Z',
  updated_at: '2026-07-25T08:00:00Z',
};

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('POST /pets/:petId/chronic - 创建慢性病记录', () => {
  it('正常创建记录，返回 201 且字段转为 camelCase', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 }) // isOwner
      .mockResolvedValueOnce({ rows: [mockChronicRecord], rowCount: 1 }); // insert

    const res = await request(createApp())
      .post('/pets/pet-001/chronic')
      .send({
        condition: '慢性肾病',
        diagnosed_date: '2025-01-01',
        severity: 'moderate',
        status: 'active',
        medications: ['处方粮'],
        vet_name: '李医生',
        vet_contact: '13800138000',
        next_checkup_date: '2026-08-01',
        symptoms: ['多饮'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.condition).toBe('慢性肾病');
    expect(res.body.data.diagnosedDate).toBe('2025-01-01');
    expect(res.body.data.petId).toBe('pet-001');
    expect(res.body.data.vetName).toBe('李医生');
  });

  it('参数校验：condition 为空，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic')
      .send({ condition: '', diagnosed_date: '2025-01-01' });

    expect(res.status).toBe(400);
  });

  it('参数校验：diagnosed_date 格式错误，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic')
      .send({ condition: '关节炎', diagnosed_date: '2025/01/01' });

    expect(res.status).toBe(400);
  });

  it('参数校验：severity 非法值，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic')
      .send({ condition: '关节炎', diagnosed_date: '2025-01-01', severity: 'extreme' });

    expect(res.status).toBe(400);
  });

  it('宠物不存在（或不属于当前用户），返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // isOwner false

    const res = await request(createApp())
      .post('/pets/pet-999/chronic')
      .send({ condition: '关节炎', diagnosed_date: '2025-01-01' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockRejectedValueOnce(new Error('DB down'));

    const res = await request(createApp())
      .post('/pets/pet-001/chronic')
      .send({ condition: '关节炎', diagnosed_date: '2025-01-01' });

    expect(res.status).toBe(500);
  });
});

describe('GET /pets/:petId/chronic - 查询慢性病记录列表', () => {
  it('正常返回列表（camelCase 字段）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 }) // isOwner
      .mockResolvedValueOnce({ rows: [mockChronicRecord], rowCount: 1 }); // list

    const res = await request(createApp()).get('/pets/pet-001/chronic');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].petId).toBe('pet-001');
    expect(res.body.data[0].nextCheckupDate).toBe('2026-08-01');
  });

  it('宠物不存在（或不属于当前用户），返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp()).get('/pets/pet-999/chronic');

    expect(res.status).toBe(404);
  });
});

describe('PUT /pets/:petId/chronic/:recordId - 更新慢性病记录', () => {
  it('正常更新记录', async () => {
    const updated = { ...mockChronicRecord, status: 'managed' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 }) // isOwner
      .mockResolvedValueOnce({ rows: [updated], rowCount: 1 }); // update

    const res = await request(createApp())
      .put('/pets/pet-001/chronic/chronic-001')
      .send({ status: 'managed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('managed');
  });

  it('记录不存在（或不属于当前用户），返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 }) // isOwner
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // update no row

    const res = await request(createApp())
      .put('/pets/pet-001/chronic/chronic-999')
      .send({ status: 'managed' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('慢性病记录不存在');
  });

  it('参数校验：condition 超长，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .put('/pets/pet-001/chronic/chronic-001')
      .send({ condition: 'x'.repeat(101) });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /pets/:petId/chronic/:recordId - 删除慢性病记录', () => {
  it('正常删除记录', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 }) // isOwner
      .mockResolvedValueOnce({ rowCount: 1 }); // delete

    const res = await request(createApp()).delete('/pets/pet-001/chronic/chronic-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('记录不存在，返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(createApp()).delete('/pets/pet-001/chronic/chronic-999');

    expect(res.status).toBe(404);
  });
});
