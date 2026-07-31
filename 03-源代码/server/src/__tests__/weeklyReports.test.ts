/**
 * 家庭周报模块集成测试
 * 覆盖：周报列表分页、最新周报、周报详情、手动生成
 * 重点验证：家庭归属校验（403）、周报不存在（404）、同周重复生成（409）、分页与年份过滤、越权防护
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
    seedream: { apiKey: '' },
    meshy: { apiKey: '' },
    moderate: { apiKey: '' },
    wechat: { appId: '', secret: '' },
    uploadDir: './uploads',
  },
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    _req.userId = 'test-user-id';
    next();
  },
}));

import weeklyReportsRouter from '../routes/weeklyReports.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/families', weeklyReportsRouter);
  return app;
}

/** 模拟归属校验通过的结果（SELECT 1 FROM ... 返回） */
const ownershipOk = { rows: [{ '?column?': 1 }], rowCount: 1 };

/** 模拟归属校验失败的结果 */
const ownershipFail = { rows: [], rowCount: 0 };

/** mock 周报数据（report_data 为对象，模拟 pg JSONB 自动解析结果） */
const mockReportData = {
  health: {
    checkin_count: 0,
    avg_poop: 0,
    avg_appetite: 0,
    avg_spirit: 0,
    anomaly_count: 0,
    best_day: null,
  },
  activities: {
    symptom_checks: 0,
    food_queries: 0,
    new_moments: 0,
    new_milestones: 0,
  },
  family: {
    feed_count: 0,
    new_events: 0,
    active_pets: 0,
  },
};

/** 模拟周报记录 */
const mockReport = {
  id: 'report-001',
  family_id: 'family-001',
  week_number: 31,
  year: 2026,
  report_data: mockReportData,
  ai_insight: null,
  share_card_url: null,
  created_at: '2026-07-30T00:00:00.000Z',
};

beforeEach(() => {
  // mockReset 清除 mock 队列（含 mockResolvedValueOnce 残留），避免测试间污染
  mockPool.query.mockReset();
});

// ===== GET /api/families/:id/weekly-reports - 获取周报列表 =====
describe('GET /api/families/:id/weekly-reports - 获取周报列表', () => {
  it('正常返回列表（含分页信息）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                              // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 })      // findByFamilyId
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });   // countByFamilyId

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].id).toBe('report-001');
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.page_size).toBe(20);
  });

  it('返回的 report_data 为对象（JSONB 已解析）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports');

    expect(res.body.data.items[0].report_data).toBeInstanceOf(Object);
    expect(res.body.data.items[0].report_data.health).toBeDefined();
    expect(res.body.data.items[0].report_data.activities).toBeDefined();
    expect(res.body.data.items[0].report_data.family).toBeDefined();
  });

  it('默认分页 page=1, page_size=20', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports');

    expect(res.body.data.page).toBe(1);
    expect(res.body.data.page_size).toBe(20);
  });

  it('分页参数正确传递', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    await request(createApp())
      .get('/api/families/family-001/weekly-reports?page=2&page_size=5');

    // 验证列表查询 SQL 包含 LIMIT 和 OFFSET
    const findCall = mockPool.query.mock.calls[1];
    expect(findCall[0]).toContain('LIMIT');
    expect(findCall[0]).toContain('OFFSET');
    // page=2, page_size=5 → offset=(2-1)*5=5, limit=5
    expect(findCall[1]).toContain(5);
  });

  it('按年过滤', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });

    await request(createApp())
      .get('/api/families/family-001/weekly-reports?year=2026');

    // 验证列表查询 SQL 包含 year 条件
    const findCall = mockPool.query.mock.calls[1];
    expect(findCall[0]).toContain('year');
    expect(findCall[1]).toContain(2026);

    // 验证 count 查询也包含 year 条件
    const countCall = mockPool.query.mock.calls[2];
    expect(countCall[0]).toContain('year');
    expect(countCall[1]).toContain(2026);
  });

  it('列表查询按 year DESC, week_number DESC 排序', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    await request(createApp())
      .get('/api/families/family-001/weekly-reports');

    const findCall = mockPool.query.mock.calls[1];
    expect(findCall[0]).toContain('ORDER BY year DESC, week_number DESC');
  });

  it('page_size 超过 100 时返回 400', async () => {
    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports?page_size=101');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('year 超出范围返回 400', async () => {
    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports?year=2019');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('数据库异常返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error')); // ownership throws

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ===== GET /api/families/:id/weekly-reports/latest - 获取最新周报 =====
describe('GET /api/families/:id/weekly-reports/latest - 获取最新周报', () => {
  it('正常返回最新周报', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                         // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 }); // findLatestByFamilyId

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports/latest');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('report-001');
    expect(res.body.data.year).toBe(2026);
    expect(res.body.data.week_number).toBe(31);
  });

  it('最新周报查询按 year DESC, week_number DESC 排序', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 });

    await request(createApp())
      .get('/api/families/family-001/weekly-reports/latest');

    const findCall = mockPool.query.mock.calls[1];
    expect(findCall[0]).toContain('ORDER BY year DESC, week_number DESC');
    expect(findCall[0]).toContain('LIMIT 1');
  });

  it('无周报返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                  // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });   // findLatestByFamilyId (empty)

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports/latest');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('暂无周报');
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports/latest');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });
});

