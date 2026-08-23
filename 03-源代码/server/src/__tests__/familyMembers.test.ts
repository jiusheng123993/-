/**
 * 多成员共同养宠 - 家庭成员管理接口测试（2026-08-24）
 * 覆盖：生成邀请码（owner）、凭码加入、成员列表、移除成员（owner）
 * 安全红线：邀请/移除仅 owner；非 owner/非成员 403
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
  },
}));
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    _req.userId = 'test-user-id';
    next();
  },
}));

import familiesRouter from '../routes/families.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/families', familiesRouter);
  return app;
}

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('生成家庭邀请码（仅 owner）', () => {
  it('owner 生成邀请码 → 201 返回 code', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'fu-1' }], rowCount: 1 })           // isFamilyOwner
      .mockResolvedValueOnce({ rows: [{ id: 'inv-1', family_id: 'fam-1', code: 'ABCDEF', expires_at: '2026-08-31T00:00:00Z' }], rowCount: 1 }); // createInvite

    const res = await request(createApp()).post('/api/families/fam-1/invites');

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBeTruthy();
  });

  it('非 owner 生成邀请码 → 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // isFamilyOwner false

    const res = await request(createApp()).post('/api/families/fam-1/invites');

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('仅家庭创建者');
  });
});

describe('凭邀请码加入家庭', () => {
  it('有效邀请码 → 加入成功返回 familyId', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'inv-1', family_id: 'fam-1', code: 'ABCDEF' }], rowCount: 1 }) // findValidByCode
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                                                    // isFamilyUser（非成员）
      .mockResolvedValueOnce({ rows: [{ id: 'fu-2', family_id: 'fam-1', user_id: 'test-user-id', role: 'member' }], rowCount: 1 }) // addUser
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });                                                  // markUsed

    const res = await request(createApp()).post('/api/families/join').send({ code: 'ABCDEF' });

    expect(res.status).toBe(200);
    expect(res.body.data.familyId).toBe('fam-1');
  });

  it('无效/过期邀请码 → 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // findValidByCode 无结果

    const res = await request(createApp()).post('/api/families/join').send({ code: 'XXXXXX' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('无效或已过期');
  });

  it('缺少邀请码 → 400（zod 校验）', async () => {
    const res = await request(createApp()).post('/api/families/join').send({});

    expect(res.status).toBe(400);
  });
});

describe('家庭成员列表', () => {
  it('家庭成员可读 → 200 返回成员', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'fu-1' }], rowCount: 1 }) // isFamilyUser
      .mockResolvedValueOnce({
        rows: [
          { id: 'fu-1', family_id: 'fam-1', user_id: 'u-owner', role: 'owner', nickname: '主人', avatar_url: '' },
          { id: 'fu-2', family_id: 'fam-1', user_id: 'u-member', role: 'member', nickname: '家人', avatar_url: '' },
        ],
        rowCount: 2,
      }); // findUsersByFamilyId

    const res = await request(createApp()).get('/api/families/fam-1/users');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].role).toBe('owner');
  });

  it('非成员 → 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp()).get('/api/families/fam-1/users');

    expect(res.status).toBe(403);
  });
});

describe('移除家庭成员（仅 owner）', () => {
  it('owner 移除成员 → 200', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'fu-1' }], rowCount: 1 }) // isFamilyOwner
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });               // removeUser

    const res = await request(createApp()).delete('/api/families/fam-1/users/u-member');

    expect(res.status).toBe(200);
  });

  it('非 owner 移除 → 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp()).delete('/api/families/fam-1/users/u-member');

    expect(res.status).toBe(403);
  });

  it('owner 不能移除自己 → 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'fu-1' }], rowCount: 1 }); // isFamilyOwner（自己是 owner）

    const res = await request(createApp()).delete('/api/families/fam-1/users/test-user-id');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('不能移除自己');
  });
});
