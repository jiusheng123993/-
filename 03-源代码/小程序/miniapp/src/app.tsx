import { PropsWithChildren, useEffect, useState, useRef } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './stores/authStore'
import { usePetStore } from './stores/petStore'
import { useCheckinStore } from './stores/checkinStore'
import { useMembershipStore } from './stores/membershipStore'
import { useTrendStore } from './stores/trendStore'
import PrivacyPopup from './components/PrivacyPopup'
import './app.scss'

function App({ children }: PropsWithChildren<{}>) {
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false)
  const privacyResolveRef = useRef<(() => void) | null>(null)
  const privacyRejectRef = useRef<(() => void) | null>(null)

  useLaunch(() => {
  })

  useEffect(() => {
    (Taro as any).onNeedPrivacyAuthorization?.((resolve: () => void, reject: () => void) => {
      privacyResolveRef.current = resolve
      privacyRejectRef.current = reject
      setShowPrivacyPopup(true)
    })

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
        } else {
          // 用户未登录，跳转到登录页面
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      } catch (err) {
        console.error('App initialization error:', err)
      }
    }
    initApp()
  }, [])

  const handlePrivacyAgree = () => {
    privacyResolveRef.current?.()
    privacyResolveRef.current = null
    privacyRejectRef.current = null
    setShowPrivacyPopup(false)
  }

  const handlePrivacyReject = () => {
    privacyRejectRef.current?.()
    privacyResolveRef.current = null
    privacyRejectRef.current = null
    setShowPrivacyPopup(false)
  }

  return (
    <>
      {children}
      <PrivacyPopup
        visible={showPrivacyPopup}
        onAgree={handlePrivacyAgree}
        onReject={handlePrivacyReject}
      />
    </>
  )
}

export default App
