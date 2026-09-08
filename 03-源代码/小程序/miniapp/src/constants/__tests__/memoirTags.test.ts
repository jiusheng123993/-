/**
 * 回忆标签常量单测（F4 记忆驱动回忆录）
 * 锁定 MEMOIR_TAG_OPTIONS 与服务端 MEMOIR_TAGS 枚举（server/src/schemas/index.ts）一致，
 * 防止前端新增/改名标签后被服务端 zod 静默剥离。
 */
import { describe, it, expect } from 'vitest'
import { MEMOIR_TAG_OPTIONS } from '../memoirTags'

/** 服务端 MEMOIR_TAGS 枚举镜像（改动任一侧必须同步另一侧） */
const SERVER_MEMOIR_TAGS = [
  'milestone',
  'daily_joy',
  'bonding',
  'special_day',
  'family',
  'health_heal',
  'farewell',
  'seasonal',
] as const

describe('constants/memoirTags', () => {
  it('标签 key 集合与服务端 MEMOIR_TAGS 枚举完全一致（双向相等）', () => {
    const frontendKeys = MEMOIR_TAG_OPTIONS.map(t => t.key).sort()
    const serverKeys = [...SERVER_MEMOIR_TAGS].sort()
    expect(frontendKeys).toEqual(serverKeys)
  })

  it('无重复 key，且每个标签都有中文展示名与 emoji', () => {
    const keys = MEMOIR_TAG_OPTIONS.map(t => t.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const tag of MEMOIR_TAG_OPTIONS) {
      expect(tag.label.length).toBeGreaterThan(0)
      expect(tag.emoji.length).toBeGreaterThan(0)
    }
  })

  it('标签数量不超过服务端 schema 上限 8 个', () => {
    expect(MEMOIR_TAG_OPTIONS.length).toBeLessThanOrEqual(8)
  })
})
