/**
 * 输出安全检测 fail-closed 语义单测（审查项修复验证）
 * 场景：检测服务 500 / 非法 JSON / 网络异常时，failClosed=true 一律视为"不安全"（宁可拦截不可放行）
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// config mock：提供 ai.apiKey（非空，使 guardCheckOutput 走真实 fetch 分支）
vi.mock('../config.js', () => ({
  config: {
    ai: { apiKey: 'test-key', baseUrl: 'https://mock-ark', model: 'mock-model' },
  },
}));

import { guardCheckOutput } from '../services/aiService.js';

describe('guardCheckOutput - fail-closed 语义', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  /** 替换全局 fetch 为可控 stub */
  function stubFetch(impl: () => Promise<Response>) {
    globalThis.fetch = vi.fn(impl) as unknown as typeof fetch;
  }

  /** 构造 ChatCompletionResponse 形状的 200 响应（守卫内部会对 content 二次 JSON.parse） */
  function okResponse(isUnsafe: boolean): Response {
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ isUnsafeMedicalAdvice: isUnsafe }) } }],
      }),
      { status: 200 },
    );
  }

  it('failClosed=true：检测服务返回 500 → 视为不安全（拦截）', async () => {
    stubFetch(() => Promise.resolve(new Response('server error', { status: 500 })));
    const result = await guardCheckOutput('text', { failClosed: true });
    expect(result.isUnsafeMedicalAdvice).toBe(true);
  });

  it('failClosed=false（默认）：检测服务返回 500 → 放行（保持旧行为，向后兼容）', async () => {
    stubFetch(() => Promise.resolve(new Response('server error', { status: 500 })));
    const result = await guardCheckOutput('text');
    expect(result.isUnsafeMedicalAdvice).toBe(false);
  });

  it('failClosed=true：返回内容非法 JSON → 视为不安全', async () => {
    stubFetch(() => Promise.resolve(new Response('not json', { status: 200 })));
    const result = await guardCheckOutput('text', { failClosed: true });
    expect(result.isUnsafeMedicalAdvice).toBe(true);
  });

  it('failClosed=true：网络异常 → 视为不安全', async () => {
    stubFetch(() => Promise.reject(new Error('network down')));
    const result = await guardCheckOutput('text', { failClosed: true });
    expect(result.isUnsafeMedicalAdvice).toBe(true);
  });

  it('failClosed=true：检测判定为不安全 → 拦截', async () => {
    stubFetch(() => Promise.resolve(okResponse(true)));
    const result = await guardCheckOutput('text', { failClosed: true });
    expect(result.isUnsafeMedicalAdvice).toBe(true);
  });

  it('failClosed=true：检测判定为安全 → 放行', async () => {
    stubFetch(() => Promise.resolve(okResponse(false)));
    const result = await guardCheckOutput('text', { failClosed: true });
    expect(result.isUnsafeMedicalAdvice).toBe(false);
  });
});
