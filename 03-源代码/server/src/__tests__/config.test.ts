/**
 * buildAiConfig 成组选择逻辑单测
 * 覆盖 ARK 全组 / 部分 ARK / ARK+AI 混配 / 纯 legacy / 全空 / 空格 key 组合，
 * 验证 baseUrl/model/apiKey 三者语义始终一致（不产生跨厂商混配）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildAiConfig } from '../config'

// 本测试只关心 buildAiConfig 纯函数，为避免受 .env 真实值干扰，统一清空相关变量
const AI_ENV_KEYS = ['ARK_API_KEY', 'ARK_BASE_URL', 'ARK_MODEL', 'AI_API_KEY', 'AI_BASE_URL', 'AI_MODEL'] as const

function clearAiEnv() {
  for (const k of AI_ENV_KEYS) delete process.env[k]
}

function setEnv(values: Partial<Record<typeof AI_ENV_KEYS[number], string>>) {
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
}

describe('buildAiConfig', () => {
  // 每个用例前清空 AI 相关变量，避免用例间相互污染
  beforeEach(() => clearAiEnv())
  // 测完还原，避免影响其他测试文件读取 config
  afterEach(() => clearAiEnv())

  it('should use full ARK trio when all three are configured', () => {
    setEnv({
      ARK_API_KEY: 'ark-key',
      ARK_BASE_URL: 'https://ark.example.com/api/v3',
      ARK_MODEL: 'deepseek-v4-flash-ga-260731',
    })
    const c = buildAiConfig()
    expect(c).toEqual({
      apiKey: 'ark-key',
      baseUrl: 'https://ark.example.com/api/v3',
      model: 'deepseek-v4-flash-ga-260731',
    })
  })

  it('should fill Ark defaults when only ARK_API_KEY is set (no cross-vendor mixing)', () => {
    // 只配 key：baseUrl/model 应回落火山默认，绝不能回落 DeepSeek 官方
    setEnv({ ARK_API_KEY: 'ark-key' })
    const c = buildAiConfig()
    expect(c.apiKey).toBe('ark-key')
    expect(c.baseUrl).toContain('ark.cn-beijing.volces.com')
    expect(c.model).toBe('deepseek-v4-flash-ga-260731')
  })

  it('should treat ARK_BASE_URL only as Ark group and fill defaults for key/model', () => {
    setEnv({ ARK_BASE_URL: 'https://ark.example.com' })
    const c = buildAiConfig()
    // 只有 baseUrl，key/model 空，仍走 Ark 语义（不会用旧 AI_*）
    expect(c.baseUrl).toBe('https://ark.example.com')
    expect(c.apiKey).toBe('')
    expect(c.model).toBe('deepseek-v4-flash-ga-260731')
  })

  it('should ignore legacy AI_* entirely when any ARK_* is present', () => {
    // 混配场景：同时有 ARK_API_KEY 和旧 AI_BASE_URL，结果必须纯 Ark，忽略旧 URL
    setEnv({ ARK_API_KEY: 'ark-key', AI_BASE_URL: 'https://api.deepseek.com/v1' })
    const c = buildAiConfig()
    expect(c.baseUrl).toContain('ark.cn-beijing.volces.com')
    expect(c.model).toBe('deepseek-v4-flash-ga-260731')
  })

  it('should use full legacy AI_* trio when no ARK_* is set', () => {
    setEnv({
      AI_API_KEY: 'legacy-key',
      AI_BASE_URL: 'https://api.deepseek.com/v1',
      AI_MODEL: 'deepseek-chat',
    })
    const c = buildAiConfig()
    expect(c.apiKey).toBe('legacy-key')
    expect(c.baseUrl).toBe('https://api.deepseek.com/v1')
    expect(c.model).toBe('deepseek-chat')
  })

  it('should fall back to DeepSeek official defaults when only legacy AI_API_KEY is set', () => {
    // 只有旧 key：缺项必须回落 DeepSeek 官方默认，而不是 Ark 默认（避免 legacy 混配）
    setEnv({ AI_API_KEY: 'legacy-key' })
    const c = buildAiConfig()
    expect(c.apiKey).toBe('legacy-key')
    expect(c.baseUrl).toBe('https://api.deepseek.com/v1')
    expect(c.model).toBe('deepseek-chat')
  })

  it('should start cleanly (empty trio) when nothing is configured', () => {
    clearAiEnv()
    const c = buildAiConfig()
    expect(c.apiKey).toBe('')
    expect(c.baseUrl).toBe('https://api.deepseek.com/v1')
    expect(c.model).toBe('deepseek-chat')
  })

  it('should treat whitespace-only ARK_API_KEY as empty and fall back to legacy', () => {
    // 边界：纯空格 key 应被 trim 后视为未配置，避免发出带空 key 的真实请求
    setEnv({ ARK_API_KEY: '   ', AI_API_KEY: 'legacy-key', AI_MODEL: 'deepseek-chat' })
    const c = buildAiConfig()
    expect(c.apiKey).toBe('legacy-key')
    expect(c.baseUrl).toBe('https://api.deepseek.com/v1')
    expect(c.model).toBe('deepseek-chat')
  })
})