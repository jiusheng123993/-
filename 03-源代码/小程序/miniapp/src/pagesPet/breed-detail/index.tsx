/**
 * 品种详情页面
 * 宠物品种详细信息展示、特征、疾病、护理建议
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { useThemeStore, type ThemeKey } from '../../stores/themeStore'
import { getActiveBreeds, type BreedItem } from '../../data/petKnowledge/breeds'
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
import { useAnalytics, usePageView } from '../../hooks/useAnalytics'
import { EVENT } from '../../constants/analyticsEvents'
import './index.scss'

const disclaimerText = new MedicalDisclaimer().getDisclaimer('green', 'breed')

const SPECIES_LABEL: Record<string, string> = {
  dog: '犬类',
  cat: '猫类',
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶',
  cat: '🐱',
}

const SIZE_LABEL: Record<string, string> = {
  toy: '超小型',
  small: '小型',
  medium: '中型',
  large: '大型',
  giant: '巨型',
}

const EXERCISE_LABEL: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const GROOMING_LABEL: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export default function BreedDetail() {
  const [breed, setBreed] = useState<BreedItem | null>(null)
  const router = useRouter()
  const { trackEvent } = useAnalytics()
  usePageView('breed_detail')

  // 直接从 store 读取主题，避免 useThemeClass 内 useEffect 冗余 setState 触发渲染层异常
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => useThemeStore.getState().current)
  useEffect(() => {
    const handler = (t: ThemeKey) => { setThemeKey(t) }
    Taro.eventCenter.on('themeChange', handler)
    return () => { Taro.eventCenter.off('themeChange', handler) }
  }, [])
  const themeClass = `theme-${themeKey}`

  useEffect(() => {
    const id = router.params.id
    if (!id) return
    // 先用当前生效品种库立即渲染（静态兜底或已缓存的热更新版本），保证首屏不等待网络
    const found = getActiveBreeds().find((b) => b.id === id)
    if (found) {
      setBreed(found)
      trackEvent(EVENT.BREED_VIEW, { breedId: found.id, breedName: found.name })
    }
    // 再异步拉服务端最新品种库；若该品种在新版本中存在则热替换渲染（修订即时可见）
    syncBreedKnowledge().then(() => {
      const fresh = getActiveBreeds().find((b) => b.id === id)
      if (fresh && fresh !== found) setBreed(fresh)
    })
  }, [router.params.id])

  const handleSetMyPet = useCallback(() => {
    if (!breed) return
    trackEvent('set_my_pet_breed', { breedId: breed.id, breedName: breed.name })
    Taro.navigateTo({
      url: `/pagesPet/edit/index?breedId=${breed.id}&breedName=${encodeURIComponent(breed.name)}&species=${breed.species}`,
    })
  }, [breed, trackEvent])

  if (!breed) {
    return (
      <View className={`breed-detail ${themeClass}`}>
        <View className='breed-detail__loading'>
          <Text className='breed-detail__loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={`breed-detail ${themeClass}`}>
      <ScrollView className='breed-detail__scroll' scrollY>
        <View className='breed-detail__hero'>
          <View className='breed-detail__hero-emoji'>
            <Text className='breed-detail__hero-emoji-text'>{SPECIES_EMOJI[breed.species]}</Text>
          </View>
          <Text className='breed-detail__hero-name'>{breed.name}</Text>
          <View className='breed-detail__hero-badges'>
            <View className='breed-detail__hero-badge'>
              <Text>{SPECIES_LABEL[breed.species]}</Text>
            </View>
            <View className='breed-detail__hero-badge'>
              <Text>{SIZE_LABEL[breed.size]}</Text>
            </View>
            <View className='breed-detail__hero-badge'>
              <Text>{breed.origin}</Text>
            </View>
          </View>
        </View>

        <View className='breed-detail__info-grid'>
          <View className='breed-detail__info-item'>
            <Text className='breed-detail__info-label'>寿命</Text>
            <Text className='breed-detail__info-value'>{breed.lifespan}</Text>
          </View>
          <View className='breed-detail__info-item'>
            <Text className='breed-detail__info-label'>体重</Text>
            <Text className='breed-detail__info-value'>{breed.weightRangeStr}</Text>
          </View>
          <View className='breed-detail__info-item'>
            <Text className='breed-detail__info-label'>运动需求</Text>
            <Text className='breed-detail__info-value'>{EXERCISE_LABEL[breed.exerciseNeeds]}</Text>
          </View>
          <View className='breed-detail__info-item'>
            <Text className='breed-detail__info-label'>美容需求</Text>
            <Text className='breed-detail__info-value'>{GROOMING_LABEL[breed.groomingNeeds]}</Text>
          </View>
        </View>

        {breed.aliases.length > 0 && (
          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title'>别名</Text>
            <View className='breed-detail__tags'>
              {breed.aliases.map((alias) => (
                <View key={alias} className='breed-detail__tag'>
                  <Text>{alias}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {breed.temperament.length > 0 && (
          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title'>性格特征</Text>
            <View className='breed-detail__tags'>
              {breed.temperament.map((t) => (
                <View key={t} className='breed-detail__tag breed-detail__tag--primary'>
                  <Text>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {breed.suitableFor.length > 0 && (
          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title'>适合人群</Text>
            <View className='breed-detail__tags'>
              {breed.suitableFor.map((s) => (
                <View key={s} className='breed-detail__tag breed-detail__tag--green'>
                  <Text>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {breed.toxicFoods.length > 0 && (
          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title breed-detail__section-title--danger'>
              ⚠️ 饮食禁忌
            </Text>
            <View className='breed-detail__danger-list'>
              {breed.toxicFoods.map((food) => (
                <View key={food} className='breed-detail__danger-card'>
                  <Text className='breed-detail__danger-icon'>🚫</Text>
                  <Text className='breed-detail__danger-text'>{food}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {breed.commonDiseases.length > 0 && (
          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title breed-detail__section-title--warning'>
              ⚡ 常见疾病
            </Text>
            <View className='breed-detail__warning-list'>
              {breed.commonDiseases.map((disease) => (
                <View key={disease} className='breed-detail__warning-card'>
                  <Text className='breed-detail__warning-icon'>💡</Text>
                  <Text className='breed-detail__warning-text'>{disease}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {breed.careTips.length > 0 && (
          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title breed-detail__section-title--success'>
              💚 养护建议
            </Text>
            <View className='breed-detail__success-list'>
              {breed.careTips.map((tip, index) => (
                <View key={index} className='breed-detail__success-card'>
                  <Text className='breed-detail__success-index'>{index + 1}</Text>
                  <Text className='breed-detail__success-text'>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {breed.dietRestrictions.length > 0 && (
          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title'>饮食建议</Text>
            <View className='breed-detail__list'>
              {breed.dietRestrictions.map((item) => (
                <View key={item} className='breed-detail__list-item'>
                  <Text className='breed-detail__list-dot'>•</Text>
                  <Text className='breed-detail__list-text'>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className='breed-detail__disclaimer'>
          <Text className='breed-detail__disclaimer-text'>{disclaimerText}</Text>
        </View>

        <View className='breed-detail__bottom-spacer' />
      </ScrollView>

      <View className='breed-detail__footer'>
        <View className='breed-detail__footer-btn' onClick={handleSetMyPet}>
          <Text className='breed-detail__footer-btn-text'>我的宠物是这个品种</Text>
        </View>
      </View>
    </View>
  )
}
