/**
 * 宠物列表组件（家庭页）
 * 横向滚动展示所有宠物卡片，支持点击切换
 */
import { View, Text, ScrollView } from '@tarojs/components'
import type { PetProfile } from '../../services/petService'
import { calcAge, getScoreLevel, type RankedPet } from './utils'

interface FamilyPetListProps {
  pets: PetProfile[]
  petScores: Record<string, number>
  rankedPets: RankedPet[]
  onPetClick: (pet: PetProfile) => void
  onAddPet: () => void
}

export default function FamilyPetList({ pets, petScores, rankedPets, onPetClick, onAddPet }: FamilyPetListProps) {
  return (
    <>
      <View className='family-section-header'>
        <Text className='family-section-title'>毛孩子们</Text>
        {pets.length === 0 && (
          <Text className='family-section-edit' onClick={onAddPet}>新建</Text>
        )}
      </View>

      {pets.length === 0 ? (
        <View className='family-empty'>
          <Text className='family-empty-icon'>🐾</Text>
          <Text className='family-empty-text'>还没有添加毛孩子</Text>
          <View className='family-empty-btn' onClick={onAddPet}>
            <Text>+ 新建毛孩子</Text>
          </View>
        </View>
      ) : (
        <ScrollView className='family-pets-scroll' scrollX>
          <View className='family-pets-list'>
            {pets.map(pet => {
              const score = petScores[pet.id] ?? 50
              const level = getScoreLevel(score)
              const emoji = pet.species === 'cat' ? '🐱' : '🐕'
              const age = calcAge(pet.birthDate)
              const roleInfo = rankedPets.find(r => r.pet.id === pet.id)
              return (
                <View
                  key={pet.id}
                  className='family-pet-card'
                  onClick={() => onPetClick(pet)}
                >
                  <View className={`family-pet-emoji-wrap family-pet-emoji-wrap--${pet.species}`}>
                    <Text className='family-pet-emoji'>{emoji}</Text>
                  </View>
                  <Text className='family-pet-name'>{pet.name}</Text>
                  {roleInfo && (
                    <View className='family-pet-role-tag'>
                      <Text className='family-pet-role-text'>{roleInfo.roleIcon} {roleInfo.role}</Text>
                    </View>
                  )}
                  <Text className='family-pet-breed'>{pet.breed || '未知品种'}</Text>
                  <Text className='family-pet-age'>{age}</Text>
                  <View className={`family-pet-score family-pet-score--${level}`}>
                    <Text className={`family-pet-score-text family-pet-score-text--${level}`}>
                      {score}分
                    </Text>
                  </View>
                </View>
              )
            })}
            <View
              className='family-pet-card family-pet-card--add'
              onClick={onAddPet}
            >
              <View className='family-pet-emoji-wrap family-pet-emoji-wrap--add'>
                <Text className='family-pet-emoji'>+</Text>
              </View>
              <Text className='family-pet-name'>新建</Text>
              <Text className='family-pet-breed'>毛孩子</Text>
              <Text className='family-pet-age'>添加</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </>
  )
}