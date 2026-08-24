/**
 * 品种识别服务测试
 * 覆盖 matchBreedInData：把 AI 识别结果（品种名/物种）在本地品种库中匹配，
 * 供「添加宠物-拍照识别品种」与「品种百科-拍照识别」共用；
 * 以及 syncBreedKnowledge：品种知识库热更新降级路径（2026-08-25）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { matchBreedInData, syncBreedKnowledge } from '../breedService'
import { api } from '../api'
import { getActiveBreeds, setActiveBreeds, BREED_DATA } from '../../data/petKnowledge/breeds'

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

// ===== syncBreedKnowledge 热更新降级路径（复刻 knowledgeService.test 模式） =====

const mockStorage: Record<string, string> = {}

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn((key: string) => {
    const raw = mockStorage[`xhh_${key}`]
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }),
  setStorage: vi.fn((key: string, value: unknown) => {
    mockStorage[`xhh_${key}`] = JSON.stringify(value)
  }),
  storage: { getToken: vi.fn(() => null) },
}))

vi.mock('../api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

/** 构造一条合法热更新条目（满足 isValidBreedList 校验） */
function hotItem(id: string) {
  return { ...BREED_DATA[0], id, sources: ['校对来源'] }
}

/** 还原切换层为静态兜底（避免污染其他用例） */
function resetActive() {
  setActiveBreeds(BREED_DATA)
}

describe('syncBreedKnowledge - 品种库热更新降级路径', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
    resetActive()
  })

  it('网络成功且结构合法 → 切换到服务端版本并写入缓存', async () => {
    const breeds = [hotItem('server_breed_1'), hotItem('server_breed_2')]
    vi.mocked(api.get).mockResolvedValue({ version: '2026-08-25.1', data: { version: '2026-08-25.1', breeds } })

    const ok = await syncBreedKnowledge()

    expect(ok).toBe(true)
    expect(getActiveBreeds().some((b) => b.id === 'server_breed_1')).toBe(true)
    expect(mockStorage['xhh_breed_knowledge']).toBeDefined()
  })

  it('非法结构（缺 sources）→ 不切换保持静态兜底', async () => {
    const bad = [{ ...hotItem('bad_1'), sources: [] }]
    vi.mocked(api.get).mockResolvedValue({ version: 'bad.1', data: { version: 'bad.1', breeds: bad } })

    const ok = await syncBreedKnowledge()

    expect(ok).toBe(false)
    expect(getActiveBreeds()).toBe(BREED_DATA)
  })

  it('非法结构（渲染必需字段缺失）→ 不切换保持静态兜底（审查 P1-1）', async () => {
    // 缺 aliases：checkin/edit/add 消费点直接调数组方法，坏库穿透会 TypeError 白屏
    const noAliases = { ...hotItem('bad_2') } as Record<string, unknown>
    delete noAliases.aliases
    vi.mocked(api.get).mockResolvedValue({ version: 'bad.1', data: { version: 'bad.1', breeds: [noAliases] } })
    expect(await syncBreedKnowledge()).toBe(false)
    expect(getActiveBreeds()).toBe(BREED_DATA)

    resetActive()
    // weightRange.min 非数值：趋势页体型兜底直接取值
    const badRange = { ...hotItem('bad_3'), weightRange: { min: '25', max: 34 } }
    vi.mocked(api.get).mockResolvedValue({ version: 'bad.1', data: { version: 'bad.1', breeds: [badRange] } })
    expect(await syncBreedKnowledge()).toBe(false)
    expect(getActiveBreeds()).toBe(BREED_DATA)
  })

  it('缓存写入异常不吞掉已成功的切换（审查 P2-2）', async () => {
    const breeds = [hotItem('switch_ok')]
    vi.mocked(api.get).mockResolvedValue({ version: 'ok.1', data: { version: 'ok.1', breeds } })
    // 模拟 storage 配额满：setStorage 抛错
    vi.mocked((await import('../../utils/storage')).setStorage).mockImplementation(() => {
      throw new Error('storage full')
    })

    const ok = await syncBreedKnowledge()

    // 切换必须成功返回 true（界面刷新信号不被缓存故障吞掉）
    expect(ok).toBe(true)
    expect(getActiveBreeds().some((b) => b.id === 'switch_ok')).toBe(true)
  })

  it('网络失败 + 有缓存 → 切换到缓存版本', async () => {
    const breeds = [hotItem('cached_breed')]
    mockStorage['xhh_breed_knowledge'] = JSON.stringify({ version: 'cached.1', data: { version: 'cached.1', breeds } })
    vi.mocked(api.get).mockRejectedValue(new Error('network down'))

    const ok = await syncBreedKnowledge()

    expect(ok).toBe(true)
    expect(getActiveBreeds().some((b) => b.id === 'cached_breed')).toBe(true)
  })

  it('网络失败 + 无缓存 → 返回 false 保持静态兜底', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('network down'))

    const ok = await syncBreedKnowledge()

    expect(ok).toBe(false)
    expect(getActiveBreeds()).toBe(BREED_DATA)
  })
})
