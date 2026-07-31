/**
 * 我的衣橱组件
 * 展示饰品统计、主题套装和试穿历史记录
 */
import { View, Text } from '@tarojs/components'
import { useMemo } from 'react'
import type { UserAccessoryInventory, TryOnHistoryEntry, ThemeSuiteTask, OutfitSlotMap, AccessorySlot } from '../../types/wardrobeTypes'
import { ACCESSORY_SLOTS, SLOT_LABELS } from '../../constants/wardrobe'
import { getAccessoryById } from '../../data/wardrobe/accessories'
import './MyWardrobe.scss'

interface MyWardrobeProps {
  inventory: UserAccessoryInventory[]
  tryOnHistory: TryOnHistoryEntry[]
  themeHistory: ThemeSuiteTask[]
  onHistoryTap?: (entry: TryOnHistoryEntry) => void
  onThemeTap?: (task: ThemeSuiteTask) => void
}

export default function MyWardrobe({
  inventory,
  tryOnHistory,
  themeHistory,
  onHistoryTap,
  onThemeTap,
}: MyWardrobeProps) {
  const stats = useMemo(() => {
    const bySlot: Record<AccessorySlot, number> = { head: 0, neck: 0, back: 0, body: 0, feet: 0 }
    for (const item of inventory) {
      const def = getAccessoryById(item.accessoryId)
      if (def) {
        bySlot[def.slot]++
      }
    }
    return {
      total: inventory.length,
      bySlot,
    }
  }, [inventory])

  const completedThemes = useMemo(
    () => themeHistory.filter(t => t.status === 'completed' && t.moderationResult !== 'block'),
    [themeHistory],
  )

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hour}:${minute}`
  }

  const getSnapshotSummary = (snapshot: OutfitSlotMap): string => {
    const parts: string[] = []
    for (const slot of ACCESSORY_SLOTS) {
      const accessoryId = snapshot[slot]
      if (accessoryId) {
        const def = getAccessoryById(accessoryId)
        if (def) parts.push(def.name)
      }
    }
    return parts.length > 0 ? parts.join(' + ') : '空穿搭'
  }

  return (
    <View className='my-wardrobe'>
      <View className='my-wardrobe__section'>
        <Text className='my-wardrobe__section-title'>📦 饰品统计</Text>
        <View className='my-wardrobe__stats'>
          <View className='my-wardrobe__stats-total'>
            <Text className='my-wardrobe__stats-total-num'>{stats.total}</Text>
            <Text className='my-wardrobe__stats-total-label'>件饰品</Text>
          </View>
          <View className='my-wardrobe__stats-slots'>
            {ACCESSORY_SLOTS.map((slot) => (
              <View key={slot} className='my-wardrobe__stats-slot'>
                <Text className='my-wardrobe__stats-slot-count'>{stats.bySlot[slot]}</Text>
                <Text className='my-wardrobe__stats-slot-label'>{SLOT_LABELS[slot]}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {completedThemes.length > 0 && (
        <View className='my-wardrobe__section'>
          <Text className='my-wardrobe__section-title'>🎨 主题套装</Text>
          <View className='my-wardrobe__theme-grid'>
            {completedThemes.map((task) => (
              <View
                key={task.id}
                className='my-wardrobe__theme-item'
                onClick={() => onThemeTap?.(task)}
              >
                <View className='my-wardrobe__theme-preview'>
                  <Text className='my-wardrobe__theme-preview-icon'>🖼</Text>
                </View>
                <Text className='my-wardrobe__theme-date'>
                  {formatTime(task.createdAt)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className='my-wardrobe__section'>
        <Text className='my-wardrobe__section-title'>🕐 试穿历史</Text>
        {tryOnHistory.length === 0 ? (
          <View className='my-wardrobe__empty'>
            <Text className='my-wardrobe__empty-text'>还没有试穿记录</Text>
          </View>
        ) : (
          <View className='my-wardrobe__timeline'>
            {tryOnHistory.map((entry) => (
              <View
                key={entry.id}
                className='my-wardrobe__timeline-item'
                onClick={() => onHistoryTap?.(entry)}
              >
                <View className='my-wardrobe__timeline-dot' />
                <View className='my-wardrobe__timeline-content'>
                  <Text className='my-wardrobe__timeline-summary'>
                    {getSnapshotSummary(entry.outfitSnapshot)}
                  </Text>
                  <Text className='my-wardrobe__timeline-time'>
                    {formatTime(entry.createdAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
