/**
 * 排行榜与角色模块集成测试
 * 覆盖：排行榜查询、角色 CRUD
 * 重点验证：家庭归属校验、宠物家庭成员校验、角色唯一性约束、参数校验
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

import leaderboardRouter from '../routes/leaderboard.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/families', leaderboardRouter);
  return app;
}

const mockRoleRow = {
  id: 'role-001',
  pet_id: 'pet-001',
  family_id: 'fam-001',
  role_type: 'guardian',
  assignment: '家里最懂事的姐姐',
  created_at: '2026-07-30T00:00:00.000Z',
};

const mockPetInfo = {
  name: '小白',
  avatar_url: 'https://example.com/avatar.jpg',
};

const mockSnapshotRow = {
  id: 'snap-001',
  family_id: 'fam-001',
  period: 'weekly',
  rankings: [
    {
      rank: 1,
      pet_id: 'pet-001',
      pet_name: '小白',
      pet_avatar_url: 'https://example.com/avatar.jpg',
      score: 95,
      metrics: { checkin_count: 7, feed_count: 3, moment_count: 5, health_score: 90 },
      badges: ['七日打卡'],
    },
  ],
  computed_at: '2026-07-30T00:00:00.000Z',
};

beforeEach(() => {
  mockPool.query.mockReset();
});

// ===== GET /api/families/:id/leaderboard - 排行榜 =====
describe('GET /api/families/:id/leaderboard - 排行榜', () => {
  it('正常返回快照数据', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // family ownership
      .mockResolvedValueOnce({ rows: [mockSnapshotRow], rowCount: 1 });   // snapshot

    const res = await request(createApp())
      .get('/api/families/fam-001/leaderboard?period=weekly');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.period).toBe('weekly');
    expect(res.body.data.rankings).toHaveLength(1);
    expect(res.body.data.rankings[0].pet_name).toBe('小白');
    expect(res.body.data.rankings[0].score).toBe(95);
  });

  it('无快照返回空榜', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/families/fam-001/leaderboard?period=monthly');

    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe('monthly');
    expect(res.body.data.rankings).toHaveLength(0);
  });

  it('默认 period=weekly', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockSnapshotRow], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/families/fam-001/leaderboard');

    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe('weekly');
  });

  it('非法 period 返回 400', async () => {
    const res = await request(createApp())
      .get('/api/families/fam-001/leaderboard?period=invalid');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('家庭不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/families/fam-999/leaderboard');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('家庭不存在');
  });

  it('数据库异常返回 500', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/api/families/fam-001/leaderboard');

    expect(res.status).toBe(500);
  });
});

// ===== GET /api/families/:id/roles - 角色列表 =====
describe('GET /api/families/:id/roles - 角色列表', () => {
  it('正常返回角色列表 + 可用类型', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // family ownership
      .mockResolvedValueOnce({ rows: [mockRoleRow], rowCount: 1 })        // roles
      .mockResolvedValueOnce({ rows: [mockPetInfo], rowCount: 1 });       // pet info

    const res = await request(createApp())
      .get('/api/families/fam-001/roles');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roles).toHaveLength(1);
    expect(res.body.data.roles[0].pet_name).toBe('小白');
    expect(res.body.data.roles[0].role_label).toBe('守护者');
    expect(res.body.data.available_types).toHaveLength(8);
  });

  it('无角色返回空数组', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/families/fam-001/roles');

    expect(res.status).toBe(200);
    expect(res.body.data.roles).toHaveLength(0);
    expect(res.body.data.available_types).toHaveLength(8);
  });

  it('家庭不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/api/families/fam-999/roles');

    expect(res.status).toBe(404);
  });
});

// ===== POST /api/families/:id/roles - 分配角色 =====
describe('POST /api/families/:id/roles - 分配角色', () => {
  it('正常分配角色（返回 201）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // family ownership
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // pet ownership
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // pet in family
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 })      // not exists
      .mockResolvedValueOnce({ rows: [mockRoleRow], rowCount: 1 })        // insert
      .mockResolvedValueOnce({ rows: [mockPetInfo], rowCount: 1 });       // pet info for response

    const res = await request(createApp())
      .post('/api/families/fam-001/roles')
      .send({
        pet_id: 'pet-001',
        role_type: 'guardian',
        assignment: '家里最懂事的姐姐',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('role-001');
    expect(res.body.data.role_label).toBe('守护者');
  });

  it('缺少 pet_id 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/fam-001/roles')
      .send({ role_type: 'guardian', assignment: 'x' });

    expect(res.status).toBe(400);
  });

  it('非法 role_type 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/fam-001/roles')
      .send({ pet_id: 'pet-001', role_type: 'invalid', assignment: 'x' });

    expect(res.status).toBe(400);
  });

  it('缺少 assignment 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/fam-001/roles')
      .send({ pet_id: 'pet-001', role_type: 'guardian' });

    expect(res.status).toBe(400);
  });

  it('家庭不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/families/fam-999/roles')
      .send({ pet_id: 'pet-001', role_type: 'guardian', assignment: 'x' });

    expect(res.status).toBe(404);
  });

  it('宠物不属于用户返回 400', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // family OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                  // pet ownership fail

    const res = await request(createApp())
      .post('/api/families/fam-001/roles')
      .send({ pet_id: 'pet-999', role_type: 'guardian', assignment: 'x' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('不属于');
  });

  it('宠物不属于该家庭返回 400', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // pet ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                  // not member

    const res = await request(createApp())
      .post('/api/families/fam-001/roles')
      .send({ pet_id: 'pet-001', role_type: 'guardian', assignment: 'x' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('不属于');
  });

  it('角色已存在返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 }); // exists

    const res = await request(createApp())
      .post('/api/families/fam-001/roles')
      .send({ pet_id: 'pet-001', role_type: 'guardian', assignment: 'x' });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('已分配');
  });

  it('数据库异常返回 500', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 })
      .mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .post('/api/families/fam-001/roles')
      .send({ pet_id: 'pet-001', role_type: 'guardian', assignment: 'x' });

    expect(res.status).toBe(500);
  });
});

// ===== PUT /api/families/:id/roles/:roleId - 更新角色 =====
describe('PUT /api/families/:id/roles/:roleId - 更新角色', () => {
  it('更新 assignment 成功', async () => {
    const updated = { ...mockRoleRow, assignment: '新描述' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // family
      .mockResolvedValueOnce({ rows: [mockRoleRow], rowCount: 1 })        // existing
      .mockResolvedValueOnce({ rows: [updated], rowCount: 1 })            // update
      .mockResolvedValueOnce({ rows: [mockPetInfo], rowCount: 1 });       // pet info

    const res = await request(createApp())
      .put('/api/families/fam-001/roles/role-001')
      .send({ assignment: '新描述' });

    expect(res.status).toBe(200);
    expect(res.body.data.assignment).toBe('新描述');
  });

  it('更新 role_type 成功（无冲突）', async () => {
    const updated = { ...mockRoleRow, role_type: 'comedian' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockRoleRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 }) // no duplicate
      .mockResolvedValueOnce({ rows: [updated], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockPetInfo], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/families/fam-001/roles/role-001')
      .send({ role_type: 'comedian' });

    expect(res.status).toBe(200);
    expect(res.body.data.role_type).toBe('comedian');
    expect(res.body.data.role_label).toBe('开心果');
  });

  it('更新 role_type 与自身相同（不查重）', async () => {
    const updated = { ...mockRoleRow };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockRoleRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [updated], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockPetInfo], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/families/fam-001/roles/role-001')
      .send({ role_type: 'guardian' });

    expect(res.status).toBe(200);
  });

  it('更新 role_type 已被占用返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockRoleRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 }); // duplicate

    const res = await request(createApp())
      .put('/api/families/fam-001/roles/role-001')
      .send({ role_type: 'comedian' });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('已分配');
  });

  it('非法 role_type 返回 400', async () => {
    const res = await request(createApp())
      .put('/api/families/fam-001/roles/role-001')
      .send({ role_type: 'invalid' });

    expect(res.status).toBe(400);
  });

  it('角色不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/api/families/fam-001/roles/role-999')
      .send({ assignment: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('角色不存在');
  });

  it('家庭不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/api/families/fam-999/roles/role-001')
      .send({ assignment: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('家庭不存在');
  });
});

// ===== DELETE /api/families/:id/roles/:roleId - 删除角色 =====
describe('DELETE /api/families/:id/roles/:roleId - 删除角色', () => {
  it('正常删除', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // family
      .mockResolvedValueOnce({ rows: [mockRoleRow], rowCount: 1 })        // existing
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });                  // delete

    const res = await request(createApp())
      .delete('/api/families/fam-001/roles/role-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('角色已移除');
  });

  it('角色不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .delete('/api/families/fam-001/roles/role-999');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('角色不存在');
  });

  it('家庭不存在返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .delete('/api/families/fam-999/roles/role-001');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('家庭不存在');
  });

  it('数据库异常返回 500', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockRoleRow], rowCount: 1 })
      .mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .delete('/api/families/fam-001/roles/role-001');

    expect(res.status).toBe(500);
  });
});
