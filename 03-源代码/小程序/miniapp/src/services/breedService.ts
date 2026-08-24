import Taro from '@tarojs/taro'
import { CONFIG } from '../config'
import { storage, getStorage, setStorage } from '../utils/storage'
import { api } from './api'
import { setActiveBreeds } from '../data/petKnowledge/breeds'
import type { BreedItem } from '../data/petKnowledge/breeds'

export interface BreedRecognizeResult {
  species: 'dog' | 'cat'
  breedName: string
  confidence: number
  reason: string
}

/**
 * 拍照识别宠物品种
 * 上传照片到后端，由 AI 分析并返回品种识别结果
 */
export async function recognizeBreed(tempFilePath: string): Promise<BreedRecognizeResult | null> {
  try {
    const token = storage.getToken()
    const res = await Taro.uploadFile({
      url: `${CONFIG.API_BASE_URL}/api/ai/breed-recognize`,
      filePath: tempFilePath,
      name: 'photo',
      header: token ? { Authorization: `Bearer ${token}` } : {},
    })

    // 登录失效/无权限单独提示，避免误导用户以为照片不清晰而反复重拍（每次重拍=1 次付费 AI 调用）
    if (res.statusCode === 401) {
      Taro.showToast({ title: '登录已过期，请重新登录后再试', icon: 'none', duration: 2500 })
      return null
    }

    let data: {
      success: boolean
      message?: string
      data?: BreedRecognizeResult
    }
    try {
      data = JSON.parse(res.data)
    } catch {
      // 非 JSON 响应（网关/代理错误页等），同样不应误导用户重拍
      Taro.showToast({ title: '识别服务异常，请稍后重试', icon: 'none', duration: 2500 })
      return null
    }

    if (data.success && data.data) {
      return data.data
    }

    // 识别失败，显示错误提示
    Taro.showToast({
      title: data.message || '未能识别出品种，请尝试更清晰的照片',
      icon: 'none',
      duration: 2500,
    })
    return null
  } catch (err) {
    console.error('[BreedService] 品种识别失败:', err)
    Taro.showToast({
      title: '网络异常，请重试',
      icon: 'none',
      duration: 2000,
    })
    return null
  }
}

/**
 * 在品种库中匹配识别结果
 * 返回匹配到的品种 ID，未匹配到返回 null
 */
export function matchBreedInData(
  breedName: string,
  species: 'dog' | 'cat',
  breedData: Array<{ id: string; name: string; species: string; aliases: string[] }>
): string | null {
  if (!breedName) return null

  // 精确匹配名称
  const exactMatch = breedData.find(
    (b) => b.species === species && b.name === breedName
  )
  if (exactMatch) return exactMatch.id

  // 模糊匹配别名
  const aliasMatch = breedData.find(
    (b) =>
      b.species === species &&
      b.aliases.some(
        (a) =>
          a === breedName ||
          breedName.includes(a) ||
          a.includes(breedName)
      )
  )
  if (aliasMatch) return aliasMatch.id

  // 包含匹配
  const containsMatch = breedData.find(
    (b) =>
      b.species === species &&
      (b.name.includes(breedName) || breedName.includes(b.name))
  )
  if (containsMatch) return containsMatch.id

  return null
}

// ===== 品种知识库热更新（复刻 knowledgeService.syncKnowledgeGraph 模式） =====

/** 品种库缓存 key（storage 内部带 xhh_ 前缀） */
const BREED_CACHE_KEY = 'breed_knowledge'

/** 服务端品种库响应（body.data 结构，与 GET /api/breeds/knowledge 返回一致） */
interface BreedKnowledgeResponse {
  version: string
  data: {
    version: string
    breeds: BreedItem[]
  }
}

/**
 * 品种库结构最小校验（与服务端 isValidBreedData 同口径）
 * 防止坏数据切换：除 id/name/species/sources 外还必须校验渲染必需字段——
 * aliases（checkin/edit/add 直接调数组方法）与 weightRange.min/max（趋势页体型兜底直接取数值），
 * 任一缺失都会在消费点抛 TypeError 白屏（审查项修复：防线闭合到"渲染必需字段"粒度）。
 */
function isValidBreedList(breeds: unknown): breeds is BreedItem[] {
  if (!Array.isArray(breeds) || breeds.length === 0) return false
  return breeds.every(
    (b) =>
      b &&
      typeof b.id === 'string' &&
      typeof b.name === 'string' &&
      (b.species === 'cat' || b.species === 'dog') &&
      Array.isArray(b.aliases) &&
      !!b.weightRange &&
      typeof b.weightRange.min === 'number' &&
      typeof b.weightRange.max === 'number' &&
      Array.isArray(b.sources) &&
      b.sources.length > 0 &&
      b.sources.every((s: unknown) => typeof s === 'string'),
  )
}

/**
 * 同步最新品种知识库（热更新，品种百科页/添加宠物面板打开时调用一次，失败不阻塞）
 * 优先级：网络成功（校验结构）→ 本地缓存 → 静态兜底（不切换，保持打包内 BREED_DATA）
 * @returns 是否成功切换到服务端/缓存版本（false 表示继续用静态兜底，调用方无需处理）
 */
export async function syncBreedKnowledge(): Promise<boolean> {
  try {
    const res = await api.get<BreedKnowledgeResponse>('/breeds/knowledge')
    if (res && res.data && isValidBreedList(res.data.breeds)) {
      setActiveBreeds(res.data.breeds)
      // 缓存写入独立 try/catch（审查项修复）：storage 配额满等异常不能吞掉已成功的切换，
      // 否则返回 false 让调用方误判失败、不刷新信号，界面停留静态库而模块层已是新库
      try {
        setStorage(BREED_CACHE_KEY, res)
      } catch (cacheErr) {
        console.warn('[BreedService] 品种库缓存写入失败（不影响本次切换）:', cacheErr)
      }
      return true
    }
  } catch {
    // 网络失败：走本地缓存兜底（未登录/弱网场景品种页仍可用旧版本数据）
  }
  const cached = getStorage<BreedKnowledgeResponse>(BREED_CACHE_KEY)
  if (cached && cached.data && isValidBreedList(cached.data.breeds)) {
    setActiveBreeds(cached.data.breeds)
    return true
  }
  return false
}