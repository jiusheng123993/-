import { describe, it, expect, beforeEach } from 'vitest'
import { createWellnessService, mealTypes, exerciseTypes } from './wellnessService'
import type { WellnessService } from './wellnessService'

describe('wellnessService', () => {
  let service: WellnessService

  beforeEach(() => {
    localStorage.clear()
    service = createWellnessService()
  })

  describe('constants', () => {
    it('has meal types', () => {
      expect(mealTypes).toContain('breakfast')
      expect(mealTypes).toContain('lunch')
      expect(mealTypes).toContain('dinner')
    })

    it('has exercise types', () => {
      expect(exerciseTypes).toContain('跑步')
      expect(exerciseTypes).toContain('瑜伽')
    })
  })

  describe('meals', () => {
    it('adds a meal', () => {
      const today = new Date().toISOString().split('T')[0]
      const meal = service.addMeal('breakfast', '豆浆油条', 500, 20, 60, 15)
      expect(meal.name).toBe('豆浆油条')
      expect(meal.calories).toBe(500)
      expect(meal.type).toBe('breakfast')
      expect(meal.date).toBe(today)
    })

    it('removes a meal', () => {
      const meal = service.addMeal('breakfast', '豆浆油条', 500)
      service.removeMeal(meal.id)
      expect(service.getState().meals).toHaveLength(0)
    })

    it('persists meals across service instances', () => {
      service.addMeal('breakfast', '豆浆油条', 500)
      const service2 = createWellnessService()
      expect(service2.getState().meals).toHaveLength(1)
    })
  })

  describe('water', () => {
    it('adds water log', () => {
      const log = service.addWater(250)
      expect(log.amount).toBe(250)
      expect(log.unit).toBe('ml')
    })

    it('removes water log', () => {
      const log = service.addWater(250)
      service.removeWater(log.id)
      expect(service.getState().water).toHaveLength(0)
    })

    it('calculates daily water intake', () => {
      const today = new Date().toISOString().split('T')[0]
      service.addWater(250)
      service.addWater(300)
      const water = service.getDailyWater(today)
      expect(water).toBe(550)
    })
  })

  describe('exercise', () => {
    it('adds exercise', () => {
      const today = new Date().toISOString().split('T')[0]
      const exercise = service.addExercise('跑步', 30, 300)
      expect(exercise.type).toBe('跑步')
      expect(exercise.duration).toBe(30)
      expect(exercise.calories).toBe(300)
      expect(exercise.date).toBe(today)
    })

    it('removes exercise', () => {
      const exercise = service.addExercise('跑步', 30, 300)
      service.removeExercise(exercise.id)
      expect(service.getState().exercises).toHaveLength(0)
    })

    it('calculates daily exercise stats', () => {
      const today = new Date().toISOString().split('T')[0]
      service.addExercise('跑步', 30, 300)
      service.addExercise('瑜伽', 20, 100)
      const stats = service.getDailyExercise(today)
      expect(stats.totalDuration).toBe(50)
      expect(stats.totalCalories).toBe(400)
    })
  })

  describe('goals', () => {
    it('sets a goal', () => {
      service.setGoal('water', 2000, 'ml')
      const state = service.getState()
      expect(state.goals).toHaveLength(1)
      expect(state.goals[0].type).toBe('water')
      expect(state.goals[0].target).toBe(2000)
    })

    it('updates existing goal', () => {
      service.setGoal('water', 2000, 'ml')
      service.setGoal('water', 2500, 'ml')
      const state = service.getState()
      expect(state.goals).toHaveLength(1)
      expect(state.goals[0].target).toBe(2500)
    })

    it('removes a goal', () => {
      service.setGoal('water', 2000, 'ml')
      const goalId = service.getState().goals[0].id
      service.removeGoal(goalId)
      expect(service.getState().goals).toHaveLength(0)
    })

    it('calculates goal progress for water', () => {
      const today = new Date().toISOString().split('T')[0]
      service.setGoal('water', 2000, 'ml')
      service.addWater(500)
      service.addWater(500)
      const progress = service.getGoalProgress('water', today)
      expect(progress.target).toBe(2000)
      expect(progress.current).toBe(1000)
      expect(progress.percent).toBe(50)
    })

    it('calculates goal progress for exercise', () => {
      const today = new Date().toISOString().split('T')[0]
      service.setGoal('exercise', 60, '分钟')
      service.addExercise('跑步', 30, 300)
      const progress = service.getGoalProgress('exercise', today)
      expect(progress.target).toBe(60)
      expect(progress.current).toBe(30)
      expect(progress.percent).toBe(50)
    })
  })

  describe('nutrition', () => {
    it('calculates daily nutrition', () => {
      const today = new Date().toISOString().split('T')[0]
      service.addMeal('breakfast', '豆浆', 200, 10, 20, 5)
      service.addMeal('lunch', '米饭', 400, 8, 60, 2)
      const nutrition = service.getDailyNutrition(today)
      expect(nutrition.calories).toBe(600)
      expect(nutrition.protein).toBe(18)
      expect(nutrition.carbs).toBe(80)
      expect(nutrition.fat).toBe(7)
    })
  })
})