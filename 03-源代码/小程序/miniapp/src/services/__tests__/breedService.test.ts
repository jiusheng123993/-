/**
 * 品种识别服务测试
 * 覆盖 matchBreedInData：把 AI 识别结果（品种名/物种）在本地品种库中匹配，
 * 供「添加宠物-拍照识别品种」与「品种百科-拍照识别」共用
 */
import { describe, it, expect } from 'vitest'
import { matchBreedInData } from '../breedService'

// 用最小品种切片模拟 BREED_DATA（结构与 breeds.ts 的 BreedItem 兼容）
const BREED_SLICE: Array<{ id: string; name: string; species: string; aliases: string[] }> = [
  { id: 'british_shorthair', name: '英国短毛猫', species: 'cat', aliases: ['英短', 'British Shorthair'] },
  { id: 'golden_retriever', name: '金毛寻回犬', species: 'dog', aliases: ['金毛', 'Golden Retriever'] },
  { id: 'chinese_domestic_cat', name: '中华田园猫', species: 'cat', aliases: ['田园猫', 'Chinese Domestic Cat'] },
]

describe('matchBreedInData', () => {
  it('名称精确匹配', () => {
    expect(matchBreedInData('英国短毛猫', 'cat', BREED_SLICE)).toBe('british_shorthair')
    expect(matchBreedInData('金毛寻回犬', 'dog', BREED_SLICE)).toBe('golden_retriever')
  })

  it('别名精确匹配（中文别名/英文别名）', () => {
    expect(matchBreedInData('英短', 'cat', BREED_SLICE)).toBe('british_shorthair')
    expect(matchBreedInData('Golden Retriever', 'dog', BREED_SLICE)).toBe('golden_retriever')
  })

  it('包含匹配：识别名含别名 或 别名含识别名', () => {
    // 识别结果「短毛英短猫」包含别名「英短」→ 命中英短
    expect(matchBreedInData('短毛英短猫', 'cat', BREED_SLICE)).toBe('british_shorthair')
    // 识别结果「金毛」是别名，别名包含于识别名「金毛犬」
    expect(matchBreedInData('金毛犬', 'dog', BREED_SLICE)).toBe('golden_retriever')
  })

  it('物种过滤：同名但物种不同不匹配', () => {
    // 库里没有叫「英国短毛犬」的狗，且物种不对应 → null
    expect(matchBreedInData('英国短毛猫', 'dog', BREED_SLICE)).toBeNull()
    expect(matchBreedInData('金毛', 'cat', BREED_SLICE)).toBeNull()
  })

  it('未匹配/空输入返回 null', () => {
    expect(matchBreedInData('无此品种', 'cat', BREED_SLICE)).toBeNull()
    expect(matchBreedInData('', 'cat', BREED_SLICE)).toBeNull()
    expect(matchBreedInData('   ', 'dog', BREED_SLICE)).toBeNull()
  })
})
