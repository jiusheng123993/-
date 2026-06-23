import { describe, expect, it } from 'vitest'
import {
  checkCognitivePermission,
  createCognitivePermission,
  DEFAULT_COGNITIVE_PERMISSION
} from '../permission/cognitivePermission'

describe('cognitivePermission', () => {
  it('creates a cognitive permission with default values', () => {
    const permission = createCognitivePermission({})

    expect(permission).toEqual({
      usableInChat: true,
      usableInPlanning: false,
      usableInCoding: false,
      usableInRecommendation: false,
      usableInEmotionalSupport: false,
      excludedScenarios: [],
      requiresConfirmation: false
    })
  })

  it('creates a cognitive permission with custom values', () => {
    const permission = createCognitivePermission({
      usableInChat: true,
      usableInPlanning: true,
      usableInRecommendation: true,
      excludedScenarios: ['coding'],
      requiresConfirmation: true
    })

    expect(permission).toEqual({
      usableInChat: true,
      usableInPlanning: true,
      usableInCoding: false,
      usableInRecommendation: true,
      usableInEmotionalSupport: false,
      excludedScenarios: ['coding'],
      requiresConfirmation: true
    })
  })

  it('allows memory usable in chat for chat scenario', () => {
    const permission = createCognitivePermission({ usableInChat: true })

    expect(checkCognitivePermission(permission, 'chat')).toEqual({
      allowed: true,
      requiresConfirmation: false,
      reason: undefined
    })
  })

  it('denies memory not usable in planning for planning scenario', () => {
    const permission = createCognitivePermission({ usableInChat: true })

    expect(checkCognitivePermission(permission, 'goal_planning')).toEqual({
      allowed: false,
      requiresConfirmation: false,
      reason: 'memory_not_permitted_for_scenario'
    })
  })

  it('denies memory with excluded scenario', () => {
    const permission = createCognitivePermission({
      usableInChat: true,
      excludedScenarios: ['chat']
    })

    expect(checkCognitivePermission(permission, 'chat')).toEqual({
      allowed: false,
      requiresConfirmation: false,
      reason: 'scenario_excluded'
    })
  })

  it('flags requiresConfirmation when set', () => {
    const permission = createCognitivePermission({
      usableInChat: true,
      requiresConfirmation: true
    })

    expect(checkCognitivePermission(permission, 'chat')).toEqual({
      allowed: true,
      requiresConfirmation: true,
      reason: undefined
    })
  })

  it('maps scenario names to permission fields correctly', () => {
    const permission = createCognitivePermission({
      usableInPlanning: true,
      usableInCoding: true,
      usableInRecommendation: true,
      usableInEmotionalSupport: true
    })

    expect(checkCognitivePermission(permission, 'goal_planning').allowed).toBe(true)
    expect(checkCognitivePermission(permission, 'focus').allowed).toBe(true)
    expect(checkCognitivePermission(permission, 'food_recommendation').allowed).toBe(true)
    expect(checkCognitivePermission(permission, 'emotional_support').allowed).toBe(true)
  })

  it('denies all scenarios when all permission flags are explicitly disabled', () => {
    const permission = createCognitivePermission({
      usableInChat: false,
      usableInPlanning: false,
      usableInCoding: false,
      usableInRecommendation: false,
      usableInEmotionalSupport: false
    })

    expect(checkCognitivePermission(permission, 'chat').allowed).toBe(false)
    expect(checkCognitivePermission(permission, 'goal_planning').allowed).toBe(false)
    expect(checkCognitivePermission(permission, 'focus').allowed).toBe(false)
    expect(checkCognitivePermission(permission, 'food_recommendation').allowed).toBe(false)
    expect(checkCognitivePermission(permission, 'emotional_support').allowed).toBe(false)
  })

  it('DEFAULT_COGNITIVE_PERMISSION allows chat only', () => {
    expect(DEFAULT_COGNITIVE_PERMISSION).toEqual({
      usableInChat: true,
      usableInPlanning: false,
      usableInCoding: false,
      usableInRecommendation: false,
      usableInEmotionalSupport: false,
      excludedScenarios: [],
      requiresConfirmation: false
    })
  })
})
