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
    jwtSecret: 'test-jwt-secret-for-integration-testing',
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

vi.mock('uuid', () => {
  let callCount = 0;
  return {
    v4: vi.fn(() => {
      callCount++;
      return `mock-uuid-${String(callCount).padStart(4, '0')}`;
    }),
  };
});

import petsRouter from '../routes/pets.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/pets', petsRouter);
  return app;
}

const mockPet = {
  id: 'pet-001',
  user_id: 'test-user-id',
  name: '小旺',
  species: 'dog',
  breed: '柯基',
  breed_id: 'corgi',
  gender: 'male',
  birth_date: '2023-01-01',
  weight: 12.5,
  avatar_photo_url: 'https://example.com/pet.jpg',
  avatar_cartoon_url: null,
  avatar_style: null,
  photos: [],
  is_neutered: false,
  microchip_id: '',
  notes: '',
  created_at: '2026-01-01T00:00:00Z',
};

const petBody = {
  name: '小旺',
  species: 'dog',
  breed: '柯基',
  breed_id: 'corgi',
  gender: 'male',
  birth_date: '2023-01-01',
  weight: 12.5,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /pets - 创建宠物', () => {
  it('正常创建宠物，返回 201', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockPet], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets')
      .send(petBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('小旺');
    expect(res.body.data.species).toBe('dog');
    expect(res.body.data.breed).toBe('柯基');
  });

  it('参数校验：缺少 name，返回 400', async () => {
    const { name, ...bodyWithoutName } = petBody;

    const res = await request(createApp())
      .post('/pets')
      .send(bodyWithoutName);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('name');
  });

  it('参数校验：缺少 species，返回 400', async () => {
    const { species, ...bodyWithoutSpecies } = petBody;

    const res = await request(createApp())
      .post('/pets')
      .send(bodyWithoutSpecies);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('species');
  });

  it('参数校验：缺少 breed，返回 400', async () => {
    const { breed, ...bodyWithoutBreed } = petBody;

    const res = await request(createApp())
      .post('/pets')
      .send(bodyWithoutBreed);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('breed');
  });

  it('创建宠物时可选字段使用默认值', async () => {
    const petWithDefaults = {
      ...mockPet,
      weight: 0,
      avatar_photo_url: null,
      avatar_cartoon_url: null,
      avatar_style: null,
      photos: [],
      is_neutered: false,
      microchip_id: '',
      notes: '',
    };
    mockPool.query.mockResolvedValueOnce({ rows: [petWithDefaults], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets')
      .send(petBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .post('/pets')
      .send(petBody);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /pets - 获取宠物列表', () => {
  it('正常获取宠物列表', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockPet], rowCount: 1 });

    const res = await request(createApp())
      .get('/pets');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('小旺');
  });

  it('空列表：用户没有宠物', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/pets');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('查询按 user_id 过滤，确保数据归属隔离', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await request(createApp()).get('/pets');

    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('WHERE user_id');
    expect(params[0]).toBe('test-user-id');
  });

  it('服务端错误：数据库异常，返回 500', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(createApp())
      .get('/pets');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /pets/:id - 获取宠物详情', () => {
  it('正常获取宠物详情', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockPet], rowCount: 1 });

    const res = await request(createApp())
      .get('/pets/pet-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('pet-001');
    expect(res.body.data.name).toBe('小旺');
  });

  it('宠物不存在，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/pets/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('查询他人宠物应返回 404（横向越权防护）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .get('/pets/other-user-pet');

    expect(res.status).toBe(404);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('AND user_id');
    expect(params[1]).toBe('test-user-id');
  });
});

describe('PUT /pets/:id - 更新宠物信息', () => {
  it('正常更新宠物信息', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ ...mockPet, name: '小旺2', weight: 15 }], rowCount: 1 });

    const res = await request(createApp())
      .put('/pets/pet-001')
      .send({ name: '小旺2', weight: 15 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('小旺2');
  });

  it('宠物不存在，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/pets/nonexistent')
      .send({ name: '新名字' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('没有需要更新的字段，返回 400', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'pet-001' }], rowCount: 1 });

    const res = await request(createApp())
      .put('/pets/pet-001')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('没有需要更新的字段');
  });

  it('更新时验证宠物归属（横向越权防护）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .put('/pets/other-user-pet')
      .send({ name: '新名字' });

    expect(res.status).toBe(404);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('AND user_id');
    expect(params[1]).toBe('test-user-id');
  });
});

describe('DELETE /pets/:id - 删除宠物', () => {
  it('正常删除宠物', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(createApp())
      .delete('/pets/pet-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('删除成功');
  });

  it('宠物不存在，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(createApp())
      .delete('/pets/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('删除时验证宠物归属（横向越权防护）', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

    await request(createApp()).delete('/pets/other-user-pet');

    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('AND user_id');
    expect(params[1]).toBe('test-user-id');
  });
});

describe('POST /pets/:id/deceased - 标记宠物离世', () => {
  it('正常标记宠物离世', async () => {
    const deceasedPet = { ...mockPet, is_deceased: true, deceased_date: '2026-07-25' };
    mockPool.query.mockResolvedValueOnce({ rows: [deceasedPet], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/deceased')
      .send({ deceased_date: '2026-07-25' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isDeceased).toBe(true);
  });

  it('不传日期时使用当天日期', async () => {
    const deceasedPet = { ...mockPet, is_deceased: true, deceased_date: '2026-07-25' };
    mockPool.query.mockResolvedValueOnce({ rows: [deceasedPet], rowCount: 1 });

    const res = await request(createApp())
      .post('/pets/pet-001/deceased')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('宠物不存在，返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/pets/nonexistent/deceased')
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });
});