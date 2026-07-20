import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { usePet } from '../../hooks/usePet'
import type { PetProfile } from '../../services/petService'
import PetCard from '../../components/PetCard'
import PetSwitcher from '../../components/PetSwitcher'
import PetDeceasedModal from '../../components/PetDeceasedModal'
import GriefCompanion from '../../components/GriefCompanion'
import { PageLoading, PageError } from '../../components'
import { useAuthStore } from '../../stores/authStore'
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
  const [deceasedModalVisible, setDeceasedModalVisible] = useState(false)
  const [deceasedPet, setDeceasedPet] = useState<PetProfile | null>(null)
  const [showGriefCompanion, setShowGriefCompanion] = useState(false)
  const [griefPet, setGriefPet] = useState<PetProfile | null>(null)
  const [error, setError] = useState('')

  const userId = useAuthStore(s => s.user?.id)

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
      if (pet.isDeceased) {
        Taro.showActionSheet({
          itemList: ['查看纪念'],
          itemColor: '#2C2C2C',
          success: (res) => {
            if (res.tapIndex === 0) {
              setGriefPet(pet)
              setShowGriefCompanion(true)
            }
          },
        })
        return
      }
      if (currentPet?.id === pet.id) {
        return
      }
      try {
        await switchPet(pet.id)
        Taro.showToast({ title: `已切换到${pet.name}`, icon: 'success' })
      } catch {
        Taro.showToast({ title: '切换失败', icon: 'none' })
      }
    },
    [currentPet, switchPet]
  )

  const handleLongPress = useCallback((pet: PetProfile) => {
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
          Taro.navigateTo({ url: `/pages/pet-profile/edit?id=${pet.id}` })
        } else if (action === '标记离世') {
          setDeceasedPet(pet)
          setDeceasedModalVisible(true)
        } else if (action === '删除宠物') {
          handleDeletePet(pet)
        }
      },
    })
  }, [])

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
    [removePet]
  )

  const handleDeceasedConfirm = useCallback(
    async (date: string) => {
      if (!deceasedPet) return
      try {
        await markPetDeceased(deceasedPet.id, date)
        Taro.showToast({ title: '已标记', icon: 'success' })
        setGriefPet(deceasedPet)
        setShowGriefCompanion(true)
      } catch {
        Taro.showToast({ title: '操作失败', icon: 'none' })
      } finally {
        setDeceasedModalVisible(false)
        setDeceasedPet(null)
      }
    },
    [deceasedPet, markPetDeceased]
  )

  const handleDeceasedCancel = useCallback(() => {
    setDeceasedModalVisible(false)
    setDeceasedPet(null)
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
    Taro.navigateTo({ url: '/pages/pet-profile/add' })
  }, [])

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
              return (
                <PetCard
                  key={pet.id}
                  pet={adaptedPet}
                  isCurrent={currentPet?.id === pet.id}
                  onClick={handlePetClick}
                  onLongPress={handleLongPress}
                />
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
        <View className='pet-profile__grief-overlay' onClick={() => { setShowGriefCompanion(false); setGriefPet(null) }}>
          <View onClick={(e) => e.stopPropagation()}>
            <GriefCompanion
              petName={griefPet.name}
              petAvatar={griefPet.avatarPhotoUrl}
              species={griefPet.species as 'dog' | 'cat'}
              deceasedDate={griefPet.deceasedDate || ''}
              onStageChange={() => {}}
            />
          </View>
        </View>
      )}
    </View>
  )
}
