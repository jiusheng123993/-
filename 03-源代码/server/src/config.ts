/**
 * 应用配置管理 - 集中管理所有环境变量和配置项
 * 从 .env 文件加载配置，提供统一的配置访问入口
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * 火山方舟 DeepSeek-V4-Flash（GA 版）默认入口
 * 与 DeepSeek 官方同款模型，换入口是为了微信「深度合成-AI问答」类目能签第三方合作协议。
 * 抽成常量供 config 与各 service 复用，避免默认字符串在多处重复维护导致不一致。
 */
const ARK_BASE_URL_DEFAULT = 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_MODEL_DEFAULT = 'deepseek-v4-flash-ga-260731';

/**
 * DeepSeek 官方默认入口（旧 AI_* 变量语义）。
 * 仅当完全没有 ARK_* 时才用到，保证 legacy 分支整组走 DeepSeek 官方，避免与 Ark 混配。
 */
const DEEPSEEK_BASE_URL_DEFAULT = 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL_DEFAULT = 'deepseek-chat';

/**
 * 读取环境变量并去除首尾空白（避免纯空格 key 被当成有效配置）
 * @param key - 环境变量名
 * @returns trim 后的值（无则空串）
 */
function env(key: string): string {
  return (process.env[key] || '').trim();
}

/**
 * 构建 AI 连接配置（成组选择，避免跨厂商混配）
 * 坑点：baseUrl/model/apiKey 必须来自同一套变量，否则会拼出「火山 key + DeepSeek 官方 URL +
 * 火山模型名」的非法组合，导致认证失败且不易排查。因此这里按整组解析：
 * - 检测到任一 ARK_* 存在 → 整组用 Ark 语义（缺项用火山默认兜底，绝不回落 AI_*）
 * - 完全没有任何 ARK_* → 整组用旧 AI_* 语义（缺项用 DeepSeek 官方默认兜底）
 * @returns { apiKey, baseUrl, model } 三者语义一致
 */
function buildAiConfig(): { apiKey: string; baseUrl: string; model: string } {
  const arkApiKey = env('ARK_API_KEY');
  const arkBaseUrl = env('ARK_BASE_URL');
  const arkModel = env('ARK_MODEL');
  const legacyApiKey = env('AI_API_KEY');
  const legacyBaseUrl = env('AI_BASE_URL');
  const legacyModel = env('AI_MODEL');

  // 只要配置了任一非空 ARK_* 就按“整组 Ark”解析
  const usingArk = Boolean(arkApiKey || arkBaseUrl || arkModel);
  return usingArk
    ? {
        apiKey: arkApiKey,
        baseUrl: arkBaseUrl || ARK_BASE_URL_DEFAULT,
        model: arkModel || ARK_MODEL_DEFAULT,
      }
    : {
        apiKey: legacyApiKey,
        baseUrl: legacyBaseUrl || DEEPSEEK_BASE_URL_DEFAULT,
        model: legacyModel || DEEPSEEK_MODEL_DEFAULT,
      };
}

/** 导出纯函数供单测覆盖 ARK/legacy/全空/空格 组合（不影响 config 构建行为） */
export { buildAiConfig };

/** 应用全局配置对象 */
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/xinghechongji',
  jwtSecret: process.env.JWT_SECRET || '',
  /** 知识图谱审核后台管理员令牌（Phase 3；未配置时管理接口一律 403，fail-closed；env() 已 trim 防尾随空格恒 403） */
  adminToken: env('ADMIN_TOKEN'),
  ai: buildAiConfig(),
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
  /** 回忆录旁白 TTS 配置（火山引擎豆包语音 Doubao Speech 2.0，回忆录 2.0 M3 模块） */
  doubaoSpeech: {
    /** 豆包语音新控制台 API Key（需在火山引擎控制台开通"语音技术/豆包语音"获取） */
    apiKey: process.env.DOUBAO_SPEECH_API_KEY || '',
    /** 资源 ID（豆包语音 2.0） */
    resourceId: process.env.DOUBAO_SPEECH_RESOURCE_ID || 'seed-tts-2.0',
    /** 默认音色（豆包语音 speaker ID） */
    voice: process.env.DOUBAO_SPEECH_VOICE || 'zh_female_vv_uranus_bigtts',
    /** 接口地址（异步合成：submit/query） */
    baseUrl: process.env.DOUBAO_SPEECH_BASE_URL || 'https://openspeech.bytedance.com/api/v3/tts',
  },
  /** 回忆录视频质量质检配置（DeepSeek 视觉模型，M5 模块） */
  qualityCheck: {
    /** 质检 API Key（缺省复用主 AI key；可单独配置） */
    apiKey: process.env.QUALITY_CHECK_API_KEY || '',
    /** 质检模型服务地址（默认 DeepSeek 官方 vision-exp） */
    baseUrl: process.env.QUALITY_CHECK_BASE_URL || 'https://api.deepseek.com/v1',
    /** 质检视觉模型（默认 DeepSeek 最新视觉模型） */
    model: process.env.QUALITY_CHECK_MODEL || 'deepseek-v4-flash-vision-exp',
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

// ===== AI 连接配置启动校验 =====
// 检测到 ARK_* 被部分配置（最常见的部署遗漏：只配了 key 忘了配另外两项）时，
// 尽早打警告日志提醒，避免线上 AI 请求静默失败。密钥本身不打印，仅打印缺失的变量名。
{
  const arkKeys = ['ARK_API_KEY', 'ARK_BASE_URL', 'ARK_MODEL'] as const;
  const anyArkSet = arkKeys.some((k) => (process.env[k] || '').trim() !== '');
  if (anyArkSet) {
    const missing = arkKeys.filter((k) => (process.env[k] || '').trim() === '');
    if (missing.length > 0) {
      console.warn(`[config] 已检测到 ARK_* 配置但以下项缺失，将使用火山方舟默认值兜底：${missing.join(', ')}`);
    }
    if (!config.ai.apiKey) {
      console.warn('[config] ARK_API_KEY 未配置，AI 对话/记忆/Agent 将无法调用（各 service 会返回占位或空）。');
    }
  } else if (config.ai.apiKey) {
    // 完全没配 ARK_* 但配了旧 AI_*：兼容旧部署，仅提示建议迁移到 ARK_*
    console.warn('[config] 当前使用旧 AI_API_KEY 语义，建议迁移到 ARK_API_KEY/ARK_BASE_URL/ARK_MODEL。');
  }
}
