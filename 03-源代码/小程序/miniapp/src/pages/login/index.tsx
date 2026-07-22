import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import './index.scss'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore(state => state.login)

  const handleLogin = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      await login()
      Taro.reLaunch({ url: '/pages/index/index' })
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-logo'>🐾</View>
      <View className='login-title'>星寰海</View>
      <View className='login-subtitle'>
        记录宠物健康<br />
        守护毛孩子每一天
      </View>
      {error && <View className='login-error'>{error}</View>}
      <Button
        className={`login-btn ${loading ? 'login-btn-loading' : ''}`}
        onClick={handleLogin}
        loading={loading}
        disabled={loading}
      >
        {loading ? '登录中...' : '微信一键登录'}
      </Button>
      <View className='login-agreement'>
        登录即表示同意<Text className='login-agreement-link'>用户协议</Text>和<Text className='login-agreement-link'>隐私政策</Text>
      </View>
    </View>
  )
}