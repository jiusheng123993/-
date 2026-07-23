import {
  journalRepository,
  type Journal,
  type CreateJournalInput,
  type UpdateJournalInput
} from '../data/repositories'

export const journalService = {
  async createEntry(userId: string, input: Omit<CreateJournalInput, 'userId'>): Promise<Journal> {
    if (!input.content.trim()) throw new Error('日记内容不能为空')
    return journalRepository.create({ ...input, userId })
  },

  async updateEntry(entryId: string, patch: UpdateJournalInput): Promise<Journal> {
    return journalRepository.update(entryId, patch)
  },

  async getEntries(userId: string): Promise<Journal[]> {
    return journalRepository.findByUserId(userId)
  },

  async getEntryByDate(userId: string, date: string): Promise<Journal | null> {
    return journalRepository.findByDate(userId, date)
  },

  async deleteEntry(entryId: string): Promise<void> {
    return journalRepository.delete(entryId)
  }
}
