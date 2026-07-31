/**
 * 穿搭预览服务
 *
 * 宠物配饰穿搭的组合管理、槽位操作、预览状态构建
 */
import type { OutfitSlotMap, AccessorySlot, OutfitLayer } from '../types/wardrobeTypes'
import type { PetSpecies } from '../types/avatarTypes'
import { resolveOutfitLayers, composeOutfitLayers } from '../engines/petAvatar/outfitRenderer'
import { getAccessoryById } from '../data/wardrobe/accessories'
import { ACCESSORY_SLOTS, SLOT_LABELS } from '../constants/wardrobe'

export interface OutfitPreview {
  svgContent: string
  layers: OutfitLayer[]
  slotSummary: Record<AccessorySlot, { equipped: boolean; accessoryName: string | null }>
}

export function buildOutfitPreview(
  slots: OutfitSlotMap,
  species: PetSpecies,
): OutfitPreview {
  const layers = resolveOutfitLayers(slots, species)
  const svgContent = composeOutfitLayers(layers)

  const slotSummary: Record<AccessorySlot, { equipped: boolean; accessoryName: string | null }> =
    {} as Record<AccessorySlot, { equipped: boolean; accessoryName: string | null }>

  for (const slot of ACCESSORY_SLOTS) {
    const accessoryId = slots[slot]
    if (accessoryId) {
      const def = getAccessoryById(accessoryId)
      slotSummary[slot] = {
        equipped: true,
        accessoryName: def ? def.name : null,
      }
    } else {
      slotSummary[slot] = { equipped: false, accessoryName: null }
    }
  }

  return { svgContent, layers, slotSummary }
}

export function toggleSlotInOutfit(
  currentSlots: OutfitSlotMap,
  slot: AccessorySlot,
  accessoryId: string | null,
): OutfitSlotMap {
  const updated: OutfitSlotMap = { ...currentSlots }

  if (accessoryId === null || accessoryId === '') {
    delete updated[slot]
  } else {
    const currentEquipped = updated[slot]
    if (currentEquipped === accessoryId) {
      delete updated[slot]
    } else {
      updated[slot] = accessoryId
    }
  }

  return updated
}

export function clearAllSlots(slots: OutfitSlotMap): OutfitSlotMap {
  return {}
}

export function getEquippedCount(slots: OutfitSlotMap): number {
  return Object.keys(slots).filter(k => slots[k as AccessorySlot] != null && slots[k as AccessorySlot] !== '').length
}

export function getEmptySlots(slots: OutfitSlotMap): AccessorySlot[] {
  return ACCESSORY_SLOTS.filter(slot => !slots[slot] || slots[slot] === '')
}

export function getSlotLabel(slot: AccessorySlot): string {
  return SLOT_LABELS[slot] || slot
}

export function isOutfitEmpty(slots: OutfitSlotMap): boolean {
  return getEquippedCount(slots) === 0
}

export function areOutfitsEqual(a: OutfitSlotMap, b: OutfitSlotMap): boolean {
  const keysA = Object.keys(a).sort()
  const keysB = Object.keys(b).sort()
  if (keysA.length !== keysB.length) return false
  return keysA.every((key, idx) => key === keysB[idx] && a[key as AccessorySlot] === b[keysB[idx] as AccessorySlot])
}

export function mergeOutfitSlots(base: OutfitSlotMap, override: Partial<OutfitSlotMap>): OutfitSlotMap {
  return { ...base, ...override }
}
