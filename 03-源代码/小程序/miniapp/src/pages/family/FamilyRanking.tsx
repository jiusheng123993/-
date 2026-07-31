/**
 * 家庭健康排行组件
 * 展示宠物健康评分排名及角色标签（老大、团宠等）
 */
import { View, Text } from '@tarojs/components'
import { RANK_MEDALS, getScoreLevel, type RankedPet } from './utils'

interface FamilyRankingProps {
  rankedPets: RankedPet[]
}

export default function FamilyRanking({ rankedPets }: FamilyRankingProps) {
  if (rankedPets.length === 0) return null

  return (
    <View className='family-ranking-section'>
      <View className='family-section-header'>
        <Text className='family-section-title'>🏆 健康排行</Text>
        <Text className='family-section-edit'>本周</Text>
      </View>
      <View className='family-ranking-list'>
        {rankedPets.slice(0, 5).map((item, idx) => {
          const medal = RANK_MEDALS[idx] || ''
          return (
            <View key={item.pet.id} className='family-ranking-item'>
              <View className='family-ranking-medal'>
                <Text className='family-ranking-medal-text'>{medal || `#${idx + 1}`}</Text>
              </View>
              <View className='family-ranking-avatar'>
                <Text>{item.pet.species === 'cat' ? '🐱' : '🐕'}</Text>
              </View>
              <View className='family-ranking-info'>
                <View className='family-ranking-name-row'>
                  <Text className='family-ranking-name'>{item.pet.name}</Text>
                  <View className='family-ranking-role-tag'>
                    <Text className='family-ranking-role-text'>{item.roleIcon} {item.role}</Text>
                  </View>
                </View>
                <Text className='family-ranking-breed'>{item.pet.breed || '未知品种'}</Text>
              </View>
              <View className={`family-ranking-score family-ranking-score--${getScoreLevel(item.score)}`}>
                <Text className='family-ranking-score-text'>{item.score}分</Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}