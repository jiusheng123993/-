/**
 * 装扮图层组合器
 * 将多个 OutfitLayer 按 zIndex 排序后合并为 SVG 片段，并支持物种差异缩放
 */
import type { OutfitLayer, OutfitSlotMap, AccessorySlot } from '../../types/wardrobeTypes'
import type { PetSpecies } from '../../types/avatarTypes'
import { SLOT_Z_INDEX } from '../../constants/wardrobe'
import { getAccessoryById } from '../../data/wardrobe/accessories'

/**
 * 装扮图层组合器
 * 将多个 OutfitLayer 按 zIndex 排序后合并为 SVG 片段
 */
export function composeOutfitLayers(layers: OutfitLayer[]): string {
  if (layers.length === 0) return ''

  const sorted = [...layers].sort((a: OutfitLayer, b: OutfitLayer) => a.zIndex - b.zIndex)

  return sorted
    .map((layer: OutfitLayer) => {
      const transformAttr = layer.transform ? ` transform="${layer.transform}"` : ''
      return `<g${transformAttr}>${layer.svgPath}</g>`
    })
    .join('')
}

/**
 * 将 OutfitSlotMap 解析为 OutfitLayer 数组
 * 根据物种差异应用不同的缩放变换
 */
export function resolveOutfitLayers(slots: OutfitSlotMap, species: PetSpecies): OutfitLayer[] {
  const entries = Object.entries(slots) as [AccessorySlot, string | undefined][]

  const layers: OutfitLayer[] = entries
    .filter(([_slot, accessoryId]) => accessoryId != null && accessoryId !== '')
    .map(([slot, accessoryId]) => {
      const def = getAccessoryById(accessoryId as string)
      return {
        slot,
        accessoryId: def ? def.id : null,
        svgPath: def ? def.svgPath : '',
        zIndex: SLOT_Z_INDEX[slot],
        transform: species === 'cat' ? 'scale(0.85, 0.9)' : undefined,
      }
    })

  return layers.sort((a: OutfitLayer, b: OutfitLayer) => a.zIndex - b.zIndex)
}
