/**
 * 邀请好友页面
 * 邀请好友使用、分享功能
 */
import { View, Text, Button } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useShareStore } from '../../stores/shareStore'
import { PageLoading, PageError } from '../../components'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useThemeClass } from '../../hooks/useThemeClass'
import './index.scss'

export default function InvitePage() {
  const user = useAuthStore(s => s.user)
  const { inviteCode, shareStats, fetchInviteCode, fetchShareStats, checkAndGrantReward, isLoading, error } = useShareStore()
  const { trackPageView, trackEvent } = useAnalytics()
  const [rewardResult, setRewardResult] = useState<string | null>(null)
  const themeClass = useThemeClass()

  const userId = user?.id || ''

  useEffect(() => {
    if (userId) {
      fetchInviteCode(userId)
      fetchShareStats(userId)
    }
  }, [userId, fetchInviteCode, fetchShareStats])

  useEffect(() => {
    trackPageView('invite')
  }, [trackPageView])

  useShareAppMessage(() => ({
    title: '我在用星寰海管理宠物健康，快来一起吧！',
    path: `/pages/index/index${inviteCode ? `?inviteCode=${inviteCode}` : ''}`,
  }))

  useShareTimeline(() => ({
    title: '星寰海 - 宠物健康管家',
    query: inviteCode ? `inviteCode=${inviteCode}` : '',
  }))

  const handleCopyCode = useCallback(() => {
    trackEvent('copy_invite_code', { code: inviteCode })
    Taro.setClipboardData({
      data: inviteCode,
      success: () => Taro.showToast({ title: '邀请码已复制', icon: 'success' }),
    })
  }, [inviteCode, trackEvent])

  const handleCheckReward = useCallback(async () => {
    if (!userId) return
    trackEvent('check_invite_reward')
    const result = await checkAndGrantReward(userId)
    if (result) {
      setRewardResult(result.message)
    }
  }, [userId, checkAndGrantReward, trackEvent])

  if (isLoading && !inviteCode) {
    return <View className={'invite-page ' + themeClass}><PageLoading /></View>
  }

  if (error) {
    return <View className={'invite-page ' + themeClass}><PageError message={error} onRetry={() => { fetchInviteCode(userId); fetchShareStats(userId) }} /></View>
  }

  return (
    <View className={'invite-page ' + themeClass}>
      <View className='invite-page__header'>
        <Text className='invite-page__title'>邀请好友</Text>
        <Text className='invite-page__subtitle'>分享给好友，一起守护毛孩子健康</Text>
      </View>

      <View className='invite-page__code-section'>
        <Text className='invite-page__code-label'>我的邀请码</Text>
        <View className='invite-page__code-box'>
          <Text className='invite-page__code-text'>{inviteCode || '---'}</Text>
        </View>
        <Button className='invite-page__copy-btn' onClick={handleCopyCode}>复制邀请码</Button>
      </View>

      <View className='invite-page__stats'>
        <View className='invite-page__stat-item'>
          <Text className='invite-page__stat-value'>{shareStats?.totalShares ?? 0}</Text>
          <Text className='invite-page__stat-label'>分享次数</Text>
        </View>
        <View className='invite-page__stat-item'>
          <Text className='invite-page__stat-value'>{shareStats?.totalInvites ?? 0}</Text>
          <Text className='invite-page__stat-label'>邀请人数</Text>
        </View>
        <View className='invite-page__stat-item'>
          <Text className='invite-page__stat-value'>{shareStats?.successfulInvites ?? 0}/3</Text>
          <Text className='invite-page__stat-label'>奖励进度</Text>
        </View>
      </View>

      <View className='invite-page__actions'>
        <Button className='invite-page__share-btn' openType='share'>分享给好友</Button>
        <Button className='invite-page__timeline-btn' onClick={() => Taro.showShareMenu({ withShareTicket: true })}>分享到朋友圈</Button>
      </View>

      <View className='invite-page__reward'>
        <Text className='invite-page__reward-title'>🎁 邀请奖励</Text>
        <Text className='invite-page__reward-desc'>邀请3位好友注册，即可获得7天会员奖励</Text>
        <Button className='invite-page__reward-btn' onClick={handleCheckReward}>检查奖励</Button>
        {rewardResult && <Text className='invite-page__reward-result'>{rewardResult}</Text>}
      </View>
    </View>
  )
}
