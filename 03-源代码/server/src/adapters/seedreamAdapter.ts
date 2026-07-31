/**
 * Seedream AI 图像生成适配器
 * 封装对火山引擎 Seedream 文生图 API 的调用
 */
import { config } from '../config.js';

/** Seedream 图像生成请求参数 */
export interface SeedreamGenerateParams {
  prompt: string;
  size?: string;
  model?: string;
}

/** Seedream 图像生成结果 */
export interface SeedreamGenerateResult {
  url: string | null;
  error: string | null;
}

const DEFAULT_MODEL = 'doubao-seedream-4-0-250828';
const DEFAULT_SIZE = '1024x1024';
const API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

export async function generateImage(params: SeedreamGenerateParams): Promise<SeedreamGenerateResult> {
  const apiKey = config.seedream.apiKey;
  if (!apiKey) {
    return { url: null, error: 'SEEDREAM_API_KEY not configured' };
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: params.model || DEFAULT_MODEL,
        prompt: params.prompt,
        size: params.size || DEFAULT_SIZE,
        n: 1,
      }),
    });

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      return { url: null, error: `Seedream API error: ${response.status} ${statusText}` };
    }

    const data = (await response.json()) as { data: Array<{ url: string }> };
    if (data.data && data.data.length > 0 && data.data[0].url) {
      return { url: data.data[0].url, error: null };
    }

    return { url: null, error: 'Seedream API returned empty data' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { url: null, error: `Seedream API call failed: ${message}` };
  }
}

export function isConfigured(): boolean {
  return !!config.seedream.apiKey;
}
