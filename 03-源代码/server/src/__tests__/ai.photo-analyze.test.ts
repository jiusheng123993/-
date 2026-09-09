/**
 * POST /api/ai/photo-analyze 聊天「发图片」视觉分析集成测试
 * 覆盖：
 *   1. 上传照片成功 → 返回视觉描述（mock analyzeImage）
 *   2. 未上传照片 → 400
 *   3. 视觉 key 未配置（analyzeImage 返回 null）→ 503 降级
 *
 * Mock 策略（对齐 timeline.test.ts）：
 *   - 配置：vi.mock('../config.js')
 *   - 认证：vi.mock('../middleware/auth.js')，注入固定 userId
 *   - 限流：vi.mock('../middleware/rateLimit.js')，替换为透传中间件
 *   - 视觉：vi.mock('../services/visionService.js')，返回固定描述
 *   - 仓库：vi.mock('../repositories/*.js')，避免真实 DB（photo-analyze 未用 pet 校验，但路由 import 了它们）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockAnalyzeImage } = vi.hoisted(() => ({
  mockAnalyzeImage: vi.fn(),
}));

vi.mock('../config.js', () => ({
  config: {
    jwtSecret: 'test-jwt-secret',
    port: 3000,
    databaseUrl: 'postgresql://localhost/test',
    ai: { apiKey: '', baseUrl: '', model: '' },
    bailian: { apiKey: '', baseUrl: '', visionModel: '', asrModel: '' },
    seedream: { apiKey: '' },
    seedance: { apiKey: '', model: '' },
    meshy: { apiKey: '', baseUrl: '' },
    moderate: { apiKey: '' },
    wechat: { appId: 'test-appid', secret: '' },
    wechatPay: {
      mock: true,
      mchId: '',
      apiV3Key: '',
      privateKey: '',
      certSerialNo: '',
      platformCertSerialNo: '',
      platformCert: '',
      notifyUrl: '',
    },
    uploadDir: './uploads',
    publicBaseUrl: '',
    allowedOrigins: [],
    qualityCheck: { apiKey: '', baseUrl: '', model: '' },
  },
}));

// 限流中间件替换为透传：测试不受 express-rate-limit 计数干扰
vi.mock('../middleware/rateLimit.js', () => ({
  chatLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  uploadLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  aiRecognizeLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  namingLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    _req.userId = 'test-user-id';
    next();
  },
}));

// 视觉服务：mock analyzeImage 返回值（photo-analyze 复用 visionService.analyzeImage）
vi.mock('../services/visionService.js', () => ({
  analyzeImage: mockAnalyzeImage,
  extractJsonFromText: vi.fn(),
}));

vi.mock('../repositories/petRepository.js', () => ({
  PetRepository: class {
    canAccess = vi.fn().mockResolvedValue(true);
    findById = vi.fn();
    findFirstByUser = vi.fn().mockResolvedValue(null);
  },
}));

vi.mock('../repositories/petFactRepository.js', () => ({
  PetFactRepository: class {
    insertFact = vi.fn().mockResolvedValue(undefined);
  },
}));

import aiRouter from '../routes/ai.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiRouter);
  return app;
}

beforeEach(() => {
  mockAnalyzeImage.mockReset();
});

describe('POST /api/ai/photo-analyze - 聊天发图片视觉分析', () => {
  it('上传照片成功返回视觉描述', async () => {
    mockAnalyzeImage.mockResolvedValueOnce('这是一只橘猫，精神不错，毛发干净，正趴在窗台上晒太阳。');

    const res = await request(createApp())
      .post('/api/ai/photo-analyze')
      .attach('photo', Buffer.from('fake-image-bytes'), { filename: 'pet.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toContain('橘猫');
    expect(mockAnalyzeImage).toHaveBeenCalledTimes(1);
    // 确认入参把图片转成了 data URL、提示词是照片观察助手
    const callArg = mockAnalyzeImage.mock.calls[0][0];
    expect(callArg.imageUrl).toContain('data:image/jpeg;base64,');
    expect(callArg.prompt).toContain('照片');
  });

  it('未上传照片返回 400', async () => {
    const res = await request(createApp()).post('/api/ai/photo-analyze');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('请上传宠物照片');
  });

  it('视觉 key 未配置（analyzeImage 返回 null）时降级返回 503', async () => {
    mockAnalyzeImage.mockResolvedValueOnce(null);

    const res = await request(createApp())
      .post('/api/ai/photo-analyze')
      .attach('photo', Buffer.from('fake-image-bytes'), { filename: 'pet.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('无法分析照片');
  });

  it('analyzeImage 抛错时降级返回 500（统一文案，不泄漏内部信息）', async () => {
    mockAnalyzeImage.mockRejectedValueOnce(new Error('Vision API error: 500'));

    const res = await request(createApp())
      .post('/api/ai/photo-analyze')
      .attach('photo', Buffer.from('fake-image-bytes'), { filename: 'pet.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('照片分析失败，请重试');
    // 不泄漏内部堆栈 / 错误详情
    expect(res.body.message).not.toContain('Vision API');
  });
});
