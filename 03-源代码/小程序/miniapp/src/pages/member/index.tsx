import { useState, useCallback, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMembership } from '../../hooks/useMembership'
import { useAuthStore } from '../../stores/authStore'
import { useAnalytics } from '../../hooks/useAnalytics'
import { AnalyticsEventName } from '../../types/analyticsTypes'
import PlanSelector from '../../components/PlanSelector'
import UsageCounter from '../../components/UsageCounter'
import type { MembershipPlan } from '../../services/membershipService'
import './index.scss'

export default function MemberPage() {
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>('yearly')
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const {
    membership,
    isLoading,
    isMember,
    initUser,
    subscribePlan,
    cancelSubscription,
    restorePurchaseStatus,
    refreshMembership,
    clearError,
    error,
  } = useMembership()

  const userId = useAuthStore(s => s.user?.id || '')
  const { trackPageView, trackEvent } = useAnalytics()

  useEffect(() => {
    trackPageView('member')
    trackEvent(AnalyticsEventName.MemberPageView, { source: 'direct', isFreeUser: !isMember })
  }, [])

  useEffect(() => {
    if (userId) {
      initUser(userId)
    }
  }, [userId, initUser])

  const handleSubscribe = useCallback(async () => {
    if (paymentProcessing) return
    setPaymentProcessing(true)
    clearError()
    trackEvent('select_plan', { plan: selectedPlan })

    try {
      const order = await subscribePlan(selectedPlan)

      if (order.status === 'pending') {
        trackEvent('subscribe_pending', { plan: selectedPlan })
        Taro.showToast({ title: '支付未完成', icon: 'none' })
      } else {
        trackEvent(AnalyticsEventName.MemberSubscribe, { plan: selectedPlan, price: selectedPlan === 'yearly' ? 198 : 29.9, source: 'member_page' })
        Taro.showToast({ title: '支付成功', icon: 'success' })
        await refreshMembership()
      }
    } catch {
      trackEvent('subscribe_failure', { plan: selectedPlan })
      Taro.showToast({ title: '操作失败', icon: 'error' })
    } finally {
      setPaymentProcessing(false)
    }
  }, [selectedPlan, paymentProcessing, subscribePlan, refreshMembership, clearError, trackEvent])

  const handleCancel = useCallback(async () => {
    Taro.showModal({
      title: '取消会员',
      content: '确认取消会员订阅？取消后会员权益将在到期日失效。',
      confirmText: '确认取消',
      confirmColor: '#FF6B35',
      success: async (res) => {
        if (res.confirm) {
          trackEvent('cancel_subscription')
          try {
            await cancelSubscription()
            Taro.showToast({ title: '已取消', icon: 'success' })
            await refreshMembership()
          } catch {
            Taro.showToast({ title: '操作失败', icon: 'error' })
          }
        }
      },
    })
  }, [cancelSubscription, refreshMembership, trackEvent])

  const handleRestore = useCallback(async () => {
    try {
      await restorePurchaseStatus()
      trackEvent('restore_purchase')
      Taro.showToast({ title: '已恢复', icon: 'success' })
      await refreshMembership()
    } catch {
      Taro.showToast({ title: '恢复失败', icon: 'error' })
    }
  }, [restorePurchaseStatus, refreshMembership, trackEvent])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <View className='member-page'>
      <View className='member-page__hero'>
        <Text className='member-page__hero-title'>星寰海会员</Text>
        <Text className='member-page__hero-subtitle'>守护毛孩子每一天</Text>
      </View>

      {isMember && membership ? (
        <View className='member-page__status'>
          <View className='member-page__status-card'>
            <Text className='member-page__status-label'>当前状态</Text>
            <Text className='member-page__status-value member-page__status-value--active'>会员生效中</Text>
          </View>
          <View className='member-page__status-card'>
            <Text className='member-page__status-label'>到期时间</Text>
            <Text className='member-page__status-value'>{formatDate(membership.expiresAt)}</Text>
          </View>
          <View className='member-page__actions'>
            <View className='member-page__action-btn member-page__action-btn--cancel' onClick={handleCancel}>
              <Text className='member-page__action-btn-text'>取消订阅</Text>
            </View>
            <View className='member-page__action-btn member-page__action-btn--restore' onClick={handleRestore}>
              <Text className='member-page__action-btn-text'>恢复购买</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className='member-page__subscribe'>
          <PlanSelector selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />
          <View
            className={`member-page__pay-btn ${paymentProcessing || isLoading ? 'member-page__pay-btn--disabled' : ''}`}
            onClick={handleSubscribe}
          >
            <Text className='member-page__pay-btn-text'>
              {paymentProcessing ? '处理中...' : '立即开通'}
            </Text>
          </View>
          <View className='member-page__restore' onClick={handleRestore}>
            <Text className='member-page__restore-text'>恢复购买</Text>
          </View>
        </View>
      )}

      <UsageCounter isMember={isMember} />

      {error && (
        <View className='member-page__error'>
          <Text className='member-page__error-text'>{error}</Text>
        </View>
      )}
    </View>
  )
}
