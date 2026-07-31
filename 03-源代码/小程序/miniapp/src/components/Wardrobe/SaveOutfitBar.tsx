/**
 * 保存穿搭操作栏组件
 * 提供保存、还原和分享穿搭的底部操作栏
 */
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { useMemo } from 'react'
import type { OutfitSlotMap } from '../../types/wardrobeTypes'
import { getEquippedCount, isOutfitEmpty } from '../../services/outfitComposition'
import './SaveOutfitBar.scss'

interface SaveOutfitBarProps {
  outfitSlots: OutfitSlotMap
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  onReset: () => void
  onShare?: () => void
}

export default function SaveOutfitBar({
  outfitSlots,
  isDirty,
  isSaving,
  onSave,
  onReset,
  onShare,
}: SaveOutfitBarProps) {
  const equippedCount = useMemo(() => getEquippedCount(outfitSlots), [outfitSlots])
  const empty = useMemo(() => isOutfitEmpty(outfitSlots), [outfitSlots])

  const handleSave = () => {
    if (isSaving || !isDirty) return
    onSave()
  }

  const handleReset = () => {
    if (empty) return
    Taro.showModal({
      title: '还原默认',
      content: '确定要卸下所有饰品吗？',
      confirmText: '确定',
      cancelText: '取消',
    }).then((res) => {
      if (res.confirm) {
        onReset()
        Taro.showToast({ title: '已还原', icon: 'success' })
      }
    })
  }

  return (
    <View className='save-bar'>
      <View
        className={`save-bar__btn save-bar__btn--reset${empty ? ' save-bar__btn--disabled' : ''}`}
        onClick={handleReset}
      >
        <Text className='save-bar__btn-icon'>↩</Text>
        <Text className='save-bar__btn-label'>还原</Text>
      </View>

      <View
        className={`save-bar__btn save-bar__btn--save${isDirty && !isSaving ? ' save-bar__btn--active' : ''}${!isDirty || isSaving ? ' save-bar__btn--disabled' : ''}`}
        onClick={handleSave}
      >
        <Text className='save-bar__btn-icon'>{isSaving ? '⏳' : '💾'}</Text>
        <Text className='save-bar__btn-label'>
          {isSaving ? '保存中' : isDirty ? '保存形象' : '已保存'}
        </Text>
        {equippedCount > 0 && (
          <View className='save-bar__badge'>
            <Text className='save-bar__badge-text'>{equippedCount}</Text>
          </View>
        )}
      </View>

      {onShare && (
        <View className='save-bar__btn save-bar__btn--share' onClick={onShare}>
          <Text className='save-bar__btn-icon'>🔗</Text>
          <Text className='save-bar__btn-label'>分享</Text>
        </View>
      )}
    </View>
  )
}
