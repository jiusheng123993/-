import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { buildMemoryGraphFromAtoms } from '../graph/memoryGraph'
import { detectMemoryContradictions } from '../graph/contradictionDetector'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-22T00:00:00.000Z'

function createAtom(id: string, predicate: string, object: string, type: MemoryAtom['type'] = 'preference'): MemoryAtom {
  return {
    id,
    scope,
    layer: 'semantic',
    type,
    subject: 'user',
    predicate,
    object,
    content: `用户${predicate}${object}`,
    source: 'chat',
    confidence: 0.8,
    strength: 0.6,
    emotionalWeight: 0.2,
    sensitivity: 'personal',
    lifecycle: 'active',
    evidence: [],
    tags: [],
    scenarios: ['chat'],
    createdAt: timestamp,
    updatedAt: timestamp,
    lastAccessedAt: timestamp,
    accessCount: 0,
    contradictionOf: []
  }
}

describe('memory graph', () => {
  it('builds user and object entities with relation from preference atoms', () => {
    const graph = buildMemoryGraphFromAtoms([createAtom('atom-1', 'likes', '西瓜')], timestamp)

    expect(graph.entities).toHaveLength(2)
    expect(graph.entities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'entity-user-user-1-project-1', name: 'user', type: 'user' }),
      expect.objectContaining({ id: 'entity-user-1-project-1-food-%E8%A5%BF%E7%93%9C', name: '西瓜', type: 'food' })
    ]))
    expect(graph.relations).toHaveLength(1)
    expect(graph.relations[0]).toMatchObject({
      fromEntityId: 'entity-user-user-1-project-1',
      toEntityId: 'entity-user-1-project-1-food-%E8%A5%BF%E7%93%9C',
      relationType: 'likes',
      evidenceAtomIds: ['atom-1'],
      lifecycle: 'active'
    })
  })

  it('builds goal entity and has_goal relation from goal atoms', () => {
    const graph = buildMemoryGraphFromAtoms([createAtom('atom-1', 'has_goal', '考研', 'goal')], timestamp)

    expect(graph.entities).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '考研', type: 'goal' })
    ]))
    expect(graph.relations[0]).toMatchObject({
      relationType: 'associated_with',
      evidenceAtomIds: ['atom-1']
    })
  })
})

describe('memory contradiction detector', () => {
  it('detects likes and dislikes contradictions for the same object', () => {
    const contradictions = detectMemoryContradictions([
      createAtom('atom-like', 'likes', '西瓜'),
      createAtom('atom-dislike', 'dislikes', '西瓜', 'boundary')
    ])

    expect(contradictions).toEqual([
      {
        object: '西瓜',
        relationTypes: ['likes', 'dislikes'],
        atomIds: ['atom-like', 'atom-dislike']
      }
    ])
  })

  it('does not compare atoms across different scopes', () => {
    const otherScopeAtom = {
      ...createAtom('atom-dislike', 'dislikes', '西瓜', 'boundary'),
      scope: { userId: 'user-2', projectId: 'project-1' }
    }

    const contradictions = detectMemoryContradictions([
      createAtom('atom-like', 'likes', '西瓜'),
      otherScopeAtom
    ])

    expect(contradictions).toEqual([])
  })
})
