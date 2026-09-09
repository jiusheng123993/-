/**
 * 运营统计端点测试（R2 付费验证数据链路）
 * 覆盖：adminAuth fail-closed（无令牌 403）、正常聚合返回、窗口参数边界。
 * 数据层走 mockPool，SQL 特征路由返回。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// vi.mock 工厂提升先于 const 声明执行，必须 vi.hoisted 共享实例（TDZ 教训）
const mockPool = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('../db.js', () => ({ pool: mockPool }));

vi.mock('../config.js', () => ({
  config: {
    jwtSecret: 'test-jwt-secret',
    adminToken: 'test-admin-token',
    port: 3000,
    databaseUrl: 'postgresql://localhost/test',
    ai: { apiKey: '' },
    seedream: { apiKey: '' },
    meshy: { apiKey: '' },
    moderate: { apiKey: '' },
    wechat: { appId: '', secret: '' },
    wechatPay: { mock: true },
    uploadDir: './uploads',
  },
}));

import adminStatsRouter from './adminStats.js';

function createApp() {
  const app = express();
  app.use('/api', adminStatsRouter);
  return app;
}

beforeEach(() => {
  mockPool.query.mockReset();
  // 按 SQL 特征路由聚合结果（次序无关）：用户/订单/会员/回忆录/退款
  mockPool.query.mockImplementation((sql: unknown) => {
    const s = String(sql);
    if (s.includes('FROM users WHERE created_at')) return Promise.resolve({ rows: [{ count: 12 }] });
    if (s.includes('FROM users')) return Promise.resolve({ rows: [{ count: 1000 }] });
    if (s.includes('DISTINCT user_id')) return Promise.resolve({ rows: [{ count: 15 }] });
    if (s.includes('FROM payment_orders') && s.includes('COUNT(*)')) {
      return Promise.resolve({ rows: [{ count: 20 }] });
    }
    if (s.includes('refunded') && s.includes('COUNT(*)')) return Promise.resolve({ rows: [{ count: 3 }] });
    if (s.includes('FROM memberships')) return Promise.resolve({ rows: [{ count: 8 }] });
    if (s.includes('awaiting_confirmation')) return Promise.resolve({ rows: [{ count: 2 }] });
    if (s.includes('FROM pet_memoir_records') && s.includes("'completed'")) {
      return Promise.resolve({ rows: [{ count: 30 }] });
    }
    if (s.includes('FROM pet_memoir_records') && s.includes("'failed'")) {
      return Promise.resolve({ rows: [{ count: 5 }] });
    }
    if (s.includes('FROM pet_memoir_records')) return Promise.resolve({ rows: [{ count: 40 }] });
    return Promise.resolve({ rows: [{ count: 0 }] });
  });
});

describe('GET /api/admin/stats - 运营统计（R2 判据数据链路）', () => {
  it('无管理员令牌返回 403（fail-closed）', async () => {
    const res = await request(createApp()).get('/api/admin/stats');
    expect(res.status).toBe(403);
  });

  it('令牌正确返回漏斗聚合与转化率', async () => {
    const res = await request(createApp())
      .get('/api/admin/stats')
      .set('x-admin-token', 'test-admin-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // 转化率 = 15 付费用户 / 1000 注册 = 1.5%
    expect(res.body.data.funnel.conversion_rate_percent).toBe(1.5);
    expect(res.body.data.funnel.target_percent).toBe(1);
    // 回忆录成功率 = 30/40 = 75%
    expect(res.body.data.memoir.success_rate_percent).toBe(75);
  });

  it('窗口天数越界收敛（days=99999 → 365）', async () => {
    const res = await request(createApp())
      .get('/api/admin/stats?days=99999')
      .set('x-admin-token', 'test-admin-token');

    expect(res.status).toBe(200);
    expect(res.body.data.window_days).toBe(365);
  });
});
