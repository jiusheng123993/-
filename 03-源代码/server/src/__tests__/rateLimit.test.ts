/**
 * 全局限流豁免测试（supertest 实测）
 *
 * 背景：全局限流 60 次/分钟挂在 /api/ 前缀，会抢在 analytics 专用限流（120 次/分钟）
 * 之前拦截埋点上报，导致用户连续操作（如切换头像）时 analytics 429。
 * 修复：globalLimiter 增加 skip 豁免 /api/analytics/* 路径（埋点有专用防刷限流）。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// 动态导入被测中间件（含新增的 skip 豁免）
import { globalLimiter } from '../middleware/rateLimit.js';

// 构造最小 express app：globalLimiter 挂 /api/ 前缀（与生产 index.ts 一致）
function buildApp() {
  const app = express();
  app.use('/api/', globalLimiter);
  app.post('/api/analytics/events', (_req, res) => res.json({ success: true }));
  app.get('/api/pets', (_req, res) => res.json({ success: true, data: [] }));
  return app;
}

describe('globalLimiter 全局限流豁免', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('analytics 埋点路径被豁免：连发 70 次（>60 全局限流阈值）仍全放行', async () => {
    const app = buildApp();
    let okCount = 0;
    for (let i = 0; i < 70; i++) {
      const res = await request(app).post('/api/analytics/events').send({ events: [] });
      if (res.status === 200) okCount++;
    }
    expect(okCount).toBe(70);
  });

  it('非 analytics 路径受全局限流约束：连发 70 次后触发 429', async () => {
    const app = buildApp();
    let okCount = 0;
    let limited = false;
    for (let i = 0; i < 70; i++) {
      const res = await request(app).get('/api/pets');
      if (res.status === 200) okCount++;
      if (res.status === 429) limited = true;
    }
    expect(okCount).toBeLessThanOrEqual(60);
    expect(limited).toBe(true);
  });
});
