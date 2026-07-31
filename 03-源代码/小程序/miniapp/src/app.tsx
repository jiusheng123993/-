import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import { usePetStore } from './stores/petStore'
import { useThemeClass } from './hooks/useThemeClass'
import { wsClient } from './services/wsClient'
import './app.scss'

let ready = false

function AppContent({ children }: any) {
  const themeClass = useThemeClass()

  return (
    <View className={`app-root ${themeClass}`}>
      {children || <View className='app-loading'><Text>星寰海</Text></View>}
    </View>
  )
}

export default function App({ children }: any) {
  useLaunch(() => {
    if (ready) return
    try {
      // 处理微信隐私授权事件（基础库 2.32.3+）
      // 必须弹出隐私协议弹窗让用户确认，不能直接 auto-resolve
      if (typeof (Taro as any).onNeedPrivacyAuthorization === 'function') {
        (Taro as any).onNeedPrivacyAuthorization((resolve: any) => {
          Taro.showModal({
            title: '隐私保护提示',
            content: '在使用该功能前，请仔细阅读《用户协议》和《隐私政策》。如你同意，请点击"同意"开始使用。',
            confirmText: '同意',
            cancelText: '拒绝',
            success: (modalRes: any) => {
              if (modalRes.confirm) {
                resolve({ event: 'agree', buttonId: 'agree' })
              } else {
                resolve({ event: 'disagree' })
              }
            },
            fail: () => {
              // 弹窗失败时默认拒绝，保护用户隐私
              resolve({ event: 'disagree' })
            },
          })
        })
      }

      useThemeStore.getState().loadTheme()
      useAuthStore.getState().initialize().then(() => {
        const authState = useAuthStore.getState()
        if (authState.user?.id && authState.token) {
          // 建立实时推送连接（支付/视频生成等事件推送）
          wsClient.connect(authState.token)
          usePetStore.getState().initUser(authState.user.id)
        }
        ready = true
      }).catch(() => {
        ready = true
      })
    } catch {
      ready = true
    }
  })

  return <AppContent>{children}</AppContent>
}