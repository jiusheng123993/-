/**
 * 分享卡片模块集成测试
 * 覆盖：生成卡片、列表分页、详情、删除、记录分享
 * 重点验证：card_type 枚举校验、source_data 非空校验、归属校验（404 防越权）、share_count 累加
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockPool, mockCrypto, mockFs } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  const crypto = { randomUUID: vi.fn(() => 'mock-card-uuid') };
  const fs = {
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
  return { mockPool: pool, mockCrypto: crypto, mockFs: fs };
});

vi.mock('../db.js', () => ({ pool: mockPool }));

vi.mock('crypto', () => ({
  default: mockCrypto,
  randomUUID: mockCrypto.randomUUID,
}));

vi.mock('fs', () => ({
  default: mockFs,
  mkdirSync: mockFs.mkdirSync,
  writeFileSync: mockFs.writeFileSync,
}));

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
    publicBaseUrl: '',
  },
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    _req.userId = 'test-user-id';
    next();
  },
}));

import shareCardsRouter from '../routes/shareCards.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/share-cards', shareCardsRouter);
  return app;
}

/** mock 卡片数据（card_data 为对象，模拟 pg JSONB 自动解析结果）
 * 结构对齐 shareCardService.buildCardData：title/icon/content/pet_name/date/style/source_data/generated_at
 */
const mockCardData = {
  title: '健康报告',
  icon: '📊',
  content: '本周健康打卡记录',
  pet_name: null,
  date: '2026-07-30',
  style: { theme: 'warm' },
  source_data: { pet_id: 'pet-001' },
  generated_at: '2026-07-30T00:00:00.000Z',
};

/** 模拟卡片记录（card_url 为真实 SVG 文件路径） */
const mockCard = {
  id: 'card-001',
  user_id: 'test-user-id',
  card_type: 'health_report',
  card_data: mockCardData,
  card_url: '/uploads/share-cards/test-user-id/mock-card-uuid.svg',
  share_channel: null,
  share_count: 0,
  created_at: '2026-07-30T00:00:00.000Z',
};

/** 模拟分享后的卡片（share_count+1, share_channel 更新） */
const mockCardAfterShare = {
  ...mockCard,
  share_count: 1,
  share_channel: 'wechat',
};

beforeEach(() => {
  // mockReset 清除 mock 队列（含 mockResolvedValueOnce 残留），避免测试间污染
  mockPool.query.mockReset();
  mockCrypto.randomUUID.mockReset();
  mockCrypto.randomUUID.mockReturnValue('mock-card-uuid');
  // fs mock 重置，避免调用记录跨测试污染
  mockFs.mkdirSync.mockReset();
  mockFs.writeFileSync.mockReset();
});