// ===== GET /api/families/:id/weekly-reports/:reportId - 获取周报详情 =====
describe('GET /api/families/:id/weekly-reports/:reportId - 获取周报详情', () => {
  it('正常返回详情', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                         // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 }); // findByIdAndFamily

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports/report-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('report-001');
    expect(res.body.data.family_id).toBe('family-001');
  });

  it('详情查询同时校验 reportId 和 familyId（防跨家庭越权）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 });

    await request(createApp())
      .get('/api/families/family-001/weekly-reports/report-001');

    const detailCall = mockPool.query.mock.calls[1];
    expect(detailCall[0]).toContain('id = $1');
    expect(detailCall[0]).toContain('family_id = $2');
    expect(detailCall[1]).toContain('report-001');
    expect(detailCall[1]).toContain('family-001');
  });

  it('周报不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                  // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });   // findByIdAndFamily (not found)

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不存在');
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .get('/api/families/family-001/weekly-reports/report-001');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });
});

// ===== POST /api/families/:id/weekly-reports/generate - 手动生成周报 =====
describe('POST /api/families/:id/weekly-reports/generate - 手动生成周报', () => {
  it('正常生成周报（返回 201）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                              // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                // findExisting (not exists)
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 });     // insertReport

    const res = await request(createApp())
      .post('/api/families/family-001/weekly-reports/generate');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('report-001');
    expect(res.body.data.ai_insight).toBeNull();
    expect(res.body.data.share_card_url).toBeNull();
  });

  it('生成的周报包含 mock report_data 结构', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/families/family-001/weekly-reports/generate');

    expect(res.body.data.report_data).toBeInstanceOf(Object);
    expect(res.body.data.report_data.health).toMatchObject({
      checkin_count: 0,
      avg_poop: 0,
      avg_appetite: 0,
      avg_spirit: 0,
      anomaly_count: 0,
      best_day: null,
    });
    expect(res.body.data.report_data.activities).toMatchObject({
      symptom_checks: 0,
      food_queries: 0,
      new_moments: 0,
      new_milestones: 0,
    });
    expect(res.body.data.report_data.family).toMatchObject({
      feed_count: 0,
      new_events: 0,
      active_pets: 0,
    });
  });

  it('生成时检查同周是否已存在', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 });

    await request(createApp())
      .post('/api/families/family-001/weekly-reports/generate');

    // findExisting 查询包含 family_id、year、week_number 条件
    const findExistingCall = mockPool.query.mock.calls[1];
    expect(findExistingCall[0]).toContain('family_id = $1');
    expect(findExistingCall[0]).toContain('year = $2');
    expect(findExistingCall[0]).toContain('week_number = $3');
    expect(findExistingCall[1]).toContain('family-001');
  });

  it('插入时 report_data 使用 JSON.stringify', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 });

    await request(createApp())
      .post('/api/families/family-001/weekly-reports/generate');

    // insert 查询参数中 report_data 应为字符串（JSON.stringify 后）
    const insertCall = mockPool.query.mock.calls[2];
    const params = insertCall[1] as unknown[];
    // 找到 report_data 参数（第 4 个：family_id, year, week_number, report_data, ai_insight, share_card_url）
    const reportDataParam = params[3];
    expect(typeof reportDataParam).toBe('string');
    // 解析后应包含 health/activities/family
    const parsed = JSON.parse(reportDataParam as string);
    expect(parsed.health).toBeDefined();
    expect(parsed.activities).toBeDefined();
    expect(parsed.family).toBeDefined();
  });

  it('同周已存在返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                         // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockReport], rowCount: 1 }); // findExisting (exists)

    const res = await request(createApp())
      .post('/api/families/family-001/weekly-reports/generate');

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('已生成');
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .post('/api/families/family-001/weekly-reports/generate');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('数据库异常返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error')); // ownership throws

    const res = await request(createApp())
      .post('/api/families/family-001/weekly-reports/generate');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
