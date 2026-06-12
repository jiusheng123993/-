import {
  taskRepository,
  goalRepository,
  growthRepository,
  type Task,
  type CreateTaskInput,
  type UpdateTaskInput
} from '../data/repositories'

export const taskService = {
  async createTask(userId: string, input: Omit<CreateTaskInput, 'userId'>): Promise<Task> {
    if (!input.title.trim()) throw new Error('任务标题不能为空')
    return taskRepository.create({ ...input, userId })
  },

  async completeTask(taskId: string): Promise<{ task: Task; experience: number }> {
    const task = await taskRepository.update(taskId, { status: 'done' })

    const expGain = Math.max(1, Math.floor((task.minutes || 0) / 5))
    await growthRepository.addExperience(task.userId, expGain)

    if (task.goalId) {
      const tasks = await taskRepository.findByGoalId(task.goalId)
      const doneCount = tasks.filter((t) => t.status === 'done').length
      const progress = Math.min(100, Math.floor((doneCount / Math.max(tasks.length, 1)) * 100))
      await goalRepository.update(task.goalId, { progress })
    }

    return { task, experience: expGain }
  },

  async getTasksByGoal(goalId: string): Promise<Task[]> {
    return taskRepository.findByGoalId(goalId)
  },

  async getAllTasks(userId: string): Promise<Task[]> {
    return taskRepository.findByUserId(userId)
  },

  async updateTask(taskId: string, patch: UpdateTaskInput): Promise<Task> {
    return taskRepository.update(taskId, patch)
  },

  async deleteTask(taskId: string): Promise<void> {
    return taskRepository.delete(taskId)
  }
}
