import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createRelationshipHealthMonitor,
  HEALTHY_THRESHOLD,
  MODERATE_THRESHOLD,
  WARNING_THRESHOLD,
  CRITICAL_THRESHOLD,
  CRISIS_KEYWORDS,
  DEPENDENCY_KEYWORDS,
  EMOTIONAL_KEYWORDS,
  CRISIS_RESPONSE
} from './relationshipHealthMonitor'
import type {
  RelationshipHealthMonitor,
  ConversationMetrics,
  HealthAssessment
} from './relationshipHealthMonitor'
import type { SafetyIncidentLog } from './safetyIncidentLog'
import type { PersonaScheduleStorage } from './personaScheduleStore'
import type { PersonaScheduler } from './personaScheduler'

function createMockIncidentLog(): SafetyIncidentLog {
  const logs: Array<{
    userId: string
    category: string
    severity: string
    description: string
    context?: Record<string, unknown>
  }> = []

  return {
    log(incident) {
      logs.push({
        userId: incident.userId,
        category: incident.category,
        severity: incident.severity,
        description: incident.description,
        context: incident.context
      })
      return `incident-${logs.length}`
    },
    getByUser() { return [] },
    getByCategory() { return [] },
    getRecent() { return [] },
    countByUser() { return logs.length },
    clear() { logs.length = 0 }
  }
}

function createHealthyMetrics(overrides?: Partial<ConversationMetrics>): ConversationMetrics {
  return {
    userId: 'user-1',
    dailyMinutes: 30,
    weeklyMinutes: 200,
    monthlyMinutes: 800,
    consecutiveDays: 5,
    averageSessionMinutes: 15,
    lateNightSessions: 0,
    emotionalKeywords: [],
    dependencyKeywords: [],
    crisisKeywords: [],
    ...overrides
  }
}

