import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { BREED_DATA, type BreedItem } from '../../data/petKnowledge/breeds'
import FloatingNav from '../../components/FloatingNav'
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
import { useAnalytics, usePageView } from '../../hooks/useAnalytics'
import './index.scss'

const disclaimerText = new MedicalDisclaimer().getDisclaimer('green', 'breed')

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

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶',
  cat: '🐱',
}

export default function PetBreed() {
  const [searchText, setSearchText] = useState<string>('')
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all')
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all')
  const [displayCount, setDisplayCount] = useState<number>(20)
  const { trackPageView, trackEvent } = useAnalytics()

  usePageView('breed')

  const filteredBreeds = useMemo<BreedItem[]>(() => {
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
    trackEvent('click_breed_card', { breedId: breed.id, breedName: breed.name })
    Taro.navigateTo({ url: `/pagesPet/breed-detail/index?id=${breed.id}` })
  }, [trackEvent])

  const handleSpeciesFilterChange = useCallback((value: SpeciesFilter) => {
    setSpeciesFilter(value)
    setDisplayCount(20)
    trackEvent('filter_species', { species: value })
  }, [trackEvent])

  const handleSizeFilterChange = useCallback((value: SizeFilter) => {
    setSizeFilter(value)
    setDisplayCount(20)
  }, [])

  const handleSearchInput = useCallback((e: { detail: { value: string } }) => {
    setSearchText(e.detail.value)
    setDisplayCount(20)
    if (e.detail.value.trim()) {
      trackEvent('search_breed', { query: e.detail.value.trim() })
    }
  }, [trackEvent])

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + 20)
  }, [])

  return (
    <View className='breed-page'>
      <View className='breed-page__header'>
        <Text className='breed-page__title'>品种百科</Text>
        <Text className='breed-page__subtitle'>
          共收录 {BREED_DATA.length} 个品种，了解你的毛孩子
        </Text>
      </View>

      <View className='breed-page__search'>
        <View className='breed-page__search-wrapper'>
          <Text className='breed-page__search-icon'>🔍</Text>
          <Input
            className='breed-page__search-input'
            placeholder='搜索品种名称...'
            placeholderClass='breed-page__search-placeholder'
            value={searchText}
            onInput={handleSearchInput}
          />
          {searchText && (
            <View className='breed-page__search-clear' onClick={() => { setSearchText(''); setDisplayCount(20) }}>
              <Text className='breed-page__search-clear-icon'>✕</Text>
            </View>
          )}
        </View>
      </View>

      <View className='breed-page__filters'>
        <ScrollView className='breed-page__filter-row' scrollX>
          <View
            className={`breed-page__filter-chip ${speciesFilter === 'all' ? 'breed-page__filter-chip--active' : ''}`}
            onClick={() => handleSpeciesFilterChange('all')}
          >
            <Text>全部</Text>
          </View>
          <View
            className={`breed-page__filter-chip ${speciesFilter === 'dog' ? 'breed-page__filter-chip--active' : ''}`}
            onClick={() => handleSpeciesFilterChange('dog')}
          >
            <Text>🐶 犬类</Text>
          </View>
          <View
            className={`breed-page__filter-chip ${speciesFilter === 'cat' ? 'breed-page__filter-chip--active' : ''}`}
            onClick={() => handleSpeciesFilterChange('cat')}
          >
            <Text>🐱 猫类</Text>
          </View>
        </ScrollView>

        <ScrollView className='breed-page__filter-row' scrollX>
          {(['all', 'toy', 'small', 'medium', 'large', 'giant'] as SizeFilter[]).map((size) => (
            <View
              key={size}
              className={`breed-page__filter-chip ${sizeFilter === size ? 'breed-page__filter-chip--active' : ''}`}
              onClick={() => handleSizeFilterChange(size)}
            >
              <Text>{SIZE_LABELS[size]}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView className='breed-page__list' scrollY lowerThreshold={100} onScrollToLower={handleLoadMore}>
        <View className='breed-page__count'>
          <Text className='breed-page__count-text'>
            共 {filteredBreeds.length} 个品种
          </Text>
        </View>

        <View className='breed-page__grid'>
          {filteredBreeds.slice(0, displayCount).map((breed) => (
            <View
              key={breed.id}
              className='breed-page__card'
              onClick={() => handleBreedClick(breed)}
            >
              <View className='breed-page__card-emoji'>
                <Text className='breed-page__card-emoji-text'>{SPECIES_EMOJI[breed.species]}</Text>
              </View>
              <View className='breed-page__card-body'>
                <Text className='breed-page__card-name'>{breed.name}</Text>
                <View className='breed-page__card-meta'>
                  <Text className='breed-page__card-meta-item'>⏱ {breed.lifespan}</Text>
                  <Text className='breed-page__card-meta-item'>⚖ {breed.weightRangeStr}</Text>
                </View>
                <View className='breed-page__card-tags'>
                  {breed.temperament.slice(0, 3).map((t) => (
                    <View key={t} className='breed-page__card-tag'>
                      <Text>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className='breed-page__card-arrow'>
                <Text>›</Text>
              </View>
            </View>
          ))}
        </View>

        {filteredBreeds.length > 0 && displayCount < filteredBreeds.length && (
          <View className='breed-page__load-more' onClick={handleLoadMore}>
            <Text className='breed-page__load-more-text'>加载更多</Text>
          </View>
        )}
        {filteredBreeds.length > 0 && displayCount >= filteredBreeds.length && (
          <View className='breed-page__load-more'>
            <Text className='breed-page__load-more-text'>已加载全部 {filteredBreeds.length} 个品种</Text>
          </View>
        )}

        {filteredBreeds.length === 0 && (
          <View className='breed-page__empty'>
            <Text className='breed-page__empty-icon'>🔍</Text>
            <Text className='breed-page__empty-text'>未找到匹配的品种</Text>
          </View>
        )}
      </ScrollView>

      <FloatingNav />

      <View className='breed-page__disclaimer'>
        <Text className='breed-page__disclaimer-text'>{disclaimerText}</Text>
      </View>
    </View>
  )
}
