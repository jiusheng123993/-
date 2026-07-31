/**
 * 食物查询流程 Hook
 * 管理食物查询激活状态，负责发起食物安全查询并生成结果卡片
 */
import { useCallback, useState } from 'react'
import { queryFood } from '../services/foodService'
import { useAuthStore } from '../stores/authStore'
import { logger } from '../logger'
import type { CardData, PetInfo } from '../types/chatTypes'

export interface UseFoodFlowParams {
  addAiMsg: (content: string, options?: string[]) => void
  addUserMsg: (content: string) => void
  addMessage: (msg: { type: 'ai' | 'user'; content: string; card?: CardData; options?: string[] }) => void
  setIsTyping: (typing: boolean) => void
  petInfo: PetInfo
}

/**
 * 食物查询流程 Hook
 *
 * 管理食物查询激活状态，
 * 负责发起食物安全查询并生成结果卡片。
 */
export function useFoodFlow(params: UseFoodFlowParams) {
  const { addAiMsg, addUserMsg, addMessage, setIsTyping, petInfo } = params
  const [foodActive, setFoodActive] = useState(false)

  /** 启动食物查询流程 */
  const handleFoodQuery = useCallback(() => {
    setFoodActive(true)
    addAiMsg('请告诉我你想查询的食物名称，我来帮你分析它对宠物是否安全～')
  }, [addAiMsg])

  /** 处理用户输入的食物名称并查询安全信息 */
  const selectFood = useCallback(
    async (foodName: string) => {
      addUserMsg(`查一下「${foodName}」`)
      setFoodActive(false)
      if (!petInfo.activePet?.id) {
        addAiMsg('请先添加宠物后再查询食物安全。')
        return
      }
      setIsTyping(true)
      try {
        const userId = useAuthStore.getState().user?.id || ''
        const result = await queryFood(
          userId,
          petInfo.activePet.id,
          foodName,
          petInfo.activePet.species as 'dog' | 'cat'
        )
        setIsTyping(false)

        const isSafe = result.safetyLevel === 'safe'
        const verdict = isSafe ? '✅ 可以吃（适量）' : '🚫 不能吃'
        const safetyEmoji =
          result.safetyLevel === 'toxic'
            ? '☠️'
            : result.safetyLevel === 'dangerous'
              ? '⚠️'
              : result.safetyLevel === 'caution'
                ? '⚡'
                : '✅'
        const card: CardData = {
          type: 'food_result',
          data: {},
          title: '📋 分析结果',
          safe: isSafe,
          risk: result.safetyLevel === 'toxic' ? 'P0' : result.safetyLevel === 'dangerous' ? 'P1' : 'P4',
          icon: safetyEmoji,
          foodName: result.foodName,
          desc: result.detail || '',
          advice: result.firstAid || (isSafe ? '适量喂食即可。' : '请勿喂食！'),
        }
        let summary = `${safetyEmoji} ${result.foodName} ${verdict}`
        if (!isSafe) {
          summary += '\n\n🚨 这是高风险食物，请务必远离！'
          if (result.symptoms && result.symptoms.length > 0) {
            summary += `\n中毒症状：${result.symptoms.join('、')}`
          }
        }
        addMessage({ type: 'ai', content: summary, card })
      } catch (err) {
        setIsTyping(false)
        logger.error('index', 'food query failed', err)
        addAiMsg('抱歉，食物查询暂时不可用，请稍后再试。')
      }
    },
    [addAiMsg, addMessage, addUserMsg, petInfo.activePet, setIsTyping]
  )

  return {
    foodActive,
    setFoodActive,
    handleFoodQuery,
    selectFood,
  }
}

export type UseFoodFlowReturn = ReturnType<typeof useFoodFlow>
