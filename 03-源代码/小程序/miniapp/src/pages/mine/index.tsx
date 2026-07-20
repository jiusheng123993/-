import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useMembership } from '../../hooks/useMembership'
import { PageLoading, PageError } from '../../components'
import './index.scss'

interface MenuItemProps {
  title: string
  icon: string
  onClick: () => void
  showBadge?: boolean
}

function MenuItem({ title, icon, onClick, showBadge }: MenuItemProps) {
  return (
    <View className='mine-page__menu-item' onClick={onClick}>
      <View className='mine-page__menu-left'>
        <Text className='mine-page__menu-icon'>{icon}</Text>
        <Text className='mine-page__menu-title'>{title}</Text>
      </View>
      <View className='mine-page__menu-right'>
        {showBadge && <View className='mine-page__menu-badge' />}
        <Text className='mine-page__menu-arrow'>›</Text>
      </View>
    </View>
  )
}

export default function MinePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { isMember, initUser } = useMembership()

  const userId = user?.id || ''

  const loadMemberData = useCallback(async () => {
    if (!userId) return
    setError('')
    setIsLoading(true)
    try {
      await initUser(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [userId, initUser])

  useEffect(() => {
    loadMemberData()
  }, [loadMemberData])

  const handleMemberClick = () => {
    Taro.navigateTo({ url: '/pages/member/index' })
  }

  const handlePetProfileClick = () => {
    Taro.switchTab({ url: '/pages/pet-profile/index' })
  }

  const handleSettingsClick = () => {
    Taro.navigateTo({ url: '/pagesUser/settings/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确认退出登录？',
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          try {
            logout()
            Taro.redirectTo({ url: '/pages/login/index' })
          } catch {
            Taro.showToast({ title: '退出失败，请重试', icon: 'none' })
          }
        }
      },
    })
  }

  if (isLoading) {
    return (
      <View className='mine-page'>
        <PageLoading />
      </View>
    )
  }

  if (error) {
    return (
      <View className='mine-page'>
        <PageError message={error} onRetry={loadMemberData} />
      </View>
    )
  }

  return (
    <View className='mine-page'>
      <View className='mine-page__header'>
        <View className='mine-page__avatar'>
          <Text className='mine-page__avatar-text'>
            {user?.nickname?.charAt(0) || '宠'}
          </Text>
        </View>
        <View className='mine-page__info'>
          <Text className='mine-page__nickname'>{user?.nickname || '铲屎官'}</Text>
          {isMember ? (
            <View className='mine-page__member-tag'>
              <Text className='mine-page__member-tag-text'>会员</Text>
            </View>
          ) : (
            <Text className='mine-page__free-tag'>免费用户</Text>
          )}
        </View>
      </View>

      <View className='mine-page__section'>
        <MenuItem
          title='会员管理'
          icon='👑'
          onClick={handleMemberClick}
          showBadge={!isMember}
        />
        <MenuItem
          title='我的宠物'
          icon='🐾'
          onClick={handlePetProfileClick}
        />
        <MenuItem
          title='设置'
          icon='⚙️'
          onClick={handleSettingsClick}
        />
      </View>

      <View className='mine-page__section'>
        <MenuItem
          title='退出登录'
          icon='🚪'
          onClick={handleLogout}
        />
      </View>
    </View>
  )
}
