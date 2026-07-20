import {
  habitRepository,
  type Habit,
  type CreateHabitInput,
  type UpdateHabitInput
} from '../data/repositories'

const MAX_HABITS_PER_USER = 20

export const habitService = {
  async createHabit(userId: string, input: Omit<CreateHabitInput, 'userId'>): Promise<Habit> {
    if (!input.name.trim()) throw new Error('习惯名称不能为空')

    const existing = await habitRepository.findByUserId(userId)
    if (existing.length >= MAX_HABITS_PER_USER) {
      throw new Error(`最多创建 ${MAX_HABITS_PER_USER} 个习惯`)
    }

    return habitRepository.create({ ...input, userId })
  },

  async checkIn(habitId: string): Promise<Habit> {
    const habit = await habitRepository.findById(habitId)
    if (!habit) throw new Error('习惯不存在')
    return habitRepository.update(habitId, { streak: habit.streak + 1 })
  },

  async resetStreak(habitId: string): Promise<Habit> {
    return habitRepository.update(habitId, { streak: 0 })
  },

  async getHabits(userId: string): Promise<Habit[]> {
    return habitRepository.findByUserId(userId)
  },

  async updateHabit(habitId: string, patch: UpdateHabitInput): Promise<Habit> {
    return habitRepository.update(habitId, patch)
  },

  async deleteHabit(habitId: string): Promise<void> {
    return habitRepository.delete(habitId)
  }
}
