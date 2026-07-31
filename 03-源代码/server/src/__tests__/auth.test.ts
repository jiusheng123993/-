/**
 * 认证路由集成测试 - 登录/用户资料 CRUD
 * 覆盖：正常流程、参数校验、数据归属、错误处理
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  return { mockPool: pool };
});

vi.mock('../db.js', () => ({ pool: mockPool }));

// 使用空的微信配置，使 auth 路由使用 dev 模式（code = openid）
vi.mock('../config.js', () => ({
  config: {
    jwtSecret: 'test-jwt-secret-for-integration-testing',
    wechat: { appId: '', secret: '' },
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

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
    verify: vi.fn(() => ({ userId: 'test-user-id' })),
  },
  sign: vi.fn(() => 'mock-jwt-token'),
  verify: vi.fn(() => ({ userId: 'test-user-id' })),
}));

import authRouter from '../routes/auth.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  return app;
}

const mockUser = {
  id: 'test-user-id',
  openid: 'test-openid',
  nickname: '测试用户',
  avatar_url: 'https://example.com/avatar.png',
  created_at: '2026-01-01T00:00:00Z',
  last_active: '2026-07-25T00:00:00Z',
};

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('POST /auth/login', () => {
  it('正常登录：code 有效，用户已存在，返回 token 和用户信息', async () => {
    // 登录时用户已存在会调用两次 pool.query：SELECT + UPDATE last_active
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/auth/login')
      .send({ code: 'test-openid' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('mock-jwt-token');
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe('test-user-id');
  });

  it('正常登录：code 有效，用户不存在，自动创建新用户', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ ...mockUser, id: 'mock-uuid-1234' }], rowCount: 1 });

    const res = await request(createApp())
      .post('/auth/login')
      .send({ code: 'new-openid' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('mock-jwt-token');
    expect(res.body.data.user.id).toBe('mock-uuid-1234');
  });

  it('参数校验：缺少 code，返回 400', async () => {
    const res = await request(createApp())
      .post('/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('code');
  });

  it('参数校验：空对象 body，返回 400', async () => {
    const res = await request(createApp())
      .post('/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB connection error'));

    const res = await request(createApp())
      .post('/auth/login')
      .send({ code: 'test-code' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('服务器内部错误');
  });
});

describe('GET /auth/profile', () => {
  it('正常获取用户信息', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

    const res = await request(createApp())
      .get('/auth/profile');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('test-user-id');
    expect(res.body.data.nickname).toBe('测试用户');
  });

  it('用户不存在，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/auth/profile');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('用户不存在');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/auth/profile');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /auth/profile', () => {
  it('正常更新昵称', async () => {
    const updatedUser = { ...mockUser, nickname: '新昵称' };
    mockPool.query.mockResolvedValueOnce({ rows: [updatedUser], rowCount: 1 });

    const res = await request(createApp())
      .put('/auth/profile')
      .send({ nickname: '新昵称' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nickname).toBe('新昵称');
  });

  it('正常更新头像', async () => {
    const updatedUser = { ...mockUser, avatar_url: 'https://example.com/new-avatar.png' };
    mockPool.query.mockResolvedValueOnce({ rows: [updatedUser], rowCount: 1 });

    const res = await request(createApp())
      .put('/auth/profile')
      .send({ avatar_url: 'https://example.com/new-avatar.png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('同时更新昵称和头像', async () => {
    const updatedUser = {
      ...mockUser,
      nickname: '新昵称',
      avatar_url: 'https://example.com/new-avatar.png',
    };
    mockPool.query.mockResolvedValueOnce({ rows: [updatedUser], rowCount: 1 });

    const res = await request(createApp())
      .put('/auth/profile')
      .send({ nickname: '新昵称', avatar_url: 'https://example.com/new-avatar.png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nickname).toBe('新昵称');
    expect(res.body.data.avatarUrl).toBe('https://example.com/new-avatar.png');
  });

  it('用户不存在，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/auth/profile')
      .send({ nickname: '新昵称' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('用户不存在');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .put('/auth/profile')
      .send({ nickname: '新昵称' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});