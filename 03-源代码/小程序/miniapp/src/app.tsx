import { View, Text } from '@tarojs/components'
import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './stores/authStore'
import './app.scss'
import { useState } from 'react'

function AppSafe({ children }: PropsWithChildren<{}>) {
  const [appReady, setAppReady] = useState(false)

  useLaunch(() => {
    try {
      useAuthStore.getState().initialize().then(() => {
        setAppReady(true)
      }).catch(() => {
        setAppReady(true)
      })
    } catch {
      setAppReady(true)
    }
  })

  if (!appReady) {
    return (
      <View className='app-loading'>
        <Text>星寰海</Text>
      </View>
    )
  }

  return <>{children}</>
}

export default AppSafe