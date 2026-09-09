/**
 * 回忆录三档体系单元测试（2026-09-09）
 * 覆盖：档位解析回退 / 管线映射 / 档位照片与时长校验 / 素材盘点与照片池路由
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  mapTierToGenerationLine,
  resolveMemoirTier,
  validateTierPhotoCount,
  validateTierDuration,
} from '../services/videoGenerationService.js';
import memoirRouter from '../routes/memoir.js';

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
    uploadDir: './uploads',
  },
  MEMOIR_TIER_CONFIG: {
    light: { minPhotos: 1, maxPhotos: 3, minDuration: 5, maxDuration: 30, defaultDuration: 20 },
    standard: { minPhotos: 5, maxPhotos: 7, minDuration: 40, maxDuration: 50, defaultDuration: 45 },
    full: { minPhotos: 8, maxPhotos: 15, minDuration: 60, maxDuration: 90, defaultDuration: 75 },
  },
  MEMOIR_TIER_LABELS: { light: '轻纪念', standard: '标准回忆录', full: '完整回忆录' },
  MEMOIR_TIER_PRICES: {
    light: { member: 1890, free: 2590 },
    standard: { member: 4500, free: 5900 },
    full: { member: 7900, free: 9900 },
  },
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { userId?: string }).userId = 'test-user-id';
    next();
  },
}));

vi.mock('../services/memoirService.js', () => ({
  createMemoir: vi.fn(),
  getStatus: vi.fn(),
  listMemoirs: vi.fn(),
  deleteMemoir: vi.fn(),
  previewMemoir: vi.fn(),
  confirmMemoirScript: vi.fn(),
  rejectMemoirScript: vi.fn(),
  MemoirError: class MemoirError extends Error {
    constructor(public statusCode: number, message: string) { super(message); }
  },
  MemoirBusinessError: class MemoirBusinessError extends Error {
    constructor(public statusCode: number, message: string, public code: string, public extra?: Record<string, unknown>) { super(message); }
  },
  MEMOIR_ERROR_CODES: { QUOTA_EXCEEDED: 'QUOTA_EXCEEDED', PAYMENT_REQUIRED: 'PAYMENT_REQUIRED', CONCURRENT_TASK: 'CONCURRENT_TASK' },
}));

import { PetRepository } from '../repositories/petRepository.js';

// ===== 档位解析与管线映射（纯函数） =====
describe('resolveMemoirTier - 档位解析', () => {
  it('显式 tier 优先返回', () => {
    expect(resolveMemoirTier('standard', 'daily')).toBe('standard');
    expect(resolveMemoirTier('full', 'daily')).toBe('full');
    expect(resolveMemoirTier('light', 'memorial')).toBe('light');
  });

  it('tier 缺省时按 memoir_type 历史规则回退（memorial→full，其余→light）', () => {
    expect(resolveMemoirTier(undefined, 'memorial')).toBe('full');
    expect(resolveMemoirTier(undefined, 'daily')).toBe('light');
    expect(resolveMemoirTier(null, 'seasonal')).toBe('light');
  });

  it('非法 tier 值回退到 memoir_type 映射（兼容历史订单旧语义 member/free）', () => {
    // 历史订单 product_metadata.tier 存过 'member'|'free' 旧语义，回调时必须兜底不炸
    expect(resolveMemoirTier('member', 'memorial')).toBe('full');
    expect(resolveMemoirTier('free', 'daily')).toBe('light');
    expect(resolveMemoirTier('garbage', 'daily')).toBe('light');
  });
});

describe('mapTierToGenerationLine - 生成管线映射', () => {
  it('light 走 daily 单段管线，standard/full 走 memorial 多段管线', () => {
    expect(mapTierToGenerationLine('light')).toBe('daily');
    expect(mapTierToGenerationLine('standard')).toBe('memorial');
    expect(mapTierToGenerationLine('full')).toBe('memorial');
  });
});

describe('validateTierPhotoCount / validateTierDuration - 档位校验', () => {
  it('照片数按档位边界校验', () => {
    expect(validateTierPhotoCount('light', 3)).toBeNull();
    expect(validateTierPhotoCount('light', 4)).toContain('1-3');
    expect(validateTierPhotoCount('standard', 5)).toBeNull();
    expect(validateTierPhotoCount('standard', 4)).toContain('5-7');
    expect(validateTierPhotoCount('standard', 8)).toContain('5-7');
    expect(validateTierPhotoCount('full', 8)).toBeNull();
    expect(validateTierPhotoCount('full', 7)).toContain('8-15');
  });

  it('时长按档位边界校验，null 放行', () => {
    expect(validateTierDuration('light', null)).toBeNull();
    expect(validateTierDuration('light', 30)).toBeNull();
    expect(validateTierDuration('light', 40)).toContain('5-30');
    expect(validateTierDuration('standard', 45)).toBeNull();
    expect(validateTierDuration('standard', 60)).toContain('40-50');
    expect(validateTierDuration('full', 75)).toBeNull();
    expect(validateTierDuration('full', 50)).toContain('60-90');
  });
});

// ===== 素材盘点与照片池路由 =====
describe('GET /:petId/memoir/material-check 与 photo-pool', () => {
  function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/pets', memoirRouter);
    return app;
  }

  beforeEach(() => {
    mockPool.query.mockReset();
    vi.mocked(PetRepository.prototype.isOwner).mockReset?.();
    vi.spyOn(PetRepository.prototype, 'isOwner').mockResolvedValue(true);
  });

  it('material-check 返回照片/回忆统计与档位建议（素材充足建议 full）', async () => {
    // 序列：1) pet_profiles.photos 2) pet_moments 聚合统计（总数/有描述数/照片总数） 3) 有描述候选列表
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ photos: ['/uploads/a.jpg', '/uploads/b.jpg', '/uploads/c.jpg', '/uploads/d.jpg', '/uploads/e.jpg', '/uploads/f.jpg', '/uploads/g.jpg', '/uploads/h.jpg'] }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ moment_total: 4, moment_with_desc: 3, photo_total: 5 }], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          { id: 'mm-1', type: 'memory', day: '2026-09-01', summary: '第一次带它去打疫苗', photo_len: 2 },
          { id: 'mm-2', type: 'diary', day: '2026-09-02', summary: '学会了握手', photo_len: 0 },
          { id: 'mm-3', type: 'milestone', day: '2026-09-03', summary: '生日吃了一罐罐头', photo_len: 3 },
        ],
        rowCount: 3,
      });

    const res = await request(createApp()).get('/api/pets/pet-001/memoir/material-check');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile_photo_count).toBe(8);
    expect(res.body.data.moment_count).toBe(4);
    expect(res.body.data.moment_with_description_count).toBe(3);
    expect(res.body.data.moment_photo_count).toBe(5);
    expect(res.body.data.suggested_tier).toBe('full');
    expect(res.body.data.moments).toHaveLength(3);
    // has_photo 从 photo_len 推导（TEXT[] 列型，array_length 计数）
    expect(res.body.data.moments[0].has_photo).toBe(true);
    expect(res.body.data.moments[1].has_photo).toBe(false);
  });

  it('material-check 素材不足时建议 light 并给出补充理由', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ photos: ['/uploads/a.jpg'] }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ moment_total: 0, moment_with_desc: 0, photo_total: 0 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp()).get('/api/pets/pet-001/memoir/material-check');

    expect(res.status).toBe(200);
    expect(res.body.data.suggested_tier).toBe('light');
    expect(res.body.data.suggestion_reason).toContain('轻纪念');
  });

  it('material-check 照片够但可勾选记忆不足时建议 standard（档位门槛独立校验）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ photos: Array.from({ length: 6 }, (_, i) => `/uploads/p${i}.jpg`) }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ moment_total: 2, moment_with_desc: 2, photo_total: 0 }], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          { id: 'mm-1', type: 'diary', day: '2026-09-01', summary: '回忆一', photo_len: 0 },
          { id: 'mm-2', type: 'diary', day: '2026-09-02', summary: '回忆二', photo_len: 0 },
        ],
        rowCount: 2,
      });

    const res = await request(createApp()).get('/api/pets/pet-001/memoir/material-check');

    expect(res.status).toBe(200);
    expect(res.body.data.suggested_tier).toBe('standard');
    expect(res.body.data.suggestion_reason).toContain('回忆');
  });

  it('photo-pool 返回档案相册与时光线照片分组', async () => {
    // photo-pool 用 unnest 展开 TEXT[]：每行一张照片（moment_id/day/url）
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ photos: ['/uploads/p1.jpg', '/uploads/p2.jpg'] }], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          { id: 'mm-1', day: '2026-09-01', url: '/uploads/m1a.jpg' },
          { id: 'mm-1', day: '2026-09-01', url: '/uploads/m1b.jpg' },
          { id: 'mm-2', day: '2026-09-02', url: '/uploads/m2a.jpg' },
        ],
        rowCount: 3,
      });

    const res = await request(createApp()).get('/api/pets/pet-001/memoir/photo-pool');

    expect(res.status).toBe(200);
    expect(res.body.data.profile_photos).toHaveLength(2);
    expect(res.body.data.moment_photos).toHaveLength(3);
    expect(res.body.data.moment_photos[0]).toEqual({ moment_id: 'mm-1', day: '2026-09-01', url: '/uploads/m1a.jpg' });
  });

  it('宠物不属于当前用户返回 404（防横向越权）', async () => {
    vi.spyOn(PetRepository.prototype, 'isOwner').mockResolvedValue(false);

    const res = await request(createApp()).get('/api/pets/pet-999/memoir/material-check');

    expect(res.status).toBe(404);
  });

  it('盘点查询异常返回 500（不泄漏内部错误）', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('db down'));

    const res = await request(createApp()).get('/api/pets/pet-001/memoir/material-check');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('服务器内部错误');
  });
});

// ===== 真实 schema 对齐锁（审查 P0：mock pool 掩盖列型错误，静态断言防复发） =====
describe('memoirMaterialService SQL 与真实列型对齐锁', () => {
  it('photos 列是 TEXT[]：SQL 必须用 array_length 而非 jsonb 函数（jsonb_typeof(text[]) 在 PG 直接报错）', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../services/memoirMaterialService.ts'),
      'utf-8',
    );
    // photos 列（TEXT[]）附近禁止 jsonb_typeof/jsonb_array_length
    expect(src).not.toMatch(/jsonb_(typeof|array_length)\(\s*photos/);
    expect(src).not.toMatch(/jsonb_(typeof|array_length)\(\s*m\.photos/);
    // pet_profiles 主键是 id（无 pet_id 列）
    expect(src).not.toMatch(/FROM pet_profiles\s+WHERE\s+pet_id\s*=/);
    expect(src).toContain('WHERE id = $1 AND user_id = $2');
    // 时光线统计不截断（总数聚合独立于 LIMIT 候选查询）
    expect(src).toContain('COUNT(*)::int AS moment_total');
  });

  it('勾选记忆查询用 text[] 直比（pet_moments.id 是 TEXT 主键，uuid 强转会报 operator 不存在）', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../services/memoryService.ts'),
      'utf-8',
    );
    // 匹配 SQL 行（AND 前缀），注释里的反引号示例文本不受影响
    expect(src).not.toMatch(/AND id = ANY\(\$3::uuid\[\]\)/);
    expect(src).toContain('AND id = ANY($3::text[])');
  });
});

// ===== 测试 mock 与真实 config 漂移锁（审查 P2：mock 值过期导致全绿假象） =====
describe('测试 config mock 与真实 config 一致性', () => {
  it('MEMOIR_TIER_CONFIG/LABELS/PRICES mock 值必须等于 config.ts 真实导出', async () => {
    // importActual 绕过本文件的 vi.mock，拿真实 config
    const realConfig = (await vi.importActual('../config.js')) as {
      MEMOIR_TIER_CONFIG: Record<string, unknown>;
      MEMOIR_TIER_LABELS: Record<string, unknown>;
      MEMOIR_TIER_PRICES: Record<string, unknown>;
    };
    const mocked = (await import('../config.js')) as unknown as {
      MEMOIR_TIER_CONFIG: Record<string, unknown>;
      MEMOIR_TIER_LABELS: Record<string, unknown>;
      MEMOIR_TIER_PRICES: Record<string, unknown>;
    };
    expect(mocked.MEMOIR_TIER_CONFIG).toEqual(realConfig.MEMOIR_TIER_CONFIG);
    expect(mocked.MEMOIR_TIER_LABELS).toEqual(realConfig.MEMOIR_TIER_LABELS);
    expect(mocked.MEMOIR_TIER_PRICES).toEqual(realConfig.MEMOIR_TIER_PRICES);
  });
});
