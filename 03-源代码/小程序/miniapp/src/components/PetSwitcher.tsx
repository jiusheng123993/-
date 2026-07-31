/**
 * 宠物切换器组件
 * 横向滚动展示所有宠物，支持切换当前宠物和添加新宠物
 */
import { View, Text, Image, ScrollView } from '@tarojs/components'
import type { PetProfile } from '../services/petService'
import './PetSwitcher.scss'

interface PetSwitcherProps {
  pets: PetProfile[]
  currentPetId: string | null
  onSwitch: (petId: string) => void
  onAdd?: () => void
}

const getDefaultEmoji = (species: 'dog' | 'cat'): string => {
  return species === 'dog' ? '🐕' : '🐱'
}

export default function PetSwitcher({ pets, currentPetId, onSwitch, onAdd }: PetSwitcherProps) {
  return (
    <View className='pet-switcher'>
      <ScrollView scrollX className='pet-switcher__scroll'>
        <View className='pet-switcher__list'>
          {pets.map(pet => (
            <View
              key={pet.id}
              className={`pet-switcher__item ${pet.id === currentPetId ? 'pet-switcher__item--active' : ''} ${pet.isDeceased ? 'pet-switcher__item--deceased' : ''}`}
              onClick={() => onSwitch(pet.id)}
            >
              <View className='pet-switcher__avatar'>
                {pet.avatarPhotoUrl ? (
                  <Image src={pet.avatarPhotoUrl} className='pet-switcher__avatar-img' mode='aspectFill' lazyLoad />
                ) : (
                  <Text className='pet-switcher__avatar-emoji'>{getDefaultEmoji(pet.species)}</Text>
                )}
              </View>
              <Text className='pet-switcher__name'>{pet.name}</Text>
            </View>
          ))}
          {onAdd && (
            <View className='pet-switcher__item pet-switcher__item--add' onClick={onAdd}>
              <View className='pet-switcher__avatar pet-switcher__avatar--add'>
                <Text className='pet-switcher__add-icon'>+</Text>
              </View>
              <Text className='pet-switcher__name'>添加</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
