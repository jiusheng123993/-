/**
 * 全家福模块集成测试
 * 覆盖：AI生成（参数校验+归属校验+业务规则）、照片列表查询、照片删除
 * 重点验证：风格白名单校验、家庭归属校验、并发生成限制、成员数校验
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
    seedream: { apiKey: 'test-seedream-key' },
    meshy: { apiKey: '' },
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

// Mock fetch for Seedream API calls
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import familyPhotosRouter from '../routes/familyPhotos.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/families', familyPhotosRouter);
  return app;
}

const ownershipOk = { rows: [{ '?column?': 1 }], rowCount: 1 };
const ownershipFail = { rows: [], rowCount: 0 };

const mockMembers = {
  rows: [
    { petId: 'pet-001', name: '小咪', species: 'cat', breed: '英短', photoUrl: 'https://example.com/pet1.jpg' },
    { petId: 'pet-002', name: '旺财', species: 'dog', breed: '金毛', photoUrl: 'https://example.com/pet2.jpg' },
  ],
};

const mockSingleMember = {
  rows: [
    { petId: 'pet-001', name: '小咪', species: 'cat', breed: '英短', photoUrl: null },
  ],
};

const mockEmptyMembers = { rows: [], rowCount: 0 };

const mockPhoto = {
  id: 'photo-001',
  photoUrl: 'https://example.com/family-photo.png',
  photoType: 'ai_generated',
  style: 'pixar',
  memberCount: 2,
  memberNames: ['小咪', '旺财'],
  status: 'completed',
  createdAt: '2026-07-31T00:00:00.000Z',
};

const mockPhotos = { rows: [mockPhoto] };

describe('POST /api/families/:familyId/photos — 生成全家福', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('style 不在白名单应返回 400', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos')
      .send({ style: 'invalid_style' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('style 为空应返回 400', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('非家庭所有者应返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // isOwner check

    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos')
      .send({ style: 'pixar' });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('无权');
  });

  it('家庭无成员应返回 400', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);   // isOwner
    mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }); // hasActiveTask (no active)
    mockPool.query.mockResolvedValueOnce(mockEmptyMembers); // collectMemberPhotos

    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos')
      .send({ style: 'pixar' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('没有宠物成员');
  });

  it('仅1位成员应返回 400', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);   // isOwner
    mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }); // hasActiveTask (no)
    mockPool.query.mockResolvedValueOnce(mockSingleMember); // collectMemberPhotos

    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos')
      .send({ style: 'pixar' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('至少2位');
  });

  it('已有进行中任务应返回 400', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);   // isOwner
    mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }); // hasActiveTask = true

    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos')
      .send({ style: 'pixar' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('进行中');
  });

  it('AI 生成成功应返回 200 + photoUrl', async () => {
    // isOwner
    mockPool.query.mockResolvedValueOnce(ownershipOk);
    // hasActiveTask (no active)
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // collectMemberPhotos
    mockPool.query.mockResolvedValueOnce(mockMembers);
    // INSERT INTO family_photos
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
    // Seedream API success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ url: 'https://seedream.example.com/photo.png' }] }),
    });
    // UPDATE family_photos SET status = 'completed'
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos')
      .send({ style: 'pixar' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.photoUrl).toBe('https://seedream.example.com/photo.png');
    expect(res.body.data.id).toBeDefined();
  });

  it('所有合法风格均可通过校验', async () => {
    const styles = ['pixar', 'ghibli', 'oil', 'ink', 'nordic', 'cyberpunk'];

    for (const style of styles) {
      mockPool.query.mockReset();
      mockPool.query.mockResolvedValueOnce(ownershipOk);

      const app = createApp();
      const res = await request(app)
        .post('/api/families/fam-001/photos')
        .send({ style });
      // 不做完全生成流程，仅验证 style 校验通过（不会 400）
      expect(res.status).not.toBe(400);
    }
  });
});

describe('GET /api/families/:familyId/photos — 照片列表', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('非家庭所有者应返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail);
    const app = createApp();
    const res = await request(app).get('/api/families/fam-001/photos');
    expect(res.status).toBe(403);
  });

  it('应返回照片列表', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);   // isOwner
    mockPool.query.mockResolvedValueOnce(mockPhotos);     // SELECT photos

    const app = createApp();
    const res = await request(app).get('/api/families/fam-001/photos');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('photo-001');
  });

  it('无照片时返回空数组', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const app = createApp();
    const res = await request(app).get('/api/families/fam-001/photos');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('DELETE /api/families/:familyId/photos/:photoId — 删除照片', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('非家庭所有者应返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail);
    const app = createApp();
    const res = await request(app).delete('/api/families/fam-001/photos/photo-001');
    expect(res.status).toBe(403);
  });

  it('照片不存在应返回 404', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);   // isOwner
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // DELETE failed

    const app = createApp();
    const res = await request(app).delete('/api/families/fam-001/photos/photo-999');
    expect(res.status).toBe(404);
  });

  it('删除成功应返回 200', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'photo-001' }], rowCount: 1 });

    const app = createApp();
    const res = await request(app).delete('/api/families/fam-001/photos/photo-001');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/families/:familyId/photos/upload — 上传/保存全家福', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
  });

  it('正常保存上传的全家福', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos/upload')
      .send({
        photoUrl: 'https://example.com/canvas-photo.png',
        photoType: 'canvas_fallback',
        memberCount: 3,
        memberNames: ['小咪', '旺财', '阿花'],
        description: 'Canvas 手动合成',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  it('photoUrl 为空，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);

    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos/upload')
      .send({ photoUrl: '', photoType: 'uploaded' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('photoType 非法值，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);

    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos/upload')
      .send({ photoUrl: 'https://example.com/photo.png', photoType: 'ai_generated' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('非家庭所有者应返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail);

    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos/upload')
      .send({ photoUrl: 'https://example.com/photo.png' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('无权');
  });

  it('memberNames 为空数组时正常入库', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipOk);
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const app = createApp();
    const res = await request(app)
      .post('/api/families/fam-001/photos/upload')
      .send({ photoUrl: 'https://example.com/photo.png', memberCount: 0, memberNames: [] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});