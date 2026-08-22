/**
 * AI 服务层 - 封装对 OpenAI 兼容协议（默认为火山方舟 Ark）与阿里云百炼 API 的调用
 * 提供文本对话、安全内容检测、语音识别、多模态识别能力
 */
import { config } from '../config.js';

/** AI 多模态消息内容块（文本或图片） */
export interface ChatMessageContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

/** AI 对话消息 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatMessageContentPart[];
}

/** AI 对话选项 */
export interface ChatOptions {
  temperature?: number;
  max_tokens?: number;
  /**
   * DeepSeek V4 思考模式开关（默认不传=模型默认思考开启）
   * 分镜生成等"要完整 JSON 正文"的场景应传 'disabled'，
   * 否则 max_tokens 会被 reasoning_content 吃掉，content 为空/截断。
   */
  thinking?: 'enabled' | 'disabled';
  /**
   * 请求超时（毫秒），默认 30s。
   * 长输出调用方（如回忆录分镜）可按需调大；超时抛 AbortError，由调用方决定降级策略。
   */
  timeoutMs?: number;
}

/** 输入安全检测结果 */
export interface GuardResult {
  isHarmful: boolean;
  score: number;
  isCrisis: boolean;
}

/** 输出安全检测结果（医疗建议检查） */
export interface GuardOutputResult {
  isUnsafeMedicalAdvice: boolean;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

function getApiKey(): string {
  return config.ai.apiKey || '';
}

/** 返回已配置的模型服务地址（config 已保证非空兜底为火山方舟默认值） */
function getBaseUrl(): string {
  return config.ai.baseUrl || '';
}

/** 返回已配置的模型名（config 已保证非空兜底为 deepseek-v4-flash-ga-260731） */
function getModel(): string {
  return config.ai.model || '';
}

/**
 * AI 对话 - 调用 OpenAI 兼容文本对话接口
 * @param messages - 对话消息列表
 * @param options - 对话参数（温度、最大 token 数）
 * @returns AI 回复文本
 */
export async function chat(
  messages: ChatMessage[],
  options?: ChatOptions,
): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return 'AI 服务暂未配置，请联系管理员设置 ARK_API_KEY（或兼容的 AI_API_KEY）环境变量。';
  }

  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.max_tokens ?? 1024;

  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      temperature,
      max_tokens: maxTokens,
      // DeepSeek V4 思考模式控制（OpenAI 兼容格式）；不传则用模型默认（思考开启）
      ...(options?.thinking ? { thinking: { type: options.thinking } } : {}),
    }),
    // 请求超时（默认 30s）：LLM 调用不允许无限挂起（超时抛 AbortError，由调用方决定降级策略）
    signal: AbortSignal.timeout(options?.timeoutMs ?? 30_000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  return data.choices[0].message.content;
}

/**
 * 输入安全检测 - 判断用户输入是否包含有害意图
 * @param text - 用户输入文本
 * @returns 安全检测结果
 */
export async function guardCheck(text: string): Promise<GuardResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return { isHarmful: false, score: 0, isCrisis: false };
  }

  const guardPrompt =
    '你是一个安全检测助手。请分析以下用户输入是否包含有害意图（0-10分）以及是否处于情绪危机状态。只回复JSON格式：{"score":<0-10>,"isCrisis":<true/false>}';

  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        { role: 'system', content: guardPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    return { isHarmful: false, score: 0, isCrisis: false };
  }

  const data = (await response.json()) as ChatCompletionResponse;
  try {
    const parsed = JSON.parse(data.choices[0].message.content);
    return {
      isHarmful: (parsed.score as number) >= 5,
      score: parsed.score as number,
      isCrisis: parsed.isCrisis as boolean,
    };
  } catch {
    return { isHarmful: false, score: 0, isCrisis: false };
  }
}

