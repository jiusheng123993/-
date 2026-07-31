import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryAggregator } from '../aggregator/memoryAggregator'

const mockStorage: Record<string, string> = {}

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn((key: string) => {
    const raw = mockStorage[key]
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }),
  setStorage: vi.fn((key: string, value: unknown) => {
    mockStorage[key] = JSON.stringify(value)
  }),
}))

describe('MemoryAggregator', () => {
  let aggregator: MemoryAggregator

  beforeEach(() => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k])
    aggregator = new MemoryAggregator('test-user')
  })

  it('获取宠物记忆画像', () => {
    const pet = { id: 'pet-1', name: '小橘', species: 'cat', breed: '橘猫', gender: 'female', birthDate: '2023-03-15' }
    const memory = aggregator.getPetMemory(pet)
    expect(memory.profile.name).toBe('小橘')
    expect(memory.profile.species).toBe('cat')
  })

  it('获取精简上下文', () => {
    const pet = { id: 'pet-1', name: '小橘', species: 'cat', breed: '橘猫', gender: 'female' }
    const ctx = aggregator.getCompactContext(pet)
    expect(ctx.systemPrompt).toContain('小橘')
  })
})
