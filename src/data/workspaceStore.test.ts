import { describe, expect, it } from 'vitest'
import { createInitialWorkspaceState, createMemoryWorkspaceStore, migrateLegacyStudyState } from './workspaceStore'

describe('workspaceStore', () => {
  it('creates a multi-workspace local-first state', () => {
    const state = createInitialWorkspaceState()

    expect(state.preferences.activeWorkspace).toBe('study')
    expect(state.preferences.activePersona).toBe('exam-student')
    expect(state.preferences.themeId).toBe('minimal-premium')
    expect(state.preferences.themeMode).toBe('persona-recommended')
    expect(state.sync.mode).toBe('local-first')
    expect(state.integrations.ai.providerId).toBe('deepseek')
    expect(state.tasks.some((task) => task.workspaceType === 'work')).toBe(true)
    expect(state.tasks.some((task) => task.workspaceType === 'growth')).toBe(true)
    expect(state.focusSessions).toEqual([])
  })

  it('saves and loads state through the workspace provider contract', () => {
    const store = createMemoryWorkspaceStore()
    const state = createInitialWorkspaceState()
    state.preferences.themeId = 'business-bluegray'
    state.preferences.themeMode = 'manual'
    state.preferences.activeWorkspace = 'work'
    state.preferences.activePersona = 'office-worker'
    state.integrations.ai.enabled = true

    store.save(state)
    const loaded = store.load()

    expect(loaded.preferences.themeId).toBe('business-bluegray')
    expect(loaded.preferences.themeMode).toBe('manual')
    expect(loaded.preferences.activeWorkspace).toBe('work')
    expect(loaded.preferences.activePersona).toBe('office-worker')
    expect(loaded.integrations.ai.enabled).toBe(true)
  })

  it('migrates legacy study state into the study workspace', () => {
    const migrated = migrateLegacyStudyState({
      goals: [{ id: 'goal-legacy', title: '旧学习目标', subject: '英语', targetDate: '2026-06-30', progress: 30 }],
      tasks: [{ id: 'task-legacy', title: '旧任务', goalId: 'goal-legacy', status: 'todo', minutes: 20, rewardXp: 10 }],
      notes: [{ id: 'note-legacy', title: '旧笔记', subject: '英语', updatedAt: '昨天' }],
      reviews: [{ id: 'review-legacy', title: '旧复习', subject: '英语', dueDate: '今天', level: 'easy' }],
      preferences: { themeId: 'cream-dopamine' }
    })

    expect(migrated.goals[0].workspaceType).toBe('study')
    expect(migrated.tasks[0].source).toBe('manual')
    expect(migrated.notes[0].area).toBe('英语')
    expect(migrated.preferences.themeId).toBe('cream-dopamine')
    expect(migrated.preferences.themeMode).toBe('manual')
  })
})
