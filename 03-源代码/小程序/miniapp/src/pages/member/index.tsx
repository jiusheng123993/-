import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useMembershipStore } from '../../stores/membershipStore'
import PageLoading from '../../components/PageLoading'
import './index.scss'

const PLANS = [
  {
    key: 'monthly',
    name: '月度会员',
    price: '¥29.9',
    period: '/月',
    originalPrice: '¥39.9',
    tag: '热门',
    features: [
      '无限次食物查询',
      'AI症状初筛（每日5次）',
      '疫苗驱虫提醒',
      '健康趋势分析',
      '宠物成长日记',
    ],
  },
  {
    key: 'yearly',
    name: '年度会员',
    price: '¥199',
    period: '/年',
    originalPrice: '¥358.8',
    tag: '最划算',
    features: [
      '月度会员全部权益',
      'AI症状初筛（无限次）',
      '专属宠物形象定制',
      '健康报告导出',
      '优先客服支持',
      '家庭共享（最多3人）',
    ],
  },
]

const BENEFITS = [
  { icon: '🔍', title: '无限食物查询', desc: '随时查询食物安全性' },
  { icon: '🤖', title: 'AI症状初筛', desc: '智能分析宠物健康状况' },
  { icon: '📅', title: '疫苗提醒', desc: '自动提醒疫苗接种时间' },
  { icon: '📊', title: '健康趋势', desc: '可视化健康数据变化' },
  { icon: '📔', title: '成长日记', desc: '记录宠物成长点滴' },
  { icon: '🎨', title: '形象定制', desc: '专属宠物虚拟形象' },
]

export default function Member() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)
  const { membership, fetchMembership, subscribePlan } = useMembershipStore()
  const [pageReady, setPageReady] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('yearly')
  const [subscribing, setSubscribing] = useState(false)

  const handleSubscribe = async () => {
    if (subscribing || !user) return
    setSubscribing(true)
    try {
      const result = await subscribePlan(selectedPlan as 'monthly' | 'yearly')
      if (result.success) {
        Taro.showToast({ title: '开通成功', icon: 'success' })
        await fetchMembership(user.id)
      } else {
        Taro.showToast({ title: result.error || '开通失败', icon: 'none' })
      }
    } catch (err) {
      Taro.showToast({ title: '开通失败，请重试', icon: 'none' })
    } finally {
      setSubscribing(false)
    }
  }

  useEffect(() => {
    if (!isInitialized) return
    if (!isAuthenticated || !user) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    const loadData = async () => {
      try {
        await fetchMembership(user.id)
      } catch (err) {
        // 静默处理错误，页面有错误状态展示
      }
      setPageReady(true)
    }
    loadData()
  }, [isInitialized, isAuthenticated, user])

  if (!pageReady) {
    return <PageLoading />
  }

  const isVip = membership?.level !== 'free'

  return (
    <ScrollView className='member-page' scrollY>
      <View className='member-header'>
        <Text className='member-header-title'>会员中心</Text>
        {isVip && (
          <View className='member-badge'>
            <Text>{membership?.level?.toUpperCase()}会员</Text>
          </View>
        )}
      </View>

      <View className='member-hero'>
        <View className='member-hero-bg' />
        <View className='member-hero-content'>
          <Text className='member-hero-icon'>👑</Text>
          <Text className='member-hero-title'>
            {isVip ? '尊享会员特权' : '开通会员，解锁全部功能'}
          </Text>
          <Text className='member-hero-desc'>
            {isVip
              ? `您的${membership?.level}会员有效期至 ${membership?.endDate || '--'}`
              : '享受无限次查询、AI分析、健康报告等专属权益'}
          </Text>
        </View>
      </View>

      <View className='member-section'>
        <Text className='member-section-title'>会员权益对比</Text>
        <View className='member-benefits'>
          {BENEFITS.map(benefit => (
            <View key={benefit.title} className='member-benefit-item'>
              <Text className='member-benefit-icon'>{benefit.icon}</Text>
              <Text className='member-benefit-title'>{benefit.title}</Text>
              <Text className='member-benefit-desc'>{benefit.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {!isVip && (
        <View className='member-section'>
          <Text className='member-section-title'>选择套餐</Text>
          <View className='member-plans'>
            {PLANS.map(plan => (
              <View
                key={plan.key}
                className={`member-plan-card ${selectedPlan === plan.key ? 'member-plan-card-active' : ''}`}
                onClick={() => setSelectedPlan(plan.key)}
              >
                {plan.tag && <View className='member-plan-tag'><Text>{plan.tag}</Text></View>}
                <Text className='member-plan-name'>{plan.name}</Text>
                <View className='member-plan-price-row'>
                  <Text className='member-plan-price'>{plan.price}</Text>
                  <Text className='member-plan-period'>{plan.period}</Text>
                </View>
                <Text className='member-plan-original'>原价 {plan.originalPrice}</Text>
                <View className='member-plan-features'>
                  {plan.features.map(f => (
                    <View key={f} className='member-plan-feature'>
                      <Text className='member-plan-check'>✓</Text>
                      <Text className='member-plan-feature-text'>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {!isVip && (
        <View className='member-section'>
          <View className='member-subscribe-btn' onClick={handleSubscribe}>
            <Text>{subscribing ? '开通中...' : '立即开通'}</Text>
          </View>
          <Text className='member-subscribe-hint'>
            开通即表示同意《会员服务协议》和《自动续费协议》
          </Text>
        </View>
      )}

      {isVip && (
        <View className='member-section'>
          <View className='member-manage-card'>
            <View className='member-manage-item'>
              <Text className='member-manage-label'>当前套餐</Text>
              <Text className='member-manage-value'>{membership?.level}会员</Text>
            </View>
            <View className='member-manage-item'>
              <Text className='member-manage-label'>到期时间</Text>
              <Text className='member-manage-value'>{membership?.endDate || '--'}</Text>
            </View>
            <View className='member-manage-item'>
              <Text className='member-manage-label'>自动续费</Text>
              <Text className='member-manage-value'>未开启</Text>
            </View>
          </View>
        </View>
      )}

      <View className='member-bottom-safe' />
    </ScrollView>
  )
}