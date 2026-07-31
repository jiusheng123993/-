/**
 * 我的页面
 * 用户信息展示、宠物切换、数据统计、功能菜单入口
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import { useMembershipStore } from '../../stores/membershipStore'
import { getCheckinStats } from '../../services/checkinService'
import PageLoading from '../../components/PageLoading'
import { useThemeClass } from '../../hooks/useThemeClass'
import './index.scss'

const MENU_ITEMS = [
  [
    { icon: '📊', label: '健康报告', url: '/pagesPet/trends/index' },
    { icon: '💉', label: '疫苗日历', url: '/pagesPet/vaccine/index' },
    { icon: '👑', label: '会员中心', url: '/pages/member/index' },
  ],
  [
    { icon: '📈', label: '效果追踪', url: '/pagesUser/effect-tracking/index' },
  ],
  [
    { icon: '👥', label: '邀请好友', url: '/pagesUser/invite/index' },
    { icon: '💬', label: '意见反馈', url: '' },
  ],
  [
    { icon: '⚙️', label: '设置', url: '/pagesUser/settings/index' },
  ],
]

export default function Mine() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)
  const logout = useAuthStore(state => state.logout)
  const { pets, currentPet, fetchPets, switchPet } = usePetStore()
  const membership = useMembershipStore(state => state.membership)
  const [pageReady, setPageReady] = useState(false)
  const [totalCheckins, setTotalCheckins] = useState(0)
  const [totalDiaries, setTotalDiaries] = useState(0)
  const themeClass = useThemeClass()

  useEffect(() => {
    if (!isInitialized) return
    if (!isAuthenticated || !user) {
      const pages = Taro.getCurrentPages()
      const currentPage = pages[pages.length - 1]
      if (currentPage && currentPage.route !== 'pages/login/index') {
        Taro.reLaunch({ url: '/pages/login/index' })
      }
      return
    }
    const loadData = async () => {
      try {
        await fetchPets(user.id)
        const fetchedPets = usePetStore.getState().pets
        if (fetchedPets.length > 0 && user?.id) {
          let totalC = 0
          let totalD = 0
          for (const pet of fetchedPets) {
            try {
              const stats = await getCheckinStats(pet.id, user.id)
              totalC += stats.totalCheckins
              totalD += stats.totalCheckins
            } catch {
              // 单个宠物统计失败不影响整体
            }
          }
          setTotalCheckins(totalC)
          setTotalDiaries(totalD)
        }
      } catch (err) {
        // 静默处理错误
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
    return <PageLoading />
  }

  const isVip = membership?.level !== 'free'

  return (
    <ScrollView className={`mine-page ${themeClass}`} scrollY>
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

      {pets.length > 0 && (
        <View className='mine-pet-chips'>
          <ScrollView className='mine-pet-chips-scroll' scrollX showScrollbar={false}>
            {pets.map(pet => {
              const isActive = currentPet?.id === pet.id
              const emoji = pet.species === 'cat' ? '🐱' : '🐶'
              return (
                <View
                  key={pet.id}
                  className={`mine-pet-chip ${isActive ? 'mine-pet-chip--active' : ''}`}
                  onClick={() => switchPet(pet.id)}
                >
                  <View className='mine-pet-chip-avatar'>
                    <Text>{emoji}</Text>
                  </View>
                  <Text className='mine-pet-chip-name'>{pet.name}</Text>
                  {isActive && (
                    <View className='mine-pet-chip-check'>
                      <Text>✓</Text>
                    </View>
                  )}
                </View>
              )
            })}
            <View
              className='mine-pet-chip mine-pet-chip--add'
              onClick={() => navigateTo('/pagesPet/add/index')}
            >
              <View className='mine-pet-chip-add-icon'>
                <Text>+</Text>
              </View>
              <Text className='mine-pet-chip-name'>添加</Text>
            </View>
          </ScrollView>
        </View>
      )}

      <View className='mine-stats'>
        <View className='mine-stat-item'>
          <Text className='mine-stat-num'>{pets.length}</Text>
          <Text className='mine-stat-label'>宠物</Text>
        </View>
        <View className='mine-stat-item'>
          <Text className='mine-stat-num'>{totalCheckins}</Text>
          <Text className='mine-stat-label'>打卡</Text>
        </View>
        <View className='mine-stat-item'>
          <Text className='mine-stat-num'>{totalDiaries}</Text>
          <Text className='mine-stat-label'>日记</Text>
        </View>
        <View className='mine-stat-item'>
          <Text className='mine-stat-num'>0</Text>
          <Text className='mine-stat-label'>收藏</Text>
        </View>
      </View>

      {!isVip && (
        <View className='mine-vip-banner' onClick={() => Taro.switchTab({ url: '/pages/member/index' })}>
          <View className='mine-vip-banner-left'>
            <Text className='mine-vip-banner-icon'>👑</Text>
            <View>
              <Text className='mine-vip-banner-title'>开通会员</Text>
              <Text className='mine-vip-banner-desc'>解锁全部功能，首月仅需¥9.9</Text>
            </View>
          </View>
          <Text className='mine-vip-banner-arrow'>›</Text>
        </View>
      )}

      <View className='section-divider' />

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