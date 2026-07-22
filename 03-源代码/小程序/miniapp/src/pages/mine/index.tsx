import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useMembership } from '../../hooks/useMembership'
import { useShareStore } from '../../stores/shareStore'
import { useAnalytics } from '../../hooks/useAnalytics'
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
  const inviteCode = useShareStore(s => s.inviteCode)
  const { trackPageView, trackEvent } = useAnalytics()

  const userId = user?.id || ''

  useEffect(() => {
    trackPageView('mine')
  }, [])

  const loadMemberData = useCallback(async () => {
    setError('')
    setIsLoading(true)
    try {
      if (!userId) {
        setIsLoading(false)
        return
      }
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
    trackEvent('click_member_menu')
    Taro.navigateTo({ url: '/pages/member/index' })
  }

  const handleInviteClick = () => {
    trackEvent('click_invite_menu')
    Taro.navigateTo({ url: '/pagesUser/invite/index' })
  }

  const handlePetProfileClick = () => {
    trackEvent('click_pet_profile_menu')
    Taro.switchTab({ url: '/pages/pet-profile/index' })
  }

  const handleSettingsClick = () => {
    trackEvent('click_settings_menu')
    Taro.navigateTo({ url: '/pagesUser/settings/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确认退出登录？',
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          trackEvent('logout')
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
          title='邀请好友'
          icon='🎁'
          onClick={handleInviteClick}
          showBadge={inviteCode === ''}
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
