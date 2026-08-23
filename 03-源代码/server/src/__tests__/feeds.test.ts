/**
 * 家庭动态墙模块集成测试
 * 覆盖：发布动态、编辑、删除、分页列表、精选动态
 * 重点验证：家庭归属校验、宠物归属校验、内容校验、照片数量校验、越权防护
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

import feedsRouter from '../routes/feeds.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/families', feedsRouter);
  return app;
}

/** 模拟归属校验通过的结果（SELECT 1 FROM ... 返回） */
const ownershipOk = { rows: [{ ok: true }], rowCount: 1 };

/** 模拟归属校验失败的结果 */
const ownershipFail = { rows: [], rowCount: 0 };

/** 模拟动态记录 */
const mockFeed = {
  id: 'feed-001',
  family_id: 'family-001',
  pet_id: 'pet-001',
  user_id: 'test-user-id',
  feed_type: 'moment',
  content: '今天小旺很开心',
  photos: ['https://example.com/photo1.jpg'],
  ai_generated: false,
  source_ref: null,
  created_at: '2026-07-30T00:00:00.000Z',
};

/** 模拟带宠物信息的动态记录 */
const mockFeedWithPet = {
  ...mockFeed,
  pet_name: '小旺',
  pet_avatar_url: 'https://example.com/avatar.jpg',
};

/** 模拟其他用户的动态 */
const mockOtherUserFeed = {
  ...mockFeed,
  id: 'feed-002',
  user_id: 'other-user-id',
  content: '别人的动态',
};

beforeEach(() => {
  // mockReset 清除 mock 队列（含 mockResolvedValueOnce 残留），避免测试间污染
  mockPool.query.mockReset();
});

