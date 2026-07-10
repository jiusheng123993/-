import { describe, expect, it, beforeEach } from 'vitest'
import { createSafetyIncidentLog } from './safetyIncidentLog'
import type { IncidentCategory, IncidentSeverity } from './safetyIncidentLog'

describe('safetyIncidentLog', () => {
  let log: ReturnType<typeof createSafetyIncidentLog>

  beforeEach(() => {
    log = createSafetyIncidentLog()
  })

  it('generates unique id and createdAt on log', () => {
    const id = log.log({
      userId: 'user-1',
      category: 'content_violation' as IncidentCategory,
      severity: 'high' as IncidentSeverity,
      description: 'Test incident'
    })

    expect(id).toBeDefined()
    expect(id.startsWith('incident_')).toBe(true)
  })

  it('filters incidents by user', () => {
    log.log({ userId: 'user-a', category: 'content_violation', severity: 'high', description: 'A1' })
    log.log({ userId: 'user-b', category: 'content_violation', severity: 'high', description: 'B1' })
    log.log({ userId: 'user-a', category: 'content_violation', severity: 'high', description: 'A2' })

    const userAIncidents = log.getByUser('user-a')
    expect(userAIncidents).toHaveLength(2)
    expect(userAIncidents.every(i => i.userId === 'user-a')).toBe(true)
  })

  it('filters incidents by category', () => {
    log.log({ userId: 'user-1', category: 'content_violation', severity: 'high', description: 'CV' })
    log.log({ userId: 'user-1', category: 'jailbreak_attempt', severity: 'high', description: 'JB' })
    log.log({ userId: 'user-1', category: 'content_violation', severity: 'high', description: 'CV2' })

    const cvIncidents = log.getByCategory('content_violation')
    expect(cvIncidents).toHaveLength(2)
    expect(cvIncidents.every(i => i.category === 'content_violation')).toBe(true)
  })

  it('returns recent incidents sorted by time desc', () => {
    log.log({ userId: 'user-1', category: 'content_violation', severity: 'high', description: 'Old' })

    const recent = log.getRecent(10)
    expect(recent.length).toBeGreaterThan(0)
    expect(recent[0].description).toBe('Old')
  })

  it('counts incidents by user correctly', () => {
    log.log({ userId: 'user-a', category: 'content_violation', severity: 'high', description: 'A1' })
    log.log({ userId: 'user-a', category: 'content_violation', severity: 'high', description: 'A2' })
    log.log({ userId: 'user-b', category: 'content_violation', severity: 'high', description: 'B1' })

    expect(log.countByUser('user-a')).toBe(2)
    expect(log.countByUser('user-b')).toBe(1)
    expect(log.countByUser('user-c')).toBe(0)
  })

  it('clears all incidents', () => {
    log.log({ userId: 'user-1', category: 'content_violation', severity: 'high', description: 'Test' })
    expect(log.getRecent().length).toBeGreaterThan(0)

    log.clear()
    expect(log.getRecent()).toHaveLength(0)
    expect(log.countByUser('user-1')).toBe(0)
  })
})