describe('createRelationshipHealthMonitor', () => {
  let monitor: RelationshipHealthMonitor
  let incidentLog: SafetyIncidentLog & { countByUser: () => number }

  beforeEach(() => {
    incidentLog = createMockIncidentLog() as SafetyIncidentLog & { countByUser: () => number }
    monitor = createRelationshipHealthMonitor(incidentLog)
  })

  describe('factory', () => {
    it('creates a monitor with all methods', () => {
      expect(monitor).toBeDefined()
      expect(typeof monitor.assess).toBe('function')
      expect(typeof monitor.checkCrisis).toBe('function')
      expect(typeof monitor.getRecommendations).toBe('function')
      expect(typeof monitor.shouldSuggestPersonaSwitch).toBe('function')
    })

    it('accepts optional scheduleStorage and scheduler', () => {
      const storage = {} as PersonaScheduleStorage
      const scheduler = {} as PersonaScheduler
      const m = createRelationshipHealthMonitor(incidentLog, storage, scheduler)
      expect(m).toBeDefined()
    })
  })

  describe('assess - healthy', () => {
    it('returns healthy level for normal usage', () => {
      const metrics = createHealthyMetrics()
      const result = monitor.assess('user-1', metrics)

      expect(result.level).toBe('healthy')
      expect(result.overallScore).toBeGreaterThanOrEqual(HEALTHY_THRESHOLD)
      expect(result.dimensions).toHaveLength(4)
      expect(result.warnings).toHaveLength(0)
    })

    it('returns all four dimensions', () => {
      const result = monitor.assess('user-1', createHealthyMetrics())

      const dimensionNames = result.dimensions.map(d => d.dimension)
      expect(dimensionNames).toContain('interaction_frequency')
      expect(dimensionNames).toContain('dialogue_depth')
      expect(dimensionNames).toContain('dependency_level')
      expect(dimensionNames).toContain('emotional_impact')
    })

    it('includes assessedAt timestamp', () => {
      const result = monitor.assess('user-1', createHealthyMetrics())
      expect(result.assessedAt).toBeDefined()
      expect(new Date(result.assessedAt).getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('assess - moderate', () => {
    it('returns moderate when daily usage exceeds healthy max', () => {
      const metrics = createHealthyMetrics({
        dailyMinutes: 140,
        weeklyMinutes: 580,
        averageSessionMinutes: 35,
        consecutiveDays: 18
      })
      const result = monitor.assess('user-1', metrics)

      expect(result.level).toBe('moderate')
      expect(result.overallScore).toBeGreaterThanOrEqual(MODERATE_THRESHOLD)
      expect(result.overallScore).toBeLessThan(HEALTHY_THRESHOLD)
    })

    it('returns moderate with consecutive days above healthy threshold', () => {
      const metrics = createHealthyMetrics({
        consecutiveDays: 25,
        dailyMinutes: 130,
        averageSessionMinutes: 35,
        weeklyMinutes: 580
      })
      const result = monitor.assess('user-1', metrics)

      expect(result.level).toBe('moderate')
    })
  })

  describe('assess - warning', () => {
    it('returns warning when daily usage exceeds warning max', () => {
      const metrics = createHealthyMetrics({
        dailyMinutes: 200,
        weeklyMinutes: 1000,
        consecutiveDays: 30,
        averageSessionMinutes: 50
      })
      const result = monitor.assess('user-1', metrics)

      expect(result.level).toBe('warning')
      expect(result.overallScore).toBeGreaterThanOrEqual(WARNING_THRESHOLD)
      expect(result.overallScore).toBeLessThan(MODERATE_THRESHOLD)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('logs incident for warning level', () => {
      const metrics = createHealthyMetrics({
        dailyMinutes: 200,
        weeklyMinutes: 1000,
        consecutiveDays: 30,
        averageSessionMinutes: 50
      })
      monitor.assess('user-1', metrics)

      expect(incidentLog.countByUser()).toBeGreaterThan(0)
    })

    it('returns warning with dependency keywords', () => {
      const metrics = createHealthyMetrics({
        dependencyKeywords: ['只有你懂我', '离不开你'],
        dailyMinutes: 130,
        averageSessionMinutes: 35,
        consecutiveDays: 20
      })
      const result = monitor.assess('user-1', metrics)

      expect(result.level).toBe('warning')
    })
  })

  describe('assess - critical', () => {
    it('returns critical for severe overuse with dependency', () => {
      const metrics = createHealthyMetrics({
        dailyMinutes: 250,
        weeklyMinutes: 1500,
        consecutiveDays: 35,
        dependencyKeywords: ['只有你懂我', '离开你我会', '没有你我怎么办', '你是唯一'],
        emotionalKeywords: ['孤独', '寂寞', '难过', '伤心', '焦虑', '害怕'],
        crisisKeywords: ['绝望']
      })
      const result = monitor.assess('user-1', metrics)

      expect(result.level).toBe('critical')
      expect(result.overallScore).toBeLessThan(CRITICAL_THRESHOLD)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('logs high severity incident for critical level', () => {
      const metrics = createHealthyMetrics({
        dailyMinutes: 250,
        weeklyMinutes: 1500,
        consecutiveDays: 35,
        dependencyKeywords: ['只有你懂我', '离开你我会', '没有你我怎么办', '你是唯一'],
        crisisKeywords: ['绝望']
      })
      monitor.assess('user-1', metrics)

      expect(incidentLog.countByUser()).toBeGreaterThan(0)
    })

    it('auto-ends cameo when critical with scheduler', () => {
      const storage: PersonaScheduleStorage = {
        get: vi.fn().mockReturnValue({
          userId: 'user-1',
          mainPersonaId: 'p1',
          mainPersonaSelectedAt: '2026-01-01',
          mainPersonaLastChangedAt: '2026-01-01',
          activeCameo: {
            personaId: 'cameo-1',
            triggeredBy: 'cron' as const,
            triggerDetail: 'test',
            startedAt: '2026-06-01',
            endsAt: '2026-06-15'
          },
          cameoFrequency: 'daily'
        }),
        save: vi.fn(),
        canChangeMainPersona: vi.fn(),
        updateMainPersona: vi.fn(),
        activateCameo: vi.fn(),
        endCameo: vi.fn(),
        clear: vi.fn()
      }
      const scheduler: PersonaScheduler = {
        getCurrentPersona: vi.fn(),
        selectMainPersona: vi.fn(),
        activateCameo: vi.fn(),
        endCameo: vi.fn(),
        checkAutoCameoTriggers: vi.fn()
      }
      const m = createRelationshipHealthMonitor(incidentLog, storage, scheduler)

      const metrics = createHealthyMetrics({
        dailyMinutes: 250,
        weeklyMinutes: 1500,
        consecutiveDays: 35,
        dependencyKeywords: ['只有你懂我', '离开你我会', '没有你我怎么办', '你是唯一'],
        crisisKeywords: ['绝望']
      })
      m.assess('user-1', metrics)

      expect(scheduler.endCameo).toHaveBeenCalledWith('user-1')
    })
  })

  describe('assess - dimension scoring', () => {
    it('interaction_frequency penalizes high daily minutes', () => {
      const healthy = monitor.assess('user-1', createHealthyMetrics({ dailyMinutes: 30 }))
      const heavy = monitor.assess('user-1', createHealthyMetrics({ dailyMinutes: 200 }))

      const healthyFreq = healthy.dimensions.find(d => d.dimension === 'interaction_frequency')!
      const heavyFreq = heavy.dimensions.find(d => d.dimension === 'interaction_frequency')!

      expect(heavyFreq.score).toBeLessThan(healthyFreq.score)
    })

    it('interaction_frequency penalizes long consecutive days', () => {
      const short = monitor.assess('user-1', createHealthyMetrics({ consecutiveDays: 5 }))
      const long = monitor.assess('user-1', createHealthyMetrics({ consecutiveDays: 35 }))

      const shortFreq = short.dimensions.find(d => d.dimension === 'interaction_frequency')!
      const longFreq = long.dimensions.find(d => d.dimension === 'interaction_frequency')!

      expect(longFreq.score).toBeLessThan(shortFreq.score)
    })

    it('dialogue_depth penalizes long average sessions', () => {
      const short = monitor.assess('user-1', createHealthyMetrics({ averageSessionMinutes: 10 }))
      const long = monitor.assess('user-1', createHealthyMetrics({ averageSessionMinutes: 90 }))

      const shortDepth = short.dimensions.find(d => d.dimension === 'dialogue_depth')!
      const longDepth = long.dimensions.find(d => d.dimension === 'dialogue_depth')!

      expect(longDepth.score).toBeLessThan(shortDepth.score)
    })

    it('dialogue_depth penalizes dependency keywords', () => {
      const clean = monitor.assess('user-1', createHealthyMetrics())
      const dependent = monitor.assess('user-1', createHealthyMetrics({
        dependencyKeywords: ['只有你懂我', '离开你我会', '没有你我怎么办', '你是唯一']
      }))

      const cleanDepth = clean.dimensions.find(d => d.dimension === 'dialogue_depth')!
      const depDepth = dependent.dimensions.find(d => d.dimension === 'dialogue_depth')!

      expect(depDepth.score).toBeLessThan(cleanDepth.score)
    })

    it('dependency_level penalizes dependency keywords', () => {
      const clean = monitor.assess('user-1', createHealthyMetrics())
      const dependent = monitor.assess('user-1', createHealthyMetrics({
        dependencyKeywords: ['只有你懂我', '离开你我会', '没有你我怎么办', '你是唯一', '我不能没有你', '你是我唯一的']
      }))

      const cleanDep = clean.dimensions.find(d => d.dimension === 'dependency_level')!
      const depDep = dependent.dimensions.find(d => d.dimension === 'dependency_level')!

      expect(depDep.score).toBeLessThan(cleanDep.score)
    })

    it('emotional_impact penalizes crisis keywords heavily', () => {
      const clean = monitor.assess('user-1', createHealthyMetrics())
      const crisis = monitor.assess('user-1', createHealthyMetrics({
        crisisKeywords: ['自杀', '绝望']
      }))

      const cleanEmo = clean.dimensions.find(d => d.dimension === 'emotional_impact')!
      const crisisEmo = crisis.dimensions.find(d => d.dimension === 'emotional_impact')!

      expect(crisisEmo.score).toBeLessThan(cleanEmo.score)
      expect(crisisEmo.score).toBeLessThanOrEqual(50)
    })

    it('emotional_impact penalizes late night sessions', () => {
      const normal = monitor.assess('user-1', createHealthyMetrics({ lateNightSessions: 0 }))
      const late = monitor.assess('user-1', createHealthyMetrics({ lateNightSessions: 10 }))

      const normalEmo = normal.dimensions.find(d => d.dimension === 'emotional_impact')!
      const lateEmo = late.dimensions.find(d => d.dimension === 'emotional_impact')!

      expect(lateEmo.score).toBeLessThan(normalEmo.score)
    })
  })

  describe('checkCrisis', () => {
    it('detects crisis keywords', () => {
      const result = monitor.checkCrisis('user-1', '我觉得活不下去了，想自杀')

      expect(result.isCrisis).toBe(true)
      expect(result.level).toBe('crisis')
      expect(result.keywords.length).toBeGreaterThan(0)
      expect(result.recommendedAction).toBe(CRISIS_RESPONSE)
    })

    it('detects multiple crisis keywords', () => {
      const result = monitor.checkCrisis('user-1', '我想自杀，想自残，不想活了')

      expect(result.isCrisis).toBe(true)
      expect(result.keywords.length).toBeGreaterThanOrEqual(2)
    })

    it('logs incident for crisis detection', () => {
      monitor.checkCrisis('user-1', '我想自杀')

      expect(incidentLog.countByUser()).toBeGreaterThan(0)
    })

    it('detects dependency keywords as concern', () => {
      const result = monitor.checkCrisis('user-1', '只有你懂我，离开你我会很孤独')

      expect(result.isCrisis).toBe(false)
      expect(result.level).toBe('concern')
      expect(result.keywords.length).toBeGreaterThan(0)
    })

    it('returns none for normal content', () => {
      const result = monitor.checkCrisis('user-1', '今天天气真好，帮我规划一下任务')

      expect(result.isCrisis).toBe(false)
      expect(result.level).toBe('none')
      expect(result.keywords).toHaveLength(0)
      expect(result.recommendedAction).toBe('')
    })

    it('prioritizes crisis over concern when both present', () => {
      const result = monitor.checkCrisis('user-1', '只有你懂我，我想自杀')

      expect(result.isCrisis).toBe(true)
      expect(result.level).toBe('crisis')
    })

    it('detects all CRISIS_KEYWORDS', () => {
      for (const keyword of CRISIS_KEYWORDS) {
        const result = monitor.checkCrisis('user-1', `测试内容 ${keyword} 测试`)
        expect(result.isCrisis).toBe(true)
      }
    })

    it('detects all DEPENDENCY_KEYWORDS', () => {
      for (const keyword of DEPENDENCY_KEYWORDS) {
        const result = monitor.checkCrisis('user-1', `测试内容 ${keyword} 测试`)
        expect(result.level).toBe('concern')
      }
    })
  })

  describe('getRecommendations', () => {
    it('returns recommendations from assessment', () => {
      const assessment: HealthAssessment = {
        overallScore: 20,
        dimensions: [],
        level: 'warning',
        warnings: [],
        recommendations: ['建议休息', '建议切换 Persona'],
        assessedAt: new Date().toISOString()
      }

      const recs = monitor.getRecommendations(assessment)
      expect(recs).toEqual(['建议休息', '建议切换 Persona'])
    })

    it('returns empty array for healthy assessment', () => {
      const assessment: HealthAssessment = {
        overallScore: 85,
        dimensions: [],
        level: 'healthy',
        warnings: [],
        recommendations: [],
        assessedAt: new Date().toISOString()
      }

      const recs = monitor.getRecommendations(assessment)
      expect(recs).toHaveLength(0)
    })
  })

  describe('shouldSuggestPersonaSwitch', () => {
    it('returns true when score below warning threshold', () => {
      const assessment: HealthAssessment = {
        overallScore: 20,
        dimensions: [],
        level: 'warning',
        warnings: [],
        recommendations: [],
        assessedAt: new Date().toISOString()
      }

      expect(monitor.shouldSuggestPersonaSwitch(assessment)).toBe(true)
    })

    it('returns false when score above warning threshold', () => {
      const assessment: HealthAssessment = {
        overallScore: 50,
        dimensions: [],
        level: 'moderate',
        warnings: [],
        recommendations: [],
        assessedAt: new Date().toISOString()
      }

      expect(monitor.shouldSuggestPersonaSwitch(assessment)).toBe(false)
    })

    it('returns false for healthy assessment', () => {
      const assessment: HealthAssessment = {
        overallScore: 85,
        dimensions: [],
        level: 'healthy',
        warnings: [],
        recommendations: [],
        assessedAt: new Date().toISOString()
      }

      expect(monitor.shouldSuggestPersonaSwitch(assessment)).toBe(false)
    })
  })

  describe('constants', () => {
    it('HEALTHY_THRESHOLD is 80', () => {
      expect(HEALTHY_THRESHOLD).toBe(80)
    })

    it('MODERATE_THRESHOLD is 60', () => {
      expect(MODERATE_THRESHOLD).toBe(60)
    })

    it('WARNING_THRESHOLD is 40', () => {
      expect(WARNING_THRESHOLD).toBe(40)
    })

    it('CRITICAL_THRESHOLD is 25', () => {
      expect(CRITICAL_THRESHOLD).toBe(25)
    })

    it('CRISIS_KEYWORDS is non-empty', () => {
      expect(CRISIS_KEYWORDS.length).toBeGreaterThan(0)
    })

    it('DEPENDENCY_KEYWORDS is non-empty', () => {
      expect(DEPENDENCY_KEYWORDS.length).toBeGreaterThan(0)
    })

    it('EMOTIONAL_KEYWORDS is non-empty', () => {
      expect(EMOTIONAL_KEYWORDS.length).toBeGreaterThan(0)
    })

    it('CRISIS_RESPONSE contains helpline numbers', () => {
      expect(CRISIS_RESPONSE).toContain('400-161-9995')
      expect(CRISIS_RESPONSE).toContain('010-82951332')
      expect(CRISIS_RESPONSE).toContain('400-821-1215')
    })
  })

  describe('edge cases', () => {
    it('handles zero values gracefully', () => {
      const metrics = createHealthyMetrics({
        dailyMinutes: 0,
        weeklyMinutes: 0,
        monthlyMinutes: 0,
        consecutiveDays: 0,
        averageSessionMinutes: 0,
        lateNightSessions: 0
      })
      const result = monitor.assess('user-1', metrics)

      expect(result.level).toBe('healthy')
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('handles maximum extreme values', () => {
      const metrics = createHealthyMetrics({
        dailyMinutes: 500,
        weeklyMinutes: 3000,
        monthlyMinutes: 12000,
        consecutiveDays: 100,
        averageSessionMinutes: 120,
        lateNightSessions: 30,
        emotionalKeywords: Array(20).fill('孤独'),
        dependencyKeywords: Array(10).fill('只有你懂我'),
        crisisKeywords: Array(5).fill('自杀')
      })
      const result = monitor.assess('user-1', metrics)

      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.level).toBe('critical')
    })

    it('scores are clamped between 0 and 100', () => {
      const metrics = createHealthyMetrics({
        dailyMinutes: 1000,
        weeklyMinutes: 10000,
        monthlyMinutes: 50000,
        consecutiveDays: 365,
        averageSessionMinutes: 500,
        lateNightSessions: 100,
        emotionalKeywords: Array(50).fill('孤独'),
        dependencyKeywords: Array(50).fill('只有你懂我'),
        crisisKeywords: Array(50).fill('自杀')
      })
      const result = monitor.assess('user-1', metrics)

      for (const dim of result.dimensions) {
        expect(dim.score).toBeGreaterThanOrEqual(0)
        expect(dim.score).toBeLessThanOrEqual(100)
      }
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('empty content returns none crisis level', () => {
      const result = monitor.checkCrisis('user-1', '')
      expect(result.level).toBe('none')
    })
  })
})
