import { describe, expect, it } from 'vitest'
import { extractMemoryAtomsFromText } from '../extraction/ruleBasedMemoryExtractor'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-22T00:00:00.000Z'

describe('rule based memory extractor', () => {
  it('extracts a food preference from chat text', () => {
    const atoms = extractMemoryAtomsFromText({
      text: '我喜欢吃西瓜',
      source: 'chat',
      scope,
      timestamp
    })

    expect(atoms).toHaveLength(1)
    expect(atoms[0]).toMatchObject({
      scope,
      layer: 'semantic',
      type: 'preference',
      subject: 'user',
      predicate: 'likes',
      object: '西瓜',
      content: '用户喜欢西瓜',
      source: 'chat',
      sensitivity: 'personal',
      lifecycle: 'draft',
      scenarios: ['chat', 'food_recommendation']
    })
    expect(atoms[0].evidence[0]).toMatchObject({
      source: 'chat',
      sourceText: '我喜欢吃西瓜',
      timestamp,
      confidence: atoms[0].confidence
    })
  })

  it('extracts a boundary from dislike text', () => {
    const atoms = extractMemoryAtomsFromText({
      text: '我不喜欢榴莲',
      source: 'chat',
      scope,
      timestamp
    })

    expect(atoms).toHaveLength(1)
    expect(atoms[0]).toMatchObject({
      type: 'boundary',
      predicate: 'dislikes',
      object: '榴莲',
      content: '用户不喜欢榴莲',
      tags: ['boundary']
    })
  })

  it('extracts a goal from intent text', () => {
    const atoms = extractMemoryAtomsFromText({
      text: '我的目标是考研',
      source: 'chat',
      scope,
      timestamp
    })

    expect(atoms).toHaveLength(1)
    expect(atoms[0]).toMatchObject({
      layer: 'semantic',
      type: 'goal',
      predicate: 'has_goal',
      object: '考研',
      content: '用户的目标是考研',
      scenarios: ['chat', 'goal_planning']
    })
  })

  it('blocks explicit no-memory instructions', () => {
    const atoms = extractMemoryAtomsFromText({
      text: '这个不要记，我喜欢吃西瓜',
      source: 'chat',
      scope,
      timestamp
    })

    expect(atoms).toEqual([])
  })

  it('blocks forbidden secrets before extraction', () => {
    const atoms = extractMemoryAtomsFromText({
      text: '我的 API Key 是 sk-1234567890abcdef',
      source: 'chat',
      scope,
      timestamp
    })

    expect(atoms).toEqual([])
  })
})
