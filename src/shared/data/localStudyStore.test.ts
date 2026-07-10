import { describe, expect, it } from 'vitest'
import { createInitialStudyState, createMemoryStudyStore } from './localStudyStore'

describe('localStudyStore', () => {
  it('creates a usable initial study state', () => {
    const state = createInitialStudyState()

    expect(state.goals).toHaveLength(2)
    expect(state.tasks.some((task) => task.status === 'todo')).toBe(true)
    expect(state.preferences.themeId).toBe('minimal-premium')
    expect(state.growth.level).toBeGreaterThan(0)
  })

  it('saves and loads state through the provider contract', () => {
    const store = createMemoryStudyStore()
    const state = createInitialStudyState()
    state.preferences.themeId = 'cream-dopamine'
    state.growth.experience = 260

    store.save(state)
    const loaded = store.load()

    expect(loaded.preferences.themeId).toBe('cream-dopamine')
    expect(loaded.growth.experience).toBe(260)
  })
})
