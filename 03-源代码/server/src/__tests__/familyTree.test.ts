/**
 * 家族图谱模块集成测试
 * 覆盖：图谱查询、关系管理（创建/更新/删除）、血缘管理（含防循环）、快照管理
 * 重点验证：家庭归属校验、宠物归属校验、关系唯一性、血缘防循环、参数校验
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

import familyTreeRouter from '../routes/familyTree.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/families', familyTreeRouter);
  return app;
}

/** 模拟归属校验通过的结果（SELECT 1 FROM ... 返回） */
const ownershipOk = { rows: [{ '?column?': 1 }], rowCount: 1 };

/** 模拟归属校验失败的结果 */
const ownershipFail = { rows: [], rowCount: 0 };

/** 模拟关系记录 */
const mockRelationship = {
  id: 'rel-001',
  family_id: 'family-001',
  pet_id_a: 'pet-001',
  pet_id_b: 'pet-002',
  relation_type: 'friend',
  direction: 'mutual',
  label_a: '朋友A',
  label_b: '朋友B',
  created_at: '2026-07-30T00:00:00.000Z',
};

/** 模拟血缘记录 */
const mockLineage = {
  id: 'lineage-001',
  family_id: 'family-001',
  parent_id: 'pet-001',
  child_id: 'pet-002',
  litter_date: '2026-01-01',
  created_at: '2026-07-30T00:00:00.000Z',
};

/** 模拟快照记录（pg JSONB 自动解析为对象） */
const mockSnapshot = {
  id: 'snapshot-001',
  family_id: 'family-001',
  layout_type: 'tree',
  graph_data: { nodes: [], edges: [] },
  thumbnail_url: 'https://example.com/thumb.png',
  created_at: '2026-07-30T00:00:00.000Z',
};

beforeEach(() => {
  // mockReset 清除 mock 队列（含 mockResolvedValueOnce 残留），避免测试间污染
  mockPool.query.mockReset();
});

