/**
 * 端到端加密服务测试
 */
import { describe, it, expect } from 'vitest'
import {
  encryptSyncPayload,
  decryptSyncPayload,
  encryptPetHealthData,
  decryptPetHealthData,
  encryptField,
  decryptField,
  isEncrypted,
} from '../../../src/services/e2eEncryptionService'
import type { PetHealthEntry } from '../../../src/memory-body/types/memoryBodyTypes'

describe('e2eEncryptionService', () => {
  const userId = 'test-user-123'

  describe('encryptSyncPayload / decryptSyncPayload', () => {
    it('should encrypt and decrypt sync payload correctly', () => {
      const entries: PetHealthEntry[] = [
        {
          id: 'entry-1',
          petId: 'pet-1',
          userId,
          appetiteLevel: 5,
          spiritLevel: 5,
          poopLevel: 5,
          exerciseLevel: 2 as 1 | 2 | 3,
          weight: undefined,
          note: '一切正常',
          hasAnomaly: false,
          anomalyItems: [],
          riskLevel: 'low',
          aiFeedback: '',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
      ]

      const encrypted = encryptSyncPayload(entries, userId)
      expect(encrypted.encrypted).toBeTruthy()
      expect(encrypted.userId).toBe(userId)
      expect(encrypted.timestamp).toBeGreaterThan(0)

      const decrypted = decryptSyncPayload(encrypted, userId)
      expect(decrypted).not.toBeNull()
      expect(decrypted!.entries).toHaveLength(1)
      expect(decrypted!.entries[0].id).toBe('entry-1')
      expect(decrypted!.entries[0].note).toBe('一切正常')
      expect(decrypted!.deviceId).toBeTruthy()
    })

    it('should return null when decrypting with wrong userId', () => {
      const entries: PetHealthEntry[] = []
      const encrypted = encryptSyncPayload(entries, userId)
      const decrypted = decryptSyncPayload(encrypted, 'wrong-user')
      expect(decrypted).toBeNull()
    })

    it('should handle empty entries array', () => {
      const encrypted = encryptSyncPayload([], userId)
      const decrypted = decryptSyncPayload(encrypted, userId)
      expect(decrypted).not.toBeNull()
      expect(decrypted!.entries).toEqual([])
    })
  })

  describe('encryptPetHealthData / decryptPetHealthData', () => {
    it('should encrypt and decrypt pet health data', () => {
      const data = { weight: 5.2, temperature: 38.5, notes: '正常' }
      const encrypted = encryptPetHealthData(data, userId)
      expect(encrypted).toBeTruthy()

      const decrypted = decryptPetHealthData(encrypted, userId)
      expect(decrypted).toEqual(data)
    })

    it('should return null for invalid encrypted data', () => {
      const decrypted = decryptPetHealthData('invalid-data', userId)
      expect(decrypted).toBeNull()
    })

    it('should return null for wrong userId', () => {
      const data = { weight: 5.2 }
      const encrypted = encryptPetHealthData(data, userId)
      const decrypted = decryptPetHealthData(encrypted, 'wrong-user')
      expect(decrypted).toBeNull()
    })
  })

  describe('encryptField / decryptField', () => {
    it('should encrypt and decrypt a field value', () => {
      const original = 'sensitive-data'
      const encrypted = encryptField(original, userId)
      expect(encrypted).not.toBe(original)

      const decrypted = decryptField(encrypted, userId)
      expect(decrypted).toBe(original)
    })

    it('should produce different ciphertexts for same plaintext', () => {
      const e1 = encryptField('same', userId)
      const e2 = encryptField('same', userId)
      expect(e1).not.toBe(e2)
    })
  })

  describe('isEncrypted', () => {
    it('should return true for encrypted data object', () => {
      const data = { encrypted: 'abc', userId: 'user1', iv: '', timestamp: 0 }
      expect(isEncrypted(data)).toBe(true)
    })

    it('should return false for non-object', () => {
      expect(isEncrypted('string')).toBe(false)
      expect(isEncrypted(123)).toBe(false)
      expect(isEncrypted(null)).toBe(false)
    })

    it('should return false for object without encrypted field', () => {
      expect(isEncrypted({ userId: 'user1' })).toBe(false)
    })
  })
})