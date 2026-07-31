/**
 * 家庭动态组件
 * 展示宠物打卡、里程碑、照片等家庭动态信息流
 */
import { View, Text, Image } from '@tarojs/components'
import { formatMomentTime, getMomentTypeInfo } from '../../services/momentService'
import type { PetMoment } from '../../types/familyTypes'

interface FamilyMomentsProps {
  moments: PetMoment[]
}

function MomentContent({ moment }: { moment: PetMoment }) {
  const content = moment.content as Record<string, unknown>
  const type = moment.type as string

  switch (type) {
    case 'checkin':
      return (
        <View className='family-moment-body'>
          <Text className='family-moment-text'>
            <Text className='family-moment-pet-name'>{content.petName as string}</Text>
            {content.action as string}
          </Text>
          <View className='family-moment-checkin-tags'>
            {(content.appetite as string) && (
              <View className='family-moment-tag'>
                <Text className='family-moment-tag-text'>🍽️ {content.appetite as string}</Text>
              </View>
            )}
            {(content.mood as string) && (
              <View className='family-moment-tag'>
                <Text className='family-moment-tag-text'>😊 {content.mood as string}</Text>
              </View>
            )}
            {(content.score as number) !== undefined && (
              <View className={`family-moment-tag family-moment-tag--${(content.score as number) >= 90 ? 'good' : (content.score as number) >= 75 ? 'mid' : 'low'}`}>
                <Text className='family-moment-tag-text'>{content.score as number}分</Text>
              </View>
            )}
          </View>
        </View>
      )
    case 'milestone':
      return (
        <View className='family-moment-body'>
          <Text className='family-moment-title'>{content.title as string}</Text>
          {(content.description as string) && <Text className='family-moment-text'>{content.description as string}</Text>}
        </View>
      )
    case 'photo':
      return (
        <View className='family-moment-body'>
          {(content.description as string) && <Text className='family-moment-text'>{content.description as string}</Text>}
          {moment.photos && moment.photos.length > 0 && (
            <View className='family-moment-photos'>
              {moment.photos.slice(0, 3).map((photo, idx) => (
                <Image
                  key={idx}
                  className='family-moment-photo'
                  src={photo}
                  mode='aspectFill'
                />
              ))}
            </View>
          )}
        </View>
      )
    case 'memory':
      return (
        <View className='family-moment-body'>
          <Text className='family-moment-text'>{content.description as string}</Text>
        </View>
      )
    default:
      return (
        <View className='family-moment-body'>
          <Text className='family-moment-text'>{content.description as string || ''}</Text>
        </View>
      )
  }
}

export default function FamilyMoments({ moments }: FamilyMomentsProps) {
  if (moments.length === 0) return null

  return (
    <View className='family-moments-section'>
      <View className='family-section-header'>
        <Text className='family-section-title'>家庭动态</Text>
        <Text className='family-section-edit'>查看全部</Text>
      </View>
      <View className='family-moments-list'>
        {moments.map((moment, idx) => {
          const typeInfo = getMomentTypeInfo(moment.type)
          const content = moment.content as Record<string, unknown>
          const petName = content.petName as string || ''
          const petEmoji = content.petEmoji as string || '🐾'
          return (
            <View
              key={moment.id}
              className='family-moment-card'
              style={{ animationDelay: `${idx * 0.06}s` }}
            >
              <View className='family-moment-header'>
                <View className='family-moment-emoji'>
                  <Text>{petEmoji}</Text>
                </View>
                <View className='family-moment-meta'>
                  <View className='family-moment-meta-row'>
                    <Text className='family-moment-name'>{petName}</Text>
                    <View className='family-moment-type-badge'>
                      <Text className='family-moment-type-text'>{typeInfo.icon} {typeInfo.label}</Text>
                    </View>
                  </View>
                  <Text className='family-moment-time'>{formatMomentTime(moment.createdAt)}</Text>
                </View>
              </View>
              <MomentContent moment={moment} />
            </View>
          )
        })}
      </View>
    </View>
  )
}