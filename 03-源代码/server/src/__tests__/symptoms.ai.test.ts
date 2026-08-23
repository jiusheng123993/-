/**
 * 症状 AI 深度分析路由集成测试（Phase 2）
 * 覆盖：会员强制校验、正常分析、输出安全检测拦截、参数校验、会员过期
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  return { mockPool: pool };
});

// 会员状态 mock（routes/symptoms.ts 内 new MembershipRepository() 时注入）
const { mockFindTierAndStatus } = vi.hoisted(() => ({ mockFindTierAndStatus: vi.fn() }));

// AI 服务 mock（chat 生成话术 / guardCheckOutput 输出安全检测）
const { mockChat, mockGuardCheckOutput } = vi.hoisted(() => ({
  mockChat: vi.fn(),
  mockGuardCheckOutput: vi.fn(),
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

vi.mock('crypto', () => ({
  default: { randomUUID: vi.fn(() => 'mock-crypto-uuid') },
  randomUUID: vi.fn(() => 'mock-crypto-uuid'),
}));

// 会员仓库：仅暴露 findTierAndStatus（挂 hoisted mock，测试内可配置返回值）
vi.mock('../repositories/membershipRepository.js', () => {
  class MockMembershipRepository {
    findTierAndStatus = mockFindTierAndStatus;
  }
  return { MembershipRepository: MockMembershipRepository };
});

// AI 服务 mock
vi.mock('../services/aiService.js', () => ({
  chat: mockChat,
  guardCheckOutput: mockGuardCheckOutput,
}));

// 记忆服务 mock：recallHealthMemories 返回固定召回，隔离记忆 SQL 的真实查询
vi.mock('../services/memoryService.js', () => ({
  recordHealthMemory: vi.fn(),
  recallHealthMemories: vi.fn(),
}));

import { recallHealthMemories } from '../services/memoryService.js';
import symptomsRouter from '../routes/symptoms.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/pets', symptomsRouter);
  return app;
}

/** 会员宠物档案行（pet_profiles 完整字段子集） */
const mockPetRow = {
  id: 'pet-001',
  user_id: 'test-user-id',
  name: '旺财',
  species: 'dog',
  breed: '金毛寻回犬',
  breed_id: null,
  gender: 'male',
  birth_date: '2020-01-01',
  weight: 30,
  avatar_photo_url: null,
  avatar_cartoon_url: null,
  avatar_style: null,
  photos: [],
  is_neutered: true,
  microchip_id: '',
  notes: '',
  is_deceased: false,
  deceased_date: null,
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

/** AI 深度分析请求体 */
const validBody = {
  symptoms: ['vomiting', 'diarrhea'],
  symptom_names: ['呕吐', '腹泻'],
  risk_level: 'warning',
  possible_conditions: ['胃炎', '肠炎'],
  conclusions: [
    { text: '呕吐+腹泻属于高风险组合，建议24小时内就医', basis: 'rule', confidence: 'high' },
  ],
};

beforeEach(() => {
  mockPool.query.mockReset();
  mockFindTierAndStatus.mockReset();
  mockChat.mockReset();
  mockGuardCheckOutput.mockReset();
  vi.mocked(recallHealthMemories).mockReset();
});

describe('POST /api/pets/:petId/symptom-check/ai-analysis', () => {
  it('非会员 → 403（服务端强制会员校验）', async () => {
    // 宠物归属校验通过
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValueOnce({ tier: 'free', status: 'active', expires_at: null });

    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('会员');
    // 非会员不应触发 LLM 调用
    expect(mockChat).not.toHaveBeenCalled();
  });

  it('会员已过期 → 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    mockFindTierAndStatus.mockResolvedValueOnce({ tier: 'member', status: 'active', expires_at: '2020-01-01T00:00:00Z' });

    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('会员 + 正常分析 → 200，返回 AI 建议（含免责声明）+ 记忆召回', async () => {
    // 调用顺序：canAccess → findByIdAndUser → 近7天打卡查询
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockPetRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockFindTierAndStatus.mockResolvedValueOnce({ tier: 'member', status: 'active', expires_at: '2026-12-31T00:00:00Z' });
    vi.mocked(recallHealthMemories).mockResolvedValueOnce([
      { content: '上次换粮后呕吐，3天后恢复', importance: 7, category: 'medical', created_at: '2026-07-01T00:00:00Z' },
    ]);
    mockChat.mockResolvedValueOnce('建议先禁食观察，如果症状持续超过24小时请及时就医。');
    mockGuardCheckOutput.mockResolvedValueOnce({ isUnsafeMedicalAdvice: false });

    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aiAdvice).toContain('不替代专业兽医诊断');
    expect(res.body.data.unsafe).toBe(false);
    expect(res.body.data.memoriesUsed).toHaveLength(1);
    expect(res.body.data.memoriesUsed[0].content).toContain('呕吐');
    // 记忆召回的关键词包含症状中文名
    expect(recallHealthMemories).toHaveBeenCalledWith(
      'test-user-id',
      'pet-001',
      expect.arrayContaining(['呕吐', '腹泻']),
      5,
    );
    // LLM 请求注入宠物档案与初筛结论
    expect(mockChat).toHaveBeenCalledTimes(1);
    const systemPrompt = mockChat.mock.calls[0][0][0].content as string;
    expect(systemPrompt).toContain('旺财');
    expect(systemPrompt).toContain('呕吐、腹泻');
    expect(systemPrompt).toContain('不推荐具体药物');
  });

  it('输出安全检测拦截 → unsafe=true，aiAdvice 为兜底文案', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockPetRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockFindTierAndStatus.mockResolvedValueOnce({ tier: 'member', status: 'active', expires_at: '2026-12-31T00:00:00Z' });
    vi.mocked(recallHealthMemories).mockResolvedValueOnce([]);
    mockChat.mockResolvedValueOnce('你的猫得了肠胃炎，建议吃阿莫西林。');
    mockGuardCheckOutput.mockResolvedValueOnce({ isUnsafeMedicalAdvice: true });

    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.data.unsafe).toBe(true);
    expect(res.body.data.aiAdvice).toContain('拦截');
  });

  it('参数校验：缺少 symptoms → 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check/ai-analysis')
      .send({ risk_level: 'warning' });

    expect(res.status).toBe(400);
    expect(mockChat).not.toHaveBeenCalled();
  });

  it('非本人宠物 → 403（归属校验）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/pets/other-pet/symptom-check/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(403);
    expect(mockChat).not.toHaveBeenCalled();
  });

  it('打卡日期格式化为 YYYY-MM-DD（TIMESTAMPTZ Date 不产出乱码）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockPetRow], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          { spirit_level: 3, appetite_level: 2, poop_level: 3, exercise_level: 3, weight: null, note: '精神稍差', created_at: new Date('2026-08-20T10:00:00Z') },
        ],
        rowCount: 1,
      });
    mockFindTierAndStatus.mockResolvedValueOnce({ tier: 'member', status: 'active', expires_at: '2026-12-31T00:00:00Z' });
    vi.mocked(recallHealthMemories).mockResolvedValueOnce([]);
    mockChat.mockResolvedValueOnce('建议观察。');
    mockGuardCheckOutput.mockResolvedValueOnce({ isUnsafeMedicalAdvice: false });

    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(200);
    const systemPrompt = mockChat.mock.calls[0][0][0].content as string;
    expect(systemPrompt).toContain('2026-08-20');
    expect(systemPrompt).not.toContain('Thu');
  });

  it('LLM 调用失败 → 降级返回（fail-safe，不抛 500，守卫不再执行）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockPetRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockFindTierAndStatus.mockResolvedValueOnce({ tier: 'member', status: 'active', expires_at: '2026-12-31T00:00:00Z' });
    vi.mocked(recallHealthMemories).mockResolvedValueOnce([]);
    mockChat.mockRejectedValueOnce(new Error('timeout'));

    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check/ai-analysis')
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.data.degraded).toBe(true);
    expect(res.body.data.aiAdvice).toContain('稍后再试');
    expect(mockGuardCheckOutput).not.toHaveBeenCalled();
  });
});
