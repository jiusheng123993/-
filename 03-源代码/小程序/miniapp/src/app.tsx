import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import { useThemeClass } from './hooks/useThemeClass'
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
      useThemeStore.getState().loadTheme()
      useAuthStore.getState().initialize().then(() => {
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