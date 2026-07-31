/**
 * 宠物档案页面
 * 展示宠物基本信息、喜好习惯、健康信息、操作入口
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import PageLoading from '../../components/PageLoading'
import PetAvatar from '../../components/PetAvatar'
import { useThemeClass } from '../../hooks/useThemeClass'
import { getPetFacts, type PetFact } from '../../services/petService'
import type { ExpressionContext } from '../../types/avatarTypes'
import './index.scss'

const defaultExpressionContext: ExpressionContext = {
  todayEntry: null,
  hasAnomaly: false,
  anomalyCount: 0,
  riskLevel: null,
  streakDays: 0,
  isBirthday: false,
  isVaccineComplete: false,
  isRecovery: false,
  isDeceased: false,
}

const FACT_ICONS: Record<string, string> = {
  like: '❤️',
  dislike: '💔',
  habit: '🔄',
  personality: '🌟',
  general: '📝',
}

export default function PetProfile() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)
  const { pets, currentPet, fetchPets, switchPet, markPetDeceased } = usePetStore()
  const [pageReady, setPageReady] = useState(false)
  const [facts, setFacts] = useState<PetFact[]>([])
  const themeClass = useThemeClass()

  const pet = currentPet || (pets.length > 0 ? pets[0] : undefined)

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
      } catch (err) {
        // 静默处理错误，页面有错误状态展示
      }
      setPageReady(true)
    }
    loadData()
  }, [isInitialized, isAuthenticated, user])

  // 当切换宠物时，加载其特征数据
  useEffect(() => {
    if (pet && pageReady) {
      getPetFacts(pet.id).then(setFacts).catch(() => setFacts([]))
    }
  }, [pet?.id, pageReady])

  const navigateTo = (url: string) => {
    Taro.navigateTo({ url })
  }

  const handleMarkDeceased = () => {
    if (!pet) return
    Taro.showModal({
      title: '标记宠物离世',
      content: `你正在将「${pet.name}」标记为已离世。\n\n宠物的所有回忆、健康记录、日记和照片将被永久保留在「时光」中，你可以随时回顾与它的点点滴滴。\n\n此操作不可撤销，是否继续？`,
      confirmText: '温柔告别',
      confirmColor: '#6B5B7B',
      cancelText: '取消',
      success: (firstRes) => {
        if (firstRes.confirm) {
          Taro.showModal({
            title: '最后的确认',
            content: `请输入「${pet.name}」以确认标记离世：`,
            editable: true as boolean,
            placeholderText: `输入「${pet.name}」确认`,
            confirmText: '确认标记',
            confirmColor: '#6B5B7B',
            cancelText: '取消',
            success: async (secondRes) => {
              if (secondRes.confirm && (secondRes as unknown as Record<string, unknown>).content === pet.name) {
                try {
                  const today = new Date().toISOString().slice(0, 10)
                  await markPetDeceased(pet.id, today)
                  Taro.showToast({ title: `${pet.name}已安息`, icon: 'none' })
                  if (user) await fetchPets(user.id)
                  setPageReady(true)
                } catch {
                  Taro.showToast({ title: '操作失败，请重试', icon: 'none' })
                }
              } else if (secondRes.confirm) {
                Taro.showToast({ title: '输入不正确，操作已取消', icon: 'none' })
              }
            },
          } as Parameters<typeof Taro.showModal>[0])
        }
      },
    })
  }

  if (!pageReady) {
    return <PageLoading />
  }

  if (pets.length === 0) {
    return (
      <View className={`profile-page ${themeClass}`}>
        <View className='profile-empty'>
          <View className='profile-empty-icon'>🐾</View>
          <Text className='profile-empty-text'>还没有添加宠物</Text>
          <Text className='profile-empty-hint'>添加你的毛孩子，开始记录健康数据</Text>
          <View className='profile-empty-btn' onClick={() => navigateTo('/pagesPet/add/index')}>
            <Text>添加宠物</Text>
          </View>
        </View>
      </View>
    )
  }

  const activePet = pet!

  return (
    <ScrollView className={`profile-page ${themeClass}`} scrollY>
      <View className='profile-header'>
        <View className='profile-avatar'>
          <PetAvatar
            species={activePet.species}
            petName={activePet.name}
            expressionContext={defaultExpressionContext}
            size={80}
          />
        </View>
        <Text className='profile-name'>{activePet.name}</Text>
        {activePet.isDeceased && (
          <View className='profile-deceased-badge'>
            <Text className='profile-deceased-icon'>🕊️</Text>
            <Text className='profile-deceased-text'>已回喵星</Text>
          </View>
        )}
        <Text className='profile-breed'>{activePet.breed || '未知品种'}</Text>
        <View className='profile-tags'>
          {activePet.gender && <Text className='profile-tag'>{activePet.gender === 'male' ? '♂ 公' : '♀ 母'}</Text>}
          {activePet.birthDate && <Text className='profile-tag'>{calcAge(activePet.birthDate)}</Text>}
          {activePet.weight && <Text className='profile-tag'>{activePet.weight}kg</Text>}
        </View>
      </View>

      {pets.length > 1 && (
        <View className='profile-pet-switcher'>
          {pets.map(p => (
            <View
              key={p.id}
              className={`profile-pet-tab ${currentPet?.id === p.id ? 'profile-pet-tab-active' : ''}`}
              onClick={() => switchPet(p.id)}
            >
              <Text>{p.species === 'cat' ? '🐱' : '🐶'}</Text>
              <Text>{p.name}</Text>
            </View>
          ))}
        </View>
      )}

      <View className='profile-section'>
        <Text className='profile-section-title'>基本信息</Text>
        <View className='profile-info-grid'>
          <View className='profile-info-item'>
            <Text className='profile-info-label'>品种</Text>
            <Text className='profile-info-value'>{activePet.breed || '未设置'}</Text>
          </View>
          <View className='profile-info-item'>
            <Text className='profile-info-label'>性别</Text>
            <Text className='profile-info-value'>{activePet.gender === 'male' ? '公' : activePet.gender === 'female' ? '母' : '未设置'}</Text>
          </View>
          <View className='profile-info-item'>
            <Text className='profile-info-label'>生日</Text>
            <Text className='profile-info-value'>{activePet.birthDate || '未设置'}</Text>
          </View>
          <View className='profile-info-item'>
            <Text className='profile-info-label'>体重</Text>
            <Text className='profile-info-value'>{activePet.weight ? `${activePet.weight}kg` : '未设置'}</Text>
          </View>
        </View>
      </View>

      {facts.length > 0 && (
        <View className='profile-section'>
          <Text className='profile-section-title'>它的喜好与习惯</Text>
          <View className='profile-facts-list'>
            {facts.map((fact) => (
              <View key={fact.id} className={`profile-fact-item profile-fact-item--${fact.category}`}>
                <Text className='profile-fact-icon'>{FACT_ICONS[fact.category] || '📝'}</Text>
                <Text className='profile-fact-text'>{fact.fact}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className='profile-section'>
        <Text className='profile-section-title'>品种特征</Text>
        <View className='profile-feature-card'>
          <View className='profile-feature-item'>
            <Text className='profile-feature-label'>毛色</Text>
            <Text className='profile-feature-value'>{activePet.coatColor || '未设置'}</Text>
          </View>
        </View>
      </View>

      <View className='profile-section'>
        <Text className='profile-section-title'>健康信息</Text>
        <View className='profile-health-card'>
          <View className='profile-health-item'>
            <Text className='profile-health-label'>过敏史</Text>
            <Text className='profile-health-value'>{activePet.allergies || '无'}</Text>
          </View>
          <View className='profile-health-item'>
            <Text className='profile-health-label'>用药史</Text>
            <Text className='profile-health-value'>{activePet.medications || '无'}</Text>
          </View>
          <View className='profile-health-item'>
            <Text className='profile-health-label'>绝育状态</Text>
            <Text className='profile-health-value'>{activePet.isNeutered ? '已绝育' : '未绝育'}</Text>
          </View>
          <View className='profile-health-item'>
            <Text className='profile-health-label'>芯片编号</Text>
            <Text className='profile-health-value'>{activePet.microchipId || '无'}</Text>
          </View>
        </View>
      </View>

      <View className='profile-section'>
        <Text className='profile-section-title'>健康管理</Text>
        <View className='profile-actions'>
          <View className='profile-action-btn' onClick={() => navigateTo('/pagesPet/chronic-tracking/index')}>
            <Text className='profile-action-icon'>🩺</Text>
            <Text className='profile-action-label'>慢性病追踪</Text>
          </View>
          <View className='profile-action-btn' onClick={() => navigateTo('/pagesPet/feeding-advice/index')}>
            <Text className='profile-action-icon'>🍽️</Text>
            <Text className='profile-action-label'>喂养建议</Text>
          </View>
          <View className='profile-action-btn' onClick={() => navigateTo(`/pagesPet/edit/index?id=${activePet.id}`)}>
            <Text className='profile-action-icon'>✏️</Text>
            <Text className='profile-action-label'>编辑档案</Text>
          </View>
        </View>
      </View>

      <View className='profile-section'>
        <View className='profile-actions'>
          <View className='profile-action-btn' onClick={() => navigateTo('/pagesPet/diary/index')}>
            <Text className='profile-action-icon'>📔</Text>
            <Text className='profile-action-label'>成长日记</Text>
          </View>
          <View className='profile-action-btn' onClick={() => navigateTo('/pagesPet/avatar-customize/index')}>
            <Text className='profile-action-icon'>🎨</Text>
            <Text className='profile-action-label'>形象定制</Text>
          </View>
          <View className='profile-action-btn' onClick={() => navigateTo('/pagesPet/wardrobe/index')}>
            <Text className='profile-action-icon'>👗</Text>
            <Text className='profile-action-label'>换装</Text>
          </View>
        </View>
      </View>

      <View className='profile-section'>
        <View className='profile-danger-zone'>
          <Text className='profile-danger-title'>危险操作</Text>
          <View className='profile-danger-btn' onClick={handleMarkDeceased}>
            <Text>标记宠物离世</Text>
          </View>
        </View>
      </View>

      <View className='profile-bottom-safe' />
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