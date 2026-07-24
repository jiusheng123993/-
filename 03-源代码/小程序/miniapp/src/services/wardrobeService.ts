import { api } from './api'
import { getStorage, setStorage } from '../utils/storage'
import { queueSync } from './syncHelper'
import type {
  AccessorySlot,
  OutfitSlotMap,
  PetOutfit,
  UserAccessoryInventory,
  TryOnHistoryEntry,
  WardrobeError,
} from '../types/wardrobeTypes'
import { WARDROBE_ERROR_CODES, MAX_TRY_ON_HISTORY, OUTFIT_SAVE_DEBOUNCE_MS } from '../constants/wardrobe'

export type { AccessorySlot } from '../types/wardrobeTypes'

const WARDROBE_KEY = 'wardrobe'
const INVENTORY_KEY = 'wardrobe_inventory'
const OUTFIT_KEY = 'wardrobe_outfit'
const TRY_ON_HISTORY_KEY = 'wardrobe_try_on_history'

interface WardrobeOverview {
  accessories: UserAccessoryInventory[]
  outfit: PetOutfit | null
  tryOnHistory: TryOnHistoryEntry[]
}

export interface EquipResult {
  outfit: PetOutfit
  equipped: { slot: AccessorySlot; accessoryId: string }
}

export interface UnequipResult {
  outfit: PetOutfit
  unequipped: { slot: AccessorySlot }
}

function userKey(userId: string, key: string): string {
  return `${key}_${userId}`
}

function getLocalInventory(userId: string): UserAccessoryInventory[] {
  return getStorage<UserAccessoryInventory[]>(userKey(userId, INVENTORY_KEY)) || []
}

function saveLocalInventory(userId: string, inventory: UserAccessoryInventory[]): void {
  setStorage(userKey(userId, INVENTORY_KEY), inventory)
}

function getLocalOutfit(petId: string): PetOutfit | null {
  return getStorage<PetOutfit>(`${OUTFIT_KEY}_${petId}`) || null
}

function saveLocalOutfit(petId: string, outfit: PetOutfit): void {
  setStorage(`${OUTFIT_KEY}_${petId}`, outfit)
}

function getLocalTryOnHistory(userId: string, petId: string): TryOnHistoryEntry[] {
  return getStorage<TryOnHistoryEntry[]>(userKey(userId, `${TRY_ON_HISTORY_KEY}_${petId}`)) || []
}

function saveLocalTryOnHistory(userId: string, petId: string, history: TryOnHistoryEntry[]): void {
  const trimmed = history.slice(0, MAX_TRY_ON_HISTORY)
  setStorage(userKey(userId, `${TRY_ON_HISTORY_KEY}_${petId}`), trimmed)
}

export function createWardrobeError(code: string, message: string, httpStatus: number = 400): WardrobeError {
  return { code, message, httpStatus }
}

export function mapWardrobeErrorCode(apiCode: string): string {
  const mapping: Record<string, string> = {
    INVALID_SLOT: WARDROBE_ERROR_CODES.SLOT_MISMATCH,
    SLOT_MISMATCH: WARDROBE_ERROR_CODES.SLOT_MISMATCH,
    ACCESSORY_NOT_FOUND: WARDROBE_ERROR_CODES.ACCESSORY_NOT_FOUND,
    NOT_OWNED: WARDROBE_ERROR_CODES.NOT_OWNED,
    PET_NOT_FOUND: WARDROBE_ERROR_CODES.PET_NOT_FOUND,
    PAYMENT_REQUIRED: WARDROBE_ERROR_CODES.MEMBERSHIP_EXPIRED,
    MEMBER_ONLY: WARDROBE_ERROR_CODES.MEMBERSHIP_EXPIRED,
    ACHIEVEMENT_LOCKED: WARDROBE_ERROR_CODES.LIMITED_EXPIRED,
    SUITE_NOT_FOUND: WARDROBE_ERROR_CODES.THEME_INACTIVE,
    TASK_IN_PROGRESS: WARDROBE_ERROR_CODES.TASK_IN_PROGRESS,
    QUOTA_EXCEEDED: WARDROBE_ERROR_CODES.QUOTA_EXCEEDED,
  }
  return mapping[apiCode] || WARDROBE_ERROR_CODES.SYSTEM_ERROR
}

