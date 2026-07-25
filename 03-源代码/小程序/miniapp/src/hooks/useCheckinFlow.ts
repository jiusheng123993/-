import { useCallback, useState } from 'react'
import type { CardData, CheckinItem, PetInfo } from '../types/chatTypes'

const CHECKIN_ITEMS: CheckinItem[] = [
  {
    key: 'stool', emoji: '💩', label: '大便情况', question: '{name}今天的大便怎么样？',
    options: [
      { label: '成型正常', score: 5 },
      { label: '偏软但不稀', score: 3 },
      { label: '拉稀/软便', score: 1 },
      { label: '没拉 / 未观察', score: 0 },
    ],
  },
  {
    key: 'pee', emoji: '💧', label: '小便情况', question: '小便颜色和频率正常吗？',
    options: [
      { label: '清亮，次数正常', score: 5 },
      { label: '颜色偏黄', score: 3 },
      { label: '频次异常', score: 1 },
      { label: '没注意', score: 0 },
    ],
  },
  {
    key: 'appetite', emoji: '🍖', label: '食欲状况', question: '{name}今天吃饭怎么样？',
    options: [
      { label: '胃口很好，光盘', score: 5 },
      { label: '正常吃完', score: 4 },
      { label: '吃得比较少', score: 2 },
      { label: '完全不吃', score: 1 },
    ],
  },
  {
    key: 'energy', emoji: '⚡', label: '精神活力', question: '{name}今天精神头怎么样？',
    options: [
      { label: '活力满满，拆家选手', score: 5 },
      { label: '正常活动', score: 4 },
      { label: '有点蔫，不太想动', score: 2 },
      { label: '趴着不动，精神差', score: 1 },
    ],
  },
  {
    key: 'weight', emoji: '⚖', label: '体重确认', question: '体重今天称了吗？（参考：上周28.0kg）',
    options: [
      { label: '28.0kg 左右，稳定', score: 5 },
      { label: '27.5-27.9kg，小幅下降', score: 3 },
      { label: '28.5kg 以上，小幅上升', score: 3 },
      { label: '今天没称', score: 0 },
    ],
  },
]

export interface UseCheckinFlowParams {
  addAiMsg: (content: string, options?: string[]) => void
  addUserMsg: (content: string) => void
  addMessage: (msg: { type: 'ai' | 'user'; content: string; card?: CardData; options?: string[] }) => void
  petInfo: PetInfo
}

/**
 * 健康打卡流程 Hook
 *
 * 管理打卡步骤与打卡数据，
 * 负责 5 项健康指标的逐项询问、选项处理与最终报告生成。
 */
export function useCheckinFlow(params: UseCheckinFlowParams) {
  const { addAiMsg, addUserMsg, addMessage, petInfo } = params
  const [checkinStep, setCheckinStep] = useState(-1)
  const [checkinData, setCheckinData] = useState<Record<string, { label: string; score: number }>>({})

  const finishCheckin = useCallback(() => {
    setCheckinData(prevData => {
      const entries = Object.entries(prevData)
      const total = entries.reduce((s, [, v]) => s + v.score, 0)
      const maxScore = entries.length * 5
      const rate = Math.round((total / maxScore) * 100)

      setCheckinStep(-1)

      const stats = entries.map(([k, v]) => {
        const item = CHECKIN_ITEMS.find(it => it.key === k)
        return { label: item?.label || k, value: v.label, emoji: item?.emoji }
      })
      const card: CardData = {
        type: 'checkin_result',
        data: {},
        title: '📊 今日健康报告',
        score: rate,
        maxScore: 100,
        stats,
      }
      let summary = '打卡完成！健康报告出炉 ✦'
      if (rate >= 90) summary += '\n\n太棒了！状态满分 ✦ 继续保持！'
      else if (rate >= 70) summary += '\n\n整体还不错！有些项目需要注意一下～'
      else summary += '\n\n状态不太理想，建议多观察。可以做个症状初筛看看。'
      addMessage({ type: 'ai', content: summary, card })
      return prevData
    })
  }, [addMessage])

  const askCheckinItem = useCallback(
    (step: number) => {
      setCheckinStep(step)
      if (step >= CHECKIN_ITEMS.length) {
        finishCheckin()
        return
      }
      const item = CHECKIN_ITEMS[step]
      const progress = `${step + 1}/5`
      addAiMsg(
        `${item.emoji} ${progress} ${item.label}\n${item.question.replace(/\{name\}/g, petInfo.name)}`,
        item.options.map(o => o.label)
      )
    },
    [addAiMsg, finishCheckin, petInfo.name]
  )

  const startCheckin = useCallback(() => {
    setCheckinData({})
    setCheckinStep(0)
    addAiMsg('好的！让我们来做个快速打卡 ✦\n\n一共5项，大概1分钟完成～我们从第一项开始：')
    setTimeout(() => askCheckinItem(0), 600)
  }, [addAiMsg, askCheckinItem])

  /** 处理用户对某一项打卡的选择 */
  const handleCheckinAnswer = useCallback(
    (label: string) => {
      const item = CHECKIN_ITEMS[checkinStep]
      const option = item.options.find(o => o.label === label)
      if (!option) return
      addUserMsg(label)
      setCheckinData(prev => ({ ...prev, [item.key]: { label, score: option.score } }))
      const next = checkinStep + 1
      setCheckinStep(next)
      setTimeout(() => askCheckinItem(next), 400)
    },
    [addUserMsg, askCheckinItem, checkinStep]
  )

  return {
    checkinStep,
    checkinData,
    startCheckin,
    handleCheckinAnswer,
    handleCheckinComplete: finishCheckin,
  }
}

export type UseCheckinFlowReturn = ReturnType<typeof useCheckinFlow>
