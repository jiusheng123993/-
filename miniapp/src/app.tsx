import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { checkAndSendFollowups, clearExpiredFollowups } from './services/notificationService'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('星寰海 v2.0 启动')

    checkAndSendFollowups()
    clearExpiredFollowups()
  })

  return children
}

export default App
