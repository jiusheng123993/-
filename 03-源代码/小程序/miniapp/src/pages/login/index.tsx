/**
 * 登录页面
 * 小程序：微信一键登录
 * App/H5：手机号+验证码登录
 */
import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeClass } from '../../hooks/useThemeClass'
import { isWeapp, sendSmsCode, isApp, API_BASE_URL } from '../../platform'
import './index.scss'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const themeClass = useThemeClass()
  const wechatLogin = useAuthStore(state => state.login)
  const phoneLogin = useAuthStore(state => state.loginByPhone)
  const isWechatOnly = isWeapp()

  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [smsSending, setSmsSending] = useState(false)
  const [smsCountdown, setSmsCountdown] = useState(0)
  const [loginMode, setLoginMode] = useState<'wechat' | 'phone'>(isWechatOnly ? 'wechat' : 'phone')

  useEffect(() => {
    if (smsCountdown <= 0) return
    const timer = setTimeout(() => setSmsCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [smsCountdown])

  const handleWechatLogin = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      await wechatLogin()
      Taro.reLaunch({ url: '/pages/index/index' })
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [loading, wechatLogin])

  const handleSendSms = useCallback(async () => {
    if (smsSending || smsCountdown > 0) return
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    setSmsSending(true)
    setError('')
    try {
      const result = await sendSmsCode(phone, API_BASE_URL)
      if (result.success) {
        setSmsCountdown(60)
      } else {
        setError(result.message || '发送失败')
      }
    } catch {
      setError('发送验证码失败')
    } finally {
      setSmsSending(false)
    }
  }, [phone, smsSending, smsCountdown])

  const handlePhoneLogin = useCallback(async () => {
    if (loading) return
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    if (smsCode.length < 4) {
      setError('请输入验证码')
      return
    }
    setLoading(true)
    setError('')
    try {
      await phoneLogin(phone, smsCode)
      Taro.reLaunch({ url: '/pages/index/index' })
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }, [loading, phone, smsCode, phoneLogin])

  const switchMode = useCallback(() => {
    setLoginMode(m => (m === 'wechat' ? 'phone' : 'wechat'))
    setError('')
  }, [])

  return (
    <View className={`login-page ${themeClass}`}>
      <View className='login-paw-particles'>
        <Text className='login-paw login-paw--1'>🐾</Text>
        <Text className='login-paw login-paw--2'>🐾</Text>
        <Text className='login-paw login-paw--3'>🐾</Text>
        <Text className='login-paw login-paw--4'>🐾</Text>
        <Text className='login-paw login-paw--5'>🐾</Text>
      </View>
      <View className='login-stars'>
        <Text className='login-star login-star--1'>✦</Text>
        <Text className='login-star login-star--2'>✧</Text>
        <Text className='login-star login-star--3'>✦</Text>
        <Text className='login-star login-star--4'>✧</Text>
        <Text className='login-star login-star--5'>✦</Text>
      </View>
      <View className='login-logo'>🐾</View>
      <View className='login-title'>星寰海</View>
      <View className='login-subtitle'>
        记录宠物健康<br />
        守护毛孩子每一天
      </View>

      {error && <View className='login-error'>{error}</View>}

      {loginMode === 'wechat' ? (
        <>
          <Button
            className={`login-btn ${loading ? 'login-btn-loading' : ''}`}
            onClick={handleWechatLogin}
            loading={loading}
            disabled={loading}
          >
            {loading ? '登录中...' : '微信一键登录'}
          </Button>
          {!isWechatOnly && (
            <View className='login-switch' onClick={switchMode}>
              手机号登录
            </View>
          )}
        </>
      ) : (
        <>
          <View className='login-phone-form'>
            <Input
              className='login-input'
              type='number'
              placeholder='请输入手机号'
              value={phone}
              maxlength={11}
              onInput={(e: any) => setPhone(e.detail.value)}
            />
            <View className='login-sms-row'>
              <Input
                className='login-input login-sms-input'
                type='number'
                placeholder='验证码'
                value={smsCode}
                maxlength={6}
                onInput={(e: any) => setSmsCode(e.detail.value)}
              />
              <View
                className={`login-sms-btn ${smsCountdown > 0 || smsSending ? 'login-sms-btn--disabled' : ''}`}
                onClick={handleSendSms}
              >
                {smsCountdown > 0 ? `${smsCountdown}s` : smsSending ? '发送中' : '获取验证码'}
              </View>
            </View>
          </View>
          <Button
            className={`login-btn ${loading ? 'login-btn-loading' : ''}`}
            onClick={handlePhoneLogin}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>
          {!isWechatOnly && (
            <View className='login-switch' onClick={switchMode}>
              微信登录
            </View>
          )}
        </>
      )}

      <View className='login-agreement'>
        登录即表示同意<Text className='login-agreement-link'>用户协议</Text>和<Text className='login-agreement-link'>隐私政策</Text>
      </View>
    </View>
  )
}