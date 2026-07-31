/**
 * 症状初筛流程 Hook
 * 管理 4 步症状询问流程，负责选项处理与风险评估报告生成
 */
import { useCallback, useState } from 'react'
import type { CardData, PetInfo } from '../types/chatTypes'

interface SymptomStep {
  key: string
  title: string
  question: string
  options: string[]
}

const SYMPTOM_STEPS: SymptomStep[] = [
  {
    key: 'symptom', title: '第1步：主要症状', question: '出现了什么症状？',
    options: ['呕吐 / 反胃', '腹泻 / 软便', '食欲不振', '精神萎靡 / 嗜睡', '皮肤瘙痒 / 掉毛', '咳嗽 / 打喷嚏'],
  },
  {
    key: 'duration', title: '第2步：持续时间', question: '这个症状持续多久了？',
    options: ['刚开始，不到半天', '今天一整天了', '2-3天了', '超过3天了'],
  },
  {
    key: 'severity', title: '第3步：严重程度', question: '症状的严重程度如何？',
    options: ['轻微的，不太影响日常', '中等，能看出不舒服', '比较严重，明显异常', '非常严重，需要急救'],
  },
  {
    key: 'other', title: '第4步：其他信息', question: '还有没有其他异常？',
    options: ['没有其他异常', '体温偏高 / 发烧', '有外伤或肿块', '眼睛/鼻子有分泌物'],
  },
]

export interface UseSymptomFlowParams {
  addAiMsg: (content: string, options?: string[]) => void
  addUserMsg: (content: string) => void
  addMessage: (msg: { type: 'ai' | 'user'; content: string; card?: CardData; options?: string[] }) => void
  petInfo: PetInfo
}

/**
 * 症状初筛流程 Hook
 *
 * 管理症状初筛步骤与数据，
 * 负责 4 步症状询问、选项处理与风险评估报告生成。
 */
export function useSymptomFlow(params: UseSymptomFlowParams) {
  const { addAiMsg, addUserMsg, addMessage, petInfo } = params
  const [symptomStep, setSymptomStep] = useState(-1)
  const [symptomData, setSymptomData] = useState<Record<string, string>>({})

  const finishSymptomCheck = useCallback(() => {
    setSymptomData(prevData => {
      setSymptomStep(-1)
      const severity = prevData.severity || ''
      let riskLevel = 'low'
      let riskLabel = '暂不严重'
      let advice = '👍 看起来暂时不严重，继续观察即可。保持正常饮食和作息。'

      if (severity.includes('非常严重')) {
        riskLevel = 'critical'
        riskLabel = '紧急'
        advice = '🚨 症状紧急！建议立即带它前往最近的宠物医院。不要等待，不要自行用药。'
      } else if (severity.includes('比较严重')) {
        riskLevel = 'high'
        riskLabel = '建议尽快就医'
        advice = '⚠ 症状比较明显，建议24小时内去看兽医。暂时保持安静，提供充足的清水。'
      } else if (severity.includes('中等')) {
        riskLevel = 'mid'
        riskLabel = '可先观察'
        advice = '⚡ 可以先在家观察1-2天。如果症状加重再考虑就医。'
      }

      const symptomInfo = [
        { label: '主要症状', value: prevData.symptom || '-' },
        { label: '持续时间', value: prevData.duration || '-' },
        { label: '严重程度', value: severity || '-' },
        { label: '其他', value: prevData.other || '-' },
      ]
      const card: CardData = {
        type: 'symptom_result',
        data: {},
        title: '📋 症状评估报告',
        riskLevel,
        risk: riskLabel,
        symptomInfo,
        advice,
        hospitalList:
          riskLevel === 'critical' || riskLevel === 'high'
            ? ['🏥 瑞鹏宠物医院 · 1.2km', '🏥 美联众合 · 2.5km', '🏥 芭比堂 · 3.1km']
            : undefined,
      }
      const summary = `初筛完成 ✦\n\n风险等级：${riskLabel}`
      addMessage({ type: 'ai', content: summary, card })
      return prevData
    })
  }, [addMessage])

  const askSymptomItem = useCallback(
    (step: number) => {
      setSymptomStep(step)
      if (step >= SYMPTOM_STEPS.length) {
        finishSymptomCheck()
        return
      }
      const s = SYMPTOM_STEPS[step]
      addAiMsg(`${s.title}\n${s.question.replace(/\{name\}/g, petInfo.name)}`, s.options)
    },
    [addAiMsg, finishSymptomCheck, petInfo.name]
  )

  const startSymptom = useCallback(() => {
    setSymptomData({})
    setSymptomStep(0)
    addAiMsg('了解！让我做一个症状初筛 ✦\n\n⚠ 这是AI预评估，不能替代专业兽医诊断。如果情况紧急请直接就医。\n\n一共4个问题：')
    setTimeout(() => askSymptomItem(0), 600)
  }, [addAiMsg, askSymptomItem])

  /** 处理用户对某一项症状问题的选择 */
  const handleSymptomAnswer = useCallback(
    (text: string) => {
      const s = SYMPTOM_STEPS[symptomStep]
      addUserMsg(text)
      setSymptomData(prev => ({ ...prev, [s.key]: text }))
      const next = symptomStep + 1
      setSymptomStep(next)
      setTimeout(() => askSymptomItem(next), 400)
    },
    [addUserMsg, askSymptomItem, symptomStep]
  )

  return {
    symptomStep,
    symptomData,
    startSymptom,
    handleSymptomAnswer,
    handleSymptomComplete: finishSymptomCheck,
  }
}

export type UseSymptomFlowReturn = ReturnType<typeof useSymptomFlow>
