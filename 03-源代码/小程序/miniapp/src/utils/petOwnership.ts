import { getStorage } from './storage'
import type { PetProfile } from '../memory-body/types/memoryBodyTypes'

const PETS_KEY = 'pets'

function userKey(userId: string, key: string): string {
  return `${key}_${userId}`
}

export function isPetOwnerLocal(petId: string, userId: string): boolean {
  if (!petId || !userId) return false
  const pets = getStorage<PetProfile[]>(userKey(userId, PETS_KEY)) || []
  return pets.some(p => p.id === petId)
}

export function requirePetOwnership(petId: string, userId: string): void {
  if (!userId) {
    throw new Error('[PetOwnership] userId is required')
  }
  if (!petId) {
    throw new Error('[PetOwnership] petId is required')
  }
  if (!isPetOwnerLocal(petId, userId)) {
    throw new Error('[PetOwnership] 无权访问该宠物数据')
  }
}
