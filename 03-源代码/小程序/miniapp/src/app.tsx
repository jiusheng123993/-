import { PropsWithChildren, useEffect } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './stores/authStore'
import { usePetStore } from './stores/petStore'
import { useCheckinStore } from './stores/checkinStore'
import { useMembershipStore } from './stores/membershipStore'
import { useTrendStore } from './stores/trendStore'
import './app.scss'

function App({ children }: PropsWithChildren<{}>) {
  useLaunch(() => {
  })

  useEffect(() => {
    const initApp = async () => {
      try {
        await useAuthStore.getState().initialize()
        const user = useAuthStore.getState().user
        if (user?.id) {
          await Promise.all([
            usePetStore.getState().initUser(user.id),
            useCheckinStore.getState().initUser(user.id),
            useMembershipStore.getState().initUser(user.id),
            useTrendStore.getState().initUser(user.id),
          ])
        }
      } catch (err) {
      }
    }
    initApp()
  }, [])

  return <>{children}</>
}

export default App
