/**
 * 喂养建议 AI 分析路由集成测试
 * 覆盖：会员强制、归属校验、schema 校验、service 调用、降级返回
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  return { mockPool: pool };
});

// 会员仓库 mock：默认会员（isMember=true），测试用例可覆盖
const { mockFindTierAndStatus } = vi.hoisted(() => ({
  mockFindTierAndStatus: vi.fn(),
}));

vi.mock('../repositories/membershipRepository.js', () => ({
  MembershipRepository: vi.fn(function (this: { findTierAndStatus: (...args: unknown[]) => unknown }) {
    this.findTierAndStatus = (...args: unknown[]) => mockFindTierAndStatus(...args);
    return this;
  }),
}));

// 喂养 AI service mock：默认返回成功
const { mockAnalyzeFeedingAdvice } = vi.hoisted(() => ({
  mockAnalyzeFeedingAdvice: vi.fn(),
}));

vi.mock('../services/feedingAiService.js', () => ({
  analyzeFeedingAdvice: (...args: unknown[]) => mockAnalyzeFeedingAdvice(...args),
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

import feedingRecordsRouter from '../routes/feedingRecords.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/pets', feedingRecordsRouter);
  return app;
}

const validBody = {
  pet_name: '可乐',
  species: 'cat',
  breed: '英短',
  age_months: 11,
  weight: 4.5,
  body_condition: 'normal',
  is_puppy_kitten: true,
  is_neutered: false,
  chronic_conditions: [],
  allergies: [],
  recent_appetite: 'good',
  recent_stool: 'normal',
  current_advice: '每日建议喂食量约 200 kcal',
};

beforeEach(() => {
  mockPool.query.mockReset();
  mockFindTierAndStatus.mockReset();
  mockAnalyzeFeedingAdvice.mockReset();
});

describe('POST /pets/:petId/feeding-records/ai-analysis - AI 喂养建议', () => {
  it('会员 + 归属校验通过 → 200 返回 AI 建议', async () => {
    // 归属校验：isOwner 查询返回 1 行
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'premium', status: 'active', expires_at: null });
    mockAnalyzeFeedingAdvice.mockResolvedValue({
      aiAdvice: '1. 建议分3-4餐喂食。\n2. 保持水分。\n\n免责声明',
      memoriesUsed: [],
      unsafe: false,
    });

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aiAdvice).toContain('1. ');
    expect(mockAnalyzeFeedingAdvice).toHaveBeenCalledTimes(1);
  });

  it('非会员 → 403 拦截（服务端强制，不能只靠前端隐藏）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'free', status: 'active', expires_at: null });

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(mockAnalyzeFeedingAdvice).not.toHaveBeenCalled();
  });

  it('会员过期 → 403 拦截', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'premium', status: 'active', expires_at: '2020-01-01T00:00:00Z' });

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('宠物不属于当前用户 → 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/pets/other-pet/feeding-records/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(404);
  });

  it('schema 校验：缺 pet_name → 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });
    const { pet_name, ...rest } = validBody;

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records/ai-analysis')
      .send(rest);

    expect(res.status).toBe(400);
  });

  it('schema 校验：species 非法 → 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records/ai-analysis')
      .send({ ...validBody, species: 'bird' });

    expect(res.status).toBe(400);
  });

  it('service 降级（LLM 不可用）→ 200 且 degraded=true（fail-safe 不抛 500）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'premium', status: 'active', expires_at: null });
    mockAnalyzeFeedingAdvice.mockResolvedValue({
      aiAdvice: 'AI 喂养建议暂时不可用，请稍后再试。免责声明',
      memoriesUsed: [],
      unsafe: false,
      degraded: true,
    });

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.data.degraded).toBe(true);
  });

  it('service 抛异常 → 500', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValue({ tier: 'premium', status: 'active', expires_at: null });
    mockAnalyzeFeedingAdvice.mockRejectedValue(new Error('LLM crash'));

    const res = await request(createApp())
      .post('/pets/pet-001/feeding-records/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(500);
  });
});
