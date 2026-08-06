/**
 * API 限流中间件配置
 * 按 TECH_DESIGN 6.0 节定义的 10 类接口限流规则
 * 使用 express-rate-limit，按 IP + 用户ID 维度限流
 */
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

/** 限流 key 生成器：IP + 用户ID（已登录时），使用 ipKeyGenerator 确保 IPv6 兼容 */
function keyGenerator(req: Request): string {
  const userId = req.userId || 'anonymous';
  return `${ipKeyGenerator(req.ip || '')}:${userId}`;
}

/** 通用限流：60次/分钟 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator,
  message: {
    success: false,
    code: '100003',
    message: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** 照片上传：10次/分钟 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator,
  message: {
    success: false,
    code: '100003',
    message: '上传过于频繁，请稍后再试',
  },
});

/** AI 算力类：5次/分钟（2D/3D形象生成） */
export const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator,
  message: {
    success: false,
    code: '100003',
    message: '生成请求过于频繁，请稍后再试',
  },
});

/** AI 对话：30次/分钟 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator,
  message: {
    success: false,
    code: '100003',
    message: '对话请求过于频繁，请稍后再试',
  },
});

/** 回忆录生成：3次/分钟 */
export const memoirLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator,
  message: {
    success: false,
    code: '100003',
    message: '视频生成请求过于频繁，请稍后再试',
  },
});

/** 取名引擎：10次/分钟 */
export const namingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator,
  message: {
    success: false,
    code: '100003',
    message: '请求过于频繁，请稍后再试',
  },
});

/** 症状初筛：10次/分钟 */
export const symptomLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator,
  message: {
    success: false,
    code: '100003',
    message: '请求过于频繁，请稍后再试',
  },
});

/** 数据同步：10次/分钟 */
export const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator,
  message: {
    success: false,
    code: '100003',
    message: '同步请求过于频繁，请稍后再试',
  },
});
