/**
 * 多成员共同养宠 - 家庭成员（人）关系接口测试（2026-08-24）
 * 覆盖：关系列表（成员可读）、创建关系（仅 owner，双方须为成员、不能自指、防重复）、删除关系（仅 owner）
 * 安全红线：关系管理仅 owner；非 owner/非成员 403；删除需归属校验（familyId 匹配）
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
    // 固定当前用户：作为家庭 owner 使用（非 owner 场景由 mock 查询返回空控制）
    _req.userId = 'test-owner-id';
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

describe('GET /:id/user-relations - 关系列表', () => {
  it('家庭成员可读 → 200 返回关系列表（JOIN 双方昵称头像）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'fu-1' }], rowCount: 1 }) // isFamilyUser
      .mockResolvedValueOnce({ // listRelations
        rows: [{
          id: 'rel-1', family_id: 'fam-1',
          user_id_a: 'u-a', user_id_b: 'u-b', relation_type: 'couple',
          created_at: '2026-08-24T00:00:00Z',
          nickname_a: '小明', avatar_url_a: null, nickname_b: '小红', avatar_url_b: null,
        }],
        rowCount: 1,
      });

    const res = await request(createApp()).get('/api/families/fam-1/user-relations');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].relationType).toBe('couple');
    expect(res.body.data[0].nicknameA).toBe('小明');
    expect(res.body.data[0].nicknameB).toBe('小红');
  });

  it('非成员 → 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // isFamilyUser false

    const res = await request(createApp()).get('/api/families/fam-1/user-relations');

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('无权');
  });
});

describe('POST /:id/user-relations - 创建关系（仅 owner）', () => {
  it('owner 且双方为成员 → 201 返回关系', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'fu-owner' }], rowCount: 1 })   // isFamilyOwner true
      .mockResolvedValueOnce({ rows: [{ id: 'fu-a' }], rowCount: 1 })       // isFamilyUser(a)
      .mockResolvedValueOnce({ rows: [{ id: 'fu-b' }], rowCount: 1 })       // isFamilyUser(b)
      .mockResolvedValueOnce({ // createRelation 成功
        rows: [{ id: 'rel-1', family_id: 'fam-1', user_id_a: 'u-a', user_id_b: 'u-b', relation_type: 'father_daughter', created_at: '2026-08-24T00:00:00Z' }],
        rowCount: 1,
      });

    const res = await request(createApp())
      .post('/api/families/fam-1/user-relations')
      .send({ userIdA: 'u-a', userIdB: 'u-b', relationType: 'father_daughter' });

    expect(res.status).toBe(201);
    expect(res.body.data.relationType).toBe('father_daughter');
  });

  it('非 owner → 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // isFamilyOwner false

    const res = await request(createApp())
      .post('/api/families/fam-1/user-relations')
      .send({ userIdA: 'u-a', userIdB: 'u-b', relationType: 'couple' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('仅家庭创建者');
  });

  it('自己对自己 → 400', async () => {
    const res = await request(createApp())
      .post('/api/families/fam-1/user-relations')
      .send({ userIdA: 'test-owner-id', userIdB: 'test-owner-id', relationType: 'couple' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('不能给自己设置关系');
  });

  it('对方不是家庭成员 → 400', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'fu-owner' }], rowCount: 1 }) // isFamilyOwner true
      .mockResolvedValueOnce({ rows: [{ id: 'fu-a' }], rowCount: 1 })     // isFamilyUser(a) true
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                  // isFamilyUser(b) false

    const res = await request(createApp())
      .post('/api/families/fam-1/user-relations')
      .send({ userIdA: 'u-a', userIdB: 'u-b', relationType: 'couple' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('必须是家庭成员');
  });

  it('两人之间已存在关系 → 409', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'fu-owner' }], rowCount: 1 }) // isFamilyOwner true
      .mockResolvedValueOnce({ rows: [{ id: 'fu-a' }], rowCount: 1 })     // isFamilyUser(a)
      .mockResolvedValueOnce({ rows: [{ id: 'fu-b' }], rowCount: 1 })     // isFamilyUser(b)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                  // createRelation 冲突 DO NOTHING 返回空

    const res = await request(createApp())
      .post('/api/families/fam-1/user-relations')
      .send({ userIdA: 'u-a', userIdB: 'u-b', relationType: 'siblings' });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('已存在关系');
  });

  it('关系类型不合法 → 400（zod 枚举校验）', async () => {
    const res = await request(createApp())
      .post('/api/families/fam-1/user-relations')
      .send({ userIdA: 'u-a', userIdB: 'u-b', relationType: 'husband' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /:id/user-relations/:relationId - 删除关系（仅 owner）', () => {
  it('owner 删除成功 → 200', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'fu-owner' }], rowCount: 1 }) // isFamilyOwner true
      .mockResolvedValueOnce({ rows: [{ id: 'rel-1' }], rowCount: 1 });   // removeRelation 成功

    const res = await request(createApp()).delete('/api/families/fam-1/user-relations/rel-1');

    expect(res.status).toBe(200);
  });

  it('非 owner → 403', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // isFamilyOwner false

    const res = await request(createApp()).delete('/api/families/fam-1/user-relations/rel-1');

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('仅家庭创建者');
  });

  it('关系不存在或不属于该家庭 → 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'fu-owner' }], rowCount: 1 }) // isFamilyOwner true
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                  // removeRelation 无匹配（归属校验拦截）

    const res = await request(createApp()).delete('/api/families/fam-1/user-relations/rel-x');

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('关系不存在');
  });
});
