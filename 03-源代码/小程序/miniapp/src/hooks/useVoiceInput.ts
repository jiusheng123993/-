/**
 * 语音输入 Hook（2026-09 改版：接入微信「同声传译」WechatSI 插件）
 *
 * 说明：
 * - 旧版用 Taro.getRecorderManager() 录原始音频 → 上传后端百炼 ASR 转写；
 *   该链路因后端 ASR 契约/权限问题一直失败，且依赖云服务付费。
 * - 现改为微信同声传译插件：按住说话时插件在微信侧直接识别并返回文字，
 *   **不经过业务服务器、不需要百炼/腾讯云密钥、不按量计费**。
 * - 依赖：①微信公众平台已添加「同声传译」插件（provider wx069ba97219f66d99）；
 *   ②app.config.ts 已声明 plugins.WechatSI。
 * - 仅微信小程序可用；其它平台（H5/App）能力检测后禁用，不抛错。
 *
 * ⚠️ 关键（2026-09 双 Agent 审查修复）：WechatSI 的 onStart/onStop/onError 是
 *   **回调槽位（赋值式）**，官方写法是 `manager.onStop = function(res){}`，
 *   不是 `manager.onStop(fn)` 方法调用；且官方方法表只有 onStart/onStop/onError，
 *   没有 onRecognize。用错会导致识别结果不回流或回调永不触发。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { isWeapp } from '../platform/detector'

export interface UseVoiceInputOptions {
  /** 识别完成回调，返回同声传译识别到的文本（空串 = 未识别到内容） */
  onRecognizeComplete: (text: string) => void
  /** 录音最大时长（毫秒），同声传译插件上限 60000、默认 60000 */
  maxDuration?: number
  /** 识别语言，默认 zh_CN（简体中文） */
  lang?: string
}

export function useVoiceInput(options: UseVoiceInputOptions) {
  const { onRecognizeComplete, maxDuration = 60000, lang = 'zh_CN' } = options
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const managerRef = useRef<any>(null)
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onRecognizeCompleteRef = useRef(onRecognizeComplete)
  const maxDurationRef = useRef(maxDuration)
  const langRef = useRef(lang)
  const elapsedSecondsRef = useRef(0)
  // 同步录音标记：startRecord 立即置 true，stopRecord/onStop/onError 复位，
  // 解决"极短点按、onStart 尚未把 isRecording 置 true 时 stopRecord 提前 return 导致后台录到上限"的竞态
  const recordingRef = useRef(false)

  // 保持回调/参数引用最新（用 ref，避免 manager 重建）
  useEffect(() => { onRecognizeCompleteRef.current = onRecognizeComplete }, [onRecognizeComplete])
  useEffect(() => { maxDurationRef.current = maxDuration }, [maxDuration])
  useEffect(() => { langRef.current = lang }, [lang])

  // 初始化同声传译识别管理器（只在挂载时建一次）
  useEffect(() => {
    // 同声传译是微信小程序能力，非 weapp 平台直接禁用（不抛错）
    if (!isWeapp()) {
      console.warn('[VoiceInput] 当前平台不支持微信同声传译插件，语音输入已禁用')
      return
    }

    // requirePlugin 是微信小程序运行时全局函数；用 globalThis 防御式取值，
    // 避免在测试/非小程序环境里出现未定义引用
    const requirePluginFn = (globalThis as Record<string, any>)?.requirePlugin
    if (typeof requirePluginFn !== 'function') {
      console.warn('[VoiceInput] 当前环境不存在 requirePlugin，语音输入已禁用')
      return
    }

    let plugin: { getRecordRecognitionManager?: () => any }
    try {
      plugin = requirePluginFn('WechatSI')
    } catch (err) {
      console.warn('[VoiceInput] 未加载到 WechatSI 插件，请检查 app.config.ts plugins 声明', err)
      return
    }

    const mgr = plugin?.getRecordRecognitionManager?.()
    // WechatSI manager 提供 start/stop 方法 + onStart/onStop/onError 回调槽位（赋值式）
    if (!mgr || typeof mgr.start !== 'function' || typeof mgr.stop !== 'function') {
      console.warn('[VoiceInput] WechatSI 识别管理器不可用，语音输入已禁用')
      return
    }
    managerRef.current = mgr
    setIsVoiceSupported(true)

    const clearTimer = () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }
    }

    // —— 槽位赋值（官方写法）——
    mgr.onStart = () => {
      elapsedSecondsRef.current = 0
      setRecordDuration(0)
      setIsRecording(true)
      clearTimer()
      const secondsLimit = Math.max(1, Math.floor(maxDurationRef.current / 1000))
      durationTimerRef.current = setInterval(() => {
        elapsedSecondsRef.current += 1
        setRecordDuration(elapsedSecondsRef.current)
        // 到时长上限：在定时器回调里判断并停止（避免在 setState updater 里做副作用）
        if (elapsedSecondsRef.current >= secondsLimit) {
          clearTimer()
          if (managerRef.current) managerRef.current.stop()
        }
      }, 1000)
    }

    mgr.onStop = (res: any) => {
      recordingRef.current = false
      setIsRecording(false)
      clearTimer()
      const text = (res?.result || '').trim()
      onRecognizeCompleteRef.current(text)
    }

    mgr.onError = (err: unknown) => {
      recordingRef.current = false
      setIsRecording(false)
      clearTimer()
      Taro.showToast({ title: '识别失败，请重试', icon: 'none' })
      console.error('[VoiceInput] Recognizer error:', err)
    }

    return () => {
      clearTimer()
      managerRef.current = null
    }
  }, [])

  /** 开始录音 + 识别 */
  const startRecord = useCallback(() => {
    if (!managerRef.current) {
      Taro.showToast({ title: '语音功能未启用，请检查插件', icon: 'none' })
      return
    }
    // 用同步 recordingRef 防重复 start（onStart 是异步的，isRecording 可能尚未置 true）
    if (recordingRef.current) return
    recordingRef.current = true
    setIsRecording(true)
    managerRef.current.start({ duration: maxDurationRef.current, lang: langRef.current })
  }, [])

  /** 结束录音，插件将在 onStop 回调里返回识别文本 */
  const stopRecord = useCallback(() => {
    if (!managerRef.current || !recordingRef.current) return
    recordingRef.current = false
    managerRef.current.stop()
  }, [])

  return {
    isRecording,
    recordDuration,
    isVoiceSupported,
    startRecord,
    stopRecord,
  }
}
