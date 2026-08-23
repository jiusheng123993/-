/**
 * 兑换码系统集成测试（2026-08-23）
 * 覆盖：管理端生成（Token）、无 Token 403、用户兑换发会员、已用/不存在码 404、并发 CAS 409
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

import redeemRouter from '../routes/redeem.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', redeemRouter);
  return app;
}

const mockCodeRow = {
  id: 1,
  code: 'XHH-TEST-TEST-TEST',
  days: 30,
  note: null,
  status: 'unused',
  used_by: null,
  used_at: null,
  created_at: '2026-08-23T00:00:00Z',
};

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('POST /api/admin/redeem-codes - 管理端生成', () => {
  it('有 Token → 200，返回兑换码列表（格式正确）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // batchInsert

    const res = await request(createApp())
      .post('/api/admin/redeem-codes')
      .set('x-admin-token', 'test-admin-token')
      .send({ count: 3, days: 30, note: '测试' });

    expect(res.status).toBe(200);
    expect(res.body.data.codes).toHaveLength(3);
    for (const c of res.body.data.codes as string[]) {
      expect(c).toMatch(/^XHH-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    }
    expect(res.body.data.days).toBe(30);
  });

  it('无 Token → 403（fail-closed）', async () => {
    const res = await request(createApp())
      .post('/api/admin/redeem-codes')
      .send({ days: 30 });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/redeem - 用户兑换', () => {
  it('有效兑换码 → 200，创建会员（memberships INSERT）', async () => {
    // 调用顺序：findByCode → markUsed → memberships SELECT → INSERT
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockCodeRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/redeem')
      .send({ code: 'xhh-test-test-test' }); // 小写提交应被转大写匹配

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.days).toBe(30);
    // 会员 INSERT 正确执行（tier='member' 是 SQL 字面量；参数为 userId + expires_at）
    const insertCall = mockPool.query.mock.calls[3];
    expect(insertCall[0]).toContain("VALUES ($1, 'member', 'active', $2, now())");
    expect(insertCall[1][0]).toBe('test-user-id');
    expect(insertCall[1][1]).toMatch(/^\d{4}-\d{2}-\d{2}T/); // expires_at ISO 时间
  });

  it('已使用的兑换码 → 404', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ...mockCodeRow, status: 'used', used_by: 'someone' }],
      rowCount: 1,
    });

    const res = await request(createApp())
      .post('/api/redeem')
      .send({ code: 'XHH-TEST-TEST-TEST' });

    expect(res.status).toBe(404);
    expect(mockPool.query).toHaveBeenCalledTimes(1); // 不执行发会员
  });

  it('不存在的兑换码 → 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/redeem')
      .send({ code: 'XHH-NOPE-NOPE-NOPE' });

    expect(res.status).toBe(404);
  });

  it('并发重复兑换（markUsed CAS 失败）→ 409', async () => {
    // findByCode 返回 unused，但 markUsed 更新 0 行（已被并发抢走）
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockCodeRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/redeem')
      .send({ code: 'XHH-TEST-TEST-TEST' });

    expect(res.status).toBe(409);
    expect(mockPool.query).toHaveBeenCalledTimes(2); // 不执行发会员
  });

  it('参数校验：空 code → 400', async () => {
    const res = await request(createApp()).post('/api/redeem').send({ code: '   ' });
    expect(res.status).toBe(400);
  });
});
