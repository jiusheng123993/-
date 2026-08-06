/**
 * 健康打卡流程 Hook
 * 管理打卡步骤与打卡数据，支持多宠物选择和 5 项健康指标的逐项询问
 */
import { useCallback, useState } from 'react'
import type { CardData, CheckinItem, PetInfo } from '../types/chatTypes'
import { usePetStore, type PetProfile } from '../stores/petStore'
import { useAuthStore } from '../stores/authStore'
import { batchCreateCheckins, getTodayCheckin, type CheckinInput } from '../services/checkinService'

/** 多宠一键打卡的选项文案（用于多宠选择步骤） */
const BATCH_CHECKIN_LABEL = '🐾 全部正常，一键打卡'

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
    key: 'weight', emoji: '⚖', label: '体重确认', question: '体重今天称了吗？',
    options: [
      { label: '体重稳定', score: 5 },
      { label: '小幅下降', score: 3 },
      { label: '小幅上升', score: 3 },
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
 * 支持多宠物选择（多宠物时先选宠物再打卡），
 * 负责 5 项健康指标的逐项询问、选项处理与最终报告生成。
 */
export function useCheckinFlow(params: UseCheckinFlowParams) {
  const { addAiMsg, addUserMsg, addMessage, petInfo } = params
  const [checkinStep, setCheckinStep] = useState(-1)
  const [checkinData, setCheckinData] = useState<Record<string, { label: string; score: number }>>({})
  const [selectedPetName, setSelectedPetName] = useState<string>('')

  const pets = usePetStore(s => s.pets)

  /** 获取当前打卡的目标宠物名 */
  const getPetName = useCallback(() => {
    return selectedPetName || petInfo.name
  }, [selectedPetName, petInfo.name])

  const finishCheckin = useCallback(() => {
    setCheckinData(prevData => {
      const entries = Object.entries(prevData)
      const total = entries.reduce((s, [, v]) => s + v.score, 0)
      const maxScore = entries.length * 5
      const rate = Math.round((total / maxScore) * 100)

      setCheckinStep(-1)
      setSelectedPetName('')

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
      const petName = getPetName()
      let summary = `${petName}的打卡完成！健康报告出炉 ✦`
      if (rate >= 90) summary += '\n\n太棒了！状态满分 ✦ 继续保持！'
      else if (rate >= 70) summary += '\n\n整体还不错！有些项目需要注意一下～'
      else summary += '\n\n状态不太理想，建议多观察。可以做个症状初筛看看。'
      addMessage({ type: 'ai', content: summary, card })
      return prevData
    })
  }, [addMessage, getPetName])

  const askCheckinItem = useCallback(
    (step: number) => {
      setCheckinStep(step)
      if (step >= CHECKIN_ITEMS.length) {
        finishCheckin()
        return
      }
      const item = CHECKIN_ITEMS[step]
      const petName = getPetName()
      const progress = `${step + 1}/5`
      addAiMsg(
        `${item.emoji} ${progress} ${item.label}\n${item.question.replace(/\{name\}/g, petName)}`,
        item.options.map(o => o.label)
      )
    },
    [addAiMsg, finishCheckin, getPetName]
  )

  const startCheckin = useCallback(() => {
    setCheckinData({})
    // 多宠物时先让用户选择
    if (pets.length > 1) {
      setCheckinStep(-2)
      addAiMsg(
        '好的！要为哪只毛孩子打卡呢？',
        [...pets.map(p => `${p.species === 'cat' ? '🐱' : '🐕'} ${p.name}`), BATCH_CHECKIN_LABEL]
      )
      return
    }
    // 单宠物直接开始
    setCheckinStep(0)
    const petName = getPetName()
    addAiMsg(`好的！让我们来给${petName}做个快速打卡 ✦\n\n一共5项，大概1分钟完成～我们从第一项开始：`)
    setTimeout(() => askCheckinItem(0), 600)
  }, [addAiMsg, askCheckinItem, pets, getPetName])

  /** 多宠一键打卡：为所有今天还没打卡的宠物批量提交“全部正常”默认指标 */
  const runBatchCheckin = useCallback(async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId || pets.length === 0) {
      addAiMsg('还没有可打卡的宠物，先添加毛孩子再来吧～')
      return
    }
    try {
      // 只批量处理今天尚未打卡的宠物，避免同一天重复记录
      const unchecked: PetProfile[] = []
      for (const p of pets) {
        const today = await getTodayCheckin(p.id, userId)
        if (!today) unchecked.push(p)
      }
      if (unchecked.length === 0) {
        addAiMsg('今天大家都已经打过卡啦，都是健康小标兵 🎉')
        return
      }
      const items: CheckinInput[] = unchecked.map(p => ({
        petId: p.id,
        userId,
        poopLevel: 3,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 2,
        hasAnomaly: false,
        anomalyItems: [],
      }))
      await batchCreateCheckins(items)
      addAiMsg(
        `搞定！已为 ${unchecked.length} 只毛孩子完成打卡 ✦\n\n` +
        `${unchecked.map(p => p.name).join('、')} 今天都是满分状态！`,
      )
    } catch {
      addAiMsg('批量打卡出了点小问题，稍后再试一次吧～')
    }
  }, [addAiMsg, pets])

  /** 处理用户对某一项打卡的选择 */
  const handleCheckinAnswer = useCallback(
    (label: string): boolean => {
      // 宠物选择步骤
      if (checkinStep === -2) {
        // 多宠一键打卡：跳过逐只询问，直接批量提交
        if (label === BATCH_CHECKIN_LABEL) {
          addUserMsg(label)
          setCheckinStep(-1)
          void runBatchCheckin()
          return true
        }
        const pet = pets.find(p => `${p.species === 'cat' ? '🐱' : '🐕'} ${p.name}` === label)
        if (pet) {
          setSelectedPetName(pet.name)
          addUserMsg(label)
          setCheckinStep(0)
          addAiMsg(`好的！让我们来给${pet.name}做个快速打卡 ✦\n\n一共5项，大概1分钟完成～我们从第一项开始：`)
          setTimeout(() => askCheckinItem(0), 600)
          return true
        }
        // 尝试模糊匹配宠物名
        const fuzzyPet = pets.find(p => label.includes(p.name))
        if (fuzzyPet) {
          setSelectedPetName(fuzzyPet.name)
          addUserMsg(label)
          setCheckinStep(0)
          addAiMsg(`好的！让我们来给${fuzzyPet.name}做个快速打卡 ✦\n\n一共5项，大概1分钟完成～我们从第一项开始：`)
          setTimeout(() => askCheckinItem(0), 600)
          return true
        }
        return false
      }

      const item = CHECKIN_ITEMS[checkinStep]
      if (!item) return false
      const option = item.options.find(o => o.label === label)
      if (option) {
        addUserMsg(label)
        setCheckinData(prev => ({ ...prev, [item.key]: { label, score: option.score } }))
        const next = checkinStep + 1
        setCheckinStep(next)
        setTimeout(() => askCheckinItem(next), 400)
        return true
      }
      // 模糊匹配：语音输入可能不精确
      const fuzzyOption = item.options.find(o => label.includes(o.label) || o.label.includes(label))
      if (fuzzyOption) {
        addUserMsg(fuzzyOption.label)
        setCheckinData(prev => ({ ...prev, [item.key]: { label: fuzzyOption.label, score: fuzzyOption.score } }))
        const next = checkinStep + 1
        setCheckinStep(next)
        setTimeout(() => askCheckinItem(next), 400)
        return true
      }
      return false
    },
    [addUserMsg, askCheckinItem, checkinStep, pets, runBatchCheckin]
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
