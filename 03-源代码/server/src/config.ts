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
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/xinghechongji',
  jwtSecret: process.env.JWT_SECRET || '',
  ai: {
    // 火山方舟 DeepSeek-V4-Flash（GA 版）：与 DeepSeek 官方同款模型，换入口是为了
    // 微信「深度合成-AI问答」类目能签第三方合作协议；优先读 ARK_*，兼容旧 AI_*
    apiKey: process.env.ARK_API_KEY || process.env.AI_API_KEY || '',
    baseUrl: process.env.ARK_BASE_URL || process.env.AI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    model: process.env.ARK_MODEL || process.env.AI_MODEL || 'deepseek-v4-flash-ga-260731',
  },
  pushplus: {
    token: process.env.PUSHPLUS_TOKEN || '',
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
  seedance: {
    apiKey: process.env.SEEDANCE_API_KEY || '',
    model: process.env.SEEDANCE_MODEL || 'doubao-seedance-1-5-pro-251215',
  },
  meshy: {
    apiKey: process.env.MESHY_API_KEY || '',
    baseUrl: 'https://api.meshy.ai',
  },
  moderate: {
    apiKey: process.env.MODERATE_API_KEY || '',
  },
  wechatPay: {
    /** Mock 模式：true=本地开发模拟支付，不调真实微信 API；false=真实微信支付 V3 */
    mock: process.env.WECHAT_PAY_MOCK !== 'false',
    mchId: process.env.WECHAT_PAY_MCH_ID || '',
    apiV3Key: process.env.WECHAT_PAY_API_V3_KEY || '',
    privateKey: process.env.WECHAT_PAY_PRIVATE_KEY || '',
    certSerialNo: process.env.WECHAT_PAY_CERT_SERIAL_NO || '',
    platformCertSerialNo: process.env.WECHAT_PAY_PLATFORM_CERT_SERIAL_NO || '',
    platformCert: process.env.WECHAT_PAY_PLATFORM_CERT || '',
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || '',
  },
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  /** 对外可访问的服务基础地址（用于生成视频/图片的完整 URL），未配置时返回相对路径 */
  publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
  /** CORS 允许来源（逗号分隔）；未配置时默认允许所有来源（小程序端不受 CORS 限制） */
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