export async function getWardrobeOverview(userId: string, petId: string): Promise<WardrobeOverview> {
  if (!userId) throw new Error('[WardrobeService] userId is required')
  if (!petId) throw new Error('[WardrobeService] petId is required')

  try {
    const result = await api.get<WardrobeOverview>('/api/wardrobe/overview', { petId })
    saveLocalInventory(userId, result.accessories)
    if (result.outfit) {
      saveLocalOutfit(petId, result.outfit)
    }
    return result
  } catch {
    return {
      accessories: getLocalInventory(userId),
      outfit: getLocalOutfit(petId),
      tryOnHistory: getLocalTryOnHistory(userId, petId),
    }
  }
}

export async function getAccessoriesBySlot(userId: string, slot: AccessorySlot): Promise<UserAccessoryInventory[]> {
  if (!userId) throw new Error('[WardrobeService] userId is required')

  try {
    const result = await api.get<{ accessories: UserAccessoryInventory[] }>('/api/wardrobe/accessories', { slot })
    return result.accessories
  } catch {
    const inventory = getLocalInventory(userId)
    return inventory
  }
}

export async function equipAccessory(
  userId: string,
  petId: string,
  slot: AccessorySlot,
  accessoryId: string,
): Promise<EquipResult> {
  if (!userId) throw new Error('[WardrobeService] userId is required')
  if (!petId) throw new Error('[WardrobeService] petId is required')
  if (!slot) throw new Error('[WardrobeService] slot is required')
  if (!accessoryId) throw new Error('[WardrobeService] accessoryId is required')

  try {
    const result = await api.post<EquipResult>('/api/wardrobe/equip', { petId, slot, accessoryId })
    saveLocalOutfit(petId, result.outfit)
    queueSync('pet_outfits', petId, 'update', result.outfit, userId)
    return result
  } catch (error) {
    const outfit = getLocalOutfit(petId) || { petId, outfitSlots: {}, updatedAt: new Date().toISOString() }
    const updatedSlots: OutfitSlotMap = { ...outfit.outfitSlots, [slot]: accessoryId }
    const updatedOutfit: PetOutfit = { ...outfit, outfitSlots: updatedSlots, updatedAt: new Date().toISOString() }
    saveLocalOutfit(petId, updatedOutfit)
    queueSync('pet_outfits', petId, 'update', updatedOutfit, userId)
    return { outfit: updatedOutfit, equipped: { slot, accessoryId } }
  }
}

export async function unequipAccessory(
  userId: string,
  petId: string,
  slot: AccessorySlot,
): Promise<UnequipResult> {
  if (!userId) throw new Error('[WardrobeService] userId is required')
  if (!petId) throw new Error('[WardrobeService] petId is required')
  if (!slot) throw new Error('[WardrobeService] slot is required')

  try {
    const result = await api.post<UnequipResult>('/api/wardrobe/unequip', { petId, slot })
    saveLocalOutfit(petId, result.outfit)
    queueSync('pet_outfits', petId, 'update', result.outfit, userId)
    return result
  } catch {
    const outfit = getLocalOutfit(petId) || { petId, outfitSlots: {}, updatedAt: new Date().toISOString() }
    const updatedSlots: OutfitSlotMap = { ...outfit.outfitSlots }
    delete updatedSlots[slot]
    const updatedOutfit: PetOutfit = { ...outfit, outfitSlots: updatedSlots, updatedAt: new Date().toISOString() }
    saveLocalOutfit(petId, updatedOutfit)
    queueSync('pet_outfits', petId, 'update', updatedOutfit, userId)
    return { outfit: updatedOutfit, unequipped: { slot } }
  }
}

