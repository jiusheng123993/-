/**
 * 品种数据测试
 * 覆盖「不确定品种」虚拟条目的数据完整性、搜索命中逻辑、
 * 来源标注（sources）完整性与译名校对（2026-08-25 数据校对轮）
 */
import { describe, it, expect } from 'vitest'
import {
  BREED_DATA,
  UNKNOWN_BREED_ID,
  UNKNOWN_BREED_NAME,
  UNKNOWN_BREED_KEYWORDS,
  isUnknownBreedKeyword,
  getActiveBreeds,
  setActiveBreeds,
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

describe('来源标注与热更新切换层（2026-08-25 数据校对轮）', () => {
  it('全部 110 条均有非空 sources 来源标注', () => {
    expect(BREED_DATA.length).toBeGreaterThan(100)
    const missing = BREED_DATA.filter((b) => !Array.isArray(b.sources) || b.sources.length === 0)
    expect(missing).toEqual([])
  })

  it('含遗传病条目补了遗传学权威源，含毒物条目补了 ASPCA 中毒控制', () => {
    const withGenetic = BREED_DATA.find((b) => b.geneticDiseases.length > 0)
    expect(withGenetic?.sources.some((s) => s.includes('OMIA') || s.includes('UC Davis'))).toBe(true)
    const withToxic = BREED_DATA.find((b) => b.toxicFoods.length > 0)
    expect(withToxic?.sources.some((s) => s.includes('ASPCA'))).toBe(true)
  })

  it('译名修正：沙特尔猫/尼比龙猫/索科凯猫 正名生效且旧名保留在 aliases 可搜索', () => {
    const chartreux = BREED_DATA.find((b) => b.id === 'chartreux')
    expect(chartreux?.name).toBe('沙特尔猫')
    expect(chartreux?.aliases).toContain('沙特儿猫') // 旧译名保留兜底搜索
    const nebelung = BREED_DATA.find((b) => b.id === 'nebelung')
    expect(nebelung?.name).toBe('尼比龙猫')
    expect(nebelung?.aliases).toContain('内华达猫')
    const sokoke = BREED_DATA.find((b) => b.id === 'sokoke')
    expect(sokoke?.name).toBe('索科凯猫')
    expect(sokoke?.aliases).toContain('肯尼亚猫')
  })

  it('getActiveBreeds 初始返回静态兜底；setActiveBreeds 切换后生效', () => {
    expect(getActiveBreeds()).toBe(BREED_DATA) // 初始未同步时即静态兜底本体
    const fake = [{ ...BREED_DATA[0], id: 'hotfix_probe' }]
    setActiveBreeds(fake as typeof BREED_DATA)
    expect(getActiveBreeds()[0].id).toBe('hotfix_probe')
    setActiveBreeds(BREED_DATA) // 还原，避免污染同文件其他用例
    expect(getActiveBreeds()).toBe(BREED_DATA)
  })
})
