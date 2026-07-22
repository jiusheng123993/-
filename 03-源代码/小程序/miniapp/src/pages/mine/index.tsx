import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import { useMembershipStore } from '../../stores/membershipStore'
import './index.scss'

const MENU_ITEMS = [
  [
    { icon: '📋', label: '我的订单', url: '' },
    { icon: '🎫', label: '优惠券', url: '' },
    { icon: '⭐', label: '我的收藏', url: '' },
  ],
  [
    { icon: '📔', label: '成长日记', url: '/pagesPet/diary/index' },
    { icon: '📊', label: '健康报告', url: '/pagesPet/trends/index' },
    { icon: '🔔', label: '提醒设置', url: '/pagesUser/settings/index' },
  ],
  [
    { icon: '👥', label: '邀请好友', url: '/pagesUser/invite/index' },
    { icon: '💬', label: '意见反馈', url: '' },
    { icon: 'ℹ️', label: '关于我们', url: '' },
  ],
]

export default function Mine() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)
  const logout = useAuthStore(state => state.logout)
  const { pets, fetchPets } = usePetStore()
  const membership = useMembershipStore(state => state.membership)
  const [pageReady, setPageReady] = useState(false)

  useEffect(() => {
    if (!isInitialized) return
    if (!isAuthenticated || !user) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    const loadData = async () => {
      try {
        await fetchPets(user.id)
      } catch (err) {
        console.error('Failed to load pets:', err)
      }
      setPageReady(true)
    }
    loadData()
  }, [isInitialized, isAuthenticated, user])

  const navigateTo = (url: string) => {
    if (!url) {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
      return
    }
    Taro.navigateTo({ url })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }

  if (!pageReady) {
    return <View className='mine-loading'>加载中...</View>
  }

  const isVip = membership?.level !== 'free'

  return (
    <ScrollView className='mine-page' scrollY>
      <View className='mine-header'>
        <View className='mine-user-card'>
          <View className='mine-avatar'>
            <Text className='mine-avatar-text'>{user?.nickname?.charAt(0) || '👤'}</Text>
          </View>
          <View className='mine-user-info'>
            <View className='mine-user-name-row'>
              <Text className='mine-user-name'>{user?.nickname || '用户'}</Text>
              {isVip && (
                <View className='mine-vip-badge'>
                  <Text>VIP</Text>
                </View>
              )}
            </View>
            <Text className='mine-user-desc'>
              {pets.length > 0 ? `${pets.length}只毛孩子` : '还没有添加宠物'}
            </Text>
          </View>
          <View className='mine-edit-btn' onClick={() => navigateTo('/pagesUser/profile/index')}>
            <Text>编辑</Text>
          </View>
        </View>
      </View>

      <View className='mine-stats'>
        <View className='mine-stat-item'>
          <Text className='mine-stat-num'>{pets.length}</Text>
          <Text className='mine-stat-label'>宠物</Text>
        </View>
        <View className='mine-stat-item'>
          <Text className='mine-stat-num'>0</Text>
          <Text className='mine-stat-label'>打卡</Text>
        </View>
        <View className='mine-stat-item'>
          <Text className='mine-stat-num'>0</Text>
          <Text className='mine-stat-label'>日记</Text>
        </View>
        <View className='mine-stat-item'>
          <Text className='mine-stat-num'>0</Text>
          <Text className='mine-stat-label'>收藏</Text>
        </View>
      </View>

      {!isVip && (
        <View className='mine-vip-banner' onClick={() => navigateTo('/pages/member/index')}>
          <View className='mine-vip-banner-left'>
            <Text className='mine-vip-banner-icon'>👑</Text>
            <View>
              <Text className='mine-vip-banner-title'>开通会员</Text>
              <Text className='mine-vip-banner-desc'>解锁全部功能，首月仅需¥29.9</Text>
            </View>
          </View>
          <Text className='mine-vip-banner-arrow'>›</Text>
        </View>
      )}

      {MENU_ITEMS.map((group, groupIndex) => (
        <View key={groupIndex} className='mine-menu-group'>
          {group.map(item => (
            <View key={item.label} className='mine-menu-item' onClick={() => navigateTo(item.url)}>
              <Text className='mine-menu-icon'>{item.icon}</Text>
              <Text className='mine-menu-label'>{item.label}</Text>
              <Text className='mine-menu-arrow'>›</Text>
            </View>
          ))}
        </View>
      ))}

      <View className='mine-section'>
        <View className='mine-logout-btn' onClick={handleLogout}>
          <Text>退出登录</Text>
        </View>
      </View>

      <View className='mine-bottom-safe' />
    </ScrollView>
  )
}