// ===== GET /api/families/:id/tree - 获取家族图谱 =====
describe('GET /api/families/:id/tree - 获取家族图谱', () => {
  it('正常返回图谱（nodes + edges）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk) // verifyFamilyOwnership
      .mockResolvedValueOnce({                                            // membersSql
        rows: [{
          pet_id: 'pet-001',
          name: '小旺',
          species: '狗',
          avatar_url: 'https://example.com/avatar.jpg',
          role_type: 'parent',
          assignment: '家长',
        }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({                                            // relationshipRepository.findByFamilyId
        rows: [mockRelationship],
        rowCount: 1,
      });

    const res = await request(createApp())
      .get('/api/families/family-001/tree');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nodes).toBeInstanceOf(Array);
    expect(res.body.data.nodes).toHaveLength(1);
    expect(res.body.data.nodes[0].pet_id).toBe('pet-001');
    expect(res.body.data.nodes[0].role).toBe('家长');
    expect(res.body.data.edges).toBeInstanceOf(Array);
    expect(res.body.data.edges).toHaveLength(1);
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .get('/api/families/family-001/tree');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('数据库异常返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/api/families/family-001/tree');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ===== POST /api/families/:id/relationships - 创建宠物关系 =====
describe('POST /api/families/:id/relationships - 创建宠物关系', () => {
  it('正常创建关系（返回 201）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)   // verifyFamilyOwnership
      .mockResolvedValueOnce(ownershipOk)   // verifyPetOwnership(pet_id_a)
      .mockResolvedValueOnce(ownershipOk)   // verifyPetOwnership(pet_id_b)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // findExisting (not found)
      .mockResolvedValueOnce({ rows: [mockRelationship], rowCount: 1 }); // insert

    const res = await request(createApp())
      .post('/api/families/family-001/relationships')
      .send({
        pet_id_a: 'pet-001',
        pet_id_b: 'pet-002',
        relation_type: 'friend',
        direction: 'mutual',
        label_a: '朋友A',
        label_b: '朋友B',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('rel-001');
    expect(res.body.data.relation_type).toBe('friend');
  });

  it('relation_type 无效返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/relationships')
      .send({
        pet_id_a: 'pet-001',
        pet_id_b: 'pet-002',
        relation_type: 'invalid_type',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('relation_type');
  });

  it('pet_id_a 和 pet_id_b 相同返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/relationships')
      .send({
        pet_id_a: 'pet-001',
        pet_id_b: 'pet-001',
        relation_type: 'friend',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不能相同');
  });

  it('缺少 pet_id_a 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/relationships')
      .send({
        pet_id_b: 'pet-002',
        relation_type: 'friend',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .post('/api/families/family-001/relationships')
      .send({
        pet_id_a: 'pet-001',
        pet_id_b: 'pet-002',
        relation_type: 'friend',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('宠物不属于当前用户返回 403', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)    // verifyFamilyOwnership OK
      .mockResolvedValueOnce(ownershipOk)    // verifyPetOwnership(pet_id_a) OK
      .mockResolvedValueOnce(ownershipFail); // verifyPetOwnership(pet_id_b) fails

    const res = await request(createApp())
      .post('/api/families/family-001/relationships')
      .send({
        pet_id_a: 'pet-001',
        pet_id_b: 'other-pet',
        relation_type: 'friend',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('宠物');
  });

  it('关系已存在返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                       // verifyFamilyOwnership
      .mockResolvedValueOnce(ownershipOk)                       // verifyPetOwnership(pet_id_a)
      .mockResolvedValueOnce(ownershipOk)                       // verifyPetOwnership(pet_id_b)
      .mockResolvedValueOnce({ rows: [mockRelationship], rowCount: 1 }); // findExisting (exists)

    const res = await request(createApp())
      .post('/api/families/family-001/relationships')
      .send({
        pet_id_a: 'pet-001',
        pet_id_b: 'pet-002',
        relation_type: 'friend',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('已存在');
  });

  it('支持全部 relation_type 枚举值', async () => {
    const types = ['friend', 'rival', 'companion', 'parent_child', 'sibling', 'mate', 'other'];
    for (const relationType of types) {
      mockPool.query.mockReset();
      mockPool.query
        .mockResolvedValueOnce(ownershipOk)
        .mockResolvedValueOnce(ownershipOk)
        .mockResolvedValueOnce(ownershipOk)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ ...mockRelationship, relation_type: relationType }], rowCount: 1 });

      const res = await request(createApp())
        .post('/api/families/family-001/relationships')
        .send({
          pet_id_a: 'pet-001',
          pet_id_b: 'pet-002',
          relation_type: relationType,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    }
  });
});

// ===== PUT /api/families/:id/relationships/:relId - 更新关系 =====
describe('PUT /api/families/:id/relationships/:relId - 更新关系', () => {
  it('正常更新关系', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                                    // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockRelationship], rowCount: 1 })      // findByIdAndFamily
      .mockResolvedValueOnce({ rows: [{ ...mockRelationship, label_a: '新标签' }], rowCount: 1 }); // updateById

    const res = await request(createApp())
      .put('/api/families/family-001/relationships/rel-001')
      .send({ label_a: '新标签' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.label_a).toBe('新标签');
  });

  it('同时更新 label_a 和 label_b', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [mockRelationship], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ ...mockRelationship, label_a: 'A', label_b: 'B' }], rowCount: 1 });

    const res = await request(createApp())
      .put('/api/families/family-001/relationships/rel-001')
      .send({ label_a: 'A', label_b: 'B' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('没有需要更新的字段返回 400', async () => {
    const res = await request(createApp())
      .put('/api/families/family-001/relationships/rel-001')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('更新');
  });

  it('关系不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                  // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });   // findByIdAndFamily (not found)

    const res = await request(createApp())
      .put('/api/families/family-001/relationships/nonexistent')
      .send({ label_a: '新标签' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不存在');
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .put('/api/families/family-001/relationships/rel-001')
      .send({ label_a: '新标签' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });
});

// ===== DELETE /api/families/:id/relationships/:relId - 删除关系 =====
describe('DELETE /api/families/:id/relationships/:relId - 删除关系', () => {
  it('正常删除关系', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                                // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockRelationship], rowCount: 1 })  // findByIdAndFamily
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });                 // deleteById

    const res = await request(createApp())
      .delete('/api/families/family-001/relationships/rel-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('删除');
  });

  it('关系不存在返回 404', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                  // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });   // findByIdAndFamily (not found)

    const res = await request(createApp())
      .delete('/api/families/family-001/relationships/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不存在');
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .delete('/api/families/family-001/relationships/rel-001');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });
});

// ===== POST /api/families/:id/lineage - 添加血缘关系 =====
describe('POST /api/families/:id/lineage - 添加血缘关系', () => {
  it('正常创建血缘关系（返回 201）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)   // verifyFamilyOwnership
      .mockResolvedValueOnce(ownershipOk)   // verifyPetOwnership(parent_id)
      .mockResolvedValueOnce(ownershipOk)   // verifyPetOwnership(child_id)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                       // findExisting (not found)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                       // findAncestors 第1层（无祖先）
      .mockResolvedValueOnce({ rows: [mockLineage], rowCount: 1 });           // insert

    const res = await request(createApp())
      .post('/api/families/family-001/lineage')
      .send({
        parent_id: 'pet-001',
        child_id: 'pet-002',
        litter_date: '2026-01-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('lineage-001');
    expect(res.body.data.parent_id).toBe('pet-001');
  });

  it('parent_id 和 child_id 相同返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/lineage')
      .send({
        parent_id: 'pet-001',
        child_id: 'pet-001',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('不能相同');
  });

  it('缺少 parent_id 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/lineage')
      .send({
        child_id: 'pet-002',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .post('/api/families/family-001/lineage')
      .send({
        parent_id: 'pet-001',
        child_id: 'pet-002',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('宠物不属于当前用户返回 403', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)    // verifyFamilyOwnership OK
      .mockResolvedValueOnce(ownershipOk)    // verifyPetOwnership(parent_id) OK
      .mockResolvedValueOnce(ownershipFail); // verifyPetOwnership(child_id) fails

    const res = await request(createApp())
      .post('/api/families/family-001/lineage')
      .send({
        parent_id: 'pet-001',
        child_id: 'other-pet',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('宠物');
  });

  it('血缘已存在返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                              // verifyFamilyOwnership
      .mockResolvedValueOnce(ownershipOk)                              // verifyPetOwnership(parent_id)
      .mockResolvedValueOnce(ownershipOk)                              // verifyPetOwnership(child_id)
      .mockResolvedValueOnce({ rows: [mockLineage], rowCount: 1 });    // findExisting (exists)

    const res = await request(createApp())
      .post('/api/families/family-001/lineage')
      .send({
        parent_id: 'pet-001',
        child_id: 'pet-002',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('已存在');
  });

  it('循环血缘返回 400（parent 是 child 的祖先）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)   // verifyFamilyOwnership
      .mockResolvedValueOnce(ownershipOk)   // verifyPetOwnership(parent_id)
      .mockResolvedValueOnce(ownershipOk)   // verifyPetOwnership(child_id)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                       // findExisting (not found)
      .mockResolvedValueOnce({ rows: [{ parent_id: 'pet-001' }], rowCount: 1 }) // findAncestors 第1层：child 的祖先是 pet-001（即 parent_id）
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                      // findAncestors 第2层：pet-001 无祖先，循环结束

    const res = await request(createApp())
      .post('/api/families/family-001/lineage')
      .send({
        parent_id: 'pet-001',
        child_id: 'pet-002',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('循环');
  });
});

// ===== GET /api/families/:id/lineage/:petId - 获取血亲树 =====
describe('GET /api/families/:id/lineage/:petId - 获取血亲树', () => {
  it('正常返回血亲树（pet + parents + children + siblings + mates）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)   // verifyFamilyOwnership
      .mockResolvedValueOnce(ownershipOk)   // verifyPetOwnership
      .mockResolvedValueOnce({                                              // pet info (pool.query)
        rows: [{
          id: 'pet-001',
          name: '小旺',
          species: '狗',
          avatar_url: 'https://example.com/avatar.jpg',
        }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })   // findParents
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })   // findChildren
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })   // findSiblings
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });  // findMatesByPetId

    const res = await request(createApp())
      .get('/api/families/family-001/lineage/pet-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pet.id).toBe('pet-001');
    expect(res.body.data.pet.name).toBe('小旺');
    expect(res.body.data.parents).toBeInstanceOf(Array);
    expect(res.body.data.children).toBeInstanceOf(Array);
    expect(res.body.data.siblings).toBeInstanceOf(Array);
    expect(res.body.data.mates).toBeInstanceOf(Array);
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .get('/api/families/family-001/lineage/pet-001');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('宠物不属于当前用户返回 403', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)    // verifyFamilyOwnership OK
      .mockResolvedValueOnce(ownershipFail); // verifyPetOwnership fails

    const res = await request(createApp())
      .get('/api/families/family-001/lineage/other-pet');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('宠物');
  });
});

// ===== POST /api/families/:id/tree/snapshot - 保存图谱快照 =====
describe('POST /api/families/:id/tree/snapshot - 保存图谱快照', () => {
  it('正常创建快照（返回 201）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)   // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockSnapshot], rowCount: 1 }); // insert

    const res = await request(createApp())
      .post('/api/families/family-001/tree/snapshot')
      .send({
        layout_type: 'tree',
        graph_data: { nodes: [], edges: [] },
        thumbnail_url: 'https://example.com/thumb.png',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('snapshot-001');
    expect(res.body.data.layout_type).toBe('tree');
  });

  it('layout_type 无效返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/tree/snapshot')
      .send({
        layout_type: 'invalid_layout',
        graph_data: { nodes: [] },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('layout_type');
  });

  it('缺少 graph_data 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/tree/snapshot')
      .send({
        layout_type: 'tree',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('thumbnail_url 非 URL 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/families/family-001/tree/snapshot')
      .send({
        layout_type: 'tree',
        graph_data: { nodes: [] },
        thumbnail_url: 'not-a-url',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .post('/api/families/family-001/tree/snapshot')
      .send({
        layout_type: 'tree',
        graph_data: { nodes: [] },
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('支持全部 layout_type 枚举值', async () => {
    const types = ['tree', 'radial', 'force', 'manual'];
    for (const layoutType of types) {
      mockPool.query.mockReset();
      mockPool.query
        .mockResolvedValueOnce(ownershipOk)
        .mockResolvedValueOnce({ rows: [{ ...mockSnapshot, layout_type: layoutType }], rowCount: 1 });

      const res = await request(createApp())
        .post('/api/families/family-001/tree/snapshot')
        .send({
          layout_type: layoutType,
          graph_data: { nodes: [] },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    }
  });
});

// ===== GET /api/families/:id/tree/snapshots - 获取快照列表 =====
describe('GET /api/families/:id/tree/snapshots - 获取快照列表', () => {
  it('正常返回快照列表（含分页信息）', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                                    // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [mockSnapshot], rowCount: 1 })         // findByFamilyId
      .mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });        // countByFamilyId

    const res = await request(createApp())
      .get('/api/families/family-001/tree/snapshots');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.page_size).toBe(20);
  });

  it('默认分页 page=1, page_size=20', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/families/family-001/tree/snapshots');

    expect(res.body.data.page).toBe(1);
    expect(res.body.data.page_size).toBe(20);
  });

  it('分页参数正确传递', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    await request(createApp())
      .get('/api/families/family-001/tree/snapshots?page=2&page_size=5');

    // 验证列表查询 SQL 包含 LIMIT 和 OFFSET
    const findCall = mockPool.query.mock.calls[1];
    expect(findCall[0]).toContain('LIMIT');
    expect(findCall[0]).toContain('OFFSET');
    // page=2, page_size=5 → offset=(2-1)*5=5, limit=5
    expect(findCall[1]).toContain(5);
  });

  it('page_size 超过 100 时返回 400', async () => {
    const res = await request(createApp())
      .get('/api/families/family-001/tree/snapshots?page_size=101');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('page 小于 1 时返回 400', async () => {
    const res = await request(createApp())
      .get('/api/families/family-001/tree/snapshots?page=0');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('家庭不属于当前用户返回 403', async () => {
    mockPool.query.mockResolvedValueOnce(ownershipFail); // verifyFamilyOwnership fails

    const res = await request(createApp())
      .get('/api/families/family-001/tree/snapshots');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无权');
  });

  it('无快照返回空数组', async () => {
    mockPool.query
      .mockResolvedValueOnce(ownershipOk)                // verifyFamilyOwnership
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // findByFamilyId (empty)
      .mockResolvedValueOnce({ rows: [{ count: 0 }], rowCount: 1 });

    const res = await request(createApp())
      .get('/api/families/family-001/tree/snapshots');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });
});
