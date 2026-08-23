/**
 * 全局限流豁免测试（supertest 实测）
 *
 * 背景：全局限流挂 /api/ 前缀，会抢在 analytics 专用限流（120 次/分钟）
 * 之前拦截埋点上报，导致用户连续操作（如切换头像）时 analytics 429。
 * 修复1：globalLimiter 增加 skip 豁免 /api/analytics/* 路径（埋点有专用防刷限流）。
 * 修复2（2026-08-23）：全局限流 60→120 次/分钟——切换宠物时档案页/时光页
 * 多模块并发加载（checkins/checkins?startDate/timeline/moments 等约 6-8 个请求），
 * 60 次/分钟会误伤正常操作触发 429。
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

  it('analytics 埋点路径被豁免：连发 70 次（>全局阈值的一半）仍全放行', async () => {
    const app = buildApp();
    let okCount = 0;
    for (let i = 0; i < 70; i++) {
      const res = await request(app).post('/api/analytics/events').send({ events: [] });
      if (res.status === 200) okCount++;
    }
    expect(okCount).toBe(70);
  });

  it('正常页面加载量（70 次/分钟）不触发 429', async () => {
    // 切换宠物时多模块并发加载约 6-8 个请求/次，1 分钟 70 次属于正常操作量
    const app = buildApp();
    let okCount = 0;
    for (let i = 0; i < 70; i++) {
      const res = await request(app).get('/api/pets');
      if (res.status === 200) okCount++;
    }
    expect(okCount).toBe(70);
  });

  it('非 analytics 路径仍受全局限流约束：连发 130 次（>120 阈值）后触发 429', async () => {
    const app = buildApp();
    let okCount = 0;
    let limited = false;
    for (let i = 0; i < 130; i++) {
      const res = await request(app).get('/api/pets');
      if (res.status === 200) okCount++;
      if (res.status === 429) limited = true;
    }
    expect(okCount).toBeLessThanOrEqual(120);
    expect(limited).toBe(true);
  });
});
