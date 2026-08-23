/**
 * 慢性病 AI 分析路由集成测试
 * 覆盖：会员强制、归属校验、schema 校验、service 调用、无慢病记录降级
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

const { mockAnalyzeChronicAdvice } = vi.hoisted(() => ({
  mockAnalyzeChronicAdvice: vi.fn(),
}));

vi.mock('../services/chronicAiService.js', () => ({
  analyzeChronicAdvice: (...args: unknown[]) => mockAnalyzeChronicAdvice(...args),
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
  mockAnalyzeChronicAdvice.mockReset();
});

describe('POST /pets/:petId/chronic/ai-analysis - AI 慢病管理建议', () => {
  it('会员 + 归属校验通过 → 200 返回 AI 建议', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'premium', status: 'active', expires_at: null });
    mockAnalyzeChronicAdvice.mockResolvedValue({
      aiAdvice: '1. 按时复查。\n2. 注意饮食。\n\n免责声明',
      memoriesUsed: [],
      unsafe: false,
    });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic/ai-analysis')
      .send({ focus: '复查提醒' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aiAdvice).toContain('1. ');
    expect(mockAnalyzeChronicAdvice).toHaveBeenCalledWith('test-user-id', 'pet-001', { focus: '复查提醒' });
  });

  it('非会员 → 403 拦截', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'free', status: 'active', expires_at: null });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic/ai-analysis')
      .send({});

    expect(res.status).toBe(403);
    expect(mockAnalyzeChronicAdvice).not.toHaveBeenCalled();
  });

  it('宠物不属于当前用户 → 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/pets/other-pet/chronic/ai-analysis')
      .send({});

    expect(res.status).toBe(404);
  });

  it('focus 超过 200 字符 → 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic/ai-analysis')
      .send({ focus: 'x'.repeat(201) });

    expect(res.status).toBe(400);
  });

  it('service 降级 → 200 且 degraded=true', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'premium', status: 'active', expires_at: null });
    mockAnalyzeChronicAdvice.mockResolvedValue({
      aiAdvice: 'AI 慢病管理建议暂时不可用，请稍后再试。免责声明',
      memoriesUsed: [],
      unsafe: false,
      degraded: true,
    });

    const res = await request(createApp())
      .post('/pets/pet-001/chronic/ai-analysis')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.degraded).toBe(true);
  });

  it('service 抛异常 → 500', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'premium', status: 'active', expires_at: null });
    mockAnalyzeChronicAdvice.mockRejectedValue(new Error('LLM crash'));

    const res = await request(createApp())
      .post('/pets/pet-001/chronic/ai-analysis')
      .send({});

    expect(res.status).toBe(500);
  });
});
