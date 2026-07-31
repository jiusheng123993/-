/**
 * 年度回忆图集模块集成测试
 * 覆盖：创建、查询详情、列表分页、更新、视频生成
 * 重点验证：归属校验、年份唯一性、草稿/完成状态约束、参数校验
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockPool, mockGenerateMemoirVideo, mockModerateVideo, mockSendToUser } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  return {
    mockPool: pool,
    mockGenerateMemoirVideo: vi.fn(),
    mockModerateVideo: vi.fn(),
    mockSendToUser: vi.fn(),
  };
});

vi.mock('../db.js', () => ({ pool: mockPool }));

vi.mock('../services/videoGenerationService.js', () => ({
  generateMemoirVideo: mockGenerateMemoirVideo,
}));

vi.mock('../services/videoModerationService.js', () => ({
  moderateVideo: mockModerateVideo,
}));

vi.mock('../services/websocketService.js', () => ({
  sendToUser: mockSendToUser,
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
  },
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    _req.userId = 'test-user-id';
    next();
  },
}));

import yearlyReviewRouter from '../routes/yearlyReview.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/pets', yearlyReviewRouter);
  return app;
}

const mockDraftRecord = {
  id: 'review-001',
  user_id: 'test-user-id',
  pet_id: 'pet-001',
  year: 2026,
  status: 'draft',
  review_data: {
    title: '2026 年度回忆',
    summary: '',
    auto_select: true,
    custom_photos: [],
    stats: {
      total_photos: 0,
      total_checkins: 0,
      total_milestones: 0,
      health_avg_score: 0,
      best_month: '',
      vet_visits: 0,
    },
    monthly_highlights: [],
    milestones: [],
    growth_timeline: [],
  },
  cover_url: null,
  video_url: null,
  paid: false,
  created_at: '2026-07-30T00:00:00.000Z',
  updated_at: '2026-07-30T00:00:00.000Z',
};

const mockCompletedRecord = {
  ...mockDraftRecord,
  id: 'review-002',
  status: 'completed',
  cover_url: 'https://example.com/cover.jpg',
  video_url: 'https://example.com/video.mp4',
  review_data: {
    ...mockDraftRecord.review_data,
    summary: '陪伴的一年',
    sections: [
      { type: 'monthly', photos: ['https://example.com/1.jpg'], title: '1月', description: '新年快乐' },
      { type: 'milestone', photos: ['https://example.com/2.jpg'], title: '生日', description: '3岁啦' },
    ],
  },
};

const mockGeneratingRecord = {
  ...mockDraftRecord,
  id: 'review-003',
  status: 'generating_video',
};

beforeEach(() => {
  mockPool.query.mockReset();
  mockGenerateMemoirVideo.mockReset();
  mockModerateVideo.mockReset();
  mockSendToUser.mockReset();
  // 默认：生成成功 + 审核通过
  mockGenerateMemoirVideo.mockResolvedValue({
    videoUrl: 'https://example.com/video.mp4',
    previewUrl: 'https://example.com/preview.mp4',
    actualDuration: 15,
    engine: 'test-mock',
  });
  mockModerateVideo.mockResolvedValue('pass');
});

// ===== POST /api/pets/:petId/yearly-review - 创建年度回忆 =====
describe('POST /api/pets/:petId/yearly-review - 创建年度回忆', () => {
  it('正常创建（返回 201，status=draft）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // ownership OK
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 })      // not exists
      .mockResolvedValueOnce({ rows: [mockDraftRecord], rowCount: 1 });   // insert

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review')
      .send({ year: 2026 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('review-001');
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.year).toBe(2026);
    expect(res.body.data.paid).toBe(false);
  });

  it('带自定义照片和标题创建', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockDraftRecord], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review')
      .send({
        year: 2026,
        auto_select: false,
        custom_photos: ['https://example.com/a.jpg'],
        title: '我的2026',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('缺少 year 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review')
      .send({ title: '无年份' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('year 非法（<2000）返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review')
      .send({ year: 1999 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('year 非整数返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review')
      .send({ year: 2026.5 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('custom_photos 非法 URL 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review')
      .send({ year: 2026, custom_photos: ['not-a-url'] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('宠物不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ownership fail

    const res = await request(createApp())
      .post('/api/pets/pet-999/yearly-review')
      .send({ year: 2026 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('同年已存在返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // ownership OK
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });     // exists

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review')
      .send({ year: 2026 });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('已存在');
  });

  it('数据库异常返回 500', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 })
      .mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review')
      .send({ year: 2026 });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ===== GET /api/pets/:petId/yearly-review/list - 列表 =====
describe('GET /api/pets/:petId/yearly-review/list - 列表', () => {
  it('正常返回列表', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // ownership
      .mockResolvedValueOnce({ rows: [mockDraftRecord, mockCompletedRecord], rowCount: 2 }) // list
      .mockResolvedValueOnce({ rows: [{ count: 2 }], rowCount: 1 });      // count

    const res = await request(createApp())
      .get('/api/pets/pet-001/yearly-review/list');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.items[0].id).toBe('review-001');
    expect(res.body.data.items[1].photo_count).toBe(2); // mockCompletedRecord sections 2 photos
  });

  it('宠物不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-999/yearly-review/list');

    expect(res.status).toBe(404);
  });

  it('分页参数生效', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCompletedRecord], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 5 }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/yearly-review/list?page=2&page_size=10');

    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe(2);
    expect(res.body.data.page_size).toBe(10);
    expect(res.body.data.total).toBe(5);
  });
});

// ===== GET /api/pets/:petId/yearly-review/:year - 详情 =====
describe('GET /api/pets/:petId/yearly-review/:year - 详情', () => {
  it('正常返回详情', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // ownership
      .mockResolvedValueOnce({ rows: [mockDraftRecord], rowCount: 1 });   // find by year

    const res = await request(createApp())
      .get('/api/pets/pet-001/yearly-review/2026');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('review-001');
    expect(res.body.data.year).toBe(2026);
  });

  it('year 非法返回 400', async () => {
    const res = await request(createApp())
      .get('/api/pets/pet-001/yearly-review/abc');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('year 不合法');
  });

  it('year 超范围返回 400', async () => {
    const res = await request(createApp())
      .get('/api/pets/pet-001/yearly-review/1999');

    expect(res.status).toBe(400);
  });

  it('年度回忆不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-001/yearly-review/2025');

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('不存在');
  });

  it('宠物不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/pets/pet-999/yearly-review/2026');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('宠物不存在');
  });
});

// ===== PUT /api/pets/:petId/yearly-review/:reviewId - 更新 =====
describe('PUT /api/pets/:petId/yearly-review/:reviewId - 更新', () => {
  it('更新标题成功', async () => {
    const updated = {
      ...mockDraftRecord,
      review_data: { ...mockDraftRecord.review_data, title: '新标题' },
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // ownership
      .mockResolvedValueOnce({ rows: [mockDraftRecord], rowCount: 1 })    // find by id
      .mockResolvedValueOnce({ rows: [updated], rowCount: 1 });           // update

    const res = await request(createApp())
      .put('/api/pets/pet-001/yearly-review/review-001')
      .send({ title: '新标题' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('更新封面成功', async () => {
    const updated = { ...mockDraftRecord, cover_url: 'https://example.com/new.jpg' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockDraftRecord], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/pets/pet-001/yearly-review/review-001')
      .send({ cover_url: 'https://example.com/new.jpg' });

    expect(res.status).toBe(200);
    expect(res.body.data.cover_url).toBe('https://example.com/new.jpg');
  });

  it('更新 review_data sections 成功', async () => {
    const updated = {
      ...mockDraftRecord,
      review_data: {
        ...mockDraftRecord.review_data,
        sections: [
          { type: 'monthly', photos: ['https://example.com/m1.jpg'], title: '1月', description: '描述' },
        ],
      },
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockDraftRecord], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/pets/pet-001/yearly-review/review-001')
      .send({
        review_data: {
          sections: [
            { type: 'monthly', photos: ['https://example.com/m1.jpg'], title: '1月', description: '描述' },
          ],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('非法 section.type 返回 400', async () => {
    const res = await request(createApp())
      .put('/api/pets/pet-001/yearly-review/review-001')
      .send({
        review_data: {
          sections: [
            { type: 'invalid', photos: [], title: 't', description: 'd' },
          ],
        },
      });

    expect(res.status).toBe(400);
  });

  it('非法 cover_url 返回 400', async () => {
    const res = await request(createApp())
      .put('/api/pets/pet-001/yearly-review/review-001')
      .send({ cover_url: 'not-a-url' });

    expect(res.status).toBe(400);
  });

  it('年度回忆不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/api/pets/pet-001/yearly-review/review-999')
      .send({ title: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('年度回忆不存在');
  });

  it('宠物不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/api/pets/pet-999/yearly-review/review-001')
      .send({ title: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('宠物不存在');
  });
});

// ===== POST /api/pets/:petId/yearly-review/:reviewId/generate-video - 生成视频 =====
describe('POST /api/pets/:petId/yearly-review/:reviewId/generate-video - 生成视频', () => {
  it('completed 状态可生成视频（异步生成 + 审核通过 → video_ready）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // ownership
      .mockResolvedValueOnce({ rows: [mockCompletedRecord], rowCount: 1 }) // find
      .mockResolvedValueOnce({ rows: [{ id: 'review-002', status: 'generating_video' }], rowCount: 1 }) // update
      .mockResolvedValueOnce({ rows: [{ id: 'review-002', status: 'video_ready', video_url: 'https://example.com/video.mp4' }], rowCount: 1 }); // async update

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review/review-002/generate-video');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('generating_video');
    expect(res.body.data.message).toContain('视频生成');

    // 等待异步生成完成
    await vi.waitFor(() => {
      expect(mockGenerateMemoirVideo).toHaveBeenCalled();
    });
    // 2 张照片 → daily 产品线
    expect(mockGenerateMemoirVideo).toHaveBeenCalledWith(
      expect.objectContaining({ productLine: 'daily', sourcePhotos: expect.any(Array) }),
    );
    expect(mockModerateVideo).toHaveBeenCalled();
    expect(mockSendToUser).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({ event: 'yearly_review_status' }),
    );
  });

  it('completed 但无照片返回 400', async () => {
    const recordNoPhotos = {
      ...mockCompletedRecord,
      review_data: { ...mockDraftRecord.review_data }, // 无 sections / custom_photos
    };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [recordNoPhotos], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review/review-002/generate-video');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('照片');
    expect(mockGenerateMemoirVideo).not.toHaveBeenCalled();
  });

  it('内容审核拒绝时自动重试，最终标记失败并通知', async () => {
    mockModerateVideo.mockResolvedValue('block');
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // ownership
      .mockResolvedValueOnce({ rows: [mockCompletedRecord], rowCount: 1 }) // find
      .mockResolvedValueOnce({ rows: [{ id: 'review-002', status: 'generating_video' }], rowCount: 1 }) // update
      .mockResolvedValueOnce({ rows: [{ id: 'review-002', status: 'failed' }], rowCount: 1 }); // async failed update

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review/review-002/generate-video');

    expect(res.status).toBe(200);

    // 3 次尝试全部因审核拒绝而重试
    await vi.waitFor(() => {
      expect(mockGenerateMemoirVideo).toHaveBeenCalledTimes(3);
    });
    expect(mockModerateVideo).toHaveBeenCalledTimes(3);
    expect(mockSendToUser).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({ event: 'yearly_review_status', data: expect.objectContaining({ type: 'yearly_video_failed' }) }),
    );
  });

  it('视频生成失败时自动重试，最终标记失败', async () => {
    mockGenerateMemoirVideo.mockRejectedValue(new Error('Seedance API error'));
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCompletedRecord], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'review-002', status: 'generating_video' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'review-002', status: 'failed' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review/review-002/generate-video');

    expect(res.status).toBe(200);

    await vi.waitFor(() => {
      expect(mockGenerateMemoirVideo).toHaveBeenCalledTimes(3);
    });
    expect(mockSendToUser).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({ event: 'yearly_review_status', data: expect.objectContaining({ type: 'yearly_video_failed' }) }),
    );
  });

  it('draft 状态无法生成视频返回 400', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockDraftRecord], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review/review-001/generate-video');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('草稿');
  });

  it('generating_video 状态重复触发返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockGeneratingRecord], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review/review-003/generate-video');

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('重复');
  });

  it('年度回忆不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review/review-999/generate-video');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('年度回忆不存在');
  });

  it('宠物不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/pets/pet-999/yearly-review/review-001/generate-video');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('数据库异常返回 500', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockCompletedRecord], rowCount: 1 })
      .mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .post('/api/pets/pet-001/yearly-review/review-002/generate-video');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
