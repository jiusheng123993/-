import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import './index.scss'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const login = useAuthStore(s => s.login)
  const error = useAuthStore(s => s.error)
  const clearError = useAuthStore(s => s.clearError)

  const handleLogin = async () => {
    if (!agreed) {
      Taro.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })
      return
    }

    setIsLoading(true)
    clearError()

    try {
      const { code } = await Taro.login()
      const result = await login(code)

      if (result.success) {
        Taro.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          Taro.reLaunch({ url: '/pages/index/index' })
        }, 1500)
      } else if (result.error?.includes('未注册') || result.error?.includes('needRegister')) {
        Taro.navigateTo({
          url: `/pages/onboarding/index?code=${encodeURIComponent(code)}`
        })
      } else {
        Taro.showToast({ title: result.error || '登录失败，请重试', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgreementClick = (type: 'user' | 'privacy') => {
    Taro.navigateTo({ url: `/pages/agreement/index?type=${type}` })
  }

  return (
    <View className='login-page'>
      <View className='ink-decoration'>
        <View className='ink-dot ink-dot-1' />
        <View className='ink-dot ink-dot-2' />
        <View className='ink-dot ink-dot-3' />
        <View className='ink-dot ink-dot-4' />
      </View>

      <View className='login-content'>
        <View className='login-brand'>
          <View className='brand-seal'>
            <Text className='seal-char'>海</Text>
          </View>
          <Text className='login-title'>星寰海</Text>
          <View className='title-underline' />
          <Text className='login-subtitle'>你的情绪急救箱</Text>
        </View>

        <View className='login-features'>
          <View className='feature-item'>
            <Text className='feature-icon'>🫧</Text>
            <Text className='feature-text'>3秒情绪打卡</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>🛟</Text>
            <Text className='feature-text'>情绪急救箱</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>🌙</Text>
            <Text className='feature-text'>深夜树洞</Text>
          </View>
        </View>

        {error && (
          <View className='login-error'>
            <Text className='login-error-text'>{error}</Text>
          </View>
        )}

        <Button
          className='login-btn'
          loading={isLoading}
          onClick={handleLogin}
        >
          <Text className='login-btn-text'>微信一键登录</Text>
        </Button>

        <View className='login-privacy'>
          <View
            className={`privacy-checkbox ${agreed ? 'privacy-checkbox--checked' : ''}`}
            onClick={() => setAgreed(!agreed)}
          >
            {agreed && <Text className='privacy-checkbox-icon'>✓</Text>}
          </View>
          <Text className='login-privacy-text'>我已阅读并同意</Text>
          <Text className='login-privacy-link' onClick={() => handleAgreementClick('user')}>《用户协议》</Text>
          <Text className='login-privacy-text'>和</Text>
          <Text className='login-privacy-link' onClick={() => handleAgreementClick('privacy')}>《隐私政策》</Text>
        </View>
      </View>
    </View>
  )
}
