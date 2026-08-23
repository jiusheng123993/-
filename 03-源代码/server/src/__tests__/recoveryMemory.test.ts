/**
 * 恢复事件记忆闭环测试（设计方案 6.2）
 * 低风险检查 + 近14天同症状高风险检查 → 沉淀"症状已恢复"记忆（importance 6，keySuffix=recovery）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  return { mockPool: pool };
});

const { mockRecordHealthMemory, mockRecallHealthMemories } = vi.hoisted(() => ({
  mockRecordHealthMemory: vi.fn(),
  mockRecallHealthMemories: vi.fn(),
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

// 记忆服务 mock：recordHealthMemory 用于断言初筛/恢复两次调用
vi.mock('../services/memoryService.js', () => ({
  recordHealthMemory: mockRecordHealthMemory,
  recallHealthMemories: mockRecallHealthMemories,
}));

import symptomsRouter from '../routes/symptoms.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/pets', symptomsRouter);
  return app;
}

/** 本次低风险检查行（createSymptomCheck 返回） */
const mockCheckRow = {
  id: 'symptom-001',
  pet_id: 'pet-001',
  user_id: 'test-user-id',
  symptoms: ['呕吐'],
  duration: '1天',
  severity: 'mild',
  additional_info: '{}',
  risk_level: 'normal',
  possible_conditions: [],
  ai_advice: '观察',
  recommended_actions: [],
  knowledge_match: null,
  created_at: '2026-08-22T00:00:00Z',
};

/** 14 天内的历史高风险检查行（findRecentHighRiskCheck 返回；created_at 用 Date 模拟 pg TIMESTAMPTZ） */
const mockPrevHighRisk = {
  id: 'symptom-000',
  pet_id: 'pet-001',
  user_id: 'test-user-id',
  symptoms: ['呕吐', '腹泻'],
  duration: '2天',
  severity: 'medium',
  additional_info: '{}',
  risk_level: 'warning',
  possible_conditions: ['胃炎'],
  ai_advice: '尽快就医',
  recommended_actions: [],
  knowledge_match: null,
  created_at: new Date('2026-08-19T00:00:00Z'),
};

beforeEach(() => {
  mockPool.query.mockReset();
  mockRecordHealthMemory.mockReset();
});

describe('恢复事件记忆闭环', () => {
  it('低风险检查 + 14天内同症状高风险检查 → 沉淀"已恢复"记忆', async () => {
    // pool.query 调用顺序：isOwner → createSymptomCheck → findRecentHighRiskCheck
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCheckRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockPrevHighRisk], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/symptom-check')
      .send({ symptoms: ['呕吐'], duration: '1天', severity: 'mild', risk_level: 'normal' });

    expect(res.status).toBe(200);
    // 初筛记忆 + 恢复记忆，共 2 次
    expect(mockRecordHealthMemory).toHaveBeenCalledTimes(2);
    const recoveryCall = mockRecordHealthMemory.mock.calls[1][0];
    expect(recoveryCall.content).toContain('已恢复');
    expect(recoveryCall.content).toContain('2026-08-19'); // 日期格式化（Date 对象不产出 "Thu"）
    expect(recoveryCall.importance).toBe(6);
    expect(recoveryCall.keySuffix).toBe('recovery');
  });

  it('高风险检查（warning）→ 只记初筛记忆，不触发恢复', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ ...mockCheckRow, risk_level: 'warning' }], rowCount: 1 });

    await request(createApp())
      .post('/api/pets/pet-001/symptom-check')
      .send({ symptoms: ['呕吐'], risk_level: 'warning' });

    expect(mockRecordHealthMemory).toHaveBeenCalledTimes(1);
    expect(mockRecordHealthMemory.mock.calls[0][0].keySuffix).toBeUndefined();
  });

  it('低风险但无历史高风险检查 → 不触发恢复', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCheckRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // 无历史高风险

    await request(createApp())
      .post('/api/pets/pet-001/symptom-check')
      .send({ symptoms: ['呕吐'], risk_level: 'normal' });

    expect(mockRecordHealthMemory).toHaveBeenCalledTimes(1);
  });

  it('边界：历史高风险检查症状无交集 → 不触发恢复（findRecentHighRiskCheck 返回 null）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCheckRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await request(createApp())
      .post('/api/pets/pet-001/symptom-check')
      .send({ symptoms: ['cough'], risk_level: 'caution' });

    expect(mockRecordHealthMemory).toHaveBeenCalledTimes(1);
  });
});
