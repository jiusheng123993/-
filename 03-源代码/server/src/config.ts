/**
 * 应用配置管理 - 集中管理所有环境变量和配置项
 * 从 .env 文件加载配置，提供统一的配置访问入口
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/** 应用全局配置对象 */
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/xinghuanhai',
  jwtSecret: process.env.JWT_SECRET || '',
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL || 'https://api.deepseek.com/v1',
    model: process.env.AI_MODEL || 'deepseek-chat',
  },
  bailian: {
    apiKey: process.env.BAILIAN_API_KEY || '',
    baseUrl: process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    visionModel: process.env.BAILIAN_VISION_MODEL || 'qwen3.6-plus',
    asrModel: process.env.BAILIAN_ASR_MODEL || 'fun-asr',
  },
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },
  seedream: {
    apiKey: process.env.SEEDREAM_API_KEY || '',
  },
  meshy: {
    apiKey: process.env.MESHY_API_KEY || '',
    baseUrl: 'https://api.meshy.ai',
  },
  moderate: {
    apiKey: process.env.MODERATE_API_KEY || '',
  },
  uploadDir: process.env.UPLOAD_DIR || './uploads',
};
