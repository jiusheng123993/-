import { View, Text } from '@tarojs/components'
import { useMemo } from 'react'
import type { ThemeSuiteDef, ThemeQuotaInfo, ThemeSuiteTask } from '../../types/wardrobeTypes'
import './ThemeSuiteGallery.scss'

interface ThemeSuiteGalleryProps {
  themes: ThemeSuiteDef[]
  quota: ThemeQuotaInfo
  activeTask: ThemeSuiteTask | null
  isGenerating: boolean
  onGenerate: (suiteId: string) => void
  onViewResult: (task: ThemeSuiteTask) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  festival: '🎉 节日',
  season: '🌸 季节',
  birthday: '🎂 生日',
  special: '✨ 特殊',
}

const CATEGORY_ORDER = ['festival', 'season', 'birthday', 'special']

export default function ThemeSuiteGallery({
  themes,
  quota,
  activeTask,
  isGenerating,
  onGenerate,
  onViewResult,
}: ThemeSuiteGalleryProps) {
  const groupedThemes = useMemo(() => {
    const groups: Record<string, ThemeSuiteDef[]> = {}
    for (const theme of themes) {
      if (!groups[theme.category]) {
        groups[theme.category] = []
      }
      groups[theme.category].push(theme)
    }
    return CATEGORY_ORDER
      .filter(cat => groups[cat]?.length)
      .map(cat => ({ category: cat, label: CATEGORY_LABELS[cat], items: groups[cat] }))
  }, [themes])

  const isQuotaExhausted = quota.remaining <= 0

  const getTaskForSuite = (suiteId: string): ThemeSuiteTask | null => {
    if (activeTask?.suiteId === suiteId) return activeTask
    return null
  }

  return (
    <View className='theme-gallery'>
      <View className='theme-gallery__quota'>
        <Text className='theme-gallery__quota-text'>
          本月生成次数：{quota.usedThisMonth}/{quota.monthlyLimit}
        </Text>
        <View className='theme-gallery__quota-bar'>
          <View
            className='theme-gallery__quota-fill'
            style={{ width: `${Math.min((quota.usedThisMonth / quota.monthlyLimit) * 100, 100)}%` }}
          />
        </View>
      </View>

      {groupedThemes.map(({ category, label, items }) => (
        <View key={category} className='theme-gallery__group'>
          <Text className='theme-gallery__group-title'>{label}</Text>
          <View className='theme-gallery__grid'>
            {items.map((theme) => {
              const task = getTaskForSuite(theme.id)
              const isProcessing = task?.status === 'pending' || task?.status === 'processing'
              const isCompleted = task?.status === 'completed'

              return (
                <View
                  key={theme.id}
                  className={`theme-gallery__card${isProcessing ? ' theme-gallery__card--processing' : ''}${isCompleted ? ' theme-gallery__card--completed' : ''}`}
                >
                  <View className='theme-gallery__card-preview'>
                    {theme.previewUrl ? (
                      <Text className='theme-gallery__card-preview-text'>🖼</Text>
                    ) : (
                      <Text className='theme-gallery__card-preview-text'>{label.split(' ')[0]}</Text>
                    )}
                  </View>

                  <Text className='theme-gallery__card-name'>{theme.name}</Text>

                  {isProcessing && (
                    <View className='theme-gallery__card-overlay'>
                      <Text className='theme-gallery__card-spinner'>⏳</Text>
                      <Text className='theme-gallery__card-status'>生成中...</Text>
                    </View>
                  )}

                  {isCompleted && task && (
                    <View
                      className='theme-gallery__card-action'
                      onClick={() => onViewResult(task)}
                    >
                      <Text className='theme-gallery__card-action-text'>查看</Text>
                    </View>
                  )}

                  {!isProcessing && !isCompleted && (
                    <View
                      className={`theme-gallery__card-action${isQuotaExhausted || isGenerating ? ' theme-gallery__card-action--disabled' : ''}`}
                      onClick={() => {
                        if (!isQuotaExhausted && !isGenerating) {
                          onGenerate(theme.id)
                        }
                      }}
                    >
                      <Text className='theme-gallery__card-action-text'>
                        {isQuotaExhausted ? '次数已用完' : isGenerating ? '生成中' : '生成'}
                      </Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>
      ))}
    </View>
  )
}
