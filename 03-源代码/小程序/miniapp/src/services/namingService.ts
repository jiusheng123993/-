import { chat, guardCheck } from './aiProvider'
import { checkInput } from '../utils/ruleGuard'
import { requireAuth } from '../utils/authGuard'

function sanitizeInput(text: string): string {
  return text.replace(/[<>\n\r]/g, '').substring(0, 50)
}

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

export async function recommendNames(
  breed: string,
  birthDate: string,
  gender: string
): Promise<string> {
  requireAuth()

  const safeBreed = sanitizeInput(breed)
  const safeBirthDate = sanitizeInput(birthDate)
  const safeGender = sanitizeInput(gender)

  const ruleResult = checkInput(safeBreed + safeGender)
  if (ruleResult.blocked) {
    return '抱歉，检测到不安全的输入，请使用其他内容重试。'
  }

  const { buildRecommendPrompt } = await import('../utils/namingPrompts')
  const season = getBirthSeason(safeBirthDate)
  const prompt = buildRecommendPrompt(safeBreed, safeBirthDate, safeGender, season)
  return await chat({
    messages: [
      { role: 'system', content: '你是一位精通中国文化的宠物取名大师。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
  })
}

function getBirthSeason(dateStr: string): string {
  const month = new Date(dateStr).getMonth() + 1
  if (month >= 3 && month <= 5) return '春'
  if (month >= 6 && month <= 8) return '夏'
  if (month >= 9 && month <= 11) return '秋'
  return '冬'
}