// ===== POST /api/families/:id/feeds - 发布动态 =====
describe('POST /api/families/:id/feeds - 发布动态', () => {
  it('正常创建动态（返回 201）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)   // verifyFamilyOwnership
      .mockResolvedValueOnce(ownershipOk)   // verifyPetOwnership
      .mockResolvedValueOnce({ rows: [mockFeed], rowCount: 1 }); // insert

    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({
        feed_type: 'moment',
        content: '今天小旺很开心',
        pet_id: 'pet-001',
        photos: ['https://example.com/photo1.jpg'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('feed-001');
    expect(res.body.data.feed_type).toBe('moment');
    expect(res.body.data.content).toBe('今天小旺很开心');
  });

  it('不带 pet_id 也能正常创建', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)   // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockFeed], rowCount: 1 }); // insert

    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({
        feed_type: 'moment',
        content: '今天小旺很开心',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('feed_type 无效返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({
        feed_type: 'invalid_type',
        content: '内容',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('feed_type');
  });

  it('content 为空返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({
        feed_type: 'moment',
        content: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('content');
  });

  it('缺少 feed_type 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({ content: '内容' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('content 超过 2000 字符返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({
        feed_type: 'moment',
        content: 'a'.repeat(2001),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('2000');
  });

  it('photos 超过 9 张返回 400', async () => {
    const photos = Array.from({ length: 10 }, (_, i) => `https://example.com/p${i}.jpg`);
    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({
        feed_type: 'moment',
        content: '内容',
        photos,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('9');
  });

  it('photos 中包含非 URL 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({
        feed_type: 'moment',
        content: '内容',
        photos: ['not-a-url'],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({
        feed_type: 'moment',
        content: '内容',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('pet_id 不属于当前用户返回 403', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)    // verifyFamilyOwnership OK
      .mockResolvedValueOnce(ownershipFail); // verifyPetOwnership fails

    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({
        feed_type: 'moment',
        content: '内容',
        pet_id: 'other-pet',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('宠物');
  });

  it('数据库异常返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error')); // ownership throws

    const res = await request(createApp())
      .post('/api/families/family-001/feeds')
      .send({
        feed_type: 'moment',
        content: '内容',
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('支持全部 feed_type 枚举值', async () => {
    const types = ['moment', 'achievement', 'health_milestone', 'family_event'];
    for (const feedType of types) {
      mockPool.query.mockReset();
      mockPool.query
        .mockResolvedValueOnce(ownershipOk)
        .mockResolvedValueOnce({ rows: [{ ...mockFeed, feed_type: feedType }], rowCount: 1 });

      const res = await request(createApp())
        .post('/api/families/family-001/feeds')
        .send({ feed_type: feedType, content: '内容' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    }
  });
});

// ===== GET /api/families/:id/feeds - 获取动态列表 =====
describe('GET /api/families/:id/feeds - 获取动态列表', () => {
  it('正常返回列表（含分页信息）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                                    // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockFeedWithPet], rowCount: 1 })       // findByFamilyId
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });         // countByFamilyId

    const res = await request(createApp())
      .get('/api/families/family-001/feeds');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.page_size).toBe(20);
  });

  it('分页参数正确传递', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    await request(createApp())
      .get('/api/families/family-001/feeds?page=2&page_size=5');

    // 验证 findByFamilyId 的 SQL 包含 LIMIT 和 OFFSET
    const findCall = mockPool.query.mock.calls[1];
    expect(findCall[0]).toContain('LIMIT');
    expect(findCall[0]).toContain('OFFSET');
    // page=2, page_size=5 → offset=(2-1)*5=5, limit=5
    expect(findCall[1]).toContain(5);
  });

  it('默认分页 page=1, page_size=20', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/families/family-001/feeds');

    expect(res.body.data.page).toBe(1);
    expect(res.body.data.page_size).toBe(20);
  });

  it('page_size 超过 100 时返回 400', async () => {
    const res = await request(createApp())
      .get('/api/families/family-001/feeds?page_size=101');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .get('/api/families/family-001/feeds');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('带 feed_type 过滤参数', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [mockFeedWithPet], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });

    await request(createApp())
      .get('/api/families/family-001/feeds?feed_type=moment');

    // 验证列表查询 SQL 包含 feed_type 条件
    const findCall = mockPool.query.mock.calls[1];
    expect(findCall[0]).toContain('feed_type');
    expect(findCall[1]).toContain('moment');
  });

  it('带 pet_id 过滤参数', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [mockFeedWithPet], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });

    await request(createApp())
      .get('/api/families/family-001/feeds?pet_id=pet-001');

    // 验证列表查询 SQL 包含 pet_id 条件
    const findCall = mockPool.query.mock.calls[1];
    expect(findCall[0]).toContain('pet_id');
    expect(findCall[1]).toContain('pet-001');
  });
});

// ===== PUT /api/families/:id/feeds/:feedId - 编辑动态 =====
describe('PUT /api/families/:id/feeds/:feedId - 编辑动态', () => {
  it('正常编辑动态', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                                  // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockFeed], rowCount: 1 })            // findByIdAndFamily
      .mockResolvedValueOnce({ rows: [{ ...mockFeed, content: '已更新' }], rowCount: 1 }); // updateById

    const res = await request(createApp())
      .put('/api/families/family-001/feeds/feed-001')
      .send({ content: '已更新' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('已更新');
  });

  it('编辑 photos 字段', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [mockFeed], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ ...mockFeed, photos: ['https://example.com/new.jpg'] }], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/families/family-001/feeds/feed-001')
      .send({ photos: ['https://example.com/new.jpg'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('动态不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                  // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });   // findByIdAndFamily (not found)

    const res = await request(createApp())
      .put('/api/families/family-001/feeds/nonexistent')
      .send({ content: '内容' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不存在');
  });

  it('编辑别人的动态返回 403', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                              // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockOtherUserFeed], rowCount: 1 }); // findByIdAndFamily (exists but other user)

    const res = await request(createApp())
      .put('/api/families/family-001/feeds/feed-002')
      .send({ content: '试图修改别人的' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('编辑');
  });

  it('没有需要更新的字段返回 400', async () => {
    const res = await request(createApp())
      .put('/api/families/family-001/feeds/feed-001')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('更新');
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .put('/api/families/family-001/feeds/feed-001')
      .send({ content: '内容' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });
});

// ===== DELETE /api/families/:id/feeds/:feedId - 删除动态 =====
describe('DELETE /api/families/:id/feeds/:feedId - 删除动态', () => {
  it('正常删除动态', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                       // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockFeed], rowCount: 1 }) // findByIdAndFamily
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });        // deleteById

    const res = await request(createApp())
      .delete('/api/families/family-001/feeds/feed-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('删除');
  });

  it('动态不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                  // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });   // findByIdAndFamily (not found)

    const res = await request(createApp())
      .delete('/api/families/family-001/feeds/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不存在');
  });

  it('删除别人的动态返回 403', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                                  // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockOtherUserFeed], rowCount: 1 });  // findByIdAndFamily (exists but other user)

    const res = await request(createApp())
      .delete('/api/families/family-001/feeds/feed-002');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('删除');
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .delete('/api/families/family-001/feeds/feed-001');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });
});

// ===== GET /api/families/:id/feeds/highlight - 精选动态 =====
describe('GET /api/families/:id/feeds/highlight - 精选动态', () => {
  it('正常返回精选动态', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                                    // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockFeedWithPet, mockFeedWithPet], rowCount: 2 }); // findHighlightByFamilyId

    const res = await request(createApp())
      .get('/api/families/family-001/feeds/highlight');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(2);
  });

  it('无动态返回空数组', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // findHighlightByFamilyId (empty)

    const res = await request(createApp())
      .get('/api/families/family-001/feeds/highlight');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(0);
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .get('/api/families/family-001/feeds/highlight');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('精选查询包含 30 天过滤条件', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await request(createApp())
      .get('/api/families/family-001/feeds/highlight');

    const highlightCall = mockPool.query.mock.calls[1];
    expect(highlightCall[0]).toContain('30 days');
    expect(highlightCall[0]).toContain('LIMIT');
  });
});
