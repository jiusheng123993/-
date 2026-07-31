/**
 * 记忆管理路由集成测试
 *
 * 覆盖：
 *   1. GET /api/memory          - 查看记忆列表（无过滤 / 按宠物过滤）
 *   2. PUT /api/memory/:id      - 修正记忆内容（成功 / 归属校验失败 / ID格式错误 / 缺少content）
 *
 * Mock 策略：
 *   - 数据库：vi.mock('../db.js')
 *   - 配置：vi.mock('../config.js')
 *   - 认证：vi.mock('../middleware/auth.js')，注入固定 userId
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
    port: 3000,
    databaseUrl: 'postgresql://localhost/test',
    ai: { apiKey: '', baseUrl: '', model: '' },
    bailian: { apiKey: '', baseUrl: '', visionModel: '', asrModel: '' },
    seedream: { apiKey: '' },
    seedance: { apiKey: '', model: '' },
    meshy: { apiKey: '', baseUrl: '' },
    moderate: { apiKey: '' },
    wechat: { appId: 'test-appid', secret: '' },
    wechatPay: {
      mock: true,
      mchId: '',
      apiV3Key: '',
      privateKey: '',
      certSerialNo: '',
      platformCertSerialNo: '',
      platformCert: '',
      notifyUrl: '',
    },
    uploadDir: './uploads',
    publicBaseUrl: '',
    allowedOrigins: [],
  },
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    _req.userId = 'test-user-id';
    next();
  },
}));

import memoryRouter from '../routes/memory.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/memory', memoryRouter);
  return app;
}

/** Mock 记忆行（与 agent_memories 表结构对齐） */
const mockMemoryRow = {
  id: 1,
  user_id: 'test-user-id',
  pet_id: 'pet-001',
  category: 'preference',
  key: 'loves_beef',
  content: '喜欢吃牛肉',
  importance: 6,
  confidence: 0.8,
  source: 'auto',
  evidence: ['user: 豆豆超爱吃牛肉'],
  decay_rate: 0.5,
  status: 'active',
  meta: {},
  last_recalled: null,
  created_at: '2026-07-31T00:00:00.000Z',
  updated_at: '2026-07-31T00:00:00.000Z',
};

beforeEach(() => {
  mockPool.query.mockReset();
});

// ===== 1. GET /api/memory - 查看记忆列表 =====
describe('GET /api/memory - 查看记忆列表', () => {
  it('无过滤返回全部记忆', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockMemoryRow], rowCount: 1 });

    const res = await request(createApp()).get('/api/memory');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.list[0].content).toBe('喜欢吃牛肉');
    expect(res.body.data.list[0].category).toBe('preference');

    // SQL 应为用户维度查询（无 pet 过滤）
    const sql = mockPool.query.mock.calls[0][0] as string;
    expect(sql).toContain('WHERE user_id = $1');
    expect(sql).not.toContain('pet_id = $2');
  });

  it('按 petId 过滤时 SQL 携带宠物条件', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockMemoryRow], rowCount: 1 });

    const res = await request(createApp()).get('/api/memory?petId=pet-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const params = mockPool.query.mock.calls[0][1] as unknown[];
    expect(params[0]).toBe('test-user-id');
    expect(params[1]).toBe('pet-001');
  });
});

// ===== 2. PUT /api/memory/:id - 修正记忆内容 =====
describe('PUT /api/memory/:id - 修正记忆内容', () => {
  it('修正成功返回 200 并标记为手动来源', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/memory/1')
      .send({ content: '喜欢吃牛肉和鸡肉' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('喜欢吃牛肉和鸡肉');

    // 验证 SQL 含归属校验（WHERE id AND user_id）与 manual 标记
    const sql = mockPool.query.mock.calls[0][0] as string;
    expect(sql).toContain("source = 'manual'");
    expect(sql).toContain('WHERE id = $1 AND user_id = $2');
    const params = mockPool.query.mock.calls[0][1] as unknown[];
    expect(params[0]).toBe(1);
    expect(params[1]).toBe('test-user-id');
  });

  it('记忆不存在或不属于当前用户返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/api/memory/999')
      .send({ content: '新的记忆内容' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('记忆不存在');
  });

  it('ID 格式错误返回 400', async () => {
    const res = await request(createApp())
      .put('/api/memory/abc')
      .send({ content: '内容' });

    expect(res.status).toBe(400);
  });

  it('缺少 content 返回 400', async () => {
    const res = await request(createApp()).put('/api/memory/1').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('content 为空字符串返回 400', async () => {
    const res = await request(createApp())
      .put('/api/memory/1')
      .send({ content: '   ' });

    expect(res.status).toBe(400);
  });
});
