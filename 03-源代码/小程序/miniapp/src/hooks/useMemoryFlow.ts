/**
 * 回忆录制流程 Hook
 * 管理回忆录制激活状态、照片选择和上传，将用户输入的回忆写入时间线服务
 */
import { useCallback, useState } from 'react'
import Taro from '@tarojs/taro'
import { timelineService } from '../services/timelineService'
import { useAuthStore } from '../stores/authStore'
import { CONFIG } from '../config'
import { storage } from '../utils/storage'
import { chooseImageWithPrivacy } from '../utils/privacy'
import { logger } from '../logger'
import type { PetInfo } from '../types/chatTypes'

export interface UseMemoryFlowParams {
  addAiMsg: (content: string, options?: string[]) => void
  addUserMsg: (content: string) => void
  setIsTyping: (typing: boolean) => void
  petInfo: PetInfo
}

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic']

/**
 * 回忆录制流程 Hook
 *
 * 管理回忆录制激活状态、照片选择和上传，
 * 负责将用户输入的回忆文本和照片写入时间线服务。
 */
export function useMemoryFlow(params: UseMemoryFlowParams) {
  const { addAiMsg, setIsTyping, petInfo } = params
  const [memoryActive, setMemoryActive] = useState(false)
  const [memoryPhoto, setMemoryPhoto] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  /** 启动回忆录制流程 */
  const startMemoryRecord = useCallback(() => {
    setMemoryActive(true)
    setMemoryPhoto(null)
    addAiMsg('要记录一段回忆吗？太棒了 ✦\n\n你可以：\n1. 点击下方 📷 按钮拍照或上传一张照片\n2. 在输入框写一段话描述这个瞬间\n\n我会帮你整理成回忆卡片～')
  }, [addAiMsg])

  /** 选择照片（拍照或相册） */
  const handleMemoryPhoto = useCallback(async () => {
    try {
      const res = await chooseImageWithPrivacy({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      if (!res.tempFilePaths.length) return

      const filePath = res.tempFilePaths[0]
      const ext = filePath.split('.').pop()?.toLowerCase() || ''
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        Taro.showToast({ title: '请上传 JPG/PNG/WebP 格式图片', icon: 'none' })
        return
      }

      setMemoryPhoto(filePath)
      Taro.showToast({ title: '照片已选择，继续输入文字吧～', icon: 'success', duration: 1500 })
    } catch (err) {
      if ((err as { errMsg?: string }).errMsg?.includes('cancel')) {
        return
      }
      Taro.showToast({ title: '选择照片失败', icon: 'none' })
    }
  }, [])

  /** 清除已选照片 */
  const clearMemoryPhoto = useCallback(() => {
    setMemoryPhoto(null)
  }, [])

  /** 上传照片到服务器 */
  const uploadMemoryPhoto = useCallback(async (): Promise<string | null> => {
    if (!memoryPhoto) return null
    setIsUploadingPhoto(true)
    try {
      const token = storage.getToken()
      const res = await Taro.uploadFile({
        url: `${CONFIG.API_BASE_URL}/api/timeline/photo/upload`,
        filePath: memoryPhoto,
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
    } finally {
      setIsUploadingPhoto(false)
    }
  }, [memoryPhoto])

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
        // 先上传照片（如果有）
        let photoUrl: string | null = null
        if (memoryPhoto) {
          photoUrl = await uploadMemoryPhoto()
        }

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
          photos: photoUrl ? [photoUrl] : [],
        })
        setMemoryPhoto(null)
        setIsTyping(false)
        if (photoUrl) {
          addAiMsg('回忆已记录 ✦\n\n照片和文字都已保存，你可以在「时光」页面查看所有回忆哦～')
        } else {
          addAiMsg('回忆已记录 ✦\n\n你可以在「时光」页面查看所有回忆哦～')
        }
      } catch (err) {
        setMemoryPhoto(null)
        setIsTyping(false)
        logger.error('index', 'memory record failed', err)
        addAiMsg('回忆已保存到本地 ✦\n\n你可以在「时光」页面查看所有回忆～')
      }
    },
    [addAiMsg, memoryPhoto, petInfo.activePet, petInfo.emoji, petInfo.name, setIsTyping, uploadMemoryPhoto]
  )

  return {
    memoryActive,
    setMemoryActive,
    memoryPhoto,
    isUploadingPhoto,
    startMemoryRecord,
    handleMemoryPhoto,
    clearMemoryPhoto,
    handleMemoryRecord,
  }
}

export type UseMemoryFlowReturn = ReturnType<typeof useMemoryFlow>