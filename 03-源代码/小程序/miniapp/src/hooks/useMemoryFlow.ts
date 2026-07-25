import { useCallback, useState } from 'react'
import { timelineService } from '../services/timelineService'
import { useAuthStore } from '../stores/authStore'
import { logger } from '../logger'
import type { PetInfo } from '../types/chatTypes'

export interface UseMemoryFlowParams {
  addAiMsg: (content: string, options?: string[]) => void
  addUserMsg: (content: string) => void
  setIsTyping: (typing: boolean) => void
  petInfo: PetInfo
}

/**
 * 回忆录制流程 Hook
 *
 * 管理回忆录制激活状态，
 * 负责将用户输入的回忆文本写入时间线服务。
 */
export function useMemoryFlow(params: UseMemoryFlowParams) {
  const { addAiMsg, setIsTyping, petInfo } = params
  const [memoryActive, setMemoryActive] = useState(false)

  /** 启动回忆录制流程 */
  const startMemoryRecord = useCallback(() => {
    setMemoryActive(true)
    addAiMsg('要记录一段回忆吗？在输入框写下这个值得记住的瞬间吧～')
  }, [addAiMsg])

  /** 处理用户输入的回忆文本并保存到时间线 */
  const handleMemoryRecord = useCallback(
    async (text: string) => {
      setMemoryActive(false)
      if (!petInfo.activePet?.id) {
        addAiMsg('请先添加宠物后再记录回忆。')
        return
      }
      setIsTyping(true)
      try {
        const userId = useAuthStore.getState().user?.id || ''
        await timelineService.addMoment({
          userId,
          petId: petInfo.activePet.id,
          type: 'memory',
          content: {
            petName: petInfo.name,
            petEmoji: petInfo.emoji,
            description: text,
          },
        })
        setIsTyping(false)
        addAiMsg('回忆已记录 ✦\n\n你可以在「时光」页面查看所有回忆哦～')
      } catch (err) {
        setIsTyping(false)
        logger.error('index', 'memory record failed', err)
        addAiMsg('回忆已保存到本地 ✦\n\n你可以在「时光」页面查看所有回忆～')
      }
    },
    [addAiMsg, petInfo.activePet, petInfo.emoji, petInfo.name, setIsTyping]
  )

  return {
    memoryActive,
    setMemoryActive,
    startMemoryRecord,
    handleMemoryRecord,
  }
}

export type UseMemoryFlowReturn = ReturnType<typeof useMemoryFlow>