export async function saveTryOnSnapshot(
  userId: string,
  petId: string,
  outfitSnapshot: OutfitSlotMap,
): Promise<TryOnHistoryEntry> {
  if (!userId) throw new Error('[WardrobeService] userId is required')
  if (!petId) throw new Error('[WardrobeService] petId is required')

  try {
    const result = await api.post<TryOnHistoryEntry>('/api/wardrobe/try-on', { petId, outfitSnapshot })
    const history = getLocalTryOnHistory(userId, petId)
    history.unshift(result)
    saveLocalTryOnHistory(userId, petId, history)
    return result
  } catch {
    const entry: TryOnHistoryEntry = {
      id: Date.now(),
      userId,
      petId,
      outfitSnapshot,
      createdAt: new Date().toISOString(),
    }
    const history = getLocalTryOnHistory(userId, petId)
    history.unshift(entry)
    saveLocalTryOnHistory(userId, petId, history)
    return entry
  }
}

export async function unlockAccessory(
  userId: string,
  accessoryId: string,
  source: string = 'default',
): Promise<UserAccessoryInventory> {
  if (!userId) throw new Error('[WardrobeService] userId is required')
  if (!accessoryId) throw new Error('[WardrobeService] accessoryId is required')

  try {
    const result = await api.post<UserAccessoryInventory>('/api/wardrobe/unlock', { accessoryId, source })
    const inventory = getLocalInventory(userId)
    inventory.push(result)
    saveLocalInventory(userId, inventory)
    return result
  } catch {
    const inventoryItem: UserAccessoryInventory = {
      id: Date.now(),
      userId,
      accessoryId,
      unlockedAt: new Date().toISOString(),
      unlockSource: source,
    }
    const inventory = getLocalInventory(userId)
    inventory.push(inventoryItem)
    saveLocalInventory(userId, inventory)
    return inventoryItem
  }
}

export function getLocalOutfitForPet(petId: string): PetOutfit | null {
  return getLocalOutfit(petId)
}

export function updateLocalOutfit(petId: string, outfit: PetOutfit): void {
  saveLocalOutfit(petId, outfit)
}

let outfitSaveTimer: ReturnType<typeof setTimeout> | null = null

export function debouncedEquipAccessory(
  userId: string,
  petId: string,
  slot: AccessorySlot,
  accessoryId: string,
  onLocalUpdate: (outfit: PetOutfit) => void,
): void {
  const outfit = getLocalOutfit(petId) || { petId, outfitSlots: {}, updatedAt: new Date().toISOString() }
  const updatedSlots: OutfitSlotMap = { ...outfit.outfitSlots, [slot]: accessoryId }
  const updatedOutfit: PetOutfit = { ...outfit, outfitSlots: updatedSlots, updatedAt: new Date().toISOString() }
  saveLocalOutfit(petId, updatedOutfit)
  onLocalUpdate(updatedOutfit)

  if (outfitSaveTimer) {
    clearTimeout(outfitSaveTimer)
  }

  outfitSaveTimer = setTimeout(() => {
    equipAccessory(userId, petId, slot, accessoryId).catch(() => {})
    outfitSaveTimer = null
  }, OUTFIT_SAVE_DEBOUNCE_MS)
}

export function debouncedUnequipAccessory(
  userId: string,
  petId: string,
  slot: AccessorySlot,
  onLocalUpdate: (outfit: PetOutfit) => void,
): void {
  const outfit = getLocalOutfit(petId) || { petId, outfitSlots: {}, updatedAt: new Date().toISOString() }
  const updatedSlots: OutfitSlotMap = { ...outfit.outfitSlots }
  delete updatedSlots[slot]
  const updatedOutfit: PetOutfit = { ...outfit, outfitSlots: updatedSlots, updatedAt: new Date().toISOString() }
  saveLocalOutfit(petId, updatedOutfit)
  onLocalUpdate(updatedOutfit)

  if (outfitSaveTimer) {
    clearTimeout(outfitSaveTimer)
  }

  outfitSaveTimer = setTimeout(() => {
    unequipAccessory(userId, petId, slot).catch(() => {})
    outfitSaveTimer = null
  }, OUTFIT_SAVE_DEBOUNCE_MS)
}

export function clearOutfitSaveTimer(): void {
  if (outfitSaveTimer) {
    clearTimeout(outfitSaveTimer)
    outfitSaveTimer = null
  }
}
