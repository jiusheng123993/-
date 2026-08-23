/**
 * 应用入口（纯 JS + createElement 版）
 *
 * 说明：原 src/app.tsx 在部分 Node/Taro 组合下入口转译异常（app 入口不经过 babel-loader，
 * 内容直接进 entry-cache 缓存），因此这里保持纯 JS、不用 JSX/TS 语法，保证构建稳定。
 */
import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import { usePetStore } from './stores/petStore'
import { useThemeClass } from './hooks/useThemeClass'
import { wsClient } from './services/wsClient'
import { PENDING_INVITE_CODE_KEY } from './services/shareService'
import { isWeapp } from './platform'
import LogoLoading from './components/LogoLoading'
import PrivacyPopup from './components/PrivacyPopup'
import './app.scss'

let ready = false

function AppContent({ children }) {
  const themeClass = useThemeClass()
  return React.createElement(
    View,
    { className: 'app-root ' + themeClass },
    children ||
      React.createElement(
        View,
        { className: 'app-loading' },
        React.createElement(Text, null, '星河宠记')
      )
  )
}

export default function App({ children }) {
  // 品牌缓冲页开关：启动初始化完成后隐藏（至少展示 800ms，避免闪屏）
  const [splashVisible, setSplashVisible] = useState(true)
  // 微信隐私授权弹窗：onNeedPrivacyAuthorization 触发时展示
  const [privacyVisible, setPrivacyVisible] = useState(false)
  // 微信隐私授权 resolve 回调（用户同意/拒绝后调用，放行/拒绝隐私接口）
  const privacyResolveRef = React.useRef(null)

  useLaunch(() => {
    if (ready) return
    // 记录启动时刻，用于保证缓冲页最短展示时长
    const launchAt = Date.now()
    // 初始化完成的收尾：置 ready 并延迟隐藏缓冲页
    const finishLaunch = () => {
      if (ready) return
      ready = true
      const elapsed = Date.now() - launchAt
      setTimeout(() => setSplashVisible(false), Math.max(0, 800 - elapsed))
    }
    try {
      // 处理微信隐私授权事件（仅小程序，基础库 2.32.3+）
      // 官方机制：隐私接口（chooseAvatar/昵称填写/chooseImage 等）被调用时触发本监听，
      // 必须用 openType="agreePrivacyAuthorization" 的 Button 弹窗让用户同意，
      // 完成后 resolve({ buttonId, event: 'agree' }) 才会放行隐私接口。
      // 若用普通 showModal 的「同意」按钮，微信不会视为完成隐私授权 → errno 112。
      if (isWeapp() && typeof Taro.onNeedPrivacyAuthorization === 'function') {
        Taro.onNeedPrivacyAuthorization((resolve) => {
          privacyResolveRef.current = resolve
          setPrivacyVisible(true)
        })
      }

      // 记录启动参数携带的邀请码，登录成功后由 authStore 消费建立推荐关系（邀请裂变）
      try {
        const launchOptions = Taro.getLaunchOptionsSync()
        const query = (launchOptions && launchOptions.query) || {}
        const inviteCode = typeof query.inviteCode === 'string' ? query.inviteCode.trim() : ''
        if (inviteCode) {
          Taro.setStorageSync(PENDING_INVITE_CODE_KEY, inviteCode)
        }
      } catch {
        // 读取启动参数失败不阻塞启动
      }

      useThemeStore.getState().loadTheme()
      useAuthStore.getState().initialize().then(() => {
        const authState = useAuthStore.getState()
        if (authState.user && authState.user.id && authState.token) {
          // 建立实时推送连接（支付/视频生成等事件推送）
          wsClient.connect(authState.token)
          usePetStore.getState().initUser(authState.user.id)
        }
        finishLaunch()
      }).catch(() => {
        finishLaunch()
      })
    } catch {
      finishLaunch()
    }
    // 兜底：初始化卡住时，缓冲页最多展示 3 秒
    setTimeout(finishLaunch, 3000)
  })

  return React.createElement(
    AppContent,
    null,
    children,
    // 启动缓冲层：盖在首屏之上，初始化完成后淡出
    splashVisible && React.createElement(LogoLoading, null),
    // 微信隐私授权弹窗（全局）：用户同意/拒绝后放行对应隐私接口
    React.createElement(PrivacyPopup, {
      visible: privacyVisible,
      onAgree: () => {
        const resolve = privacyResolveRef.current
        if (resolve) {
          resolve({ event: 'agree', buttonId: 'agree' })
          privacyResolveRef.current = null
        }
        setPrivacyVisible(false)
      },
      onReject: () => {
        const resolve = privacyResolveRef.current
        if (resolve) {
          resolve({ event: 'disagree' })
          privacyResolveRef.current = null
        }
        setPrivacyVisible(false)
      },
    })
  )
}
