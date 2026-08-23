/**
 * 回忆录模块集成测试
 * 覆盖：创建任务、状态查询、列表分页、删除约束、预览获取
 * 重点验证：
 *   1. 归属校验（防越权）
 *   2. 并发检查（同一宠物同时只能有一个 pending/processing 任务）
 *   3. 照片数量按产品线差异化校验（daily 1-3 张，memorial 8-15 张）
 *   4. 会员配额校验（会员日常回忆录每月免费 3 次；非会员/纪念Vlog 需付费）
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

import memoirRouter from '../routes/memoir.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/pets', memoirRouter);
  return app;
}

/** 生成指定数量的有效照片 URL */
function makePhotos(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `https://example.com/photo${i + 1}.jpg`);
}

const mockMemoirRecord = {
  id: 'memoir-001',
  user_id: 'test-user-id',
  pet_id: 'pet-001',
  memoir_type: 'daily',
  status: 'pending',
  source_photos: makePhotos(2),
  source_text: null,
  narrative_structure: { music_style: 'warm', duration: 15, style_preset: null },
  video_url: null,
  preview_url: null,
  cost_credits: null,
  payment_id: null,
  error_message: null,
  created_at: '2026-07-30T00:00:00.000Z',
  completed_at: null,
};

const mockCompletedRecord = {
  ...mockMemoirRecord,
  id: 'memoir-002',
  status: 'completed',
  video_url: 'https://example.com/video.mp4',
  preview_url: 'https://example.com/preview.mp4',
  completed_at: '2026-07-30T01:00:00.000Z',
};

const mockProcessingRecord = {
  ...mockMemoirRecord,
  id: 'memoir-003',
  status: 'processing',
};

/** 会员状态查询结果（有效会员） */
const activeMemberRow = {
  tier: 'member',
  status: 'active',
  expires_at: null,
};

beforeEach(() => {
  mockPool.query.mockReset();
});

// ===== POST /api/pets/:petId/memoir - 创建回忆录 =====
describe('POST /api/pets/:petId/memoir - 创建回忆录', () => {
  it('会员创建日常回忆录（配额内）返回 201，status=pending', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // no active task
      .mockResolvedValueOnce({ rows: [activeMemberRow], rowCount: 1 })      // membership: active member
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 })         // monthly quota: 0 used
      .mockResolvedValueOnce({ rows: [mockMemoirRecord], rowCount: 1 });    // insert

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({
        memoir_type: 'daily',
        source_photos: makePhotos(2),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('memoir-001');
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.progress).toBe(0);
  });

  it('缺少 memoir_type 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ source_photos: makePhotos(2) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('日常回忆录照片超过3张返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'daily', source_photos: makePhotos(4) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('日常回忆录照片数量');
  });

  it('日常回忆录照片为0张返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'daily', source_photos: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('纪念Vlog照片不足8张返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'memorial', source_photos: makePhotos(7) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('纪念Vlog照片数量');
  });

  it('纪念Vlog照片超过15张返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'memorial', source_photos: makePhotos(16) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('纪念Vlog照片数量');
  });

  it('宠物不属于当前用户返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ownership fails

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'daily', source_photos: makePhotos(2) });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('已有 pending/processing 任务返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [mockProcessingRecord], rowCount: 1 }); // active task exists

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'daily', source_photos: makePhotos(2) });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('正在进行');
    expect(res.body.code).toBe('CONCURRENT_TASK');
  });

  it('非会员创建日常回忆录返回 402（需付费）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })  // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                    // no active task
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                   // membership: not found → free

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'daily', source_photos: makePhotos(2) });

    expect(res.status).toBe(402);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
    expect(res.body.price).toBe(990);
    expect(res.body.message).toContain('9.9');
  });

  it('会员创建纪念Vlog返回 402（需付费 99 元）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // no active task
      .mockResolvedValueOnce({ rows: [activeMemberRow], rowCount: 1 });     // membership: active member

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'memorial', source_photos: makePhotos(10) });

    expect(res.status).toBe(402);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
    expect(res.body.price).toBe(9900);
    expect(res.body.message).toContain('99');
  });

  it('非会员创建纪念Vlog返回 402（需付费 149 元）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })  // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                    // no active task
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                   // membership: not found → free

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'memorial', source_photos: makePhotos(10) });

    expect(res.status).toBe(402);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
    expect(res.body.price).toBe(14900);
    expect(res.body.message).toContain('149');
  });

  it('会员日常回忆录配额用完返回 402（需付费 9.9 元）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // no active task
      .mockResolvedValueOnce({ rows: [activeMemberRow], rowCount: 1 })      // membership: active member
      .mockResolvedValueOnce({ rows: [{ count: 3 }], rowCount: 1 });        // monthly quota: 3 used (limit)

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'daily', source_photos: makePhotos(2) });

    expect(res.status).toBe(402);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
    expect(res.body.price).toBe(990);
    expect(res.body.message).toContain('配额已用完');
  });

  it('会员过期视为非会员，日常回忆录返回 402', async () => {
    const expiredMemberRow = {
      tier: 'member',
      status: 'active',
      expires_at: '2020-01-01T00:00:00.000Z', // 已过期
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })  // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                    // no active task
      .mockResolvedValueOnce({ rows: [expiredMemberRow], rowCount: 1 });   // membership: expired

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'daily', source_photos: makePhotos(2) });

    expect(res.status).toBe(402);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
  });

  it('数据库异常返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error')); // ownership throws

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'daily', source_photos: makePhotos(2) });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('时长超出日常回忆录范围（5-30秒）返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'daily', source_photos: makePhotos(2), duration: 60 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('日常回忆录时长');
  });

  it('时长超出纪念Vlog范围（60-90秒）返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir')
      .send({ memoir_type: 'memorial', source_photos: makePhotos(10), duration: 30 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('纪念Vlog时长');
  });
});

