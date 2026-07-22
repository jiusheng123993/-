import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import './index.scss'

export default function PetProfile() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)
  const { pets, currentPet, fetchPets, setCurrentPet } = usePetStore()
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
    Taro.navigateTo({ url })
  }

  if (!pageReady) {
    return <View className='profile-loading'>加载中...</View>
  }

  if (pets.length === 0) {
    return (
      <View className='profile-page'>
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

  const pet = currentPet || pets[0]

  return (
    <ScrollView className='profile-page' scrollY>
      <View className='profile-header'>
        <View className='profile-avatar'>
          <Text className='profile-avatar-emoji'>{pet.species === 'cat' ? '🐱' : '🐶'}</Text>
        </View>
        <Text className='profile-name'>{pet.name}</Text>
        <Text className='profile-breed'>{pet.breed || '未知品种'}</Text>
        <View className='profile-tags'>
          {pet.gender && <Text className='profile-tag'>{pet.gender === 'male' ? '♂ 公' : '♀ 母'}</Text>}
          {pet.birthday && <Text className='profile-tag'>{calcAge(pet.birthday)}</Text>}
          {pet.weight && <Text className='profile-tag'>{pet.weight}kg</Text>}
        </View>
      </View>

      {pets.length > 1 && (
        <View className='profile-pet-switcher'>
          {pets.map(p => (
            <View
              key={p.id}
              className={`profile-pet-tab ${currentPet?.id === p.id ? 'profile-pet-tab-active' : ''}`}
              onClick={() => setCurrentPet(p)}
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
            <Text className='profile-info-value'>{pet.breed || '未设置'}</Text>
          </View>
          <View className='profile-info-item'>
            <Text className='profile-info-label'>性别</Text>
            <Text className='profile-info-value'>{pet.gender === 'male' ? '公' : pet.gender === 'female' ? '母' : '未设置'}</Text>
          </View>
          <View className='profile-info-item'>
            <Text className='profile-info-label'>生日</Text>
            <Text className='profile-info-value'>{pet.birthday || '未设置'}</Text>
          </View>
          <View className='profile-info-item'>
            <Text className='profile-info-label'>体重</Text>
            <Text className='profile-info-value'>{pet.weight ? `${pet.weight}kg` : '未设置'}</Text>
          </View>
        </View>
      </View>

      <View className='profile-section'>
        <Text className='profile-section-title'>品种特征</Text>
        <View className='profile-feature-card'>
          <View className='profile-feature-item'>
            <Text className='profile-feature-label'>体型</Text>
            <Text className='profile-feature-value'>{pet.size || '未设置'}</Text>
          </View>
          <View className='profile-feature-item'>
            <Text className='profile-feature-label'>毛发</Text>
            <Text className='profile-feature-value'>{pet.coatType || '未设置'}</Text>
          </View>
          <View className='profile-feature-item'>
            <Text className='profile-feature-label'>性格</Text>
            <Text className='profile-feature-value'>{pet.personality || '未设置'}</Text>
          </View>
        </View>
      </View>

      <View className='profile-section'>
        <Text className='profile-section-title'>健康信息</Text>
        <View className='profile-health-card'>
          <View className='profile-health-item'>
            <Text className='profile-health-label'>过敏史</Text>
            <Text className='profile-health-value'>{pet.allergies || '无'}</Text>
          </View>
          <View className='profile-health-item'>
            <Text className='profile-health-label'>用药史</Text>
            <Text className='profile-health-value'>{pet.medications || '无'}</Text>
          </View>
          <View className='profile-health-item'>
            <Text className='profile-health-label'>绝育状态</Text>
            <Text className='profile-health-value'>{pet.neutered ? '已绝育' : '未绝育'}</Text>
          </View>
          <View className='profile-health-item'>
            <Text className='profile-health-label'>芯片编号</Text>
            <Text className='profile-health-value'>{pet.chipId || '无'}</Text>
          </View>
        </View>
      </View>

      <View className='profile-section'>
        <View className='profile-actions'>
          <View className='profile-action-btn' onClick={() => navigateTo(`/pagesPet/edit/index?id=${pet.id}`)}>
            <Text className='profile-action-icon'>✏️</Text>
            <Text className='profile-action-label'>编辑档案</Text>
          </View>
          <View className='profile-action-btn' onClick={() => navigateTo('/pagesPet/diary/index')}>
            <Text className='profile-action-icon'>📔</Text>
            <Text className='profile-action-label'>成长日记</Text>
          </View>
          <View className='profile-action-btn' onClick={() => navigateTo('/pagesPet/avatar-customize/index')}>
            <Text className='profile-action-icon'>🎨</Text>
            <Text className='profile-action-label'>形象定制</Text>
          </View>
        </View>
      </View>

      <View className='profile-section'>
        <View className='profile-danger-zone'>
          <Text className='profile-danger-title'>危险操作</Text>
          <View className='profile-danger-btn'>
            <Text>标记宠物离世</Text>
          </View>
        </View>
      </View>

      <View className='profile-bottom-safe' />
    </ScrollView>
  )
}

function calcAge(birthday: string): string {
  const birth = new Date(birthday)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (months < 12) return `${months}个月`
  return `${Math.floor(months / 12)}岁`
}