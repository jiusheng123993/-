/**
 * 统一视觉识别服务测试（F8）
 * 覆盖：
 *   1. analyzeImage：正常识别 / 无 key 降级 / HTTP 错误 / 关闭思考模式参数
 *   2. extractJsonFromText：JSON 提取（markdown 包裹/杂音/无 JSON）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// mock config（质检/视觉配置）
vi.mock('../config.js', () => ({
  config: {
    ai: { apiKey: 'ai-key' },
    qualityCheck: { apiKey: 'qc-key', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-v4-flash-vision-exp' },
  },
}));

import { analyzeImage, extractJsonFromText } from './visionService.js';

describe('visionService 统一视觉识别', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('extractJsonFromText', () => {
    it('纯 JSON 提取', () => {
      const result = extractJsonFromText('{"metrics":[]}');
      expect(result).toEqual({ metrics: [] });
    });

    it('markdown 代码块包裹', () => {
      const result = extractJsonFromText('```json\n{"a":1}\n```');
      expect(result).toEqual({ a: 1 });
    });

    it('前后杂音', () => {
      const result = extractJsonFromText('识别结果：{"a":1} 完毕');
      expect(result).toEqual({ a: 1 });
    });

    it('无 JSON 返回 null', () => {
      expect(extractJsonFromText('抱歉无法识别')).toBeNull();
      expect(extractJsonFromText(null)).toBeNull();
    });
  });

  describe('analyzeImage', () => {
    it('正常识别返回模型文本', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"metrics":[]}' } }] }),
      }));
      const result = await analyzeImage({ imageUrl: 'data:image/jpeg;base64,xxx', prompt: '提取指标' });
      expect(result).toBe('{"metrics":[]}');
      // 验证请求体含 thinking disabled（保证正文完整）
      const fetchCall = vi.mocked(fetch).mock.calls[0] as unknown as [string, { body: string }];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('deepseek-v4-flash-vision-exp');
      expect(body.thinking).toEqual({ type: 'disabled' });
      expect(body.messages[1].content[1].image_url.url).toContain('data:image/jpeg');
    });

    it('无 key 降级返回 null', async () => {
      const { config } = await import('../config.js');
      const savedQc = config.qualityCheck.apiKey;
      const savedAi = config.ai.apiKey;
      config.qualityCheck.apiKey = '';
      config.ai.apiKey = '';
      const result = await analyzeImage({ imageUrl: 'x', prompt: 'p' });
      expect(result).toBeNull();
      config.qualityCheck.apiKey = savedQc;
      config.ai.apiKey = savedAi;
    });

    it('HTTP 错误抛异常', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
      await expect(analyzeImage({ imageUrl: 'x', prompt: 'p' })).rejects.toThrow('401');
    });
  });
});