// ===== GET /api/pets/:petId/memoir/status - 查询状态 =====
describe('GET /api/pets/:petId/memoir/status - 查询状态', () => {
  it('正常返回最新任务状态', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [mockMemoirRecord], rowCount: 1 });    // findLatestByPetId

    const res = await request(createApp())
      .get('/api/pets/pet-001/memoir/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.id).toBe('memoir-001');
  });

  it('无任务返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })  // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                   // no task found

    const res = await request(createApp())
      .get('/api/pets/pet-001/memoir/status');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('暂无');
  });

  it('宠物不属于当前用户返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ownership fails

    const res = await request(createApp())
      .get('/api/pets/pet-001/memoir/status');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });
});

// ===== GET /api/pets/:petId/memoir/list - 获取列表 =====
describe('GET /api/pets/:petId/memoir/list - 获取列表', () => {
  it('正常返回列表', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })      // ownership OK
      .mockResolvedValueOnce({ rows: [mockMemoirRecord, mockCompletedRecord], rowCount: 2 }) // findByPetId
      .mockResolvedValueOnce({ rows: [{ count: 2 }], rowCount: 1 });           // countByPetId

    const res = await request(createApp())
      .get('/api/pets/pet-001/memoir/list');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.list).toBeInstanceOf(Array);
    expect(res.body.data.list).toHaveLength(2);
    expect(res.body.data.total).toBe(2);
  });

  it('分页参数正确传递', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })  // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                    // findByPetId
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });       // countByPetId

    await request(createApp())
      .get('/api/pets/pet-001/memoir/list?page=2&page_size=5');

    // 验证 findByPetId 的 SQL 包含 LIMIT 和 OFFSET
    const findByPetIdCall = mockPool.query.mock.calls[1];
    expect(findByPetIdCall[0]).toContain('LIMIT');
    expect(findByPetIdCall[0]).toContain('OFFSET');
    // limit=5, offset=(2-1)*5=5
    expect(findByPetIdCall[1]).toContain(5);
  });

  it('宠物不属于当前用户返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ownership fails

    const res = await request(createApp())
      .get('/api/pets/pet-001/memoir/list');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });
});

// ===== DELETE /api/pets/:petId/memoir/:memoirId - 删除回忆录 =====
describe('DELETE /api/pets/:petId/memoir/:memoirId - 删除回忆录', () => {
  it('正常删除已完成任务', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [mockCompletedRecord], rowCount: 1 })  // findByIdAndUser
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });                    // deleteById

    const res = await request(createApp())
      .delete('/api/pets/pet-001/memoir/memoir-002');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('删除');
  });

  it('删除 pending 任务返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })  // ownership OK
      .mockResolvedValueOnce({ rows: [mockMemoirRecord], rowCount: 1 });   // findByIdAndUser (pending)

    const res = await request(createApp())
      .delete('/api/pets/pet-001/memoir/memoir-001');

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不允许删除');
  });

  it('回忆录不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })  // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                   // findByIdAndUser (not found)

    const res = await request(createApp())
      .delete('/api/pets/pet-001/memoir/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('回忆录不存在');
  });

  it('宠物不属于当前用户返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ownership fails

    const res = await request(createApp())
      .delete('/api/pets/pet-001/memoir/memoir-001');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });
});

// ===== POST /api/pets/:petId/memoir/preview - 获取预览 =====
describe('POST /api/pets/:petId/memoir/preview - 获取预览', () => {
  it('正常返回 preview_url', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [mockCompletedRecord], rowCount: 1 }); // findByIdAndUser

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir/preview')
      .send({ memoir_id: 'memoir-002' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.preview_url).toBe('https://example.com/preview.mp4');
  });

  it('回忆录不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })  // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                   // findByIdAndUser (not found)

    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir/preview')
      .send({ memoir_id: 'nonexistent' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('回忆录不存在');
  });

  it('缺少 memoir_id 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/memoir/preview')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('memoir_id');
  });
});

// ===== GET /api/pets/:petId/membership - 查询会员状态（回忆录定价） =====
describe('GET /api/pets/:petId/membership - 查询会员状态', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
  });

  it('会员用户返回会员价格', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{
        id: 'mem-001', tier: 'monthly', plan: 'monthly', status: 'active',
        price: 990, expires_at: '2026-09-01T00:00:00Z', started_at: '2026-08-01T00:00:00Z',
      }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/membership');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isMember).toBe(true);
    expect(res.body.data.memoirPrice).toBe(9900);
    expect(res.body.data.memberPrice).toBe(9900);
    expect(res.body.data.tier).toBe('monthly');
  });

  it('非会员用户返回非会员价格', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/membership');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isMember).toBe(false);
    expect(res.body.data.memoirPrice).toBe(14900);
    expect(res.body.data.tier).toBe('free');
  });

  it('宠物不属于当前用户，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/other-pet/membership');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('会员已过期，返回非会员价格', async () => {
    const pastDate = '2024-01-01T00:00:00Z';
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{
        id: 'mem-002', tier: 'monthly', plan: 'monthly', status: 'active',
        price: 990, expires_at: pastDate, started_at: '2023-12-01T00:00:00Z',
      }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/membership');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isMember).toBe(false);
    expect(res.body.data.memoirPrice).toBe(14900);
    expect(res.body.data.status).toBe('expired');
  });
});
