import { describe, expect, it } from 'vitest'
import { getPersonaById, personaRegistry } from './personaRegistry'

describe('personaRegistry', () => {
  it('defines differentiated scenarios for target user groups', () => {
    const ids = personaRegistry.map((persona) => persona.id)

    expect(ids).toEqual([
      'exam-student', 'office-worker', 'creator', 'self-growth',
      'grad-exam', 'civil-service', 'cert-exam', 'english-cet'
    ])
    expect(new Set(ids).size).toBe(personaRegistry.length)
  })

  it('gives every persona unique modules, metrics, and AI role', () => {
    const moduleSignatures = personaRegistry.map((persona) => persona.modules.map((module) => module.title).join('|'))
    const metricSignatures = personaRegistry.map((persona) => persona.keyMetrics.join('|'))
    const aiRoles = personaRegistry.map((persona) => persona.aiRole)

    expect(new Set(moduleSignatures).size).toBe(personaRegistry.length)
    expect(new Set(metricSignatures).size).toBe(personaRegistry.length)
    expect(new Set(aiRoles).size).toBe(personaRegistry.length)

    personaRegistry.forEach((persona) => {
      expect(persona.targetUser).toBeTruthy()
      expect(persona.painPoint).toBeTruthy()
      expect(persona.primaryFlow).toBeTruthy()
      expect(persona.modules.length).toBeGreaterThanOrEqual(4)
      expect(persona.keyMetrics.length).toBeGreaterThanOrEqual(4)
      expect(persona.aiActions.length).toBeGreaterThanOrEqual(3)
      expect(persona.recommendedThemeId).toBeTruthy()
    })
  })

  it('falls back to the exam student persona when an id is missing', () => {
    expect(getPersonaById('missing').id).toBe('exam-student')
  })
})
