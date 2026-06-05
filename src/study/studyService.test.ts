import { describe, it, expect, beforeEach } from 'vitest'
import { createStudyService } from './studyService'
import { createMemoryStudyStore, createInitialStudyState } from '../data/localStudyStore'
import type { StudyService } from './studyService'

describe('studyService', () => {
  let service: StudyService

  beforeEach(() => {
    const store = createMemoryStudyStore(createInitialStudyState())
    service = createStudyService(store)
  })

  describe('getState', () => {
    it('returns the current study state', () => {
      const state = service.getState()
      expect(state.goals).toHaveLength(2)
      expect(state.tasks).toHaveLength(3)
      expect(state.notes).toHaveLength(2)
      expect(state.reviews).toHaveLength(2)
    })
  })

  describe('addGoal', () => {
    it('adds a new goal and returns it', () => {
      const goal = service.addGoal('线性代数复习', '数学', '2026-07-15')

      expect(goal.id).toBeTruthy()
      expect(goal.title).toBe('线性代数复习')
      expect(goal.subject).toBe('数学')
      expect(goal.targetDate).toBe('2026-07-15')
      expect(goal.progress).toBe(0)

      const state = service.getState()
      expect(state.goals).toHaveLength(3)
      expect(state.goals.find((g) => g.id === goal.id)).toBeTruthy()
    })

    it('generates unique IDs for each goal', () => {
      const goal1 = service.addGoal('目标A', '科目A', '2026-08-01')
      const goal2 = service.addGoal('目标B', '科目B', '2026-08-02')

      expect(goal1.id).not.toBe(goal2.id)
    })
  })

  describe('updateGoalProgress', () => {
    it('updates the progress of an existing goal', () => {
      const state = service.getState()
      const goalId = state.goals[0].id

      service.updateGoalProgress(goalId, 85)

      const updated = service.getState()
      expect(updated.goals[0].progress).toBe(85)
    })

    it('clamps progress between 0 and 100', () => {
      const state = service.getState()
      const goalId = state.goals[0].id

      service.updateGoalProgress(goalId, 150)
      expect(service.getState().goals[0].progress).toBe(100)

      service.updateGoalProgress(goalId, -20)
      expect(service.getState().goals[0].progress).toBe(0)
    })

    it('does nothing for non-existent goal ID', () => {
      const before = service.getState()
      service.updateGoalProgress('non-existent-id', 50)
      const after = service.getState()
      expect(after.goals).toEqual(before.goals)
    })
  })

  describe('removeGoal', () => {
    it('removes a goal by ID', () => {
      const state = service.getState()
      const goalId = state.goals[0].id

      service.removeGoal(goalId)

      const updated = service.getState()
      expect(updated.goals).toHaveLength(1)
      expect(updated.goals.find((g) => g.id === goalId)).toBeUndefined()
    })

    it('also removes tasks associated with the removed goal', () => {
      const state = service.getState()
      const goalId = state.goals[0].id
      const tasksBefore = state.tasks.filter((t) => t.goalId === goalId).length

      expect(tasksBefore).toBeGreaterThan(0)

      service.removeGoal(goalId)

      const updated = service.getState()
      expect(updated.tasks.filter((t) => t.goalId === goalId)).toHaveLength(0)
    })

    it('does nothing for non-existent goal ID', () => {
      const before = service.getState()
      service.removeGoal('non-existent-id')
      expect(service.getState().goals).toEqual(before.goals)
    })
  })

  describe('addTask', () => {
    it('adds a new task and returns it', () => {
      const state = service.getState()
      const goalId = state.goals[0].id

      const task = service.addTask('完成习题集', goalId, 45)

      expect(task.id).toBeTruthy()
      expect(task.title).toBe('完成习题集')
      expect(task.goalId).toBe(goalId)
      expect(task.status).toBe('todo')
      expect(task.minutes).toBe(45)
      expect(task.rewardPoints).toBe(45)

      const updated = service.getState()
      expect(updated.tasks).toHaveLength(4)
    })

    it('generates unique IDs for each task', () => {
      const state = service.getState()
      const goalId = state.goals[0].id

      const task1 = service.addTask('任务A', goalId, 30)
      const task2 = service.addTask('任务B', goalId, 60)

      expect(task1.id).not.toBe(task2.id)
    })
  })

  describe('toggleTask', () => {
    it('toggles task status from todo to done', () => {
      const state = service.getState()
      const taskId = state.tasks.find((t) => t.status === 'todo')!.id

      service.toggleTask(taskId)

      const updated = service.getState()
      expect(updated.tasks.find((t) => t.id === taskId)!.status).toBe('done')
    })

    it('toggles task status from done back to todo', () => {
      const state = service.getState()
      const taskId = state.tasks.find((t) => t.status === 'done')!.id

      service.toggleTask(taskId)

      const updated = service.getState()
      expect(updated.tasks.find((t) => t.id === taskId)!.status).toBe('todo')
    })

    it('does nothing for non-existent task ID', () => {
      const before = service.getState()
      service.toggleTask('non-existent-id')
      expect(service.getState().tasks).toEqual(before.tasks)
    })
  })

  describe('removeTask', () => {
    it('removes a task by ID', () => {
      const state = service.getState()
      const taskId = state.tasks[0].id

      service.removeTask(taskId)

      const updated = service.getState()
      expect(updated.tasks).toHaveLength(2)
      expect(updated.tasks.find((t) => t.id === taskId)).toBeUndefined()
    })

    it('does nothing for non-existent task ID', () => {
      const before = service.getState()
      service.removeTask('non-existent-id')
      expect(service.getState().tasks).toEqual(before.tasks)
    })
  })

  describe('addNote', () => {
    it('adds a new note and returns it', () => {
      const note = service.addNote('微积分笔记', '数学')

      expect(note.id).toBeTruthy()
      expect(note.title).toBe('微积分笔记')
      expect(note.subject).toBe('数学')
      expect(note.updatedAt).toBeTruthy()

      const state = service.getState()
      expect(state.notes).toHaveLength(3)
    })

    it('generates unique IDs for each note', () => {
      const note1 = service.addNote('笔记A', '科目A')
      const note2 = service.addNote('笔记B', '科目B')

      expect(note1.id).not.toBe(note2.id)
    })
  })

  describe('removeNote', () => {
    it('removes a note by ID', () => {
      const state = service.getState()
      const noteId = state.notes[0].id

      service.removeNote(noteId)

      const updated = service.getState()
      expect(updated.notes).toHaveLength(1)
      expect(updated.notes.find((n) => n.id === noteId)).toBeUndefined()
    })

    it('does nothing for non-existent note ID', () => {
      const before = service.getState()
      service.removeNote('non-existent-id')
      expect(service.getState().notes).toEqual(before.notes)
    })
  })

  describe('addReviewItem', () => {
    it('adds a new review item and returns it', () => {
      const item = service.addReviewItem('泰勒公式', '数学', '2026-06-10', 'hard')

      expect(item.id).toBeTruthy()
      expect(item.title).toBe('泰勒公式')
      expect(item.subject).toBe('数学')
      expect(item.dueDate).toBe('2026-06-10')
      expect(item.level).toBe('hard')

      const state = service.getState()
      expect(state.reviews).toHaveLength(3)
    })

    it('generates unique IDs for each review item', () => {
      const item1 = service.addReviewItem('复习A', '科目A', '2026-06-10', 'easy')
      const item2 = service.addReviewItem('复习B', '科目B', '2026-06-11', 'medium')

      expect(item1.id).not.toBe(item2.id)
    })
  })

  describe('removeReviewItem', () => {
    it('removes a review item by ID', () => {
      const state = service.getState()
      const reviewId = state.reviews[0].id

      service.removeReviewItem(reviewId)

      const updated = service.getState()
      expect(updated.reviews).toHaveLength(1)
      expect(updated.reviews.find((r) => r.id === reviewId)).toBeUndefined()
    })

    it('does nothing for non-existent review ID', () => {
      const before = service.getState()
      service.removeReviewItem('non-existent-id')
      expect(service.getState().reviews).toEqual(before.reviews)
    })
  })

  describe('getOverallProgress', () => {
    it('returns correct progress summary', () => {
      const progress = service.getOverallProgress()

      expect(progress.totalGoals).toBe(2)
      expect(progress.avgProgress).toBe(60)
      expect(progress.totalTasks).toBe(3)
      expect(progress.completedTasks).toBe(1)
    })

    it('returns zero avgProgress when there are no goals', () => {
      const store = createMemoryStudyStore({
        ...createInitialStudyState(),
        goals: []
      })
      const emptyService = createStudyService(store)

      const progress = emptyService.getOverallProgress()
      expect(progress.totalGoals).toBe(0)
      expect(progress.avgProgress).toBe(0)
    })

    it('reflects updated progress after goal progress changes', () => {
      const state = service.getState()
      const goalId = state.goals[0].id

      service.updateGoalProgress(goalId, 100)

      const progress = service.getOverallProgress()
      expect(progress.avgProgress).toBe(74)
    })

    it('reflects updated completed tasks after toggling', () => {
      const state = service.getState()
      const todoTaskId = state.tasks.find((t) => t.status === 'todo')!.id

      service.toggleTask(todoTaskId)

      const progress = service.getOverallProgress()
      expect(progress.completedTasks).toBe(2)
      expect(progress.totalTasks).toBe(3)
    })

    it('counts review items due today or earlier', () => {
      const today = new Date().toISOString().slice(0, 10)
      service.addReviewItem('紧急复习', '数学', today, 'hard')

      const progress = service.getOverallProgress()
      expect(progress.reviewDueCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('service with custom store', () => {
    it('uses the provided store for persistence', () => {
      const store = createMemoryStudyStore(createInitialStudyState())
      const svc = createStudyService(store)

      svc.addGoal('自定义目标', '自定义科目', '2026-12-31')

      const loaded = store.load()
      expect(loaded.goals).toHaveLength(3)
    })
  })
})
