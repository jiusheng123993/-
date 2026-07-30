import { MemoryAggregator } from '../aggregator/memoryAggregator'
import type { UnifiedPetMemory, MemoryFragment } from '../types/memoryBodyTypes'

interface PetBasicInfo {
  id: string
  name: string
  species: string
  breed: string
  gender: string
  birthDate?: string
}

export class AiMemoryInjector {
  private aggregator: MemoryAggregator
  private userId: string

  constructor(userId: string) {
    this.userId = userId
    this.aggregator = new MemoryAggregator(userId)
  }

  /**
   * 构建 AI 对话的 system prompt 片段
   * 约 400-600 tokens
   */
  buildSystemPrompt(pet: PetBasicInfo): string {
    const { systemPrompt } = this.aggregator.getCompactContext(pet)
    return systemPrompt
  }

  /**
   * 构建包含记忆片段的上下文
   */
  buildContext(pet: PetBasicInfo, _maxTokens: number = 600): { systemPrompt: string; fragments: MemoryFragment[] } {
    return this.aggregator.getCompactContext(pet)
  }

  /**
   * 为特定用户问题获取相关记忆
   */
  getRelevantForQuery(pet: PetBasicInfo, userQuery: string): MemoryFragment[] {
    return this.aggregator.getRelevantMemories(pet, userQuery)
  }

  /**
   * 获取完整的宠物记忆画像
   */
  getPetMemory(pet: PetBasicInfo): UnifiedPetMemory {
    return this.aggregator.getPetMemory(pet)
  }
}
