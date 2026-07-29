import Taro from '@tarojs/taro'
import { CONFIG } from '../config'
import { storage } from '../utils/storage'

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

    const data = JSON.parse(res.data) as {
      success: boolean
      message?: string
      data?: BreedRecognizeResult
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