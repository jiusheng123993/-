import {
  examRepository,
  errorBookRepository,
  memoryCardRepository,
  type Exam,
  type CreateExamInput,
  type UpdateExamInput,
  type ErrorBookItem,
  type CreateErrorBookInput,
  type MemoryCard,
  type CreateMemoryCardInput
} from '../data/repositories'

export const studyService = {
  async createExam(userId: string, input: Omit<CreateExamInput, 'userId'>): Promise<Exam> {
    if (!input.name.trim()) throw new Error('考试名称不能为空')
    return examRepository.create({ ...input, userId })
  },

  async updateExam(examId: string, patch: UpdateExamInput): Promise<Exam> {
    return examRepository.update(examId, patch)
  },

  async getExams(userId: string): Promise<Exam[]> {
    return examRepository.findByUserId(userId)
  },

  async deleteExam(examId: string): Promise<void> {
    return examRepository.delete(examId)
  },

  async addErrorQuestion(userId: string, input: Omit<CreateErrorBookInput, 'userId'>): Promise<ErrorBookItem> {
    if (!input.question.trim()) throw new Error('题目内容不能为空')
    return errorBookRepository.create({ ...input, userId })
  },

  async getErrorQuestions(userId: string): Promise<ErrorBookItem[]> {
    return errorBookRepository.findByUserId(userId)
  },

  async getUnmasteredErrors(userId: string): Promise<ErrorBookItem[]> {
    return errorBookRepository.findUnmastered(userId)
  },

  async markErrorMastered(errorId: string): Promise<ErrorBookItem> {
    return errorBookRepository.update(errorId, { mastered: true })
  },

  async deleteErrorQuestion(errorId: string): Promise<void> {
    return errorBookRepository.delete(errorId)
  },

  async createMemoryCard(userId: string, input: Omit<CreateMemoryCardInput, 'userId'>): Promise<MemoryCard> {
    if (!input.front.trim() || !input.back.trim()) throw new Error('卡片正反面不能为空')
    return memoryCardRepository.create({ ...input, userId })
  },

  async getMemoryCards(userId: string): Promise<MemoryCard[]> {
    return memoryCardRepository.findByUserId(userId)
  },

  async getDueCards(userId: string): Promise<MemoryCard[]> {
    return memoryCardRepository.findDue(userId)
  },

  async reviewCard(cardId: string, quality: number): Promise<MemoryCard> {
    const card = await memoryCardRepository.findById(cardId)
    if (!card) throw new Error('卡片不存在')

    const newEaseFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    let newInterval: number

    if (quality < 3) {
      newInterval = 1
    } else if (card.reviewCount === 0) {
      newInterval = 1
    } else if (card.reviewCount === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(card.interval * newEaseFactor)
    }

    const nextReviewAt = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000).toISOString()

    return memoryCardRepository.update(cardId, {
      interval: newInterval,
      easeFactor: newEaseFactor,
      reviewCount: card.reviewCount + 1,
      nextReviewAt
    })
  },

  async deleteMemoryCard(cardId: string): Promise<void> {
    return memoryCardRepository.delete(cardId)
  }
}
