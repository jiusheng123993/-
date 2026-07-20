import { useEffect, useCallback } from 'react'
import { View, Text, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore, type NotificationSettings } from '../../stores/settingsStore'
import { useMembership } from '../../hooks/useMembership'
import { APP_VERSION } from '../../constants'
import './index.scss'

export default function SettingsPage() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const isMember = useMembership().isMember
  const notification = useSettingsStore(s => s.notification)
  const loadSettings = useSettingsStore(s => s.loadSettings)
  const updateNotification = useSettingsStore(s => s.updateNotification)
  const clearCache = useSettingsStore(s => s.clearCache)
  const exportData = useSettingsStore(s => s.exportData)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleToggleNotification = useCallback((key: keyof NotificationSettings, value: boolean) => {
    updateNotification(key, value)
  }, [updateNotification])

  const handleClearCache = useCallback(() => {
    Taro.showModal({
      title: '清除缓存',
      content: '确认清除所有本地缓存数据？',
      success: (res) => {
        if (res.confirm) {
          clearCache()
          Taro.showToast({ title: '缓存已清除', icon: 'success' })
        }
      },
    })
  }, [clearCache])

  const handleExportData = useCallback(async () => {
    if (!isMember) {
      Taro.showToast({ title: '会员专属功能', icon: 'none' })
      return
    }
    try {
      const data = exportData()
      await Taro.setClipboardData({ data })
      Taro.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
    } catch {
      Taro.showToast({ title: '导出失败', icon: 'none' })
    }
  }, [isMember, exportData])

  const handleAgreement = useCallback((type: 'user' | 'privacy') => {
    Taro.navigateTo({ url: `/pages/agreement/index?type=${type}` })
  }, [])

  const handleLogout = useCallback(() => {
    Taro.showModal({
      title: '退出登录',
      content: '确认退出当前账号？',
      confirmColor: '#FF6B35',
      success: async (res) => {
        if (res.confirm) {
          await logout()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }, [logout])

  return (
    <View className='settings-page'>
      <View className='settings-page__section'>
        <Text className='settings-page__section-title'>账号管理</Text>
        <View className='settings-page__item'>
          <Text className='settings-page__item-label'>微信绑定</Text>
          <Text className='settings-page__item-value settings-page__item-value--bound'>已绑定</Text>
        </View>
        <View className='settings-page__item' onClick={() => Taro.showToast({ title: '手机绑定功能开发中', icon: 'none' })}>
          <Text className='settings-page__item-label'>手机号绑定</Text>
          <Text className='settings-page__item-value'>未绑定</Text>
        </View>
      </View>

      <View className='settings-page__section'>
        <Text className='settings-page__section-title'>通知设置</Text>
        <View className='settings-page__item'>
          <Text className='settings-page__item-label'>打卡提醒</Text>
          <Switch checked={notification.checkinReminder} onChange={(e) => handleToggleNotification('checkinReminder', e.detail.value)} color='#4A90D9' />
        </View>
        <View className='settings-page__item'>
          <Text className='settings-page__item-label'>疫苗驱虫提醒</Text>
          <Switch checked={notification.vaccineReminder} onChange={(e) => handleToggleNotification('vaccineReminder', e.detail.value)} color='#4A90D9' />
        </View>
        <View className='settings-page__item'>
          <Text className='settings-page__item-label'>健康异常提醒</Text>
          <Switch checked={notification.healthAlert} onChange={(e) => handleToggleNotification('healthAlert', e.detail.value)} color='#4A90D9' />
        </View>
      </View>

      <View className='settings-page__section'>
        <Text className='settings-page__section-title'>数据管理</Text>
        <View className='settings-page__item' onClick={handleClearCache}>
          <Text className='settings-page__item-label'>清除缓存</Text>
          <Text className='settings-page__item-arrow'>›</Text>
        </View>
        <View className='settings-page__item' onClick={handleExportData}>
          <Text className='settings-page__item-label'>数据导出</Text>
          {!isMember && <Text className='settings-page__item-badge'>会员</Text>}
          <Text className='settings-page__item-arrow'>›</Text>
        </View>
      </View>

      <View className='settings-page__section'>
        <Text className='settings-page__section-title'>关于</Text>
        <View className='settings-page__item' onClick={() => handleAgreement('user')}>
          <Text className='settings-page__item-label'>用户协议</Text>
          <Text className='settings-page__item-arrow'>›</Text>
        </View>
        <View className='settings-page__item' onClick={() => handleAgreement('privacy')}>
          <Text className='settings-page__item-label'>隐私政策</Text>
          <Text className='settings-page__item-arrow'>›</Text>
        </View>
        <View className='settings-page__item'>
          <Text className='settings-page__item-label'>当前版本</Text>
          <Text className='settings-page__item-value'>{APP_VERSION}</Text>
        </View>
      </View>

      <View className='settings-page__logout' onClick={handleLogout}>
        <Text className='settings-page__logout-text'>退出登录</Text>
      </View>
    </View>
  )
}
