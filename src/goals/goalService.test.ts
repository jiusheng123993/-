import { describe, it, expect, beforeEach } from 'vitest'
import {
  createInitialGoalState,
  createObjective,
  updateObjective,
  deleteObjective,
  addKeyResult,
  updateKeyResult,
  deleteKeyResult,
  completeObjective,
  getActiveObjectives,
  getObjectivesByCategory,
  getOverallProgress
} from './goalService'

describe('goalService', () => {
  let state = createInitialGoalState()

  beforeEach(() => {
    state = createInitialGoalState()
  })

  it('creates initial state with zero objectives', () => {
    expect(state.objectives).toEqual([])
    expect(state.totalActive).toBe(0)
    expect(state.totalCompleted).toBe(0)
  })

  it('creates an objective', () => {
    const newState = createObjective(state, {
      title: '学习 TypeScript',
      description: '掌握 TS 高级类型',
      category: 'learning',
      status: 'active',
      priority: 'high',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    expect(newState.objectives).toHaveLength(1)
    expect(newState.totalActive).toBe(1)
    expect(newState.objectives[0].title).toBe('学习 TypeScript')
    expect(newState.objectives[0].progress).toBe(0)
  })

  it('updates an objective', () => {
    let s = createObjective(state, {
      title: '原始标题',
      description: '',
      category: 'learning',
      status: 'active',
      priority: 'medium',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    const id = s.objectives[0].id
    s = updateObjective(s, id, { title: '更新标题', priority: 'high' })

    expect(s.objectives[0].title).toBe('更新标题')
    expect(s.objectives[0].priority).toBe('high')
  })

  it('deletes an objective', () => {
    let s = createObjective(state, {
      title: '测试目标',
      description: '',
      category: 'other',
      status: 'active',
      priority: 'low',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    const id = s.objectives[0].id
    s = deleteObjective(s, id)

    expect(s.objectives).toHaveLength(0)
    expect(s.totalActive).toBe(0)
  })

  it('adds key results to an objective', () => {
    let s = createObjective(state, {
      title: '学习目标',
      description: '',
      category: 'learning',
      status: 'active',
      priority: 'high',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    const objId = s.objectives[0].id
    s = addKeyResult(s, objId, { title: '完成 10 个项目', target: 10, current: 0, unit: '个' })
    s = addKeyResult(s, objId, { title: '阅读 5 本书', target: 5, current: 0, unit: '本' })

    expect(s.objectives[0].keyResults).toHaveLength(2)
  })

  it('updates key result progress', () => {
    let s = createObjective(state, {
      title: '学习目标',
      description: '',
      category: 'learning',
      status: 'active',
      priority: 'high',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    const objId = s.objectives[0].id
    s = addKeyResult(s, objId, { title: '完成项目', target: 10, current: 0, unit: '个' })
    const krId = s.objectives[0].keyResults[0].id

    s = updateKeyResult(s, objId, krId, { current: 5 })
    expect(s.objectives[0].keyResults[0].current).toBe(5)
    expect(s.objectives[0].keyResults[0].isCompleted).toBe(false)

    s = updateKeyResult(s, objId, krId, { current: 10 })
    expect(s.objectives[0].keyResults[0].isCompleted).toBe(true)
  })

  it('deletes a key result', () => {
    let s = createObjective(state, {
      title: '学习目标',
      description: '',
      category: 'learning',
      status: 'active',
      priority: 'high',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    const objId = s.objectives[0].id
    s = addKeyResult(s, objId, { title: 'KR1', target: 10, current: 0, unit: '个' })
    const krId = s.objectives[0].keyResults[0].id
    s = deleteKeyResult(s, objId, krId)

    expect(s.objectives[0].keyResults).toHaveLength(0)
  })

  it('completes an objective', () => {
    let s = createObjective(state, {
      title: '完成目标',
      description: '',
      category: 'other',
      status: 'active',
      priority: 'high',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    const id = s.objectives[0].id
    s = completeObjective(s, id)

    expect(s.objectives[0].status).toBe('completed')
    expect(s.objectives[0].progress).toBe(100)
    expect(s.totalCompleted).toBe(1)
    expect(s.totalActive).toBe(0)
  })

  it('filters active objectives', () => {
    let s = createObjective(state, {
      title: '活跃目标',
      description: '',
      category: 'learning',
      status: 'active',
      priority: 'high',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    const id = s.objectives[0].id
    s = completeObjective(s, id)

    expect(getActiveObjectives(s)).toHaveLength(0)
  })

  it('filters objectives by category', () => {
    let s = createObjective(state, {
      title: '学习目标',
      description: '',
      category: 'learning',
      status: 'active',
      priority: 'high',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    s = createObjective(s, {
      title: '健康目标',
      description: '',
      category: 'health',
      status: 'active',
      priority: 'medium',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    expect(getObjectivesByCategory(s, 'learning')).toHaveLength(1)
    expect(getObjectivesByCategory(s, 'health')).toHaveLength(1)
  })

  it('calculates overall progress', () => {
    let s = createObjective(state, {
      title: '目标1',
      description: '',
      category: 'learning',
      status: 'active',
      priority: 'high',
      startDate: '2026-06-01',
      targetDate: '2026-07-01'
    })

    const objId = s.objectives[0].id
    s = addKeyResult(s, objId, { title: 'KR1', target: 10, current: 5, unit: '个' })

    expect(getOverallProgress(s)).toBe(50)
  })
})