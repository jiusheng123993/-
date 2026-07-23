import { chat } from './aiProvider'

export async function interpretName(
  name: string,
  breed: string,
  birthDate: string
): Promise<string> {
  const { buildInterpretPrompt } = await import('../utils/namingPrompts')
  const prompt = buildInterpretPrompt(name, breed, birthDate)
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
  const { buildRecommendPrompt } = await import('../utils/namingPrompts')
  const season = getBirthSeason(birthDate)
  const prompt = buildRecommendPrompt(breed, birthDate, gender, season)
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