/**
 * 输出安全检测 - 检查 AI 回复是否包含不安全的医疗建议
 * fail-closed 语义：opts.failClosed=true 时，检测服务不可用/解析失败一律视为不安全（宁可拦截，不可放行）
 * @param text - AI 回复文本
 * @param opts - 选项（failClosed：服务异常时是否按"不安全"处理，默认 false=放行，保持旧行为）
 * @returns 输出安全检测结果
 */
export async function guardCheckOutput(
  text: string,
  opts?: { failClosed?: boolean },
): Promise<GuardOutputResult> {
  const apiKey = getApiKey();
  const failClosed = opts?.failClosed ?? false;
  // 检测失败/无密钥/解析失败时的默认结果：fail-closed 则拦截，否则放行（向后兼容）
  const block = (): GuardOutputResult => ({ isUnsafeMedicalAdvice: failClosed });

  if (!apiKey) {
    return block();
  }

  const prompt =
    '你是一个安全检测助手。请分析以下AI回答是否包含不安全的医疗建议（如推荐具体药物、处方、替代兽医诊断等）。只回复JSON格式：{"isUnsafeMedicalAdvice":<true/false>}';

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getModel(),
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text },
        ],
        temperature: 0,
        max_tokens: 50,
      }),
      // 15s 超时：安全检测不允许挂起
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    // 网络异常/超时：按 fail-closed 语义返回
    return block();
  }

  if (!response.ok) {
    return block();
  }

  // response.json() 本身可能抛（非法 JSON），一并纳入 try 按 fail-closed 语义兜底
  let data: ChatCompletionResponse;
  try {
    data = (await response.json()) as ChatCompletionResponse;
    const parsed = JSON.parse(data.choices[0].message.content);
    return { isUnsafeMedicalAdvice: parsed.isUnsafeMedicalAdvice as boolean };
  } catch {
    return block();
  }
}

// ========== 阿里云百炼 API（多模态：视觉 + 语音） ==========

function getBailianApiKey(): string {
  return config.bailian.apiKey || '';
}

function getBailianBaseUrl(): string {
  return config.bailian.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
}

function getBailianVisionModel(): string {
  return config.bailian.visionModel || 'qwen3.6-plus';
}

/**
 * 调用百炼大模型（兼容 OpenAI 格式）- 支持多模态输入
 * @param messages - 对话消息列表（支持文本和图片）
 * @param options - 对话参数
 * @returns AI 回复文本
 */
export async function bailianChat(
  messages: ChatMessage[],
  options?: ChatOptions & { model?: string },
): Promise<string> {
  const apiKey = getBailianApiKey();

  if (!apiKey) {
    return '百炼 AI 服务暂未配置，请联系管理员设置 BAILIAN_API_KEY 环境变量。';
  }

  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.max_tokens ?? 1024;
  const model = options?.model || getBailianVisionModel();

  const response = await fetch(`${getBailianBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`百炼 API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  return data.choices[0].message.content;
}

/**
 * 百炼语音识别（Fun-ASR）- 将音频转为文字
 * @param audioBase64 - Base64 编码的音频数据
 * @param mimeType - 音频 MIME 类型
 * @returns 转写文本
 */
export async function bailianASR(audioBase64: string, mimeType: string): Promise<string> {
  const apiKey = getBailianApiKey();

  if (!apiKey) {
    throw new Error('百炼 AI 服务暂未配置');
  }

  // 将 base64 转为 Buffer
  const audioBuffer = Buffer.from(audioBase64, 'base64');

  // 构建 FormData
  const formData = new FormData();
  formData.append('model', 'fun-asr');
  formData.append('file', new Blob([audioBuffer], { type: mimeType }), `audio.${mimeType.split('/')[1] || 'mp3'}`);

  // 使用 DashScope 原生 API（非 OpenAI 兼容格式）
  const dashscopeBase = getBailianBaseUrl().replace('/compatible-mode/v1', '');
  const response = await fetch(`${dashscopeBase}/api/v1/services/audio/asr/transcription`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`百炼 ASR error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    output?: { text?: string };
    text?: string;
  };

  return data.output?.text || data.text || '';
}
