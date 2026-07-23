import { View, Text } from '@tarojs/components'
import { PropsWithChildren, useState } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './stores/authStore'
import './app.scss'

function App({ children }: PropsWithChildren<{}>) {
  const [appReady, setAppReady] = useState(false)

  useLaunch(() => {
    useAuthStore.getState().initialize().then(() => {
      const isAuth = useAuthStore.getState().isAuthenticated
      if (!isAuth) {
        Taro.reLaunch({ url: '/pages/login/index' })
      }
    }).catch((err) => {
      // 静默处理初始化错误
      Taro.reLaunch({ url: '/pages/login/index' })
    }).finally(() => {
      setAppReady(true)
    })
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

export default App