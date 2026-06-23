import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import {
  OverrideLevel,
  OVERRIDE_PRIORITY_ORDER,
  OVERRIDE_LEVEL_LABELS,
  resolveOverride,
  getOverrideLevel,
  isHigherPriority,
  canOverride,
  resolveMemoryConflict,
  type OverrideSource
} from '../hierarchy/overrideHierarchy'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-23T00:00:00.000Z'

function atom(partial: Partial<MemoryAtom>): MemoryAtom {
  return {
    id: partial.id ?? 'atom-1',
    scope: partial.scope ?? scope,
    layer: partial.layer ?? 'semantic',
    type: partial.type ?? 'preference',
    subject: partial.subject ?? 'user',
    predicate: partial.predicate ?? 'likes',
    object: partial.object ?? '西瓜',
    content: partial.content ?? '用户喜欢西瓜',
    source: partial.source ?? 'chat',
    confidence: partial.confidence ?? 0.78,
    strength: partial.strength ?? 0.5,
    emotionalWeight: partial.emotionalWeight ?? 0.1,
    sensitivity: partial.sensitivity ?? 'personal',
    lifecycle: partial.lifecycle ?? 'active',
    evidence: partial.evidence ?? [{
      id: 'evidence-1',
      source: 'chat',
      sourceText: '我喜欢吃西瓜',
      timestamp,
      confidence: 0.78
    }],
    tags: partial.tags ?? [],
    scenarios: partial.scenarios ?? ['chat'],
    createdAt: partial.createdAt ?? timestamp,
    updatedAt: partial.updatedAt ?? timestamp,
    lastAccessedAt: partial.lastAccessedAt ?? timestamp,
    accessCount: partial.accessCount ?? 0,
    contradictionOf: partial.contradictionOf ?? []
  }
}

