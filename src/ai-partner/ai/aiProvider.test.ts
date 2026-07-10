import { describe, expect, it } from 'vitest'
import { aiProviderRegistry, createAiPromptDraft, getAiProviderById } from './aiProvider'

describe('aiProvider', () => {
  it('registers replaceable AI providers for future integration', () => {
    const ids = aiProviderRegistry.map((provider) => provider.id)

    expect(ids).toEqual(['deepseek', 'openai', 'tongyi', 'doubao', 'local'])
    expect(getAiProviderById('missing').id).toBe('deepseek')
    expect(getAiProviderById('local').deployment).toBe('local')
  })

  it('creates a bounded prompt draft for action-coach workflows', () => {
    const draft = createAiPromptDraft('deepseek', {
      kind: 'meeting-actions',
      input: '产品下周三前确认首页结构，开发本周评估打包方案。',
      context: '办公工作区'
    })

    expect(draft.title).toBe('会议记录转行动项')
    expect(draft.systemPrompt).toContain('AI 行动教练')
    expect(draft.userPrompt).toContain('办公工作区')
    expect(draft.userPrompt).toContain('打包方案')
  })

  it('supports memory reflection as a dedicated AI task kind', () => {
    const draft = createAiPromptDraft('deepseek', {
      kind: 'memory-reflection',
      input: '根据最近 7 天事件提炼画像更新建议。',
      context: '长期画像：用户偏好结构化反馈'
    })

    expect(draft.title).toBe('记忆反思与画像更新')
    expect(draft.systemPrompt).toContain('记忆反思')
    expect(draft.userPrompt).toContain('长期画像')
    expect(draft.userPrompt).toContain('画像更新建议')
  })
})
