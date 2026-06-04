import { describe, it, expect, beforeEach } from 'vitest'
import {
  createInitialHabitState,
  toggleHabit,
  updateHabitProgress,
  getTodayDateString,
  getTodayHabitRecords,
  getHabitCompletionRate,
  addCustomHabit,
  removeHabit
} from './habitService'

describe('habitService', () => {
  let state = createInitialHabitState()
  const today = getTodayDateString()

  beforeEach(() => {
    state = createInitialHabitState()
  })

  it('creates initial state with default habits', () => {
    expect(state.habits.length).toBeGreaterThan(0)
    expect(state.habits.every((h) => h.isActive)).toBe(true)
    expect(state.records).toEqual([])
  })

  it('toggles habit completion', () => {
    const habitId = state.habits[0].id
    const toggled = toggleHabit(state, habitId, today)
    expect(getTodayHabitRecords(toggled)).toHaveLength(1)
    expect(getTodayHabitRecords(toggled)[0].completed).toBe(true)

    const untoggled = toggleHabit(toggled, habitId, today)
    expect(getTodayHabitRecords(untoggled)).toHaveLength(0)
  })

  it('updates habit progress', () => {
    const habitId = state.habits[0].id
    const updated = updateHabitProgress(state, habitId, today, 3)
    const records = getTodayHabitRecords(updated)
    expect(records).toHaveLength(1)
    expect(records[0].value).toBe(3)
    expect(records[0].completed).toBe(false)
  })

  it('calculates completion rate', () => {
    expect(getHabitCompletionRate(state)).toBe(0)

    const habitId = state.habits[0].id
    let updated = toggleHabit(state, habitId, today)
    const rate = getHabitCompletionRate(updated)
    expect(rate).toBeGreaterThan(0)
  })

  it('adds custom habit', () => {
    const updated = addCustomHabit(state, {
      id: 'custom-test',
      name: '测试习惯',
      icon: '🧪',
      category: 'life',
      target: 1,
      unit: '次',
      color: '#000'
    })
    expect(updated.habits.find((h) => h.id === 'custom-test')).toBeDefined()
    expect(updated.habits.find((h) => h.id === 'custom-test')?.isActive).toBe(true)
  })

  it('removes habit', () => {
    const habitId = state.habits[0].id
    let updated = toggleHabit(state, habitId, today)
    updated = removeHabit(updated, habitId)
    expect(updated.habits.find((h) => h.id === habitId)).toBeUndefined()
    expect(updated.records.filter((r) => r.habitId === habitId)).toHaveLength(0)
  })

  it('getTodayDateString returns YYYY-MM-DD format', () => {
    const dateStr = getTodayDateString()
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('calculates current streak', () => {
    const habitId = state.habits[0].id
    const toggled = toggleHabit(state, habitId, today)
    expect(toggled.currentStreak[habitId]).toBeGreaterThanOrEqual(0)
  })
})