describe('overrideHierarchy', () => {
  describe('OverrideLevel enum', () => {
    it('has 7 levels in correct priority order', () => {
      expect(OVERRIDE_PRIORITY_ORDER).toEqual([
        OverrideLevel.USER_EXPLICIT_COMMAND,
        OverrideLevel.USER_EXPLICIT_CORRECTION,
        OverrideLevel.USER_CONFIRMED_MEMORY,
        OverrideLevel.PROJECT_RULE,
        OverrideLevel.GLOBAL_RULE,
        OverrideLevel.HISTORICAL_MEMORY,
        OverrideLevel.MODEL_INFERENCE
      ])
    })

    it('has labels for all levels', () => {
      expect(OVERRIDE_LEVEL_LABELS[OverrideLevel.USER_EXPLICIT_COMMAND]).toBe('用户最新明确指令')
      expect(OVERRIDE_LEVEL_LABELS[OverrideLevel.USER_EXPLICIT_CORRECTION]).toBe('用户明确纠正')
      expect(OVERRIDE_LEVEL_LABELS[OverrideLevel.USER_CONFIRMED_MEMORY]).toBe('用户确认记忆')
      expect(OVERRIDE_LEVEL_LABELS[OverrideLevel.PROJECT_RULE]).toBe('项目规则')
      expect(OVERRIDE_LEVEL_LABELS[OverrideLevel.GLOBAL_RULE]).toBe('全局规则')
      expect(OVERRIDE_LEVEL_LABELS[OverrideLevel.HISTORICAL_MEMORY]).toBe('历史记忆')
      expect(OVERRIDE_LEVEL_LABELS[OverrideLevel.MODEL_INFERENCE]).toBe('模型推断')
    })
  })

  describe('getOverrideLevel', () => {
    it('returns USER_EXPLICIT_COMMAND for user command source', () => {
      const source: OverrideSource = { type: 'user_command', timestamp }
      expect(getOverrideLevel(source)).toBe(OverrideLevel.USER_EXPLICIT_COMMAND)
    })

    it('returns USER_EXPLICIT_CORRECTION for user correction source', () => {
      const source: OverrideSource = { type: 'user_correction', timestamp }
      expect(getOverrideLevel(source)).toBe(OverrideLevel.USER_EXPLICIT_CORRECTION)
    })

    it('returns USER_CONFIRMED_MEMORY for confirmed lifecycle', () => {
      const source: OverrideSource = { type: 'memory_lifecycle', lifecycle: 'confirmed', timestamp }
      expect(getOverrideLevel(source)).toBe(OverrideLevel.USER_CONFIRMED_MEMORY)
    })

    it('returns PROJECT_RULE for project rule source', () => {
      const source: OverrideSource = { type: 'project_rule', timestamp }
      expect(getOverrideLevel(source)).toBe(OverrideLevel.PROJECT_RULE)
    })

    it('returns GLOBAL_RULE for global rule source', () => {
      const source: OverrideSource = { type: 'global_rule', timestamp }
      expect(getOverrideLevel(source)).toBe(OverrideLevel.GLOBAL_RULE)
    })

    it('returns HISTORICAL_MEMORY for active lifecycle', () => {
      const source: OverrideSource = { type: 'memory_lifecycle', lifecycle: 'active', timestamp }
      expect(getOverrideLevel(source)).toBe(OverrideLevel.HISTORICAL_MEMORY)
    })

    it('returns MODEL_INFERENCE for model inference source', () => {
      const source: OverrideSource = { type: 'model_inference', timestamp }
      expect(getOverrideLevel(source)).toBe(OverrideLevel.MODEL_INFERENCE)
    })
  })

  describe('isHigherPriority', () => {
    it('user command is higher than user correction', () => {
      expect(isHigherPriority(OverrideLevel.USER_EXPLICIT_COMMAND, OverrideLevel.USER_EXPLICIT_CORRECTION)).toBe(true)
    })

    it('user correction is higher than confirmed memory', () => {
      expect(isHigherPriority(OverrideLevel.USER_EXPLICIT_CORRECTION, OverrideLevel.USER_CONFIRMED_MEMORY)).toBe(true)
    })

    it('confirmed memory is higher than project rule', () => {
      expect(isHigherPriority(OverrideLevel.USER_CONFIRMED_MEMORY, OverrideLevel.PROJECT_RULE)).toBe(true)
    })

    it('project rule is higher than global rule', () => {
      expect(isHigherPriority(OverrideLevel.PROJECT_RULE, OverrideLevel.GLOBAL_RULE)).toBe(true)
    })

    it('global rule is higher than historical memory', () => {
      expect(isHigherPriority(OverrideLevel.GLOBAL_RULE, OverrideLevel.HISTORICAL_MEMORY)).toBe(true)
    })

    it('historical memory is higher than model inference', () => {
      expect(isHigherPriority(OverrideLevel.HISTORICAL_MEMORY, OverrideLevel.MODEL_INFERENCE)).toBe(true)
    })

    it('same level is not higher priority', () => {
      expect(isHigherPriority(OverrideLevel.USER_EXPLICIT_COMMAND, OverrideLevel.USER_EXPLICIT_COMMAND)).toBe(false)
    })

    it('model inference is not higher than anything', () => {
      expect(isHigherPriority(OverrideLevel.MODEL_INFERENCE, OverrideLevel.USER_EXPLICIT_COMMAND)).toBe(false)
      expect(isHigherPriority(OverrideLevel.MODEL_INFERENCE, OverrideLevel.HISTORICAL_MEMORY)).toBe(false)
    })
  })

  describe('canOverride', () => {
    it('user command can override anything', () => {
      expect(canOverride(OverrideLevel.USER_EXPLICIT_COMMAND, OverrideLevel.USER_EXPLICIT_CORRECTION)).toBe(true)
      expect(canOverride(OverrideLevel.USER_EXPLICIT_COMMAND, OverrideLevel.MODEL_INFERENCE)).toBe(true)
    })

    it('model inference cannot override anything', () => {
      expect(canOverride(OverrideLevel.MODEL_INFERENCE, OverrideLevel.USER_EXPLICIT_COMMAND)).toBe(false)
      expect(canOverride(OverrideLevel.MODEL_INFERENCE, OverrideLevel.HISTORICAL_MEMORY)).toBe(false)
      expect(canOverride(OverrideLevel.MODEL_INFERENCE, OverrideLevel.MODEL_INFERENCE)).toBe(false)
    })

    it('historical memory cannot override user confirmed memory', () => {
      expect(canOverride(OverrideLevel.HISTORICAL_MEMORY, OverrideLevel.USER_CONFIRMED_MEMORY)).toBe(false)
    })

    it('project rule cannot override user correction', () => {
      expect(canOverride(OverrideLevel.PROJECT_RULE, OverrideLevel.USER_EXPLICIT_CORRECTION)).toBe(false)
    })
  })

  describe('resolveOverride', () => {
    it('returns higher priority source when they differ', () => {
      const result = resolveOverride(
        { type: 'user_command', timestamp: '2026-06-23T01:00:00.000Z' },
        { type: 'model_inference', timestamp: '2026-06-23T02:00:00.000Z' }
      )
      expect(result.type).toBe('user_command')
    })

    it('returns newer source when same priority level', () => {
      const result = resolveOverride(
        { type: 'user_command', timestamp: '2026-06-23T01:00:00.000Z' },
        { type: 'user_command', timestamp: '2026-06-23T02:00:00.000Z' }
      )
      expect(result.timestamp).toBe('2026-06-23T02:00:00.000Z')
    })

    it('user correction overrides confirmed memory regardless of timestamp', () => {
      const result = resolveOverride(
        { type: 'user_correction', timestamp: '2026-06-23T01:00:00.000Z' },
        { type: 'memory_lifecycle', lifecycle: 'confirmed', timestamp: '2026-06-23T02:00:00.000Z' }
      )
      expect(result.type).toBe('user_correction')
    })
  })

  describe('resolveMemoryConflict', () => {
    it('keeps user command memory over model inference memory', () => {
      const cmdAtom = atom({
        id: 'cmd-1',
        content: '用户喜欢芒果',
        object: '芒果',
        source: 'user_command',
        lifecycle: 'active',
        updatedAt: '2026-06-23T01:00:00.000Z'
      })
      const infAtom = atom({
        id: 'inf-1',
        content: '用户喜欢西瓜',
        object: '西瓜',
        source: 'model_inference',
        lifecycle: 'active',
        updatedAt: '2026-06-23T02:00:00.000Z'
      })

      const result = resolveMemoryConflict(cmdAtom, infAtom)
      expect(result.kept.id).toBe('cmd-1')
      expect(result.discarded.id).toBe('inf-1')
      expect(result.reason).toContain('用户最新明确指令')
    })

    it('keeps newer memory when same source type', () => {
      const older = atom({
        id: 'old-1',
        content: '用户喜欢西瓜',
        object: '西瓜',
        source: 'chat',
        lifecycle: 'active',
        updatedAt: '2026-06-23T01:00:00.000Z'
      })
      const newer = atom({
        id: 'new-1',
        content: '用户喜欢芒果',
        object: '芒果',
        source: 'chat',
        lifecycle: 'active',
        updatedAt: '2026-06-23T02:00:00.000Z'
      })

      const result = resolveMemoryConflict(older, newer)
      expect(result.kept.id).toBe('new-1')
      expect(result.discarded.id).toBe('old-1')
    })

    it('user correction overrides confirmed memory', () => {
      const correction = atom({
        id: 'corr-1',
        content: '用户现在喜欢芒果',
        object: '芒果',
        source: 'user_correction',
        lifecycle: 'active',
        updatedAt: '2026-06-23T01:00:00.000Z'
      })
      const confirmed = atom({
        id: 'conf-1',
        content: '用户喜欢西瓜',
        object: '西瓜',
        source: 'chat',
        lifecycle: 'confirmed',
        updatedAt: '2026-06-23T02:00:00.000Z'
      })

      const result = resolveMemoryConflict(correction, confirmed)
      expect(result.kept.id).toBe('corr-1')
      expect(result.discarded.id).toBe('conf-1')
    })

    it('never lets model inference override user confirmed memory', () => {
      const confirmed = atom({
        id: 'conf-1',
        content: '用户喜欢西瓜',
        object: '西瓜',
        source: 'chat',
        lifecycle: 'confirmed',
        updatedAt: '2026-06-23T01:00:00.000Z'
      })
      const inference = atom({
        id: 'inf-1',
        content: '用户喜欢芒果',
        object: '芒果',
        source: 'model_inference',
        lifecycle: 'active',
        updatedAt: '2026-06-23T02:00:00.000Z'
      })

      const result = resolveMemoryConflict(inference, confirmed)
      expect(result.kept.id).toBe('conf-1')
      expect(result.discarded.id).toBe('inf-1')
    })
  })
})
