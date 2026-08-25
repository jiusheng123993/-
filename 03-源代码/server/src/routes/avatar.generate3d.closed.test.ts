/**
 * 3D 模型功能关闭回归锁（2026-08-22《功能分级与竞品分析》决定：上线首版关闭 3D）
 *
 * 决定背景：需求未验证 + Meshy ~1-3 元/个烧钱；关闭机制 = 配额归零（MEMBER_3D_MONTHLY_LIMIT = 0）+ 前端隐藏入口。
 * 本测试锁两件事：
 *   1. 即使是会员，POST /generate-3d 也必须被 403 FEATURE_DISABLED 拦截（不建任务、不调 Meshy）；
 *   2. /quota 对会员返回 generation3D.limit === 0（前端 canGen3D 契约依据）。
 * 需求验证后恢复：把 avatar.ts 的 MEMBER_3D_MONTHLY_LIMIT 改回正数 + ImageGallery show3DEntry 传 true，本测试同步改断言。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ---- mock avatar.ts 的外部依赖（不触真实 DB / Meshy） ----
const { mockCanAccess, mockGetTask, mockCreateTask, mockCountMonthlyCompleted, mockGenerate3D } = vi.hoisted(() => ({
  mockCanAccess: vi.fn().mockResolvedValue(true),
  mockGetTask: vi.fn().mockResolvedValue({ id: 'task-2d-1', taskType: '2d', status: 'completed' }),
  mockCreateTask: vi.fn(),
  mockCountMonthlyCompleted: vi.fn().mockResolvedValue(0),
  mockGenerate3D: vi.fn(),
}));

vi.mock('../db.js', () => ({ pool: { query: vi.fn() } }));

vi.mock('../config.js', () => ({
  config: {
    seedream: { apiKey: 'test-key' },
    meshy: { apiKey: 'test-meshy-key' },
    supabase: { url: '', serviceKey: '' },
  },
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { userId?: string }).userId = 'test-user';
    next();
  },
}));

vi.mock('../repositories/petRepository.js', () => ({
  PetRepository: class {
    canAccess = mockCanAccess;
  },
}));

// 会员（active 且不过期）：证明"关闭后连会员也生成不了"
vi.mock('../repositories/membershipRepository.js', () => ({
  MembershipRepository: class {
    findTierAndStatus = vi.fn().mockResolvedValue({ tier: 'member', status: 'active', expires_at: null });
  },
}));

vi.mock('../repositories/avatarTaskRepository.js', () => ({
  AvatarTaskRepository: class {
    countMonthlyCompleted = mockCountMonthlyCompleted;
    createTask = vi.fn();
  },
}));

vi.mock('../services/taskQueue.js', () => ({
  createTask: mockCreateTask,
  getTask: mockGetTask,
  getLatestTaskByPet: vi.fn(),
}));

vi.mock('../services/avatarService.js', () => ({
  generatePetImage: vi.fn(),
  generatePetImageOptions: vi.fn(),
  generateBackgroundSwap: vi.fn(),
  cleanCustomBackground: vi.fn(),
  extractPetAppearance: vi.fn(),
  AVATAR_STYLE_OPTIONS: [{ key: 'q', label: 'Q版萌系' }],
  EXPRESSION_PROMPTS: {},
  AVATAR_BACKGROUND_PROMPTS: {},
}));

vi.mock('../services/petPrompt.js', () => ({ translatePetNames: vi.fn(s => s) }));
vi.mock('../services/photoUploadService.js', () => ({ uploadPetPhoto: vi.fn() }));
vi.mock('../services/image2DService.js', () => ({ generate2DAvatarPack: vi.fn() }));
vi.mock('../services/model3DService.js', () => ({ generate3DModel: mockGenerate3D }));

import router from './avatar.js';

const app = express();
app.use(express.json());
app.use('/api/avatars', router);

describe('3D 模型功能关闭回归锁（2026-08-22 决定：上线首版关闭）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认桩保持有效（clearAllMocks 会清掉实现，逐项重置）
    mockCanAccess.mockResolvedValue(true);
    mockGetTask.mockResolvedValue({ id: 'task-2d-1', taskType: '2d', status: 'completed' });
    mockCountMonthlyCompleted.mockResolvedValue(0);
  });

  it('会员调用 generate-3d 应被 403 FEATURE_DISABLED 拦截且不创建任务', async () => {
    const res = await request(app)
      .post('/api/avatars/generate-3d')
      .send({ petId: 'pet-1', image2DTaskId: 'task-2d-1' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FEATURE_DISABLED');
    expect(res.body.message).toContain('暂未开放');
    // 关键：不落任务、不触发 Meshy 调用（烧钱入口必须封死）
    expect(mockCreateTask).not.toHaveBeenCalled();
    expect(mockGenerate3D).not.toHaveBeenCalled();
  });

  it('/quota 应向会员返回 generation3D.limit === 0（前端隐藏入口的契约依据）', async () => {
    const res = await request(app).get('/api/avatars/quota');

    expect(res.status).toBe(200);
    expect(res.body.data.isMember).toBe(true);
    expect(res.body.data.generation3D.limit).toBe(0);
  });
});
