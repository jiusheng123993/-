/**
 * 会员管理路由集成测试
 * 覆盖：会员状态、订阅（多种计划）、取消订阅、配额查询
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
    wechatPay: {
      mock: true,
      mchId: 'test-mch',
      apiV3Key: '',
      privateKey: '',
      certSerialNo: '',
      platformCertSerialNo: '',
      platformCert: '',
      notifyUrl: '',
    },
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

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-order-uuid'),
}));

import membershipRouter from '../routes/membership.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/membership', membershipRouter);
  return app;
}

const mockMembership = {
  id: 'membership-001',
  user_id: 'test-user-id',
  tier: 'member',
  plan: 'monthly',
  status: 'active',
  price: 2990,
  expires_at: '2026-08-25T00:00:00Z',
  started_at: '2026-07-25T00:00:00Z',
};

const mockQuota = {
  food_queries_count: 2,
  symptom_checks_count: 1,
  trend_days_viewed: 0,
};

beforeEach(() => {
  // 项目规范：使用 mockReset 而非 clearAllMocks，避免 mockResolvedValueOnce 队列在测试间泄漏
  mockPool.query.mockReset();
});

describe('GET /membership/status - 获取会员状态', () => {
  it('正常获取会员状态（已订阅）', async () => {
    // expires_at is in the future
    const activeMembership = {
      ...mockMembership,
      expires_at: '2027-08-25T00:00:00Z',
    };
    mockPool.query.mockResolvedValueOnce({ rows: [activeMembership], rowCount: 1 });

    const res = await request(createApp())
      .get('/membership/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tier).toBe('member');
    expect(res.body.data.plan).toBe('monthly');
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.price).toBe(2990);
  });

  it('未订阅用户返回 free', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/membership/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tier).toBe('free');
    expect(res.body.data.plan).toBeNull();
    expect(res.body.data.status).toBe('none');
    expect(res.body.data.expiresAt).toBeNull();
  });

  it('会员已过期返回 expired', async () => {
    // expires_at is in the past
    const expiredMembership = {
      ...mockMembership,
      status: 'active',
      expires_at: '2025-01-01T00:00:00Z',
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [expiredMembership], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/membership/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tier).toBe('free');
    expect(res.body.data.status).toBe('expired');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/membership/status');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /membership/subscribe - 订阅会员（v2 走支付流程）', () => {
  /**
   * 新流程（v2）：/subscribe 不再直接激活会员，而是创建支付订单 + 调微信支付下单
   * 仅 2 个 DB 查询：userRepository.findById + paymentOrderRepository.createMembershipOrder
   * 返回 { order_id, plan, price, payment, message }
   */
  it('正常订阅 monthly 计划：返回订单 + 支付参数', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'test-user-id', openid: 'test-openid' }], rowCount: 1 })  // findById
      .mockResolvedValueOnce({ rows: [{ id: 'mock-order-uuid' }], rowCount: 1 });                       // createMembershipOrder

    const res = await request(createApp())
      .post('/membership/subscribe')
      .send({ plan: 'monthly' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan).toBe('monthly');
    // 立项 v0.2 P0-1：促销价仅保留年费 88，月付恢复常规价 29.9（停 9.9 亏损获客）
    expect(res.body.data.price).toBe(2990);
    expect(res.body.data.order_id).toBe('mock-order-uuid');
    expect(res.body.data.payment).toBeDefined();
    expect(res.body.data.payment.prepay_id).toContain('mock_prepay_');
    expect(res.body.data.message).toContain('订单已创建');
  });

  it('正常订阅 quarterly 计划', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'test-user-id', openid: 'test-openid' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'mock-order-uuid' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/membership/subscribe')
      .send({ plan: 'quarterly' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan).toBe('quarterly');
    // 立项 v0.2 P0-1：季付恢复常规价 79.9（8.6 元/月仍低于权益成本）
    expect(res.body.data.price).toBe(7990);
  });

  it('正常订阅 yearly 计划', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'test-user-id', openid: 'test-openid' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'mock-order-uuid' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/membership/subscribe')
      .send({ plan: 'yearly' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan).toBe('yearly');
    expect(res.body.data.price).toBe(8800);
  });

  it('参数校验：无效的 plan，返回 400', async () => {
    const res = await request(createApp())
      .post('/membership/subscribe')
      .send({ plan: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('monthly, quarterly, yearly');
  });

  it('参数校验：缺少 plan，返回 400', async () => {
    const res = await request(createApp())
      .post('/membership/subscribe')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('plan');
  });

  it('plan 白名单校验：空字符串返回 400', async () => {
    const res = await request(createApp())
      .post('/membership/subscribe')
      .send({ plan: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('用户不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // findById: empty

    const res = await request(createApp())
      .post('/membership/subscribe')
      .send({ plan: 'monthly' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('用户不存在');
  });

  it('服务端错误：数据库异常返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .post('/membership/subscribe')
      .send({ plan: 'monthly' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /membership/cancel - 取消订阅', () => {
  it('正常取消订阅', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'membership-001', tier: 'member', plan: 'monthly', expires_at: '2026-08-25T00:00:00Z' }],
      rowCount: 1,
    });

    const res = await request(createApp())
      .post('/membership/cancel');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('已取消');
    expect(res.body.data.expiresAt).toBeDefined();
  });

  it('没有活跃订阅，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/membership/cancel');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('未找到活跃的会员订阅');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .post('/membership/cancel');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /membership/usage - 查询使用配额', () => {
  it('正常获取当日使用配额', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockQuota], rowCount: 1 });

    const res = await request(createApp())
      .get('/membership/usage');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.foodQueriesCount).toBe(2);
    expect(res.body.data.symptomChecksCount).toBe(1);
    expect(res.body.data.trendDaysViewed).toBe(0);
    expect(res.body.data.foodQueriesLimit).toBe(5);
    expect(res.body.data.symptomChecksLimit).toBe(3);
    expect(res.body.data.trendDaysLimit).toBe(1);
  });

  it('当天无使用记录时返回零值', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/membership/usage');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.foodQueriesCount).toBe(0);
    expect(res.body.data.symptomChecksCount).toBe(0);
    expect(res.body.data.trendDaysViewed).toBe(0);
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/membership/usage');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});