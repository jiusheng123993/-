/**
 * 慢性病风险扫描路由集成测试
 * 覆盖：会员强制、归属校验、schema 校验、service 调用、降级返回
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  return { mockPool: pool };
});

const { mockFindTierAndStatus } = vi.hoisted(() => ({
  mockFindTierAndStatus: vi.fn(),
}));

vi.mock('../repositories/membershipRepository.js', () => ({
  MembershipRepository: vi.fn(function (this: { findTierAndStatus: (...args: unknown[]) => unknown }) {
    this.findTierAndStatus = (...args: unknown[]) => mockFindTierAndStatus(...args);
    return this;
  }),
}));

const { mockScanChronicRisk } = vi.hoisted(() => ({
  mockScanChronicRisk: vi.fn(),
}));

vi.mock('../services/chronicRiskService.js', () => ({
  scanChronicRisk: (...args: unknown[]) => mockScanChronicRisk(...args),
}));

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

import chronicRouter from '../routes/chronic.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/pets', chronicRouter);
  return app;
}

beforeEach(() => {
  mockPool.query.mockReset();
  mockFindTierAndStatus.mockReset();
  mockScanChronicRisk.mockReset();
});

describe('POST /pets/:petId/chronic/scan-risk - 慢病风险扫描', () => {
  it('会员 + 归属校验通过 → 200 返回风险信号与 AI 洞察', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'premium', status: 'active', expires_at: null });
    mockScanChronicRisk.mockResolvedValue({
      signals: [{ type: 'high_risk_frequency', title: '高风险打卡频繁', detail: '近30天有10天高风险', level: 'alert', relatedDates: [] }],
      aiInsight: '暂未发现明显慢病风险。免责声明',
      unsafe: false,
      scanDate: '2026-08-23',
    });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic/scan-risk')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.signals).toHaveLength(1);
    expect(res.body.data.aiInsight).toContain('免责声明');
    expect(mockScanChronicRisk).toHaveBeenCalledWith('test-user-id', 'pet-001');
  });

  it('非会员 → 403 拦截', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'free', status: 'active', expires_at: null });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic/scan-risk')
      .send({});

    expect(res.status).toBe(403);
    expect(mockScanChronicRisk).not.toHaveBeenCalled();
  });

  it('宠物不属于当前用户 → 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/pets/other-pet/chronic/scan-risk')
      .send({});

    expect(res.status).toBe(404);
  });

  it('schema 校验：携带未知字段（strict）→ 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic/scan-risk')
      .send({ unexpected: 1 });

    expect(res.status).toBe(400);
  });

  it('service 降级（LLM 不可用）→ 200 且 degraded=true', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'premium', status: 'active', expires_at: null });
    mockScanChronicRisk.mockResolvedValue({
      signals: [],
      aiInsight: 'AI 风险分析暂时不可用，请稍后再试。免责声明',
      unsafe: false,
      degraded: true,
      scanDate: '2026-08-23',
    });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic/scan-risk')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.degraded).toBe(true);
  });

  it('service 抛异常 → 500', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'premium', status: 'active', expires_at: null });
    mockScanChronicRisk.mockRejectedValue(new Error('DB crash'));

    const res = await request(createApp())
      .post('/pets/pet-001/chronic/scan-risk')
      .send({});

    expect(res.status).toBe(500);
  });
});
