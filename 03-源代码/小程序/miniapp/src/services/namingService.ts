/**
 * AI 取名服务
 *
 * 调用 AI 为宠物生成名字建议，含本地缓存
 */
import Taro from '@tarojs/taro'
import { chat, guardCheck } from './aiProvider'
import { checkInput } from '../utils/ruleGuard'
import { requireAuth } from '../utils/authGuard'
import { CONFIG } from '../config'
import { storage } from '../utils/storage'

function sanitizeInput(text: string): string {
  return text.replace(/[<>\n\r]/g, '').substring(0, 50)
}

/**
 * 上传宠物照片用于取名分析
 * @returns 上传后的照片 URL，失败返回 null
 */
export async function uploadNamingPhoto(tempFilePath: string): Promise<string | null> {
  try {
    const token = storage.getToken()
    const res = await Taro.uploadFile({
      url: `${CONFIG.API_BASE_URL}/api/naming/photo/upload`,
      filePath: tempFilePath,
      name: 'photo',
      header: token ? { Authorization: `Bearer ${token}` } : {},
    })

    const data = JSON.parse(res.data) as { success: boolean; data?: { url: string }; url?: string }
    if (data.success) {
      return data.data?.url || data.url || null
    }
    return null
  } catch {
    return null
  }
}

/**
 * 解读用户提供的名字
 */
export async function interpretName(
  name: string,
  breed: string,
  birthDate: string
): Promise<string> {
  requireAuth()

  const safeName = sanitizeInput(name)
  const safeBreed = sanitizeInput(breed)
  const safeBirthDate = sanitizeInput(birthDate)

  const ruleResult = checkInput(safeName + safeBreed + safeBirthDate)
  if (ruleResult.blocked) {
    return '抱歉，检测到不安全的输入，请使用其他名字重试。'
  }

  const guardResult = await guardCheck(safeName + safeBreed)
  if (guardResult.isHarmful) {
    return '抱歉，检测到不安全的输入，请使用其他名字重试。'
  }

  const { buildInterpretPrompt } = await import('../utils/namingPrompts')
  const prompt = buildInterpretPrompt(safeName, safeBreed, safeBirthDate)
  return await chat({
    messages: [
      { role: 'system', content: '你是一位精通中国传统文化的取名大师。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
  })
}

export interface RecommendNamesParams {
  breed: string
  birthDate: string
  gender: string
  style?: string
  photoUrl?: string
  description?: string
  /** 已推荐过的名字，避免重复 */
  excludeNames?: string[]
}

/**
 * AI 推荐宠物名字
 *
 * 支持传入照片 URL 和文字描述，AI 会综合所有信息推荐 5 个名字。
 */
export async function recommendNames(params: RecommendNamesParams): Promise<string> {
  requireAuth()

  const { breed, birthDate, gender, style, photoUrl, description, excludeNames } = params

  const safeBreed = sanitizeInput(breed)
  const safeBirthDate = sanitizeInput(birthDate)
  const safeGender = sanitizeInput(gender)
  const safeStyle = style ? sanitizeInput(style) : undefined
  const safeDesc = description ? sanitizeInput(description) : undefined
  const safeExcludeNames = excludeNames?.filter(n => n.length <= 10).map(n => sanitizeInput(n))

  const ruleResult = checkInput(safeBreed + safeGender + (safeDesc || ''))
  if (ruleResult.blocked) {
    return '抱歉，检测到不安全的输入，请使用其他内容重试。'
  }

  const { buildRecommendPrompt } = await import('../utils/namingPrompts')
  const season = getBirthSeason(safeBirthDate)
  const prompt = buildRecommendPrompt({
    breed: safeBreed,
    birthDate: safeBirthDate,
    gender: safeGender,
    season,
    style: safeStyle,
    photoUrl,
    description: safeDesc,
    excludeNames: safeExcludeNames,
  })

  return await chat({
    messages: [
      { role: 'system', content: '你是一位精通中国文化的宠物取名大师。请严格按JSON格式返回结果。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 2048,
  })
}

function getBirthSeason(dateStr: string): string {
  const month = new Date(dateStr).getMonth() + 1
  if (month >= 3 && month <= 5) return '春'
  if (month >= 6 && month <= 8) return '夏'
  if (month >= 9 && month <= 11) return '秋'
  return '冬'
}

export interface AnalyzeNameDetailParams {
  name: string
  breed: string
  birthDate: string
  gender: string
  wuxing: string
  starMansion: string
  description?: string
}

/**
 * AI 命理深度分析宠物名字
 *
 * 点击名字卡片后调用，返回包含八字、运势、五行、星宿等命理级别的深度分析。
 */
export async function analyzeNameDetail(params: AnalyzeNameDetailParams): Promise<string> {
  requireAuth()

  const { name, breed, birthDate, gender, wuxing, starMansion, description } = params

  const safeName = sanitizeInput(name)
  const safeBreed = sanitizeInput(breed)
  const safeBirthDate = sanitizeInput(birthDate)
  const safeGender = sanitizeInput(gender)
  const safeWuxing = sanitizeInput(wuxing)
  const safeStarMansion = sanitizeInput(starMansion)
  const safeDesc = description ? sanitizeInput(description) : undefined

  const ruleResult = checkInput(safeName + safeBreed + safeGender + (safeDesc || ''))
  if (ruleResult.blocked) {
    return ''
  }

  const { buildDetailPrompt } = await import('../utils/namingPrompts')
  const season = getBirthSeason(safeBirthDate)
  const prompt = buildDetailPrompt({
    name: safeName,
    breed: safeBreed,
    birthDate: safeBirthDate,
    gender: safeGender,
    season,
    wuxing: safeWuxing,
    starMansion: safeStarMansion,
    description: safeDesc,
  })

  return await chat({
    messages: [
      { role: 'system', content: '你是一位精通中国传统命理学的取名大师。请严格按JSON格式返回结果。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.85,
    max_tokens: 2048,
  })
}