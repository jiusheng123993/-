import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useMemo, useCallback } from 'react'
import { BREED_DATA, type BreedItem } from '../../data/petKnowledge/breeds'
import FloatingNav from '../../components/FloatingNav'
import './index.scss'

type SpeciesFilter = 'all' | 'dog' | 'cat'
type SizeFilter = 'all' | 'toy' | 'small' | 'medium' | 'large' | 'giant'

const SIZE_LABELS: Record<SizeFilter, string> = {
  all: '全部',
  toy: '超小型',
  small: '小型',
  medium: '中型',
  large: '大型',
  giant: '巨型',
}

const EXERCISE_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const GROOMING_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export default function PetBreed() {
  const [searchText, setSearchText] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all')
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all')
  const [selectedBreed, setSelectedBreed] = useState<BreedItem | null>(null)

  const filteredBreeds = useMemo(() => {
    let result = BREED_DATA

    if (speciesFilter !== 'all') {
      result = result.filter((b) => b.species === speciesFilter)
    }
    if (sizeFilter !== 'all') {
      result = result.filter((b) => b.size === sizeFilter)
    }
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase()
      result = result.filter(
        (b) =>
          b.name.includes(keyword) ||
          b.aliases.some((a) => a.toLowerCase().includes(keyword))
      )
    }

    return result
  }, [searchText, speciesFilter, sizeFilter])

  const handleBreedClick = useCallback((breed: BreedItem) => {
    setSelectedBreed(breed)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedBreed(null)
  }, [])

  const handleNavigateToFood = useCallback(() => {
    Taro.switchTab({ url: '/pages/index/index' })
  }, [])

  if (selectedBreed) {
    return (
      <View className='breed-page'>
        <View className='breed-detail'>
          <View className='breed-detail__header'>
            <View className='breed-detail__back' onClick={handleBack}>
              <Text className='breed-detail__back-icon'>&lt;</Text>
              <Text className='breed-detail__back-text'>返回列表</Text>
            </View>
            <Text className='breed-detail__species-tag'>
              {selectedBreed.species === 'dog' ? '🐕 犬' : '🐈 猫'}
            </Text>
          </View>

          <View className='breed-detail__title-section'>
            <Text className='breed-detail__name'>{selectedBreed.name}</Text>
            {selectedBreed.aliases.length > 0 && (
              <Text className='breed-detail__aliases'>
                {selectedBreed.aliases.join(' / ')}
              </Text>
            )}
          </View>

          <View className='breed-detail__info-grid'>
            <View className='breed-detail__info-item'>
              <Text className='breed-detail__info-label'>体型</Text>
              <Text className='breed-detail__info-value'>{SIZE_LABELS[selectedBreed.size]}</Text>
            </View>
            <View className='breed-detail__info-item'>
              <Text className='breed-detail__info-label'>原产地</Text>
              <Text className='breed-detail__info-value'>{selectedBreed.origin}</Text>
            </View>
            <View className='breed-detail__info-item'>
              <Text className='breed-detail__info-label'>平均寿命</Text>
              <Text className='breed-detail__info-value'>{selectedBreed.avgLifespan}</Text>
            </View>
            <View className='breed-detail__info-item'>
              <Text className='breed-detail__info-label'>平均体重</Text>
              <Text className='breed-detail__info-value'>{selectedBreed.avgWeight}</Text>
            </View>
          </View>

          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title'>性格特征</Text>
            <View className='breed-detail__tags'>
              {selectedBreed.temperament.map((t) => (
                <View key={t} className='breed-detail__tag breed-detail__tag--temperament'>
                  <Text>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title'>养护需求</Text>
            <View className='breed-detail__care-grid'>
              <View className='breed-detail__care-item'>
                <Text className='breed-detail__care-label'>运动量</Text>
                <Text className='breed-detail__care-value'>{EXERCISE_LABELS[selectedBreed.exerciseNeeds]}</Text>
              </View>
              <View className='breed-detail__care-item'>
                <Text className='breed-detail__care-label'>美容需求</Text>
                <Text className='breed-detail__care-value'>{GROOMING_LABELS[selectedBreed.groomingNeeds]}</Text>
              </View>
            </View>
          </View>

          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title breed-detail__section-title--warning'>遗传疾病风险</Text>
            <View className='breed-detail__list'>
              {selectedBreed.geneticDiseases.map((d) => (
                <View key={d} className='breed-detail__list-item'>
                  <Text className='breed-detail__list-bullet'>⚠</Text>
                  <Text className='breed-detail__list-text'>{d}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title breed-detail__section-title--info'>常见健康问题</Text>
            <View className='breed-detail__list'>
              {selectedBreed.commonHealthIssues.map((d) => (
                <View key={d} className='breed-detail__list-item'>
                  <Text className='breed-detail__list-bullet'>ℹ</Text>
                  <Text className='breed-detail__list-text'>{d}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title breed-detail__section-title--care'>特殊护理建议</Text>
            <View className='breed-detail__list'>
              {selectedBreed.specialCare.map((d) => (
                <View key={d} className='breed-detail__list-item'>
                  <Text className='breed-detail__list-bullet'>💡</Text>
                  <Text className='breed-detail__list-text'>{d}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='breed-detail__section'>
            <Text className='breed-detail__section-title'>适合人群</Text>
            <View className='breed-detail__tags'>
              {selectedBreed.suitableFor.map((s) => (
                <View key={s} className='breed-detail__tag breed-detail__tag--suitable'>
                  <Text>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <FloatingNav />
      </View>
    )
  }

  return (
    <View className='breed-page'>
      <View className='breed-page__header'>
        <Text className='breed-page__title'>品种百科</Text>
        <Text className='breed-page__subtitle'>
          共收录 {BREED_DATA.length} 个品种，了解你的毛孩子
        </Text>
      </View>

      <View className='breed-page__search'>
        <Input
          className='breed-page__search-input'
          placeholder='搜索品种名称...'
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      <View className='breed-page__filters'>
        <ScrollView className='breed-page__filter-row' scrollX>
          <View
            className={`breed-page__filter-chip ${speciesFilter === 'all' ? 'breed-page__filter-chip--active' : ''}`}
            onClick={() => setSpeciesFilter('all')}
          >
            <Text>全部</Text>
          </View>
          <View
            className={`breed-page__filter-chip ${speciesFilter === 'dog' ? 'breed-page__filter-chip--active' : ''}`}
            onClick={() => setSpeciesFilter('dog')}
          >
            <Text>🐕 犬类</Text>
          </View>
          <View
            className={`breed-page__filter-chip ${speciesFilter === 'cat' ? 'breed-page__filter-chip--active' : ''}`}
            onClick={() => setSpeciesFilter('cat')}
          >
            <Text>🐈 猫类</Text>
          </View>
        </ScrollView>

        <ScrollView className='breed-page__filter-row' scrollX>
          {(['all', 'toy', 'small', 'medium', 'large', 'giant'] as SizeFilter[]).map((size) => (
            <View
              key={size}
              className={`breed-page__filter-chip ${sizeFilter === size ? 'breed-page__filter-chip--active' : ''}`}
              onClick={() => setSizeFilter(size)}
            >
              <Text>{SIZE_LABELS[size]}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView className='breed-page__list' scrollY>
        <View className='breed-page__count'>
          <Text className='breed-page__count-text'>
            共 {filteredBreeds.length} 个品种
          </Text>
        </View>

        {filteredBreeds.map((breed) => (
          <View
            key={breed.id}
            className='breed-page__card'
            onClick={() => handleBreedClick(breed)}
          >
            <View className='breed-page__card-header'>
              <Text className='breed-page__card-name'>{breed.name}</Text>
              <Text className='breed-page__card-species'>
                {breed.species === 'dog' ? '🐕' : '🐈'}
              </Text>
            </View>
            <View className='breed-page__card-info'>
              <Text className='breed-page__card-item'>体型: {SIZE_LABELS[breed.size]}</Text>
              <Text className='breed-page__card-item'>寿命: {breed.avgLifespan}</Text>
              <Text className='breed-page__card-item'>体重: {breed.avgWeight}</Text>
            </View>
            <View className='breed-page__card-temperament'>
              {breed.temperament.slice(0, 4).map((t) => (
                <View key={t} className='breed-page__card-tag'>
                  <Text>{t}</Text>
                </View>
              ))}
            </View>
            <View className='breed-page__card-arrow'>
              <Text>&gt;</Text>
            </View>
          </View>
        ))}

        {filteredBreeds.length === 0 && (
          <View className='breed-page__empty'>
            <Text className='breed-page__empty-icon'>🔍</Text>
            <Text className='breed-page__empty-text'>未找到匹配的品种</Text>
          </View>
        )}
      </ScrollView>

      <FloatingNav />
    </View>
  )
}
