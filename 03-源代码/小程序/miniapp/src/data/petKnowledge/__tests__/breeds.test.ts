/**
 * 品种数据测试
 * 覆盖「不确定品种」虚拟条目的数据完整性与搜索命中逻辑
 * （用户不知道宠物品种时的兜底方案：混血/串串/流浪猫狗）
 */
import { describe, it, expect } from 'vitest'
import {
  BREED_DATA,
  UNKNOWN_BREED_ID,
  UNKNOWN_BREED_NAME,
  UNKNOWN_BREED_KEYWORDS,
  isUnknownBreedKeyword,
} from '../breeds'

describe('不确定品种虚拟条目', () => {
  it('UNKNOWN_BREED_ID 不在 BREED_DATA 中（不污染品种知识库统计与详情页）', () => {
    expect(BREED_DATA.some((b) => b.id === UNKNOWN_BREED_ID)).toBe(false)
  })

  it('UNKNOWN_BREED_NAME 与 ID 配套且非空', () => {
    expect(UNKNOWN_BREED_NAME).toBeTruthy()
    expect(UNKNOWN_BREED_KEYWORDS.length).toBeGreaterThan(0)
  })

  it('UNKNOWN_BREED_ID 为非空字符串（满足前端校验与后端 schema 非空要求）', () => {
    expect(UNKNOWN_BREED_ID.length).toBeGreaterThan(0)
  })
})

describe('isUnknownBreedKeyword 搜索命中', () => {
  it('空关键词返回 false（初始态展示与否由调用方决定）', () => {
    expect(isUnknownBreedKeyword('')).toBe(false)
    expect(isUnknownBreedKeyword('   ')).toBe(false)
  })

  it('命中：不确定/混血/串串/不知道', () => {
    expect(isUnknownBreedKeyword('不确定')).toBe(true)
    expect(isUnknownBreedKeyword('混血')).toBe(true)
    expect(isUnknownBreedKeyword('串')).toBe(true)
    expect(isUnknownBreedKeyword('串串')).toBe(true)
    expect(isUnknownBreedKeyword('不知道')).toBe(true)
  })

  it('命中：流浪/土狗/土猫/田园/领养（与面板提示语「常见于流浪猫狗」呼应）', () => {
    expect(isUnknownBreedKeyword('流浪')).toBe(true)
    expect(isUnknownBreedKeyword('土狗')).toBe(true)
    expect(isUnknownBreedKeyword('土猫')).toBe(true)
    expect(isUnknownBreedKeyword('田园')).toBe(true)
    expect(isUnknownBreedKeyword('领养')).toBe(true)
  })

  it('命中：英文 mix / unknown（含大小写不敏感）', () => {
    expect(isUnknownBreedKeyword('mix')).toBe(true)
    expect(isUnknownBreedKeyword('unknown')).toBe(true)
    expect(isUnknownBreedKeyword('UNKNOWN')).toBe(true)
  })

  it('未命中：普通品种关键词不影响正常搜索', () => {
    expect(isUnknownBreedKeyword('金毛')).toBe(false)
    expect(isUnknownBreedKeyword('布偶')).toBe(false)
    expect(isUnknownBreedKeyword('英短')).toBe(false)
  })

  it('命中：单字部分匹配（输入「不」→ 不确定品种）', () => {
    expect(isUnknownBreedKeyword('不')).toBe(true)
  })
})
