/**
 * 多成员共同养宠 - 权限矩阵专项测试（2026-08-24）
 * 覆盖：
 * 1. petRepository.canAccess：主人/家庭成员/非成员 判定 + SQL 含 UNION 家庭分支
 * 2. FamilyUserRepository：成员 CRUD + 角色判定
 * 3. 路由集成：家庭成员可给共享宠物打卡/查看历史；非成员 404
 * 安全红线：多用户共享后归属校验必须后端统一，本测试是权限回归的守门员
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

import { PetRepository } from '../repositories/petRepository.js';
import { FamilyUserRepository } from '../repositories/familyRepository.js';
import checkinsRouter from '../routes/checkins.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/pets', checkinsRouter);
  return app;
}

const petRepository = new PetRepository();
const familyUserRepository = new FamilyUserRepository();

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('petRepository.canAccess 宠物访问权（主人 OR 家庭成员）', () => {
  it('主人：pet_profiles.user_id 命中 → true', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    const result = await petRepository.canAccess('pet-001', 'user-owner');
    expect(result).toBe(true);
  });

  it('家庭成员：pet_family_members JOIN pet_family_users 命中 → true', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    const result = await petRepository.canAccess('pet-001', 'user-member');
    expect(result).toBe(true);
  });

  it('非成员且非主人 → false', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: false }], rowCount: 1 });
    const result = await petRepository.canAccess('pet-001', 'user-stranger');
    expect(result).toBe(false);
  });

  it('SQL 必须同时覆盖 主人 与 家庭成员 两个分支（防越权回归）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });
    await petRepository.canAccess('pet-001', 'user-001');
    const sql = mockPool.query.mock.calls[0][0] as string;
    expect(sql).toContain('pet_profiles');
    expect(sql).toContain('pet_family_members');
    expect(sql).toContain('pet_family_users');
    expect(sql).toContain('UNION');
  });
});

describe('FamilyUserRepository 家庭成员（人）CRUD', () => {
  it('addUser：INSERT 家庭-用户关联（默认 member 角色）', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'fu-1', family_id: 'fam-1', user_id: 'user-2', role: 'member' }],
      rowCount: 1,
    });
    const row = await familyUserRepository.addUser('fam-1', 'user-2');
    expect(row?.role).toBe('member');
    expect(mockPool.query.mock.calls[0][1]).toContain('fam-1');
    expect(mockPool.query.mock.calls[0][1]).toContain('user-2');
  });

  it('removeUser：DELETE 且返回是否命中', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const ok = await familyUserRepository.removeUser('fam-1', 'user-2');
    expect(ok).toBe(true);
    expect((mockPool.query.mock.calls[0][0] as string)).toContain('DELETE FROM pet_family_users');
  });

  it('isFamilyOwner：仅 role=owner 命中', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'fu-1' }], rowCount: 1 });
    const ok = await familyUserRepository.isFamilyOwner('fam-1', 'user-owner');
    expect(ok).toBe(true);
    const sql = mockPool.query.mock.calls[0][0] as string;
    const params = mockPool.query.mock.calls[0][1] as unknown[];
    expect(sql).toContain('role');
    expect(params).toContain('owner');
  });

  it('isFamilyUser：成员判定（owner 或 member 均可）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'fu-1' }], rowCount: 1 });
    const ok = await familyUserRepository.isFamilyUser('fam-1', 'user-member');
    expect(ok).toBe(true);
  });
});

describe('路由集成：共享宠物打卡权限', () => {
  const mockCheckin = {
    id: 'checkin-001',
    pet_id: 'pet-001',
    user_id: 'test-user-id',
    poop_level: 3,
    appetite_level: 4,
    spirit_level: 5,
    exercise_level: 4,
    weight: null,
    has_anomaly: false,
    anomaly_items: [],
    ai_feedback: null,
    risk_level: 'normal',
    note: null,
    created_at: '2026-07-25T08:00:00Z',
  };

  it('家庭成员（canAccess=true）：可给共享宠物打卡 → 201', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // canAccess
      .mockResolvedValueOnce({ rows: [mockCheckin], rowCount: 1 });    // createCheckin

    const res = await request(createApp())
      .post('/pets/pet-001/checkins')
      .send({ poop_level: 3, appetite_level: 4, spirit_level: 5, exercise_level: 4, risk_level: 'normal' });

    expect(res.status).toBe(201);
    expect(res.body.data.poopLevel).toBe(3);
  });

  it('非成员（canAccess=false）：打卡 → 404（不泄露宠物存在性）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ ok: false }], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/checkins')
      .send({ poop_level: 3, appetite_level: 4, spirit_level: 5, exercise_level: 4, risk_level: 'normal' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('家庭成员查看打卡历史：按宠物维度返回（含他人记录）', async () => {
    const otherMemberCheckin = { ...mockCheckin, id: 'checkin-002', user_id: 'user-member' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // canAccess
      .mockResolvedValueOnce({ rows: [mockCheckin, otherMemberCheckin], rowCount: 2 }); // findHistoryByDays

    const res = await request(createApp()).get('/pets/pet-001/checkins?days=7');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[1].userId).toBe('user-member'); // 家庭成员记录可见，可标注"谁记录的"
  });
});
