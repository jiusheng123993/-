import { View, Text } from '@tarojs/components'
import { useMemo } from 'react'
import PetAvatar from '../PetAvatar'
import type { OutfitSlotMap, AccessorySlot } from '../../types/wardrobeTypes'
import type { OutfitPreview as OutfitPreviewData } from '../../services/outfitComposition'
import { ACCESSORY_SLOTS, SLOT_LABELS } from '../../constants/wardrobe'
import './OutfitPreview.scss'

interface OutfitPreviewProps {
  species: 'dog' | 'cat'
  petName: string
  outfitSlots: OutfitSlotMap
  preview: OutfitPreviewData | null
  onSlotTap?: (slot: AccessorySlot) => void
  activeSlot?: AccessorySlot | null
  size?: number
}

const SLOT_ICONS: Record<AccessorySlot, string> = {
  head: '🎩',
  neck: '🎀',
  back: '🎒',
  body: '👕',
  feet: '🧦',
}

export default function OutfitPreview({
  species,
  petName,
  outfitSlots,
  preview,
  onSlotTap,
  activeSlot,
  size = 160,
}: OutfitPreviewProps) {
  const slotSummary = preview?.slotSummary

  const equippedCount = useMemo(
    () => ACCESSORY_SLOTS.filter(s => outfitSlots[s]).length,
    [outfitSlots],
  )

  return (
    <View className='outfit-preview'>
      <View className='outfit-preview__avatar'>
        <PetAvatar
          species={species}
          petName={petName}
          expressionContext={{
            todayEntry: null,
            hasAnomaly: false,
            anomalyCount: 0,
            riskLevel: null,
            streakDays: 0,
            isBirthday: false,
            isVaccineComplete: false,
            isRecovery: false,
            isDeceased: false,
          }}
          outfitSlots={outfitSlots}
          size={size}
        />
        {equippedCount > 0 && (
          <View className='outfit-preview__badge'>
            <Text className='outfit-preview__badge-text'>{equippedCount}</Text>
          </View>
        )}
      </View>

      <View className='outfit-preview__slots'>
        {ACCESSORY_SLOTS.map((slot) => {
          const isEquipped = !!outfitSlots[slot]
          const isActive = activeSlot === slot
          const accessoryName = slotSummary?.[slot]?.accessoryName

          return (
            <View
              key={slot}
              className={`outfit-preview__slot${isEquipped ? ' outfit-preview__slot--equipped' : ''}${isActive ? ' outfit-preview__slot--active' : ''}`}
              onClick={() => onSlotTap?.(slot)}
            >
              <Text className='outfit-preview__slot-icon'>{SLOT_ICONS[slot]}</Text>
              <Text className='outfit-preview__slot-label'>{SLOT_LABELS[slot]}</Text>
              {isEquipped && accessoryName && (
                <Text className='outfit-preview__slot-name'>{accessoryName}</Text>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}
