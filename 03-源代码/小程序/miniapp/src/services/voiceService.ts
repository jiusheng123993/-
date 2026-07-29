import Taro from '@tarojs/taro'
import { CONFIG } from '../config'
import { storage } from '../utils/storage'

/**
 * 上传录音文件到后端进行语音转文字
 * @param tempFilePath 录音临时文件路径
 * @returns 转写后的文本，失败返回 null
 */
export async function uploadVoiceForTranscription(tempFilePath: string): Promise<string | null> {
  try {
    const token = storage.getToken()
    const res = await Taro.uploadFile({
      url: `${CONFIG.API_BASE_URL}/api/ai/voice`,
      filePath: tempFilePath,
      name: 'audio',
      header: token ? { Authorization: `Bearer ${token}` } : {},
    })

    const data = JSON.parse(res.data) as { success: boolean; data?: { text: string } }
    if (data.success && data.data?.text) {
      return data.data.text
    }
    return null
  } catch (err) {
    console.error('[VoiceService] Upload failed:', err)
    return null
  }
}