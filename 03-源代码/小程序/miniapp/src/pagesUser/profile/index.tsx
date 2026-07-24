import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUserStats } from '../../hooks/useUserStats';
import { useSubscribeStore } from '../../stores/subscribeStore';
import { usePetStore } from '../../stores/petStore';
import { generateHealthReport, formatReportAsText } from '../../services/reportService';
import { APP_VERSION, HOTLINE_NUMBER } from '../../constants';
import { useAnalytics, usePageView } from '../../hooks/useAnalytics';
import { PageLoading, PageError } from '../../components';
import { useThemeClass } from '../../hooks/useThemeClass';
import './index.scss';

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, isAuthenticated, logout } = useAuthStore();
  const stats = useUserStats();
  const fetchStatuses = useSubscribeStore((s) => s.fetchStatuses)
  const hasAnyAccepted = useSubscribeStore((s) => s.hasAnyAccepted)
  const requestAll = useSubscribeStore((s) => s.requestAll)
  const currentPet = usePetStore((s) => s.currentPet)
  const { trackEvent } = useAnalytics()
  usePageView('profile')
  const themeClass = useThemeClass()

  const loadProfileData = useCallback(async () => {
    setError('')
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      fetchStatuses()
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  const handleAvatarClick = () => {
    if (!isAuthenticated) {
      Taro.navigateTo({ url: '/pages/login/index' });
    }
  };

  const handleHealthReport = async () => {
    trackEvent('click_health_report')
    if (!user?.id || !currentPet?.id) {
      Taro.showToast({ title: '请先添加宠物', icon: 'none' })
      return
    }
    Taro.showLoading({ title: '生成报告中...' })
    try {
      const report = await generateHealthReport(user.id, currentPet.id, 30)
      Taro.hideLoading()
      if (!report) {
        Taro.showToast({ title: '暂无数据', icon: 'none' })
        return
      }
      const text = formatReportAsText(report)
      Taro.showModal({
        title: '健康报告',
        content: text.slice(0, 500) + '\n\n...（完整报告请查看控制台）',
        showCancel: true,
        cancelText: '关闭',
        confirmText: '复制文本',
        success: (res) => {
          if (res.confirm) {
            Taro.setClipboardData({
              data: text,
              success: () => Taro.showToast({ title: '已复制', icon: 'success' }),
            })
          }
        },
      })
    } catch (err) {
      Taro.hideLoading()
      Taro.showToast({ title: '生成失败', icon: 'none' })
    }
  }

  const handleSubscribeClick = () => {
    trackEvent('click_subscribe_manage')
    if (hasAnyAccepted()) {
      Taro.showModal({
        title: '消息订阅管理',
        content: '已开启消息提醒。如需关闭，请在微信「设置-订阅消息」中管理',
        showCancel: true,
        cancelText: '重新订阅',
        confirmText: '知道了',
        success: (res) => {
          if (res.cancel) {
            requestAll()
          }
        },
      })
    } else {
      Taro.showModal({
        title: '开启消息提醒',
        content: '开启后可以接收每日打卡提醒、疫苗到期提醒和健康异常通知',
        confirmText: '开启',
        cancelText: '暂不',
        success: (res) => {
          if (res.confirm) {
            requestAll()
          }
        },
      })
    }
  }

  const handleSettingsClick = () => {
    Taro.navigateTo({ url: '/pagesUser/settings/index' });
  };

  const handleAboutClick = () => {
    Taro.showModal({
      title: '关于星寰海',
      content: `版本：${APP_VERSION}\n\n星寰海 — AI宠物管家，以memory-body引擎为核心，帮助宠物主人科学管理宠物健康。\n\n宠物急救热线：${HOTLINE_NUMBER}`,
      showCancel: true,
      cancelText: '拨打热线',
      confirmText: '知道了',
      success: (res) => {
        if (res.cancel) {
          Taro.makePhoneCall({ phoneNumber: HOTLINE_NUMBER });
        }
      },
    });
  };

  const handleLogout = async () => {
    trackEvent('logout')
    const result = await Taro.showModal({
      title: '确认登出',
      content: '登出后需要重新登录才能使用完整功能',
      confirmText: '确认登出',
      cancelText: '取消',
    });

    if (result.confirm) {
      try {
        await logout();
        Taro.showToast({ title: '已登出', icon: 'success' });
      } catch {
        Taro.showToast({ title: '登出失败，请重试', icon: 'none' });
      }
    }
  };

  if (isLoading) {
    return (
      <View className={'profile-page ' + themeClass}>
        <PageLoading />
      </View>
    )
  }

  if (error) {
    return (
      <View className={'profile-page ' + themeClass}>
        <PageError message={error} onRetry={loadProfileData} />
      </View>
    )
  }

  return (
    <View className={'profile-page ' + themeClass}>
      <View className='ink-bg-decoration ink-bg-1' />
      <View className='ink-bg-decoration ink-bg-2' />

      <View className='profile-header ink-item' style={{ animationDelay: '0.1s' }}>
        <View className='avatar-section' onClick={handleAvatarClick}>
          {user?.avatar ? (
            <Image className='avatar' src={user.avatar} mode='aspectFill' lazyLoad />
          ) : (
            <View className='avatar-placeholder'>
              <Text className='avatar-icon'>👤</Text>
            </View>
          )}
          <View className='user-info'>
            {isAuthenticated && user?.nickname ? (
              <Text className='nickname'>{user.nickname}</Text>
            ) : (
              <Text className='login-hint'>点击登录</Text>
            )}
          </View>
        </View>
      </View>

      <View className='stats-section ink-item' style={{ animationDelay: '0.2s' }}>
        <View className='stats-title'>
          <Text>我的数据</Text>
        </View>
        <View className='stats-grid'>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.usageDays}</Text>
            <Text className='stat-label'>使用天数</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.petCount}</Text>
            <Text className='stat-label'>宠物数量</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.checkinCount}</Text>
            <Text className='stat-label'>打卡记录</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.vaccineCount}</Text>
            <Text className='stat-label'>疫苗记录</Text>
          </View>
        </View>
      </View>

      <View className='menu-section ink-item' style={{ animationDelay: '0.3s' }}>
        <View className='menu-item' onClick={handleHealthReport}>
          <Text className='menu-icon'>📋</Text>
          <Text className='menu-text'>健康报告</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={handleSubscribeClick}>
          <Text className='menu-icon'>🔔</Text>
          <Text className='menu-text'>消息提醒</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={handleSettingsClick}>
          <Text className='menu-icon'>⚙️</Text>
          <Text className='menu-text'>设置</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={handleAboutClick}>
          <Text className='menu-icon'>ℹ️</Text>
          <Text className='menu-text'>关于我们</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>

      {isAuthenticated && (
        <View className='logout-section ink-item' style={{ animationDelay: '0.4s' }}>
          <View className='logout-btn' onClick={handleLogout}>
            <Text className='logout-text'>退出登录</Text>
          </View>
        </View>
      )}

      <View className='profile-footer'>
        <Text className='footer-text'>星寰海 v{APP_VERSION}</Text>
      </View>

    </View>
  );
}
