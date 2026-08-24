/**
 * 品种知识库路由集成测试（热更新）
 * 覆盖：最新品种库下发（含空表播种）、DB 异常降级 503、
 *       管理端 Token 鉴权、保存版本递增、坏数据结构校验拦截
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

import breedRouter from '../routes/breeds.js';
import { isValidBreedData } from '../routes/breeds.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', breedRouter);
  return app;
}

// 版本动态取今日 UTC 日期（与 saveBreeds/getLatestBreeds 基准日一致，避免 UTC 跨日后断言必红）
const EXPECTED_BREED_VERSION = `${new Date().toISOString().slice(0, 10)}.1`;

/** 合法品种条目（满足 isValidBreedData 最小校验：id/name/species/aliases/weightRange/sources） */
const mockBreedItem = {
  id: 'golden_retriever',
  name: '金毛寻回犬',
  species: 'dog',
  aliases: ['金毛', 'Golden Retriever'],
  weightRange: { min: 25, max: 34 },
  sources: ['AKC 品种标准'],
};

const mockBreedRow = {
  id: 1,
  version: EXPECTED_BREED_VERSION,
  data: { version: EXPECTED_BREED_VERSION, updatedAt: '2026-08-25', breeds: [mockBreedItem] },
  created_at: '2026-08-25T00:00:00Z',
};

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('GET /api/breeds/knowledge - 品种库下发', () => {
  it('已有数据 → 返回最新版本与 breeds 数组', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockBreedRow], rowCount: 1 });

    const res = await request(createApp()).get('/api/breeds/knowledge');

    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe(EXPECTED_BREED_VERSION);
    expect(res.body.data.data.breeds).toHaveLength(1);
    expect(res.body.data.data.breeds[0].sources).toEqual(['AKC 品种标准']);
  });

  it('空表 → 惰性播种种子后返回（INSERT 参数含种子 breeds）', async () => {
    // 流程：SELECT 最新（空）→ INSERT ON CONFLICT（种子）→ 重查取权威行
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockBreedRow], rowCount: 1 });

    const res = await request(createApp()).get('/api/breeds/knowledge');

    expect(res.status).toBe(200);
    // 第二次调用是播种 INSERT：参数含版本号与种子数据（真实 breedSeed.json，110 条）
    const insertCall = mockPool.query.mock.calls[1];
    expect(insertCall[0]).toContain('INSERT INTO breed_knowledge');
    expect((insertCall[1][1] as { breeds: unknown[] }).breeds.length).toBeGreaterThan(100);
  });

  it('DB 异常 → 503 由前端静态兜底', async () => {
    mockPool.query.mockRejectedValue(new Error('db down'));

    const res = await request(createApp()).get('/api/breeds/knowledge');

    expect(res.status).toBe(503);
  });
});

describe('管理端 - /api/admin/breeds', () => {
  it('无 Token → 403', async () => {
    const res = await request(createApp()).get('/api/admin/breeds');
    expect(res.status).toBe(403);
  });

  it('Token 正确 → 200 查看当前品种库', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockBreedRow], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/admin/breeds')
      .set('x-admin-token', 'test-admin-token');

    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe(EXPECTED_BREED_VERSION);
  });

  it('PUT 保存新版本（版本自动递增为今日.2）', async () => {
    // saveBreeds：getLatestBreeds（查最新）→ INSERT 新版本
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockBreedRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/admin/breeds')
      .set('x-admin-token', 'test-admin-token')
      .send({
        data: {
          updatedAt: '2026-08-25',
          breeds: [
            { id: 'chartreux', name: '沙特尔猫', species: 'cat', aliases: ['chartreux'], weightRange: { min: 3, max: 7 }, sources: ['CFA 品种标准'] },
            mockBreedItem,
          ],
        },
      });

    expect(res.status).toBe(200);
    const today = new Date().toISOString().slice(0, 10);
    expect(res.body.data.version).toBe(`${today}.2`);
  });

  it('PUT 坏数据（缺 sources）→ 400 拒绝上线', async () => {
    const res = await request(createApp())
      .put('/api/admin/breeds')
      .set('x-admin-token', 'test-admin-token')
      .send({
        data: {
          breeds: [{ id: 'bad_1', name: '缺来源', species: 'cat', sources: [] }],
        },
      });

    expect(res.status).toBe(400);
    expect(mockPool.query).not.toHaveBeenCalled();
  });
});