// ===== POST /api/share-cards/generate - 生成分享卡片 =====
describe('POST /api/share-cards/generate - 生成分享卡片', () => {
  it('正常生成卡片（返回 201）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 }); // insertCard

    const res = await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'health_report',
        source_data: { pet_id: 'pet-001' },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('card-001');
    expect(res.body.data.card_type).toBe('health_report');
    expect(res.body.data.share_count).toBe(0);
    expect(res.body.data.share_channel).toBeNull();
  });

  it('生成的 card_url 使用 crypto.randomUUID 作为占位 id', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 });

    await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'milestone',
        source_data: { milestone_id: 'm-001' },
      });

    // 验证调用了 crypto.randomUUID
    expect(mockCrypto.randomUUID).toHaveBeenCalled();
  });

  it('插入时 card_data 使用 JSON.stringify 并包含结构化字段', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 });

    await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'health_report',
        source_data: { pet_id: 'pet-001', custom_text: '今天小旺很可爱' },
        style: { theme: 'cute', background_color: '#fff' },
      });

    // insert 查询参数中 card_data 应为字符串（JSON.stringify 后）
    const insertCall = mockPool.query.mock.calls[0];
    const params = insertCall[1] as unknown[];
    // 参数顺序：user_id, card_type, card_data, card_url, share_channel, share_count
    const cardDataParam = params[2];
    expect(typeof cardDataParam).toBe('string');
    const parsed = JSON.parse(cardDataParam as string);
    // 验证新结构化字段
    expect(parsed.title).toBe('健康报告');
    expect(parsed.icon).toBe('📊');
    expect(parsed.content).toBe('今天小旺很可爱');
    expect(parsed.source_data.pet_id).toBe('pet-001');
    expect(parsed.style.theme).toBe('cute');
    expect(parsed.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('生成卡片时调用 fs.writeFileSync 保存 SVG 文件', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 });

    await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'health_report',
        source_data: { pet_id: 'pet-001' },
      });

    // 验证 fs.writeFileSync 被调用（SVG 内容写入）
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('share-cards'),
      { recursive: true },
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('mock-card-uuid.svg'),
      expect.stringContaining('<svg'),
      'utf8',
    );
  });

  it('card_url 格式为 /uploads/share-cards/{userId}/{cardId}.svg', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 });

    await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'milestone',
        source_data: { milestone_id: 'm-001' },
      });

    // 验证 insertCard 传入的 card_url 参数格式
    const insertCall = mockPool.query.mock.calls[0];
    const params = insertCall[1] as unknown[];
    const cardUrlParam = params[3];
    expect(cardUrlParam).toBe('/uploads/share-cards/test-user-id/mock-card-uuid.svg');
  });

  it('fs 写入失败时降级为 card_url=null（不阻断卡片创建）', async () => {
    mockFs.writeFileSync.mockImplementationOnce(() => {
      throw new Error('Disk full');
    });
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ...mockCard, card_url: null }],
      rowCount: 1,
    });

    const res = await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'health_report',
        source_data: { pet_id: 'pet-001' },
      });

    expect(res.status).toBe(201);
    // insertCard 传入的 card_url 应为 null（降级）
    const insertCall = mockPool.query.mock.calls[0];
    const params = insertCall[1] as unknown[];
    expect(params[3]).toBeNull();
  });

  it('card_type 无效返回 400', async () => {
    const res = await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'invalid_type',
        source_data: { pet_id: 'pet-001' },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('card_type');
  });

  it('source_data 为空对象返回 400（refine 校验）', async () => {
    const res = await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'health_report',
        source_data: {},
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('source_data');
  });

  it('缺少 source_data 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'health_report',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('custom_photos 超过 9 张返回 400', async () => {
    const photos = Array.from({ length: 10 }, (_, i) => `https://example.com/p${i}.jpg`);
    const res = await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'daily_moment',
        source_data: { custom_photos: photos },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('9');
  });

  it('custom_photos 中包含非 URL 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'daily_moment',
        source_data: { custom_photos: ['not-a-url'] },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('custom_text 超过 500 字符返回 400', async () => {
    const res = await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'daily_moment',
        source_data: { custom_text: 'a'.repeat(501) },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('500');
  });

  it('style.theme 无效返回 400', async () => {
    const res = await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'health_report',
        source_data: { pet_id: 'pet-001' },
        style: { theme: 'invalid_theme' },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('支持全部 card_type 枚举值', async () => {
    const types = [
      'health_report', 'weekly_summary', 'milestone', 'family_tree', 'memoir',
      'naming', 'birthday', 'achievement', 'daily_moment', 'yearly_review', 'wardrobe',
    ];
    for (const cardType of types) {
      mockPool.query.mockReset();
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...mockCard, card_type: cardType }],
        rowCount: 1,
      });

      const res = await request(createApp())
        .post('/api/share-cards/generate')
        .send({ card_type: cardType, source_data: { pet_id: 'pet-001' } });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    }
  });

  it('数据库异常返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error')); // insertCard throws

    const res = await request(createApp())
      .post('/api/share-cards/generate')
      .send({
        card_type: 'health_report',
        source_data: { pet_id: 'pet-001' },
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ===== GET /api/share-cards - 获取卡片列表 =====
describe('GET /api/share-cards - 获取卡片列表', () => {
  it('正常返回列表（含分页信息）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 })       // findByUserId
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });  // countByUserId

    const res = await request(createApp())
      .get('/api/share-cards');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.page_size).toBe(20);
  });

  it('返回的 card_data 为对象（JSONB 已解析）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/share-cards');

    expect(res.body.data.items[0].card_data).toBeInstanceOf(Object);
    expect(res.body.data.items[0].card_data.title).toBe('健康报告');
  });

  it('默认分页 page=1, page_size=20', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/share-cards');

    expect(res.body.data.page).toBe(1);
    expect(res.body.data.page_size).toBe(20);
  });

  it('分页参数正确传递', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    await request(createApp())
      .get('/api/share-cards?page=2&page_size=5');

    // 验证列表查询 SQL 包含 LIMIT 和 OFFSET
    const findCall = mockPool.query.mock.calls[0];
    expect(findCall[0]).toContain('LIMIT');
    expect(findCall[0]).toContain('OFFSET');
    // page=2, page_size=5 → offset=(2-1)*5=5, limit=5
    expect(findCall[1]).toContain(5);
  });

  it('列表查询按 created_at DESC 排序', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    await request(createApp())
      .get('/api/share-cards');

    const findCall = mockPool.query.mock.calls[0];
    expect(findCall[0]).toContain('ORDER BY created_at DESC');
  });

  it('列表查询包含 user_id 条件（防跨用户泄露）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    await request(createApp())
      .get('/api/share-cards');

    const findCall = mockPool.query.mock.calls[0];
    expect(findCall[0]).toContain('user_id = $1');
    expect(findCall[1]).toContain('test-user-id');
  });

  it('按 card_type 过滤', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });

    await request(createApp())
      .get('/api/share-cards?card_type=health_report');

    // 验证列表查询 SQL 包含 card_type 条件
    const findCall = mockPool.query.mock.calls[0];
    expect(findCall[0]).toContain('card_type');
    expect(findCall[1]).toContain('health_report');

    // 验证 count 查询也包含 card_type 条件
    const countCall = mockPool.query.mock.calls[1];
    expect(countCall[0]).toContain('card_type');
    expect(countCall[1]).toContain('health_report');
  });

  it('page_size 超过 100 时返回 400', async () => {
    const res = await request(createApp())
      .get('/api/share-cards?page_size=101');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('page 小于 1 返回 400', async () => {
    const res = await request(createApp())
      .get('/api/share-cards?page=0');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('数据库异常返回 500', async () => {
    mockPool.query
      .mockRejectedValueOnce(new Error('DB error'))                              // findByUserId throws
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });             // countByUserId（Promise.all 已因 find 抛错而 reject，此值不会被使用）

    const res = await request(createApp())
      .get('/api/share-cards');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ===== GET /api/share-cards/:id - 获取卡片详情 =====
describe('GET /api/share-cards/:id - 获取卡片详情', () => {
  it('正常返回详情', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 }); // findByIdAndUser

    const res = await request(createApp())
      .get('/api/share-cards/card-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('card-001');
    expect(res.body.data.card_type).toBe('health_report');
  });

  it('详情查询同时校验 id 和 user_id（防横向越权）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 });

    await request(createApp())
      .get('/api/share-cards/card-001');

    const detailCall = mockPool.query.mock.calls[0];
    expect(detailCall[0]).toContain('id = $1');
    expect(detailCall[0]).toContain('user_id = $2');
    expect(detailCall[1]).toContain('card-001');
    expect(detailCall[1]).toContain('test-user-id');
  });

  it('卡片不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // findByIdAndUser (not found)

    const res = await request(createApp())
      .get('/api/share-cards/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不存在');
  });

  it('卡片不属于当前用户返回 404（横向越权防护，不泄露存在性）', async () => {
    // findByIdAndUser 用 id + user_id 双条件，不属于当前用户也返回空
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/share-cards/other-user-card');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('数据库异常返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/api/share-cards/card-001');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ===== DELETE /api/share-cards/:id - 删除卡片 =====
describe('DELETE /api/share-cards/:id - 删除卡片', () => {
  it('正常删除卡片', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 }) // findByIdAndUser
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });        // deleteById

    const res = await request(createApp())
      .delete('/api/share-cards/card-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('删除');
  });

  it('卡片不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // findByIdAndUser (not found)

    const res = await request(createApp())
      .delete('/api/share-cards/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不存在');
  });

  it('删除别人的卡片返回 404（横向越权防护）', async () => {
    // findByIdAndUser 用 id + user_id 双条件，不属于当前用户也返回空
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .delete('/api/share-cards/other-user-card');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('数据库异常返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .delete('/api/share-cards/card-001');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ===== POST /api/share-cards/:id/share - 记录分享行为 =====
describe('POST /api/share-cards/:id/share - 记录分享行为', () => {
  it('正常记录分享（share_count+1）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 })              // findByIdAndUser
      .mockResolvedValueOnce({ rows: [mockCardAfterShare], rowCount: 1 });   // incrementShareCount

    const res = await request(createApp())
      .post('/api/share-cards/card-001/share')
      .send({ share_channel: 'wechat' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.share_count).toBe(1);
    expect(res.body.data.share_channel).toBe('wechat');
  });

  it('分享次数累加使用原子自增（share_count = share_count + 1）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCardAfterShare], rowCount: 1 });

    await request(createApp())
      .post('/api/share-cards/card-001/share')
      .send({ share_channel: 'moments' });

    // 验证 UPDATE 语句包含 share_count = share_count + 1
    const updateCall = mockPool.query.mock.calls[1];
    expect(updateCall[0]).toContain('share_count = share_count + 1');
    expect(updateCall[0]).toContain('share_channel');
  });

  it('分享时更新 share_channel 字段', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ ...mockCardAfterShare, share_channel: 'moments' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/share-cards/card-001/share')
      .send({ share_channel: 'moments' });

    expect(res.body.data.share_channel).toBe('moments');
  });

  it('分享更新包含 user_id 归属校验（防越权操作他人卡片）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCardAfterShare], rowCount: 1 });

    await request(createApp())
      .post('/api/share-cards/card-001/share')
      .send({ share_channel: 'wechat' });

    // 验证 UPDATE 语句 WHERE 包含 id 和 user_id
    const updateCall = mockPool.query.mock.calls[1];
    expect(updateCall[0]).toContain('id = $1');
    expect(updateCall[0]).toContain('user_id = $2');
    expect(updateCall[1]).toContain('card-001');
    expect(updateCall[1]).toContain('test-user-id');
  });

  it('share_channel 无效返回 400', async () => {
    const res = await request(createApp())
      .post('/api/share-cards/card-001/share')
      .send({ share_channel: 'invalid_channel' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('share_channel');
  });

  it('缺少 share_channel 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/share-cards/card-001/share')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('支持全部分享渠道枚举', async () => {
    const channels = ['wechat', 'moments', 'save', 'copy'];
    for (const channel of channels) {
      mockPool.query.mockReset();
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ ...mockCardAfterShare, share_channel: channel }],
          rowCount: 1,
        });

      const res = await request(createApp())
        .post('/api/share-cards/card-001/share')
        .send({ share_channel: channel });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.share_channel).toBe(channel);
    }
  });

  it('卡片不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // findByIdAndUser (not found)

    const res = await request(createApp())
      .post('/api/share-cards/nonexistent/share')
      .send({ share_channel: 'wechat' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不存在');
  });

  it('卡片不属于当前用户返回 404（横向越权防护）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/share-cards/other-user-card/share')
      .send({ share_channel: 'wechat' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('数据库异常返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error')); // findByIdAndUser throws

    const res = await request(createApp())
      .post('/api/share-cards/card-001/share')
      .send({ share_channel: 'wechat' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
