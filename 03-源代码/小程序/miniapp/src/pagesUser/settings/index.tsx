/**
 * 设置页面
 * 应用设置、通知管理、主题切换、账号管理
 */
import { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore, type NotificationSettings } from '../../stores/settingsStore'
import { useThemeStore, THEME_LIST, type ThemeKey } from '../../stores/themeStore'
import { useMembership } from '../../hooks/useMembership'
import { useAnalytics } from '../../hooks/useAnalytics'
import { APP_VERSION } from '../../constants'
import {
  exportAllUserData,
  deleteUserData,
  generateDeletionConfirmCode,
  getDataPrivacyStatus,
  requestAccountDeletion,
  cancelAccountDeletion,
} from '../../services/dataPrivacyService'
import type { AccountDeletionReason, DataPrivacyStatus, AccountDeletionResult } from '../../types/dataPrivacyTypes'
import { AccountDeletionConfirm } from '../../components/AccountDeletionConfirm'
import { useThemeClass, useThemeKey } from '../../hooks/useThemeClass'
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
  const currentTheme = useThemeKey()
  const setTheme = useThemeStore.getState().setTheme
  const { trackPageView, trackEvent } = useAnalytics()
  const themeClass = useThemeClass()

  const [privacyStatus, setPrivacyStatus] = useState<DataPrivacyStatus | null>(null)
  const [showDeletionModal, setShowDeletionModal] = useState(false)
  const [deletionConfirmCode, setDeletionConfirmCode] = useState('')
  const [deletionLoading, setDeletionLoading] = useState(false)
  const [exportingData, setExportingData] = useState(false)

  useEffect(() => {
    loadSettings()
    setPrivacyStatus(getDataPrivacyStatus())
  }, [loadSettings])

  useEffect(() => {
    trackPageView('settings')
  }, [trackPageView])

  const deletionCountdown = useMemo(() => {
    if (!privacyStatus?.accountDeletionRequested || !privacyStatus.accountDeletionScheduledAt) {
      return null
    }
    const scheduled = new Date(privacyStatus.accountDeletionScheduledAt)
    const now = new Date()
    const diffMs = scheduled.getTime() - now.getTime()
    if (diffMs <= 0) return '即将执行'
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return `${days}天后`
  }, [privacyStatus?.accountDeletionRequested, privacyStatus?.accountDeletionScheduledAt])

  const handleToggleNotification = useCallback((key: keyof NotificationSettings, value: boolean) => {
    trackEvent('toggle_notification', { key, value })
    updateNotification(key, value)
  }, [updateNotification, trackEvent])

  const handleClearCache = useCallback(() => {
    Taro.showModal({
      title: '清除缓存',
      content: '确认清除所有本地缓存数据？',
      success: (res) => {
        if (res.confirm) {
          trackEvent('clear_cache')
          clearCache()
          Taro.showToast({ title: '缓存已清除', icon: 'success' })
        }
      },
    })
  }, [clearCache, trackEvent])

  const handleExportData = useCallback(async () => {
    if (!isMember) {
      Taro.showToast({ title: '会员专属功能', icon: 'none' })
      return
    }
    try {
      const data = exportData()
      await Taro.setClipboardData({ data })
      trackEvent('export_data')
      Taro.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
    } catch {
      Taro.showToast({ title: '导出失败', icon: 'none' })
    }
  }, [isMember, exportData, trackEvent])

  const handleExportAllData = useCallback(async () => {
    if (!user?.id) return
    if (exportingData) return

    Taro.showModal({
      title: '导出全部数据',
      content: '将导出您在星寰海的所有个人数据（云端+本地），生成JSON文件。是否继续？',
      success: async (res) => {
        if (!res.confirm) return
        setExportingData(true)
        try {
          const result = await exportAllUserData(user.id)
          if (result.success && result.data) {
            await Taro.setClipboardData({ data: result.data })
            trackEvent('export_all_data')
            Taro.showToast({ title: `已导出${result.totalRecords}条记录`, icon: 'success' })
            setPrivacyStatus(getDataPrivacyStatus())
          } else {
            Taro.showToast({ title: result.error || '导出失败', icon: 'none' })
          }
        } catch {
          Taro.showToast({ title: '导出失败', icon: 'none' })
        } finally {
          setExportingData(false)
        }
      },
    })
  }, [user?.id, exportingData, trackEvent])

  const handleDeleteCloudData = useCallback(() => {
    if (!user?.id) return

    Taro.showModal({
      title: '删除云端数据',
      content: '此操作将永久删除您在云端的全部数据，且无法恢复！本地数据不受影响。确定要继续吗？',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (!res.confirm) return
        try {
          const result = await deleteUserData(user.id)
          if (result.success) {
            trackEvent('delete_cloud_data')
            Taro.showToast({ title: `已删除${result.deletedTables.length}类数据`, icon: 'success' })
            setPrivacyStatus(getDataPrivacyStatus())
          } else {
            Taro.showToast({ title: result.error || '删除失败', icon: 'none' })
          }
        } catch {
          Taro.showToast({ title: '删除失败', icon: 'none' })
        }
      },
    })
  }, [user?.id, trackEvent])

  const handleRequestDeletion = useCallback(() => {
    trackEvent('request_account_deletion')
    const code = generateDeletionConfirmCode()
    setDeletionConfirmCode(code)
    setShowDeletionModal(true)
  }, [trackEvent])

  const handleDeletionConfirm = useCallback(async (reason: AccountDeletionReason, customReason: string, code: string) => {
    if (!user?.id) return
    setDeletionLoading(true)
    try {
      const result: AccountDeletionResult = await requestAccountDeletion(user.id, { reason, customReason, confirmCode: code })
      if (result.success) {
        trackEvent('confirm_account_deletion', { reason })
        setShowDeletionModal(false)
        Taro.showToast({
          title: `注销申请已提交，${result.gracePeriodDays}天冷静期`,
          icon: 'none',
          duration: 3000,
        })
        setPrivacyStatus(getDataPrivacyStatus())
      } else {
        Taro.showToast({ title: result.error || '注销失败', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '注销请求失败', icon: 'none' })
    } finally {
      setDeletionLoading(false)
    }
  }, [user?.id, trackEvent])

  const handleDeletionCancel = useCallback(() => {
    setShowDeletionModal(false)
  }, [])

  const handleCancelDeletion = useCallback(async () => {
    if (!user?.id) return
    Taro.showModal({
      title: '取消注销',
      content: '确认取消账号注销申请？取消后您的账号将恢复正常使用。',
      success: async (res) => {
        if (!res.confirm) return
        const success = await cancelAccountDeletion(user.id)
        if (success) {
          Taro.showToast({ title: '已取消注销', icon: 'success' })
          setPrivacyStatus(getDataPrivacyStatus())
        } else {
          Taro.showToast({ title: '取消失败，请稍后重试', icon: 'none' })
        }
      },
    })
  }, [user?.id])

  const handleAgreement = useCallback((type: 'user' | 'privacy') => {
    Taro.navigateTo({ url: `/pagesUser/agreement/index?type=${type}` })
  }, [])

  const handleMemoryCorrection = useCallback(() => {
    trackEvent('open_memory_correction')
    Taro.navigateTo({ url: '/pagesUser/memory/index' })
  }, [trackEvent])

  const handleThemeChange = useCallback((theme: ThemeKey) => {
    trackEvent('change_theme', { theme })
    setTheme(theme)
    Taro.showToast({ title: '主题已切换', icon: 'success', duration: 1000 })
  }, [setTheme, trackEvent])

  const handleLogout = useCallback(() => {
    Taro.showModal({
      title: '退出登录',
      content: '确认退出当前账号？',
      confirmColor: '#FF6B35',
      success: async (res) => {
        if (res.confirm) {
          trackEvent('logout')
          await logout()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }, [logout, trackEvent])

  return (
    <View className={'settings-page ' + themeClass}>
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
        <Text className='settings-page__section-title'>主题切换</Text>
        {/* 日间模式 */}
        <Text className='settings-page__theme-group-title'>☀️ 日间模式</Text>
        <View className='settings-page__theme-grid'>
          {THEME_LIST.filter(t => t.mode === 'light').map((theme) => (
            <View
              key={theme.key}
              className={`settings-page__theme-card ${currentTheme === theme.key ? 'settings-page__theme-card--active' : ''}`}
              onClick={() => handleThemeChange(theme.key)}
            >
              <View
                className='settings-page__theme-preview'
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}88)` }}
              >
                <Text className='settings-page__theme-preview-emoji'>{theme.emoji}</Text>
              </View>
              <View className='settings-page__theme-info'>
                <Text className='settings-page__theme-name'>{theme.name}</Text>
                <Text className='settings-page__theme-desc'>{theme.desc}</Text>
              </View>
              {currentTheme === theme.key && (
                <View className='settings-page__theme-check'>
                  <Text>✓</Text>
                </View>
              )}
            </View>
          ))}
        </View>
        {/* 夜间模式 */}
        <Text className='settings-page__theme-group-title'>🌙 夜间模式</Text>
        <View className='settings-page__theme-grid'>
          {THEME_LIST.filter(t => t.mode === 'dark').map((theme) => (
            <View
              key={theme.key}
              className={`settings-page__theme-card ${currentTheme === theme.key ? 'settings-page__theme-card--active' : ''}`}
              onClick={() => handleThemeChange(theme.key)}
            >
              <View
                className='settings-page__theme-preview'
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}88)` }}
              >
                <Text className='settings-page__theme-preview-emoji'>{theme.emoji}</Text>
              </View>
              <View className='settings-page__theme-info'>
                <Text className='settings-page__theme-name'>{theme.name}</Text>
                <Text className='settings-page__theme-desc'>{theme.desc}</Text>
              </View>
              {currentTheme === theme.key && (
                <View className='settings-page__theme-check'>
                  <Text>✓</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View className='settings-page__section'>
        <Text className='settings-page__section-title'>数据管理</Text>
        <View className='settings-page__item' onClick={handleClearCache}>
          <Text className='settings-page__item-label'>清除缓存</Text>
          <Text className='settings-page__item-arrow'>›</Text>
        </View>
        <View className='settings-page__item' onClick={handleExportData}>
          <Text className='settings-page__item-label'>快速导出</Text>
          {!isMember && <Text className='settings-page__item-badge'>会员</Text>}
          <Text className='settings-page__item-arrow'>›</Text>
        </View>
        <View className='settings-page__item' onClick={handleExportAllData}>
          <Text className='settings-page__item-label'>导出全部数据</Text>
          {exportingData && <Text className='settings-page__item-loading'>导出中...</Text>}
          <Text className='settings-page__item-arrow'>›</Text>
        </View>
        <View className='settings-page__item' onClick={handleMemoryCorrection}>
          <Text className='settings-page__item-label'>AI 记忆纠错</Text>
          <Text className='settings-page__item-arrow'>›</Text>
        </View>
        <View className='settings-page__item' onClick={handleDeleteCloudData}>
          <Text className='settings-page__item-label settings-page__item-label--danger'>删除云端数据</Text>
          <Text className='settings-page__item-arrow'>›</Text>
        </View>
      </View>

      {privacyStatus?.accountDeletionRequested && deletionCountdown && (
        <View className='settings-page__deletion-notice'>
          <Text className='deletion-notice__title'>账号注销中</Text>
          <Text className='deletion-notice__desc'>
            您的账号将于{deletionCountdown}被永久注销删除。冷静期内可取消。
          </Text>
          <View className='deletion-notice__action' onClick={handleCancelDeletion}>
            <Text className='deletion-notice__cancel'>取消注销</Text>
          </View>
        </View>
      )}

      <View className='settings-page__section'>
        <Text className='settings-page__section-title'>账号安全</Text>
        <View className='settings-page__item' onClick={handleRequestDeletion}>
          <Text className='settings-page__item-label settings-page__item-label--danger'>注销账号</Text>
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

      {showDeletionModal && (
        <View className='settings-page__modal'>
          <View className='settings-page__modal-content'>
            <AccountDeletionConfirm
              confirmCode={deletionConfirmCode}
              onConfirm={handleDeletionConfirm}
              onCancel={handleDeletionCancel}
              loading={deletionLoading}
            />
          </View>
        </View>
      )}
    </View>
  )
}
