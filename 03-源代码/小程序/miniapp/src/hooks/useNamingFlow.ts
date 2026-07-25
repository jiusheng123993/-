import { useCallback, useState } from 'react'
import { recommendNames } from '../services/namingService'
import { usePetStore } from '../stores/petStore'
import { CONFIG } from '../config'
import type { CardData, NamingResult, PetInfo } from '../types/chatTypes'

interface NamingStep {
  key: string
  question: string
  options: string[]
}

const NAMING_STEPS: NamingStep[] = [
  {
    key: 'gender', question: '新宝贝是男生还是女生呀？',
    options: ['男生 ♂', '女生 ♀', '还不知道 / 无所谓'],
  },
  {
    key: 'style', question: '你喜欢什么风格的名字？',
    options: ['古风诗意（如：墨韵、云栖）', '可爱萌系（如：团团、布丁）', '食物系列（如：年糕、汤圆）', '自然元素（如：星河、山月）'],
  },
]

/** 基于风格本地生成候选名字（API 不可用时的降级方案） */
function generateNames(style: string): NamingResult[] {
  if (style.includes('古风')) return [
    { name: '墨韵', meaning: '墨香氤氲，韵味悠长。适合气质优雅的宝贝', score: 95 },
    { name: '云栖', meaning: '云深不知处，栖居于心。安静温柔的好名字', score: 92 },
    { name: '霁月', meaning: '雨过天晴，月明如洗。寓意拨云见日，好运连连', score: 88 },
  ]
  if (style.includes('可爱')) return [
    { name: '布丁', meaning: '甜甜蜜蜜，软软糯糯。让人忍不住想rua', score: 93 },
    { name: '泡芙', meaning: '外表酥脆内心柔软，可爱又有个性', score: 90 },
    { name: '奶糖', meaning: '奶香四溢，甜而不腻。治愈系首选', score: 87 },
  ]
  if (style.includes('食物')) return [
    { name: '年糕', meaning: '年年高升，黏人暖心。适合粘人的小可爱', score: 94 },
    { name: '汤圆', meaning: '团团圆圆，白白胖胖。寓意家庭美满幸福', score: 91 },
    { name: '麻薯', meaning: 'Q弹软糯，外表朴素内有惊喜。独一无二的小特别', score: 85 },
  ]
  return [
    { name: '星河', meaning: '璀璨星河，独一无二。愿它成为你生命中最亮的光', score: 96 },
    { name: '山月', meaning: '山间明月，清辉婉转。安静而坚定的陪伴', score: 90 },
    { name: '朝露', meaning: '清晨的露珠，纯净珍贵。每一天都是新的开始', score: 87 },
  ]
}

/** 解析 AI 返回的取名推荐文本为结构化结果 */
function parseRecommendResult(text: string): NamingResult[] {
  const results: NamingResult[] = []
  const lines = text.split('\n').filter(l => l.trim())
  for (const line of lines) {
    const scoreMatch = line.match(/(\d{1,3})\s*分/)
    const nameMatch = line.match(/[「【《]?\s*(.{1,8})\s*[」】》]?[:：\s]+(.+)/)
    if (nameMatch) {
      results.push({
        name: nameMatch[1].replace(/[「」【】《》]/g, '').trim(),
        meaning: nameMatch[2].trim(),
        score: scoreMatch ? parseInt(scoreMatch[1]) : 85,
      })
    }
  }
  if (results.length === 0) {
    const nameRegex = /(\d+)[.、]\s*[「【《]?\s*(.{1,8})\s*[」】》]?\s*[:：\s-]+(.+)/g
    let match: RegExpExecArray | null
    while ((match = nameRegex.exec(text)) !== null) {
      results.push({
        name: match[2].replace(/[「」【】《》]/g, '').trim(),
        meaning: match[3].trim(),
        score: parseInt(match[1]) * 10,
      })
    }
  }
  return results.slice(0, 5)
}

export interface UseNamingFlowParams {
  addAiMsg: (content: string, options?: string[]) => void
  addUserMsg: (content: string) => void
  addMessage: (msg: { type: 'ai' | 'user'; content: string; card?: CardData; options?: string[] }) => void
  petInfo: PetInfo
}

/**
 * AI 取名流程 Hook
 *
 * 管理取名步骤与数据，
 * 负责 2 步偏好收集与最终名字推荐卡片生成。
 */
export function useNamingFlow(params: UseNamingFlowParams) {
  const { addAiMsg, addUserMsg, addMessage, petInfo } = params
  const [namingStep, setNamingStep] = useState(-1)
  const [namingData, setNamingData] = useState<Record<string, string>>({})

  const finishNaming = useCallback(async () => {
    setNamingStep(-1)
    const style = namingData.style || ''
    const genderText = namingData.gender || ''

    let names: NamingResult[] = []

    if (!CONFIG.USE_MOCK) {
      try {
        const pet = usePetStore.getState().currentPet
        const breed = pet?.breed || '未知品种'
        const birthDate = pet?.birthDate || ''
        const gender = genderText.includes('男') ? 'male' : genderText.includes('女') ? 'female' : 'unknown'

        const result = await recommendNames(breed, birthDate, gender)
        const parsed = parseRecommendResult(result)
        if (parsed.length > 0) {
          names = parsed
        }
      } catch {
        // true AI API不可用时降级到本地生成
      }
    }

    if (names.length === 0) {
      names = generateNames(style)
    }

    const card: CardData = {
      type: 'naming_cards',
      data: {},
      names,
    }
    addMessage({ type: 'ai', content: '基于你的偏好，我为你推荐以下名字 ✦', card })
  }, [addMessage, namingData.gender, namingData.style])

  const askNamingItem = useCallback(
    (step: number) => {
      setNamingStep(step)
      if (step >= NAMING_STEPS.length) {
        finishNaming()
        return
      }
      const s = NAMING_STEPS[step]
      addAiMsg(s.question.replace(/\{name\}/g, petInfo.name), s.options)
    },
    [addAiMsg, finishNaming, petInfo.name]
  )

  const startNaming = useCallback(() => {
    setNamingData({})
    setNamingStep(0)
    addAiMsg('要给新宝贝取名字吗？太开心了！让我来帮你 ✦\n\n请先告诉我一些基本信息～')
    setTimeout(() => askNamingItem(0), 500)
  }, [addAiMsg, askNamingItem])

  /** 处理用户对某一项取名偏好的选择 */
  const handleNamingAnswer = useCallback(
    (text: string) => {
      const s = NAMING_STEPS[namingStep]
      addUserMsg(text)
      setNamingData(prev => ({ ...prev, [s.key]: text }))
      const next = namingStep + 1
      setNamingStep(next)
      setTimeout(() => askNamingItem(next), 400)
    },
    [addUserMsg, askNamingItem, namingStep]
  )

  return {
    namingStep,
    namingData,
    startNaming,
    handleNamingAnswer,
  }
}

export type UseNamingFlowReturn = ReturnType<typeof useNamingFlow>
