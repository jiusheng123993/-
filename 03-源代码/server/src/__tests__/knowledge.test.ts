/**
 * 知识图谱路由集成测试（Phase 3）
 * 覆盖：最新图谱下发（含空表播种）、用户纠错提交与校验、
 *       管理端 Token 鉴权（未配置/错误/正确）、图谱保存版本递增、反馈审核
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
    adminToken: 'test-admin-token',
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

import knowledgeRouter from '../routes/knowledge.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', knowledgeRouter);
  return app;
}

// 最新图谱行（version 动态取今日 UTC 日期，与 saveGraph 基准日一致，避免 UTC 跨日后断言必红，审查项修复）
// 注意：version 是动态的（${今日UTC}.1），下方断言必须用同一动态变量，不能写死日期
const EXPECTED_GRAPH_VERSION = `${new Date().toISOString().slice(0, 10)}.1`;

const mockGraphRow = {
  id: 1,
  version: EXPECTED_GRAPH_VERSION,
  data: { version: EXPECTED_GRAPH_VERSION, riskRules: [{ id: 'r1' }], diseases: [] },
  created_at: '2026-08-22T00:00:00Z',
};

const mockFeedbackRow = {
  id: 'fb-001',
  user_id: 'test-user-id',
  pet_id: null,
  check_id: null,
  entity_type: 'disease',
  entity_name: '胃炎',
  suggestion: '建议补充来源',
  status: 'open',
  admin_note: null,
  created_at: '2026-08-22T00:00:00Z',
  reviewed_at: null,
};

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('GET /api/knowledge/latest - 图谱下发', () => {
  it('已有图谱 → 返回最新版本', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockGraphRow], rowCount: 1 });

    const res = await request(createApp()).get('/api/knowledge/latest');

    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe(EXPECTED_GRAPH_VERSION);
    expect(res.body.data.data.riskRules).toHaveLength(1);
  });

  it('空表 → 用种子初始化并返回', async () => {
    // 播种流程：SELECT 最新（空）→ INSERT ON CONFLICT → 重查取权威行（审查项修复后多一次查询）
    const seededRow = {
      id: 1,
      version: EXPECTED_GRAPH_VERSION,
      data: { version: EXPECTED_GRAPH_VERSION, riskRules: [{ id: 'seed-rule' }], diseases: [{ id: 'seed-disease' }] },
      created_at: '2026-08-22T00:00:00Z',
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [seededRow], rowCount: 1 });

    const res = await request(createApp()).get('/api/knowledge/latest');

    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe(EXPECTED_GRAPH_VERSION);
    expect(res.body.data.data.riskRules).toHaveLength(1);
  });
});

describe('POST /api/knowledge/feedback - 用户纠错', () => {
  it('正常提交 → 200 创建反馈', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockFeedbackRow], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/knowledge/feedback')
      .send({ entity_type: 'disease', entity_name: '胃炎', suggestion: '建议补充来源' });

    expect(res.status).toBe(200);
    expect(res.body.data.entity_type).toBe('disease');
  });

  it('参数校验：缺 suggestion → 400', async () => {
    const res = await request(createApp())
      .post('/api/knowledge/feedback')
      .send({ entity_type: 'disease', entity_name: '胃炎' });

    expect(res.status).toBe(400);
  });
});

describe('管理端 Token 鉴权', () => {
  it('无 Token → 403', async () => {
    const res = await request(createApp()).get('/api/admin/knowledge');
    expect(res.status).toBe(403);
  });

  it('Token 错误 → 403', async () => {
    const res = await request(createApp())
      .get('/api/admin/knowledge')
      .set('x-admin-token', 'wrong-token');
    expect(res.status).toBe(403);
  });

  it('Token 正确 → 200 查看图谱', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockGraphRow], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/admin/knowledge')
      .set('x-admin-token', 'test-admin-token');

    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe(EXPECTED_GRAPH_VERSION);
  });

  it('PUT 保存图谱（版本自动递增）', async () => {
    // saveGraph：getLatestGraph（查询最新）→ INSERT 新版本；data 需通过结构校验（含 name/level/match/sourceRef）
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockGraphRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/admin/knowledge')
      .set('x-admin-token', 'test-admin-token')
      .send({
        data: {
          symptoms: [{ id: 'cough', name: '咳嗽', species: ['cat', 'dog'], bodySystem: 'respiratory' }],
          riskRules: [
            {
              id: 'r-new',
              name: '新规则：咳嗽 → 关注',
              level: 'warning',
              match: { type: 'single', symptomIds: ['cough'] },
              sourceRef: { sourceId: 'self_reviewed', title: '内部自审', authority: 'internal', reviewStatus: 'reviewed' },
            },
          ],
          diseases: [{ id: 'd-new', name: '新病', species: ['dog'], relatedSymptoms: [], typicalText: '', emergencyLevel: 'normal', sourceRef: { sourceId: 'self_reviewed', title: '内部自审', authority: 'internal', reviewStatus: 'reviewed' } }],
        },
      });

    expect(res.status).toBe(200);
    // 版本 = 今日 UTC 日期 + 递增序号（不写死日期，避免 UTC 跨日后 CI 必红，审查项修复）
    const today = new Date().toISOString().slice(0, 10);
    expect(res.body.data.version).toBe(`${today}.2`);
  });

  it('反馈列表（按状态过滤）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockFeedbackRow], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/admin/feedback?status=open')
      .set('x-admin-token', 'test-admin-token');

    expect(res.status).toBe(200);
    expect(res.body.data.list).toHaveLength(1);
  });

  it('审核反馈 → 200 更新状态', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ...mockFeedbackRow, status: 'approved', admin_note: '已核实' }],
      rowCount: 1,
    });

    const res = await request(createApp())
      .post('/api/admin/feedback/fb-001/review')
      .set('x-admin-token', 'test-admin-token')
      .send({ action: 'approve', note: '已核实' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });

  it('审核不存在的反馈 → 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/admin/feedback/nonexistent/review')
      .set('x-admin-token', 'test-admin-token')
      .send({ action: 'reject' });

    expect(res.status).toBe(404);
  });

  it('PUT 保存图谱：结构非法（空 riskRules）→ 400（防止坏数据上线，审查项修复）', async () => {
    const res = await request(createApp())
      .put('/api/admin/knowledge')
      .set('x-admin-token', 'test-admin-token')
      .send({ data: { riskRules: [], diseases: [] } });

    expect(res.status).toBe(400);
  });

  it('PUT 保存图谱：规则缺 sourceRef → 400', async () => {
    const res = await request(createApp())
      .put('/api/admin/knowledge')
      .set('x-admin-token', 'test-admin-token')
      .send({ data: { riskRules: [{ id: 'r1', name: 'x', level: 'emergency', match: { type: 'single', symptomIds: ['a'] } }], diseases: [{ id: 'd1' }] } });

    expect(res.status).toBe(400);
  });

  it('审核：非法 action → 400', async () => {
    const res = await request(createApp())
      .post('/api/admin/feedback/fb-001/review')
      .set('x-admin-token', 'test-admin-token')
      .send({ action: 'hack' });

    expect(res.status).toBe(400);
  });

  it('GET /latest 仓库异常 → 503（降级路径）', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('db down'));

    const res = await request(createApp()).get('/api/knowledge/latest');

    expect(res.status).toBe(503);
  });

  it('反馈：entity_name 超长 → 400', async () => {
    const res = await request(createApp())
      .post('/api/knowledge/feedback')
      .send({ entity_type: 'disease', entity_name: 'x'.repeat(101), suggestion: 'test' });

    expect(res.status).toBe(400);
  });
});
