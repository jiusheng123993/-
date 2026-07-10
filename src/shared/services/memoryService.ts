import {
  memoryRepository,
  type MemoryEvent,
  type CreateMemoryInput
} from '../data/repositories'

export const memoryService = {
  async recordEvent(userId: string, input: Omit<CreateMemoryInput, 'userId'>): Promise<MemoryEvent> {
    if (!input.title.trim()) throw new Error('记忆标题不能为空')
    return memoryRepository.create({ ...input, userId })
  },

  async getMemories(userId: string, limit = 100): Promise<MemoryEvent[]> {
    return memoryRepository.findByUserId(userId, limit)
  },

  async getMemoriesByType(userId: string, type: string): Promise<MemoryEvent[]> {
    return memoryRepository.findByType(userId, type)
  },

  async forgetMemory(memoryId: string): Promise<void> {
    return memoryRepository.forget(memoryId)
  },

  async deleteMemory(memoryId: string): Promise<void> {
    return memoryRepository.delete(memoryId)
  }
}
