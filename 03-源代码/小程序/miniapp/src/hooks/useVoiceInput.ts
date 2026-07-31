/**
 * 语音输入 Hook
 * 封装微信录音管理器，管理录音状态与生命周期，提供 press-and-hold 式语音输入
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'

export interface UseVoiceInputOptions {
  /** 录音完成后回调，返回音频临时文件路径 */
  onRecordComplete: (tempFilePath: string) => void
  /** 录音最大时长（秒），默认 60 */
  maxDuration?: number
}

/**
 * 语音输入 Hook
 *
 * 封装微信录音管理器，管理录音状态与生命周期，
 * 提供 press-and-hold 式语音输入能力。
 */
export function useVoiceInput(options: UseVoiceInputOptions) {
  const { onRecordComplete, maxDuration = 60 } = options
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const recorderRef = useRef<Taro.RecorderManager | null>(null)
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onRecordCompleteRef = useRef(onRecordComplete)

  // 保持回调引用最新
  useEffect(() => {
    onRecordCompleteRef.current = onRecordComplete
  }, [onRecordComplete])

  // 初始化录音管理器
  useEffect(() => {
    const recorder = Taro.getRecorderManager()
    recorderRef.current = recorder

    recorder.onStart(() => {
      setIsRecording(true)
      setRecordDuration(0)
      // 每秒更新录音时长
      durationTimerRef.current = setInterval(() => {
        setRecordDuration(prev => {
          if (prev >= maxDuration) {
            recorder.stop()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    })

    recorder.onStop((res) => {
      setIsRecording(false)
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }
      if (res.tempFilePath) {
        onRecordCompleteRef.current(res.tempFilePath)
      }
    })

    recorder.onError((err) => {
      setIsRecording(false)
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }
      Taro.showToast({ title: '录音失败，请重试', icon: 'none' })
      console.error('[VoiceInput] Recorder error:', err)
    })

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
      }
    }
  }, [maxDuration])

  /** 开始录音 */
  const startRecord = useCallback(() => {
    if (isRecording) return
    recorderRef.current?.start({
      duration: maxDuration * 1000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3',
    })
  }, [isRecording, maxDuration])

  /** 停止录音 */
  const stopRecord = useCallback(() => {
    if (!isRecording) return
    recorderRef.current?.stop()
  }, [isRecording])

  return {
    isRecording,
    recordDuration,
    startRecord,
    stopRecord,
  }
}