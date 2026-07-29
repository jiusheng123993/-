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
  },
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    _req.userId = 'test-user-id';
    next();
  },
}));

vi.mock('crypto', () => ({
  default: {
    randomUUID: vi.fn(() => 'mock-crypto-uuid'),
  },
  randomUUID: vi.fn(() => 'mock-crypto-uuid'),
}));

import familiesRouter from '../routes/families.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', familiesRouter);
  return app;
}

const mockFamily = {
  id: 'family-001',
  user_id: 'test-user-id',
  name: '我的毛孩子',
  avatar_url: null,
  created_at: '2026-07-01T00:00:00Z',
};

const mockFamilyWithMembers = {
  ...mockFamily,
  member_count: '2',
};

const mockMember = {
  id: 'member-001',
  family_id: 'family-001',
  pet_id: 'pet-001',
  role: 'member',
  pet_name: '小旺',
  species: 'dog',
  breed: '柯基',
  avatar_cartoon_url: null,
  avatar_photo_url: null,
  joined_at: '2026-07-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/families - 创建家庭', () => {
  it('正常创建家庭', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockFamily], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/families')
      .send({ name: '我的毛孩子' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('我的毛孩子');
  });

  it('参数校验：name 为空字符串，返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families')
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('家庭名称');
  });

  it('参数校验：name 为纯空格，返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families')
      .send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('家庭名称');
  });

  it('参数校验：缺少 name，返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('家庭名称');
  });

  it('name 前后空格自动 trim', async () => {
    const trimmedFamily = { ...mockFamily, name: '我的毛孩子' };
    mockPool.query.mockResolvedValueOnce({ rows: [trimmedFamily], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/families')
      .send({ name: '  我的毛孩子  ' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('我的毛孩子');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .post('/api/families')
      .send({ name: '我的毛孩子' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/families - 获取家庭列表', () => {
  it('正常获取家庭列表（含成员计数）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockFamilyWithMembers], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/families');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('我的毛孩子');
    expect(res.body.data[0].member_count).toBe('2');
  });

  it('无家庭时返回空数组', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/families');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('按 user_id 隔离数据', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await request(createApp()).get('/api/families');

    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('WHERE f.user_id');
    expect(params[0]).toBe('test-user-id');
  });
});

describe('GET /api/families/:id - 获取家庭详情', () => {
  it('正常获取家庭详情（含成员列表）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockFamily], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockMember], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/families/family-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('我的毛孩子');
    expect(res.body.data.members).toBeInstanceOf(Array);
    expect(res.body.data.members).toHaveLength(1);
    expect(res.body.data.members[0].pet_name).toBe('小旺');
  });

  it('家庭不存在，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/families/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('家庭不存在');
  });

  it('按 user_id 隔离（横向越权防护）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/families/other-family');

    expect(res.status).toBe(404);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('AND user_id');
    expect(params[1]).toBe('test-user-id');
  });
});

describe('PUT /api/families/:id - 更新家庭', () => {
  it('正常更新家庭名称', async () => {
    const updatedFamily = { ...mockFamily, name: '新家庭名' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'family-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [updatedFamily], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/families/family-001')
      .send({ name: '新家庭名' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('新家庭名');
  });

  it('家庭不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/api/families/other-family')
      .send({ name: '新家庭名' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('无权操作此家庭');
  });

  it('没有需要更新的字段，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'family-001' }], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/families/family-001')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('没有需要更新的字段');
  });
});

describe('DELETE /api/families/:id - 删除家庭', () => {
  it('正常删除家庭', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'family-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .delete('/api/families/family-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('家庭已删除');
  });

  it('家庭不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .delete('/api/families/other-family');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('无权操作此家庭');
  });
});

describe('POST /api/families/:id/members - 添加成员', () => {
  it('正常添加家庭成员', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'family-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [mockMember], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/families/family-001/members')
      .send({ pet_id: 'pet-001', role: 'member' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pet_id).toBe('pet-001');
  });

  it('参数校验：缺少 pet_id，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'family-001' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/families/family-001/members')
      .send({ role: 'member' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('宠物ID');
  });

  it('宠物不属于当前用户，返回 403', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'family-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/families/family-001/members')
      .send({ pet_id: 'other-pet', role: 'member' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('只能添加自己的宠物');
  });

  it('宠物已在家庭中，返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'family-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'existing' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/families/family-001/members')
      .send({ pet_id: 'pet-001', role: 'member' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('该宠物已在家庭中');
  });

  it('家庭不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/families/other-family/members')
      .send({ pet_id: 'pet-001', role: 'member' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('无权操作此家庭');
  });
});

describe('DELETE /api/families/:id/members/:petId - 移除成员', () => {
  it('正常移除成员', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'family-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockMember], rowCount: 1 });

    const res = await request(createApp())
      .delete('/api/families/family-001/members/pet-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('成员已移除');
  });

  it('成员不存在，返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'family-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .delete('/api/families/family-001/members/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('成员不存在');
  });

  it('家庭不属于当前用户，返回 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .delete('/api/families/other-family/members/pet-001');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('无权操作此家庭');
  });
});