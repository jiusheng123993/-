import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import { useCheckinStore } from '../../stores/checkinStore'
import { useMembershipStore } from '../../stores/membershipStore'
import PageLoading from '../../components/PageLoading'
import './index.scss'

const QUICK_ACTIONS = [
  { icon: '🍎', label: '食物查询', url: '/pagesPet/food-query/index', bg: '#FFF0E6' },
  { icon: '🤒', label: '症状初筛', url: '/pagesPet/symptom-check/index', bg: '#FFE8E8' },
  { icon: '💉', label: '疫苗日历', url: '/pagesPet/vaccine/index', bg: '#E8F0FE' },
  { icon: '📊', label: '健康趋势', url: '/pagesPet/trends/index', bg: '#E8F8E8' },
  { icon: '🎨', label: '形象定制', url: '/pagesPet/avatar-customize/index', bg: '#FDE8F0' },
  { icon: '🏥', label: '找医院', url: '/pagesPet/hospital/index', bg: '#F0E8F8' },
  { icon: '📋', label: '健康报告', url: '/pagesPet/trends/index', bg: '#FFF8E8' },
  { icon: '💼', label: '职业顾问', url: '/pagesCareer/profile/index', bg: '#E8EEFF' },
]

const TIPS = [
  '夏季注意驱虫，建议每月1次',
  '猫咪每天需要16-20小时睡眠',
  '定期梳毛有助于减少毛球问题',
  '狗狗每天至少需要30分钟运动',
  '保持宠物饮水充足，预防泌尿问题',
  '定期检查耳朵，预防耳螨感染',
]

