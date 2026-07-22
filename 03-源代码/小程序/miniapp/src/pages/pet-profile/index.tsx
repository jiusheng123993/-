import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePet } from '../../hooks/usePet'
import { useAnalytics } from '../../hooks/useAnalytics'
import type { PetProfile } from '../../services/petService'
import PetCard from '../../components/PetCard'
import PetSwitcher from '../../components/PetSwitcher'
import PetDeceasedModal from '../../components/PetDeceasedModal'
import GriefCompanion from '../../components/GriefCompanion'
import { PageLoading, PageError } from '../../components'
import { useAuthStore } from '../../stores/authStore'
import { BREED_DATA } from '../../data/petKnowledge/breeds'
import type { BreedItem } from '../../data/petKnowledge/breeds'
import './index.scss'

function adaptPetForCard(pet: PetProfile): PetProfile & { avatarUrl?: string } {
  return {
    ...pet,
    avatarUrl: pet.avatarPhotoUrl,
  }
}

export default function PetProfile() {
  const {
    pets,
    currentPet,
    isLoading,
    initUser,
    switchPet,
    removePet,
    markPetDeceased,
  } = usePet()
  const { trackPageView, trackEvent } = useAnalytics()
  const [deceasedModalVisible, setDeceasedModalVisible] = useState(false)
  const [deceasedPet, setDeceasedPet] = useState<PetProfile | null>(null)
  const [showGriefCompanion, setShowGriefCompanion] = useState(false)
  const [griefPet, setGriefPet] = useState<PetProfile | null>(null)
  const [error, setError] = useState('')

  const userId = useAuthStore(s => s.user?.id)

  const currentBreedInfo = useMemo<BreedItem | null>(() => {
    if (!currentPet?.breedId) return null
    return BREED_DATA.find((b) => b.id === currentPet.breedId) ?? null
  }, [currentPet?.breedId])

  useEffect(() => {
    trackPageView('pet_profile')
  }, [trackPageView])

  useEffect(() => {
    if (userId) {
      initUser(userId).catch((err) => {
        setError(err instanceof Error ? err.message : '加载失败，请重试')
      })
    }
  }, [userId, initUser])

  const handleRetry = useCallback(() => {
    setError('')
    if (userId) {
      initUser(userId).catch((err) => {
        setError(err instanceof Error ? err.message : '加载失败，请重试')
      })
    }
  }, [userId, initUser])

  const handlePetClick = useCallback(
    async (pet: PetProfile) => {
      trackEvent('click_pet_card', { petId: pet.id, isDeceased: pet.isDeceased })
      if (pet.isDeceased) {
        setGriefPet(pet)
        setShowGriefCompanion(true)
        return
      }
      if (currentPet?.id === pet.id) {
        return
      }
      try {
        await switchPet(pet.id)
        trackEvent('switch_pet', { petId: pet.id, petName: pet.name })
        Taro.showToast({ title: `已切换到${pet.name}`, icon: 'success' })
      } catch {
        Taro.showToast({ title: '切换失败', icon: 'none' })
      }
    },
    [currentPet, switchPet, trackEvent]
  )

  const handleLongPress = useCallback((pet: PetProfile) => {
    trackEvent('long_press_pet', { petId: pet.id })
    const itemList = ['编辑信息']
    if (!pet.isDeceased) {
      itemList.push('标记离世')
    }
    itemList.push('删除宠物')

    Taro.showActionSheet({
      itemList,
      itemColor: '#2C2C2C',
      success: (res) => {
        const action = itemList[res.tapIndex]
        if (action === '编辑信息') {
          Taro.navigateTo({ url: `/pagesPet/edit/index?id=${pet.id}` })
        } else if (action === '标记离世') {
          setDeceasedPet(pet)
          setDeceasedModalVisible(true)
        } else if (action === '删除宠物') {
          handleDeletePet(pet)
        }
      },
    })
  }, [trackEvent])

  const handleDeletePet = useCallback(
    (pet: PetProfile) => {
      Taro.showModal({
        title: '确认删除',
        content: `确定要删除「${pet.name}」的档案吗？此操作不可恢复。`,
        confirmText: '删除',
        confirmColor: '#FF4D4F',
        cancelText: '取消',
        success: async (res) => {
          if (res.confirm) {
            trackEvent('delete_pet', { petId: pet.id })
            try {
              await removePet(pet.id)
              Taro.showToast({ title: '已删除', icon: 'success' })
            } catch {
              Taro.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        },
      })
    },
    [removePet, trackEvent]
  )

  const handleDeceasedConfirm = useCallback(
    async (date: string) => {
      if (!deceasedPet) return
      try {
        await markPetDeceased(deceasedPet.id, date)
        trackEvent('mark_deceased', { petId: deceasedPet.id })
        setGriefPet(deceasedPet)
        setShowGriefCompanion(true)
      } catch {
        Taro.showToast({ title: '操作失败', icon: 'none' })
      } finally {
        setDeceasedModalVisible(false)
        setDeceasedPet(null)
      }
    },
    [deceasedPet, markPetDeceased, trackEvent]
  )

  const handleDeceasedCancel = useCallback(() => {
    setDeceasedModalVisible(false)
    setDeceasedPet(null)
  }, [])

  const handleGriefComplete = useCallback(() => {
    setShowGriefCompanion(false)
    setGriefPet(null)
  }, [])

  const handleSwitchPet = useCallback(
    (petId: string) => {
      const pet = pets.find((p) => p.id === petId)
      if (pet) {
        handlePetClick(pet)
      }
    },
    [pets, handlePetClick]
  )

  const handleAddPet = useCallback(() => {
    trackEvent('add_pet_click')
    Taro.navigateTo({ url: '/pagesPet/add/index' })
  }, [trackEvent])

  if (isLoading && pets.length === 0) {
    return (
      <View className='pet-profile'>
        <PageLoading />
      </View>
    )
  }

  if (error && pets.length === 0) {
    return (
      <View className='pet-profile'>
        <PageError message={error} onRetry={handleRetry} />
      </View>
    )
  }

  return (
    <View className='pet-profile'>
      <View className='pet-profile__header'>
        <Text className='pet-profile__title'>宠物档案</Text>
        {pets.length > 0 && (
          <Text className='pet-profile__count'>共{pets.length}只</Text>
        )}
      </View>

      {pets.length === 0 ? (
        <View className='pet-profile__empty'>
          <Text className='pet-profile__empty-icon'>🐾</Text>
          <Text className='pet-profile__empty-text'>
            还没有添加宠物{'\n'}快来记录你的小伙伴吧
          </Text>
          <View className='pet-profile__empty-btn' onClick={handleAddPet}>
            <Text>添加宠物</Text>
          </View>
        </View>
      ) : (
        <>
          <PetSwitcher
            pets={pets}
            currentPetId={currentPet?.id ?? null}
            onSwitch={handleSwitchPet}
            onAdd={handleAddPet}
          />

          <View className='pet-profile__list'>
            {pets.map((pet) => {
              const adaptedPet = adaptPetForCard(pet)
              const isCurrentPet = currentPet?.id === pet.id
              return (
                <View key={pet.id}>
                  <PetCard
                    pet={adaptedPet}
                    isCurrent={isCurrentPet}
                    onClick={handlePetClick}
                    onLongPress={handleLongPress}
                  />
                  {isCurrentPet && currentBreedInfo && (
                    <View className='pet-profile__breed-traits'>
                      <View className='pet-profile__breed-traits-header'>
                        <Text className='pet-profile__breed-traits-title'>📋 {currentBreedInfo.name}品种特征</Text>
                      </View>
                      {currentBreedInfo.commonDiseases.length > 0 && (
                        <View className='pet-profile__breed-traits-row'>
                          <Text className='pet-profile__breed-traits-label'>🏥 常见疾病</Text>
                          <View className='pet-profile__breed-traits-tags'>
                            {currentBreedInfo.commonDiseases.map((d) => (
                              <Text key={d} className='pet-profile__breed-traits-tag pet-profile__breed-traits-tag--warn'>{d}</Text>
                            ))}
                          </View>
                        </View>
                      )}
                      <View className='pet-profile__breed-traits-row'>
                        <Text className='pet-profile__breed-traits-label'>⚖️ 标准体重</Text>
                        <Text className='pet-profile__breed-traits-value'>{currentBreedInfo.weightRange.min} ~ {currentBreedInfo.weightRange.max} kg</Text>
                      </View>
                      {currentBreedInfo.dietRestrictions.length > 0 && (
                        <View className='pet-profile__breed-traits-row'>
                          <Text className='pet-profile__breed-traits-label'>🚫 饮食禁忌</Text>
                          <View className='pet-profile__breed-traits-tags'>
                            {currentBreedInfo.dietRestrictions.map((d) => (
                              <Text key={d} className='pet-profile__breed-traits-tag pet-profile__breed-traits-tag--danger'>{d}</Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                  {isCurrentPet && (
                    <View className='pet-profile__health-info'>
                      <View className='pet-profile__health-info-header'>
                        <Text className='pet-profile__health-info-title'>🏥 健康信息</Text>
                      </View>
                      <View className='pet-profile__health-info-row'>
                        <Text className='pet-profile__health-info-label'>毛色</Text>
                        <Text className={pet.coatColor ? 'pet-profile__health-info-value' : 'pet-profile__health-info-empty'}>
                          {pet.coatColor || '未填写'}
                        </Text>
                      </View>
                      <View className='pet-profile__health-info-row'>
                        <Text className='pet-profile__health-info-label'>芯片号</Text>
                        <Text className={pet.microchipId ? 'pet-profile__health-info-value' : 'pet-profile__health-info-empty'}>
                          {pet.microchipId || '未填写'}
                        </Text>
                      </View>
                      <View className='pet-profile__health-info-row'>
                        <Text className='pet-profile__health-info-label'>过敏史</Text>
                        <Text className={pet.allergies.length > 0 ? 'pet-profile__health-info-value' : 'pet-profile__health-info-empty'}>
                          {pet.allergies.length > 0 ? pet.allergies.join('、') : '未填写'}
                        </Text>
                      </View>
                      <View className='pet-profile__health-info-row'>
                        <Text className='pet-profile__health-info-label'>用药史</Text>
                        <Text className={pet.medications.length > 0 ? 'pet-profile__health-info-value' : 'pet-profile__health-info-empty'}>
                          {pet.medications.length > 0 ? pet.medications.join('、') : '未填写'}
                        </Text>
                      </View>
                      <View className='pet-profile__health-info-row'>
                        <Text className='pet-profile__health-info-label'>慢性病</Text>
                        <Text className={pet.chronicConditions.length > 0 ? 'pet-profile__health-info-value' : 'pet-profile__health-info-empty'}>
                          {pet.chronicConditions.length > 0 ? pet.chronicConditions.join('、') : '未填写'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </>
      )}

      {pets.length > 0 && (
        <View className='pet-profile__add-btn' onClick={handleAddPet}>
          <Text className='pet-profile__add-icon'>+</Text>
          <Text>添加宠物</Text>
        </View>
      )}

      <PetDeceasedModal
        visible={deceasedModalVisible}
        petName={deceasedPet?.name ?? ''}
        onConfirm={handleDeceasedConfirm}
        onCancel={handleDeceasedCancel}
      />

      {showGriefCompanion && griefPet && (
        <View className='pet-profile__grief-overlay'>
          <GriefCompanion
            petId={griefPet.id}
            petName={griefPet.name}
            species={griefPet.species as 'dog' | 'cat'}
            deceasedDate={griefPet.deceasedDate ?? ''}
            onComplete={handleGriefComplete}
          />
        </View>
      )}
    </View>
  )
}