describe('isValidBreedData 结构校验', () => {
  it('合法数据通过；空列表/非法物种/非字符串来源拒绝', () => {
    expect(isValidBreedData({ breeds: [mockBreedItem] })).toBe(true);
    expect(isValidBreedData({ breeds: [] })).toBe(false);
    expect(isValidBreedData(null)).toBe(false);
    expect(
      isValidBreedData({ breeds: [{ ...mockBreedItem, species: 'bird' }] }),
    ).toBe(false);
    expect(
      isValidBreedData({ breeds: [{ ...mockBreedItem, sources: ['ok', 123] }] }),
    ).toBe(false);
  });

  it('长度与规模约束（审查项加固）：超长字段/超量条目/重复 id 拒绝', () => {
    // id/name 超过 50 字符拒绝
    expect(
      isValidBreedData({ breeds: [{ ...mockBreedItem, name: '长'.repeat(51) }] }),
    ).toBe(false);
    expect(
      isValidBreedData({ breeds: [{ ...mockBreedItem, id: 'x'.repeat(51) }] }),
    ).toBe(false);
    // 来源标注元素超过 100 字符拒绝
    expect(
      isValidBreedData({
        breeds: [{ ...mockBreedItem, sources: ['源'.repeat(101)] }],
      }),
    ).toBe(false);
    // 条目数超过 300 拒绝
    const many = Array.from({ length: 301 }, (_, i) => ({ ...mockBreedItem, id: `b${i}` }));
    expect(isValidBreedData({ breeds: many })).toBe(false);
    // 重复 id 拒绝（前端匹配取首条，重复语义不明）
    expect(
      isValidBreedData({ breeds: [mockBreedItem, { ...mockBreedItem }] }),
    ).toBe(false);
  });

  it('渲染必需字段校验（审查 P1-1）：缺 aliases 或 weightRange 数值非法均拒绝', () => {
    // 缺 aliases：checkin/edit/add 消费点直接调数组方法，缺失会 TypeError 白屏
    const noAliases = { ...mockBreedItem } as Record<string, unknown>;
    delete noAliases.aliases;
    expect(isValidBreedData({ breeds: [noAliases] })).toBe(false);
    expect(
      isValidBreedData({ breeds: [{ ...mockBreedItem, aliases: '不是数组' }] }),
    ).toBe(false);
    // weightRange.min/max 必须为数值（趋势页体型兜底直接取值）
    expect(
      isValidBreedData({
        breeds: [{ ...mockBreedItem, weightRange: { min: '25', max: 34 } }],
      }),
    ).toBe(false);
    expect(
      isValidBreedData({ breeds: [{ ...mockBreedItem, weightRange: null }] }),
    ).toBe(false);
  });
});

describe('saveBreeds 版本语义契约（审查项补充）', () => {
  it('跨日版本递增：latest 为昨日版本 → 新版本为今日.1', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ ...mockBreedRow, version: `${yesterday}.5` }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/admin/breeds')
      .set('x-admin-token', 'test-admin-token')
      .send({ data: { breeds: [mockBreedItem] } });

    expect(res.status).toBe(200);
    const today = new Date().toISOString().slice(0, 10);
    expect(res.body.data.version).toBe(`${today}.1`);
    // INSERT 参数中 merged 已覆写版本元信息（服务端权威，客户端传值不生效）
    const insertCall = mockPool.query.mock.calls[1];
    expect((insertCall[1][0] as string)).toBe(`${today}.1`);
    const merged = insertCall[1][1] as Record<string, unknown>;
    expect(merged.version).toBe(`${today}.1`);
    expect(merged.updatedAt).toBe(today);
  });
});
