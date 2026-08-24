/**
 * 形象库接口集成测试（avatar.ts 的 /library 三个路由）
 * 覆盖：保存（参数校验/归属校验）、查询、删除（归属校验）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ---- mock 所有 avatar.ts 的外部依赖（避免真实 DB/外部服务） ----
const { mockFindByIdAndUser, mockLibrarySave, mockLibraryFind, mockLibraryDelete, mockGenerateOptions, mockExtractAppearance, mockCreateGeneration, mockMarkCompleted } = vi.hoisted(() => ({
  mockFindByIdAndUser: vi.fn(),
  mockLibrarySave: vi.fn(),
  mockLibraryFind: vi.fn(),
  mockLibraryDelete: vi.fn(),
  mockGenerateOptions: vi.fn().mockResolvedValue([{ style: 'q', label: 'Q版萌系', url: 'https://cdn.example.com/q.png', sheetUrl: 'https://cdn.example.com/q-sheet.png' }]),
  mockExtractAppearance: vi.fn().mockResolvedValue('橘色虎斑英短，橙底深棕条纹，额头M纹，圆脸，琥珀色大眼睛，粉色鼻头'),
  mockCreateGeneration: vi.fn().mockResolvedValue({ id: 'gen-1' }),
  mockMarkCompleted: vi.fn().mockResolvedValue({}),
}));

vi.mock('../db.js', () => ({ pool: { query: vi.fn() } }));
vi.mock('../config.js', () => ({
  config: {
    seedream: { apiKey: 'test-key' },
    meshy: { apiKey: '' },
    supabase: { url: '', serviceKey: '' },
  },
}));
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (_req as express.Request & { userId?: string }).userId = 'test-user';
    next();
  },
}));
vi.mock('../repositories/petRepository.js', () => ({
  PetRepository: class {
    findByIdAndUser = mockFindByIdAndUser;
    canAccess = mockFindByIdAndUser;
  },
}));
vi.mock('../repositories/membershipRepository.js', () => ({
  MembershipRepository: class {
    findTierAndStatus = vi.fn().mockResolvedValue({ tier: 'member', status: 'active' });
  },
}));
vi.mock('../repositories/avatarRepository.js', () => ({
  AvatarGenerationRepository: class {
    createGeneration = mockCreateGeneration;
    markCompleted = mockMarkCompleted;
    markFailed = vi.fn();
    countMonthlyOptionsByUser = vi.fn().mockResolvedValue(0);
  },
  Avatar2DImageRepository: class {},
  Avatar3DModelRepository: class {},
  AvatarLibraryRepository: class {
    save = mockLibrarySave;
    findByPet = mockLibraryFind;
    delete = mockLibraryDelete;
  },
}));
vi.mock('../repositories/avatarTaskRepository.js', () => ({
  AvatarTaskRepository: class {},
}));
vi.mock('../services/avatarService.js', () => ({
  generatePetImage: vi.fn(),
  generatePetImageOptions: mockGenerateOptions,
  extractPetAppearance: mockExtractAppearance,
  AVATAR_STYLE_OPTIONS: [
    { key: 'q', label: 'Q版萌系' },
    { key: 'japanese', label: '日系治愈' },
    { key: 'american', label: '美式卡通' },
    { key: 'watercolor', label: '水彩手绘' },
    { key: 'clay', label: '黏土萌宠' },
  ],
  EXPRESSION_PROMPTS: { happy: '开心的表情' },
}));
vi.mock('../services/photoUploadService.js', () => ({ uploadPetPhoto: vi.fn() }));
vi.mock('../services/taskQueue.js', () => ({
  createTask: vi.fn(),
  getTask: vi.fn(),
  getLatestTaskByPet: vi.fn(),
  updateTaskProgress: vi.fn(),
  updateTaskStatus: vi.fn(),
  updateTaskResult: vi.fn(),
}));
vi.mock('../services/image2DService.js', () => ({ generate2DAvatarPack: vi.fn() }));
vi.mock('../services/model3DService.js', () => ({ generate3DModel: vi.fn() }));

import avatarRouter from './avatar.js';

function createApp() {
  const app = express();
  // trust proxy：让 generateLimiter 按 X-Forwarded-For 分桶，避免新增用例挤爆同 IP 5 次/分窗口
  app.set('trust proxy', true);
  app.use(express.json());
  app.use('/api/avatar', avatarRouter);
  return app;
}

const ownedPet = { id: 'pet-1', species: 'cat', breed: '英短', gender: '', user_id: 'test-user' };

describe('POST /api/avatar/generate-options — 文字生成自动提取外貌', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindByIdAndUser.mockResolvedValue({
      id: 'pet-1',
      species: 'cat',
      breed: '英短',
      gender: '',
      avatar_photo_url: 'https://e.com/photo.jpg',
    });
    mockGenerateOptions.mockResolvedValue([{ style: 'q', label: 'Q版萌系', url: 'https://cdn.example.com/q.png', sheetUrl: 'https://cdn.example.com/q-sheet.png' }]);
  });

  it('配额标签（审查修复）：文字流（无参考图）style 必含 -text-，不计照片月额度', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/generate-options')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({ petId: 'pet-1', style: 'cartoon', styleKey: 'q' });
    expect(res.status).toBe(200);
    expect(mockCreateGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ style: expect.stringContaining('-text-') }),
    );
    expect(mockCreateGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ style: expect.not.stringContaining('-photo') }),
    );
  });

  it('配额标签（审查修复）：照片流（带参考图）即使传 styleKey 也记 -photo（堵图生图绕月限）', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/generate-options')
      .set('X-Forwarded-For', '203.0.113.11')
      .send({ petId: 'pet-1', style: 'cartoon', styleKey: 'q', referenceImageUrl: 'https://e.com/photo.jpg' });
    expect(res.status).toBe(200);
    expect(mockCreateGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ style: expect.stringMatching(/-photo$/) }),
    );
    // 一次运行只记 1 次 + markCompleted 取头像 URL（options[0].url；generationId 由路由生成）
    expect(mockCreateGeneration).toHaveBeenCalledTimes(1);
    expect(mockMarkCompleted).toHaveBeenCalledWith(expect.any(String), 'https://cdn.example.com/q.png');
  });

  it('描述为空且有真实照片时，自动提取外貌并拼进生成', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/generate-options')
      .send({ petId: 'pet-1', style: 'cartoon', styleKey: 'q', expression: 'happy' });
    expect(res.status).toBe(200);
    expect(mockExtractAppearance).toHaveBeenCalledWith('https://e.com/photo.jpg');
    expect(mockGenerateOptions).toHaveBeenCalledWith(
      expect.objectContaining({ description: '橘色虎斑英短，橙底深棕条纹，额头M纹，圆脸，琥珀色大眼睛，粉色鼻头' }),
    );
  });

  it('用户已写描述时不再自动提取（用户描述优先）', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/generate-options')
      .send({ petId: 'pet-1', style: 'cartoon', styleKey: 'q', description: '用户自己写的详细描述' });
    expect(res.status).toBe(200);
    expect(mockExtractAppearance).not.toHaveBeenCalled();
    expect(mockGenerateOptions).toHaveBeenCalledWith(
      expect.objectContaining({ description: '用户自己写的详细描述' }),
    );
  });

  it('无照片时跳过自动提取（不调用视觉，回退档案描述）', async () => {
    mockFindByIdAndUser.mockResolvedValue({ id: 'pet-1', species: 'cat', breed: '英短', gender: '', avatar_photo_url: null });
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/generate-options')
      .send({ petId: 'pet-1', style: 'cartoon', styleKey: 'q' });
    expect(res.status).toBe(200);
    expect(mockExtractAppearance).not.toHaveBeenCalled();
  });

  it('视觉提取失败时降级（不影响生成）', async () => {
    mockExtractAppearance.mockRejectedValue(new Error('vision down'));
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/generate-options')
      .send({ petId: 'pet-1', style: 'cartoon', styleKey: 'q' });
    expect(res.status).toBe(200);
    expect(mockGenerateOptions).toHaveBeenCalled();
  });
});

describe('POST /api/avatar/library — 保存形象到形象库', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindByIdAndUser.mockResolvedValue(ownedPet);
    mockLibrarySave.mockResolvedValue({ id: 'lib-1' });
  });

  it('正常保存（style 白名单内 + http URL）返回 id', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/library')
      .send({ petId: 'pet-1', style: 'q', expression: 'happy', imageUrl: 'https://cdn.example.com/a.png' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(mockLibrarySave).toHaveBeenCalledWith(
      expect.objectContaining({ petId: 'pet-1', userId: 'test-user', style: 'q', expression: 'happy' }),
    );
  });

  it('style 不在白名单应返回 400', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/library')
      .send({ petId: 'pet-1', style: 'evil_style', imageUrl: 'https://cdn.example.com/a.png' });
    expect(res.status).toBe(400);
    expect(mockLibrarySave).not.toHaveBeenCalled();
  });

  it('expression 不在白名单时存 null（不拒绝，防脏数据破坏筛选）', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/library')
      .send({ petId: 'pet-1', style: 'q', expression: '<script>alert(1)</script>', imageUrl: 'https://cdn.example.com/a.png' });
    expect(res.status).toBe(200);
    expect(mockLibrarySave).toHaveBeenCalledWith(
      expect.objectContaining({ style: 'q', expression: null }),
    );
  });

  it('viewType=multiview 存为设定图类型；非法 viewType 归为 headshot（迁移 030）', async () => {
    const app = createApp();
    // 合法：全方位角色设定图
    await request(app)
      .post('/api/avatar/library')
      .send({ petId: 'pet-1', style: 'q', imageUrl: 'https://cdn.example.com/sheet.png', viewType: 'multiview' });
    expect(mockLibrarySave).toHaveBeenLastCalledWith(
      expect.objectContaining({ imageUrl: 'https://cdn.example.com/sheet.png', viewType: 'multiview' }),
    );
    // 非法：归为 headshot 缺省，不拒绝（兼容旧版本调用方不传 viewType）
    await request(app)
      .post('/api/avatar/library')
      .send({ petId: 'pet-1', style: 'q', imageUrl: 'https://cdn.example.com/a.png', viewType: 'evil_type' });
    expect(mockLibrarySave).toHaveBeenLastCalledWith(
      expect.objectContaining({ viewType: 'headshot' }),
    );
  });

  it('imageUrl 非 http(s) 应返回 400（防存脏数据）', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/library')
      .send({ petId: 'pet-1', style: 'q', imageUrl: 'file:///etc/passwd' });
    expect(res.status).toBe(400);
    expect(mockLibrarySave).not.toHaveBeenCalled();
  });

  it('宠物不存在或无权访问应返回 404', async () => {
    mockFindByIdAndUser.mockResolvedValue(null);
    const app = createApp();
    const res = await request(app)
      .post('/api/avatar/library')
      .send({ petId: 'pet-999', style: 'q', imageUrl: 'https://cdn.example.com/a.png' });
    expect(res.status).toBe(404);
    expect(mockLibrarySave).not.toHaveBeenCalled();
  });
});

describe('GET /api/avatar/library — 查询形象库', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindByIdAndUser.mockResolvedValue(ownedPet);
    mockLibraryFind.mockResolvedValue([
      { id: 'lib-1', pet_id: 'pet-1', user_id: 'test-user', style: 'q', expression: 'happy', image_url: 'https://cdn.example.com/a.png', created_at: '2026-08-24T00:00:00.000Z' },
    ]);
  });

  it('正常查询返回形象列表（时间倒序）', async () => {
    const app = createApp();
    const res = await request(app).get('/api/avatar/library?petId=pet-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].style).toBe('q');
  });

  it('缺少 petId 应返回 400', async () => {
    const app = createApp();
    const res = await request(app).get('/api/avatar/library');
    expect(res.status).toBe(400);
  });

  it('宠物不存在应返回 404', async () => {
    mockFindByIdAndUser.mockResolvedValue(null);
    const app = createApp();
    const res = await request(app).get('/api/avatar/library?petId=pet-999');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/avatar/library/:id — 删除形象', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正常删除返回 success', async () => {
    mockLibraryDelete.mockResolvedValue(true);
    const app = createApp();
    const res = await request(app).delete('/api/avatar/library/lib-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockLibraryDelete).toHaveBeenCalledWith('lib-1', 'test-user');
  });

  it('不存在或非本人应返回 404', async () => {
    mockLibraryDelete.mockResolvedValue(false);
    const app = createApp();
    const res = await request(app).delete('/api/avatar/library/lib-999');
    expect(res.status).toBe(404);
  });
});
