import {
  goalRepository,
  growthRepository,
  type Goal,
  type CreateGoalInput
} from '../data/repositories'

export interface GrowthReward {
  experience: number
  levelUp: boolean
  newLevel: number
}

export const goalService = {
  async createGoal(userId: string, input: Omit<CreateGoalInput, 'userId'>): Promise<Goal> {
    if (!input.title.trim()) throw new Error('目标标题不能为空')
    return goalRepository.create({ ...input, userId })
  },

  async updateProgress(goalId: string, progress: number): Promise<Goal> {
    if (progress < 0 || progress > 100) throw new Error('进度必须在 0-100 之间')
    return goalRepository.update(goalId, { progress })
  },

  async completeGoal(goalId: string): Promise<{ goal: Goal; reward: GrowthReward }> {
    const goal = await goalRepository.update(goalId, { progress: 100, status: 'completed' })

    const growthState = await growthRepository.addExperience(goal.userId, 50)
    const reward: GrowthReward = {
      experience: 50,
      levelUp: growthState.level > (growthState.level - 1),
      newLevel: growthState.level
    }

    return { goal, reward }
  },

  async archiveGoal(goalId: string): Promise<Goal> {
    return goalRepository.update(goalId, { status: 'archived' })
  },

  async getActiveGoals(userId: string): Promise<Goal[]> {
    return goalRepository.findByStatus(userId, 'active')
  },

  async getAllGoals(userId: string): Promise<Goal[]> {
    return goalRepository.findByUserId(userId)
  },

  async deleteGoal(goalId: string): Promise<void> {
    return goalRepository.delete(goalId)
  }
}
