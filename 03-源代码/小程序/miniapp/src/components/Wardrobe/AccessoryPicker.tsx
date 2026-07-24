import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useCallback } from 'react'
import type { AccessorySlot, AccessoryDef, UserAccessoryInventory, UnlockSource } from '../../types/wardrobeTypes'
import { ACCESSORY_SLOTS, SLOT_LABELS } from '../../constants/wardrobe'
import { getAccessoriesBySlot } from '../../data/wardrobe/accessories'
import './AccessoryPicker.scss'

interface AccessoryPickerProps {
  inventory: UserAccessoryInventory[]
  activeSlot: AccessorySlot
  equippedSlots: Partial<Record<AccessorySlot, string>>
  onEquip: (slot: AccessorySlot, accessoryId: string) => void
  onUnlockRequest: (accessoryId: string, source: UnlockSource) => void
}

const SOURCE_LABELS: Record<UnlockSource, string> = {
  default: '免费',
  achievement: '成就',
  paid: '付费',
  member: '会员',
}

const SOURCE_ICONS: Record<UnlockSource, string> = {
  default: '🆓',
  achievement: '🏆',
  paid: '💎',
  member: '👑',
}

export default function AccessoryPicker({
  inventory,
  activeSlot,
  equippedSlots,
  onEquip,
  onUnlockRequest,
}: AccessoryPickerProps) {
  const [selectedSlot, setSelectedSlot] = useState<AccessorySlot>(activeSlot)

  const ownedIds = useMemo(
    () => new Set(inventory.map(i => i.accessoryId)),
    [inventory],
  )

  const accessories = useMemo(
    () => getAccessoriesBySlot(selectedSlot),
    [selectedSlot],
  )

  const handleSlotChange = useCallback((slot: AccessorySlot) => {
    setSelectedSlot(slot)
  }, [])

  const handleAccessoryTap = useCallback(
    (accessory: AccessoryDef) => {
      if (ownedIds.has(accessory.id)) {
        onEquip(selectedSlot, accessory.id)
      } else {
        onUnlockRequest(accessory.id, accessory.unlockSource)
      }
    },
    [selectedSlot, ownedIds, onEquip, onUnlockRequest],
  )

  return (
    <View className='accessory-picker'>
      <ScrollView scrollX className='accessory-picker__slot-bar'>
        <View className='accessory-picker__slot-bar-inner'>
          {ACCESSORY_SLOTS.map((slot) => {
            const isEquipped = !!equippedSlots[slot]
            const isActive = selectedSlot === slot

            return (
              <View
                key={slot}
                className={`accessory-picker__slot-tab${isActive ? ' accessory-picker__slot-tab--active' : ''}${isEquipped ? ' accessory-picker__slot-tab--equipped' : ''}`}
                onClick={() => handleSlotChange(slot)}
              >
                <Text className='accessory-picker__slot-tab-label'>{SLOT_LABELS[slot]}</Text>
                {isEquipped && <View className='accessory-picker__slot-tab-dot' />}
              </View>
            )
          })}
        </View>
      </ScrollView>

      <View className='accessory-picker__grid'>
        {accessories.map((accessory) => {
          const isOwned = ownedIds.has(accessory.id)
          const isEquipped = equippedSlots[selectedSlot] === accessory.id

          return (
            <View
              key={accessory.id}
              className={`accessory-picker__item${isEquipped ? ' accessory-picker__item--equipped' : ''}${!isOwned ? ' accessory-picker__item--locked' : ''}`}
              onClick={() => handleAccessoryTap(accessory)}
            >
              <View className='accessory-picker__item-icon'>
                <Text>{isOwned ? '✨' : SOURCE_ICONS[accessory.unlockSource]}</Text>
              </View>
              <Text className='accessory-picker__item-name'>{accessory.name}</Text>
              {!isOwned && (
                <View className='accessory-picker__item-lock'>
                  <Text className='accessory-picker__item-lock-label'>
                    {SOURCE_LABELS[accessory.unlockSource]}
                  </Text>
                </View>
              )}
              {isEquipped && (
                <View className='accessory-picker__item-check'>
                  <Text className='accessory-picker__item-check-icon'>✓</Text>
                </View>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}
