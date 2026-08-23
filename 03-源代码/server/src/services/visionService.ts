/**
 * 统一视觉识别服务（回忆录 2.0 F8：Agent 识图能力底座）
 * 职责：图片 → DeepSeek 视觉模型（deepseek-v4-flash-vision-exp）→ 结构化文本/JSON
 *
 * 复用场景：
 * - 体检报告识别（指标提取）
 * - 品种识别（可切换，替代百炼 qwen）
 * - 未来一切"看图理解"能力
 *
 * 设计：
 * - 复用 config.qualityCheck（DeepSeek 视觉配置：baseUrl/model/apiKey）
 * - 关闭思考模式（thinking disabled）：保证 max_tokens 全部给正文，JSON 不截断
 * - 未配置 key 时降级返回 null（不抛错，由调用方处理）
 *
 * 安全：
 * - key 只从 config 读取，禁止硬编码/打印
 */
import { config } from '../config.js';

/** 视觉识别参数 */
export interface AnalyzeImageParams {
  /** 图片（http URL 或 data URL） */
  imageUrl: string;
  /** 系统提示词（要求输出什么格式，如"提取体检指标 JSON"） */
  prompt: string;
  /** 最大输出 token（默认 500） */
  maxTokens?: number;
}

/**
 * 图片 → 视觉模型文本
 * @param params - 识别参数
 * @returns 模型回复文本；未配置 key 返回 null（降级）
 * @throws 网络/API 错误时抛异常（由调用方决定降级策略）
 */
export async function analyzeImage(params: AnalyzeImageParams): Promise<string | null> {
  // 视觉识别必须用视觉模型（qualityCheck 组），不能回落主 AI key：
  // 主 AI 可能是火山方舟（ARK）或 v4-flash（无视觉），回落会跨厂商混配 401 或模型错误
  const apiKey = config.qualityCheck.apiKey;
  if (!apiKey) {
    console.warn('[Vision] 未配置视觉识别 key（QUALITY_CHECK_API_KEY），识别降级（不可回落主 AI key）');
    return null;
  }

  const response = await fetch(`${config.qualityCheck.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.qualityCheck.model,
      messages: [
        { role: 'system', content: params.prompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: '请识别这张图片并按要求输出。' },
            { type: 'image_url', image_url: { url: params.imageUrl } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: params.maxTokens ?? 500,
      // 关闭思考模式：保证 content 有完整正文（DeepSeek V4 默认思考会吃 token）
      thinking: { type: 'disabled' },
    }),
    // 视觉识别超时保护：30 秒无响应则中止（防请求悬挂占用连接）
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? null;
}

/**
 * 从视觉模型回复中提取 JSON（兼容 markdown 代码块包裹/前后杂音）
 * @param raw - 模型回复
 * @returns 解析后的对象；无 JSON 返回 null
 */
export function extractJsonFromText(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  // 优先剥离 ```json ... ``` 围栏（模型常见输出格式）
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