export default function Index() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)
  const { pets, currentPet, fetchPets, switchPet } = usePetStore()
  const { todayCheckin, streakDays, fetchCheckins } = useCheckinStore()
  const membership = useMembershipStore(state => state.membership)
  const [pageReady, setPageReady] = useState(false)
  const [showPetList, setShowPetList] = useState(false)
  const [tipIndex] = useState(() => Math.floor(Math.random() * TIPS.length))

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
        // 静默处理错误，页面有错误状态展示
      }
      setPageReady(true)
    }
    loadData()
  }, [isInitialized, isAuthenticated, user])

  useEffect(() => {
    if (currentPet) {
      fetchCheckins(currentPet.id)
    }
  }, [currentPet])

  const navigateTo = (url: string) => {
    Taro.navigateTo({ url })
  }

  const handleCheckin = () => {
    if (currentPet) {
      navigateTo('/pagesPet/checkin/index')
    }
  }

  if (!pageReady) {
    return <PageLoading />
  }

  return (
    <ScrollView className='home-page' scrollY>
      <View className='home-header'>
        <Text className='home-header-title'>星寰海</Text>
        <View className='home-header-right' onClick={() => navigateTo('/pagesUser/settings/index')}>
          <Text className='home-settings-icon'>⚙️</Text>
        </View>
      </View>

      {pets.length > 0 && (
        <View className='home-pet-card' onClick={() => setShowPetList(!showPetList)}>
          <View className='home-pet-card-left'>
            <View className='home-pet-avatar'>{currentPet?.species === 'cat' ? '🐱' : '🐶'}</View>
            <View className='home-pet-info'>
              <Text className='home-pet-name'>{currentPet?.name || '未选择'}</Text>
              <Text className='home-pet-detail'>
                {currentPet?.breed || ''}{currentPet?.breed && currentPet?.birthDate ? ' · ' : ''}
                {currentPet?.birthDate ? calcAge(currentPet.birthDate) : ''}
                {currentPet?.weight ? ` · ${currentPet.weight}kg` : ''}
              </Text>
            </View>
          </View>
          <Text className='home-pet-switch'>▼ 切换宠物</Text>
        </View>
      )}

      {showPetList && pets.length > 1 && (
        <View className='home-pet-dropdown'>
          {pets.map(pet => (
            <View
              key={pet.id}
              className={`home-pet-dropdown-item ${currentPet?.id === pet.id ? 'home-pet-dropdown-item-active' : ''}`}
              onClick={() => { switchPet(pet.id); setShowPetList(false) }}
            >
              <Text>{pet.species === 'cat' ? '🐱' : '🐶'} {pet.name}</Text>
              {currentPet?.id === pet.id && <Text className='home-pet-check'>✓</Text>}
            </View>
          ))}
        </View>
      )}

      {currentPet && (
        <View className='home-avatar-section'>
          <View className='home-avatar-card'>
            <View className='home-avatar-placeholder'>
              <Text className='home-avatar-emoji'>{currentPet.species === 'cat' ? '🐱' : '🐶'}</Text>
              <Text className='home-avatar-mood'>开心</Text>
            </View>
          </View>
        </View>
      )}

      <View className='home-checkin-section'>
        <View className='home-checkin-card'>
          <Text className='home-checkin-title'>毛孩子今天怎么样？</Text>
          <View className='home-checkin-btn' onClick={handleCheckin}>
            <Text className='home-checkin-btn-text'>开始3秒打卡</Text>
          </View>
          <View className='home-checkin-streak'>
            <Text className='home-checkin-streak-text'>
              已连续打卡 {streakDays} 天 🔥
            </Text>
          </View>
        </View>
      </View>

      <View className='home-section'>
        <Text className='home-section-title'>快捷功能</Text>
        <View className='home-quick-actions'>
          {QUICK_ACTIONS.map(action => (
            <View
              key={action.label}
              className='home-quick-action'
              onClick={() => navigateTo(action.url)}
            >
              <View className='home-quick-icon' style={{ background: action.bg }}>
                <Text>{action.icon}</Text>
              </View>
              <Text className='home-quick-label'>{action.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='home-section'>
        <View className='home-vaccine-card' onClick={() => navigateTo('/pagesPet/vaccine/index')}>
          <View className='home-vaccine-left'>
            <Text className='home-vaccine-icon'>📅</Text>
            <View>
              <Text className='home-vaccine-label'>upcoming</Text>
              <Text className='home-vaccine-text'>
                {currentPet?.name || '毛孩子'}的疫苗提醒
              </Text>
            </View>
          </View>
          <Text className='home-vaccine-arrow'>›</Text>
        </View>
      </View>

      <View className='home-section'>
        <View className='home-tip-card'>
          <View className='home-tip-header'>
            <Text className='home-tip-icon'>💡</Text>
            <Text className='home-tip-label'>今日小贴士</Text>
          </View>
          <Text className='home-tip-text'>{TIPS[tipIndex]}</Text>
        </View>
      </View>

      {pets.length === 0 && (
        <View className='home-section'>
          <View className='home-empty'>
            <View className='home-empty-icon'>🐾</View>
            <Text className='home-empty-text'>还没有添加宠物</Text>
            <Text className='home-empty-hint'>添加宠物后开始记录健康数据</Text>
            <View className='home-empty-btn' onClick={() => navigateTo('/pagesPet/add/index')}>
              <Text>添加宠物</Text>
            </View>
          </View>
        </View>
      )}

      <View className='home-member-section'>
        <View className='home-member-banner' onClick={() => Taro.switchTab({ url: '/pages/member/index' })}>
          <View>
            <Text className='home-member-level'>
              {membership?.level === 'free' ? '免费用户' : `${membership?.level}会员`}
            </Text>
            <Text className='home-member-hint'>
              {membership?.level === 'free' ? '开通会员解锁更多功能' : '查看会员权益'}
            </Text>
          </View>
          <View className='home-member-btn'>
            <Text>{membership?.level === 'free' ? '开通' : '查看'}</Text>
          </View>
        </View>
      </View>

      <View className='home-bottom-safe' />
    </ScrollView>
  )
}

function calcAge(birthDate: string): string {
  const birth = new Date(birthDate)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (months < 12) return `${months}个月`
  return `${Math.floor(months / 12)}岁`
}