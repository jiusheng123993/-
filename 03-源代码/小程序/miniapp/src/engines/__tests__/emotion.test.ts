import { describe, it, expect } from 'vitest'
import {
  detectSickAnxiety,
  detectNewOwnerAnxiety,
  detectGriefStage,
  getGriefStepMessage,
  GRIEF_FLOW_STEPS,
  getDisclaimer,
  createIntervention,
  requiresCrisisReferral,
  getSickAnxietyLevel,
} from '../emotion'

describe('detectSickAnxiety', () => {
  it('detects sick anxiety when consecutiveAnomalyDays >= 3', () => {
    expect(detectSickAnxiety({
      petName: '咪咪', consecutiveAnomalyDays: 3,
    })).toBe(true)
  })

  it('does not detect when consecutiveAnomalyDays < 3', () => {
    expect(detectSickAnxiety({
      petName: '咪咪', consecutiveAnomalyDays: 2,
    })).toBe(false)
  })

  it('detects with higher values', () => {
    expect(detectSickAnxiety({
      petName: '咪咪', consecutiveAnomalyDays: 7,
    })).toBe(true)
  })
})

describe('detectNewOwnerAnxiety', () => {
  it('detects new owner anxiety with high food queries', () => {
    expect(detectNewOwnerAnxiety({
      foodQueryCount: 5,
      symptomCheckCount: 0,
    })).toBe(true)
  })

  it('detects new owner anxiety with high symptom checks', () => {
    expect(detectNewOwnerAnxiety({
      foodQueryCount: 0,
      symptomCheckCount: 3,
    })).toBe(true)
  })

  it('does not detect for low queries and checks', () => {
    expect(detectNewOwnerAnxiety({
      foodQueryCount: 2,
      symptomCheckCount: 1,
    })).toBe(false)
  })
})

describe('detectGriefStage', () => {
  it('detects denial stage', () => {
    expect(detectGriefStage('不可能 不相信')).toBe('denial')
  })

  it('detects anger stage', () => {
    expect(detectGriefStage('不公平 为什么')).toBe('anger')
  })

  it('detects depression stage', () => {
    expect(detectGriefStage('难过 想念')).toBe('depression')
  })

  it('defaults to denial when no keywords match', () => {
    expect(detectGriefStage('hello world')).toBe('denial')
  })
})

describe('GRIEF_FLOW_STEPS', () => {
  it('has 4 steps in correct order', () => {
    expect(GRIEF_FLOW_STEPS).toHaveLength(4)
    expect(GRIEF_FLOW_STEPS.map(s => s.step)).toEqual(['name', 'write', 'connect', 'close'])
  })

  it('name step has options', () => {
    expect(GRIEF_FLOW_STEPS[0].options).toBeDefined()
    expect(GRIEF_FLOW_STEPS[0].options!.length).toBeGreaterThan(0)
  })

  it('write step has placeholder', () => {
    expect(GRIEF_FLOW_STEPS[1].placeholder).toBeDefined()
  })
})

describe('getGriefStepMessage', () => {
  it('returns opening message for name step', () => {
    expect(getGriefStepMessage('name', '咪咪')).toContain('不需要坚强')
  })

  it('returns feeling-based message for write step', () => {
    expect(getGriefStepMessage('write', '咪咪', '空虚')).toContain('空虚')
  })

  it('returns default feeling message for write step without feeling', () => {
    expect(getGriefStepMessage('write', '咪咪')).toContain('这种情绪')
  })

  it('returns connection message for connect step', () => {
    expect(getGriefStepMessage('connect', '咪咪')).toContain('2,847')
  })

  it('returns closing message for close step', () => {
    expect(getGriefStepMessage('close', '咪咪')).toContain('咪咪')
  })
})

describe('getDisclaimer', () => {
  it('returns grief disclaimer with hotline', () => {
    expect(getDisclaimer('grief')).toContain('400-161-9995')
  })

  it('returns sick_anxiety disclaimer', () => {
    expect(getDisclaimer('sick_anxiety')).toContain('兽医')
  })
})

describe('createIntervention', () => {
  it('creates intervention with correct type', () => {
    const intv = createIntervention('sick_anxiety', 'u1', 'test message', { petId: 'p1' })
    expect(intv.type).toBe('sick_anxiety')
    expect(intv.userId).toBe('u1')
    expect(intv.message).toBe('test message')
    expect(intv.userResponded).toBe(false)
    expect(intv.id).toContain('intv_sick_anxiety')
    expect(intv.requiresCrisisReferral).toBe(false)
  })

  it('creates intervention with anxietyLevel', () => {
    const intv = createIntervention('sick_anxiety', 'u1', 'test', { petId: 'p1' }, 'p1', 'severe')
    expect(intv.anxietyLevel).toBe('severe')
    expect(intv.requiresCrisisReferral).toBe(true)
  })

  it('creates grief intervention with crisis referral', () => {
    const intv = createIntervention('grief', 'u1', 'grief message', {})
    expect(intv.type).toBe('grief')
    expect(intv.requiresCrisisReferral).toBe(true)
  })
})

describe('requiresCrisisReferral', () => {
  it('returns true for grief type', () => {
    expect(requiresCrisisReferral('grief')).toBe(true)
  })

  it('returns true for sick_anxiety with severe level', () => {
    expect(requiresCrisisReferral('sick_anxiety', 'severe')).toBe(true)
  })

  it('returns false for sick_anxiety with moderate level', () => {
    expect(requiresCrisisReferral('sick_anxiety', 'moderate')).toBe(false)
  })

  it('returns false for sick_anxiety with mild level', () => {
    expect(requiresCrisisReferral('sick_anxiety', 'mild')).toBe(false)
  })

  it('returns false for new_owner_anxiety', () => {
    expect(requiresCrisisReferral('new_owner_anxiety', 'severe')).toBe(false)
  })
})

describe('getSickAnxietyLevel', () => {
  it('returns severe for 7+ consecutive anomaly days', () => {
    expect(getSickAnxietyLevel({ petName: '咪咪', consecutiveAnomalyDays: 7 })).toBe('severe')
  })

  it('returns moderate for 5-6 consecutive anomaly days', () => {
    expect(getSickAnxietyLevel({ petName: '咪咪', consecutiveAnomalyDays: 5 })).toBe('moderate')
  })

  it('returns mild for 3-4 consecutive anomaly days', () => {
    expect(getSickAnxietyLevel({ petName: '咪咪', consecutiveAnomalyDays: 3 })).toBe('mild')
  })
})
