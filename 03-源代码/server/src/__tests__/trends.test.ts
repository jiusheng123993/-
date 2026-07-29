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

import trendsRouter from '../routes/trends.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', trendsRouter);
  return app;
}

const mockHealthEntry = {
  record_date: new Date('2026-07-25'),
  value: '12.5',
};

const mockHealthEntry2 = {
  record_date: new Date('2026-07-24'),
  value: '12.3',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/pets/:petId/trends - 获取趋势数据', () => {
  it('正常获取体重趋势（默认 30 天）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockHealthEntry, mockHealthEntry2], rowCount: 2 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends?type=weight');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('weight');
    expect(res.body.data.points).toBeInstanceOf(Array);
    expect(res.body.data.points.length).toBeGreaterThan(0);
    expect(res.body.data.trend).toBeDefined();
    expect(res.body.data.trend.current).toBeDefined();
    expect(res.body.data.trend.avg).toBeDefined();
    expect(res.body.data.trend.min).toBeDefined();
    expect(res.body.data.trend.max).toBeDefined();
  });

  it('type 参数不传时默认使用 weight', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockHealthEntry], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends');

    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe('weight');
  });

  it('type 参数无效，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends?type=invalid');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('weight, appetite 或 poop');
  });

  it('自定义 days 参数（边界值 1）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends?type=weight&days=1');

    expect(res.status).toBe(200);
    expect(res.body.data.days).toBe(1);
  });

  it('days 超过 365 时截断为 365', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends?type=weight&days=500');

    expect(res.status).toBe(200);
    expect(res.body.data.days).toBe(365);
  });

  it('days 为负数时截断为 1', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends?type=weight&days=-10');

    expect(res.status).toBe(200);
    expect(res.body.data.days).toBe(1);
  });

  it('无数据时返回空趋势', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends?type=appetite');

    expect(res.status).toBe(200);
    expect(res.body.data.points).toEqual([]);
    expect(res.body.data.trend.current).toBeNull();
    expect(res.body.data.trend.avg).toBeNull();
  });

  it('宠物不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/other-pet/trends?type=weight');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('无权操作此宠物');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends?type=weight');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/pets/:petId/trends/report - 获取月度报告', () => {
  it('正常获取月度报告', async () => {
    const mockReportRow = {
      entry_count: '10',
      avg_weight: '12.5',
      avg_appetite: '4.2',
      avg_poop: '3.8',
      avg_spirit: '4.5',
      avg_exercise: '4.0',
      min_weight: '12.0',
      max_weight: '13.0',
      anomaly_count: '1',
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockReportRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ weight: '12.5' }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends/report?year=2026&month=7');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.year).toBe(2026);
    expect(res.body.data.month).toBe(7);
    expect(res.body.data.entry_count).toBe(10);
    expect(res.body.data.summary.avg_weight).toBe(12.5);
    expect(res.body.data.summary.anomaly_count).toBe(1);
  });

  it('不传年月时使用当前月份', async () => {
    const mockReportRow = {
      entry_count: '0',
      avg_weight: null,
      avg_appetite: null,
      avg_poop: null,
      avg_spirit: null,
      avg_exercise: null,
      min_weight: null,
      max_weight: null,
      anomaly_count: '0',
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockReportRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ weight: '12.5' }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends/report');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('无打卡记录时 entry_count 为 0', async () => {
    const emptyReport = {
      entry_count: '0',
      avg_weight: null,
      avg_appetite: null,
      avg_poop: null,
      avg_spirit: null,
      avg_exercise: null,
      min_weight: null,
      max_weight: null,
      anomaly_count: '0',
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [emptyReport], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends/report');

    expect(res.status).toBe(200);
    expect(res.body.data.entry_count).toBe(0);
    expect(res.body.data.summary.avg_weight).toBeNull();
  });

  it('宠物不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/other-pet/trends/report');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('无权操作此宠物');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/api/pets/pet-001/trends/report');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});