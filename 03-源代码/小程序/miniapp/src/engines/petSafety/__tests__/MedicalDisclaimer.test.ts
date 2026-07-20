import { describe, it, expect } from 'vitest'
import { MedicalDisclaimer, mapFoodSafetyToHealthRisk } from '../MedicalDisclaimer'
import type { UrgencyLevel } from '../PetSafetyHandler'
import type { FoodSafetyLevel } from '../ToxicFoodFilter'
import type { HealthRiskLevel } from '../../../memory-body/types/memoryBodyTypes'

describe('MedicalDisclaimer', () => {
  const disclaimer = new MedicalDisclaimer()

  describe('getDisclaimer - food context', () => {
    it('returns toxic food disclaimer for red urgency', () => {
      const result = disclaimer.getDisclaimer('red', 'food')
      expect(result).toContain('严重危害')
    })

    it('returns dangerous food disclaimer for orange urgency', () => {
      const result = disclaimer.getDisclaimer('orange', 'food')
      expect(result).toContain('风险')
    })

    it('returns caution food disclaimer for yellow urgency', () => {
      const result = disclaimer.getDisclaimer('yellow', 'food')
      expect(result).toContain('谨慎')
    })

    it('returns safe food disclaimer for green urgency', () => {
      const result = disclaimer.getDisclaimer('green', 'food')
      expect(result).toContain('通常安全')
    })
  })

  describe('getDisclaimer - symptom context', () => {
    it('returns red symptom disclaimer for red urgency', () => {
      const result = disclaimer.getDisclaimer('red', 'symptom')
      expect(result).toContain('严重症状')
    })

    it('returns orange symptom disclaimer for orange urgency', () => {
      const result = disclaimer.getDisclaimer('orange', 'symptom')
      expect(result).toContain('尽快就医')
    })

    it('returns yellow symptom disclaimer for yellow urgency', () => {
      const result = disclaimer.getDisclaimer('yellow', 'symptom')
      expect(result).toContain('持续观察')
    })

    it('returns general disclaimer for green urgency', () => {
      const result = disclaimer.getDisclaimer('green', 'symptom')
      expect(result).toContain('仅供参考')
    })
  })

  describe('getDisclaimer - checkin context', () => {
    it('returns anomaly disclaimer for red urgency', () => {
      const result = disclaimer.getDisclaimer('red', 'checkin')
      expect(result).toContain('异常')
    })

    it('returns anomaly disclaimer for orange urgency', () => {
      const result = disclaimer.getDisclaimer('orange', 'checkin')
      expect(result).toContain('异常')
    })

    it('returns anomaly disclaimer for yellow urgency', () => {
      const result = disclaimer.getDisclaimer('yellow', 'checkin')
      expect(result).toContain('异常')
    })

    it('returns normal disclaimer for green urgency', () => {
      const result = disclaimer.getDisclaimer('green', 'checkin')
      expect(result).toContain('仅供参考')
    })
  })

  describe('getDisclaimer - default fallback', () => {
    it('returns general disclaimer for unknown context', () => {
      const result = disclaimer.getDisclaimer('green', 'unknown' as 'food' | 'symptom' | 'checkin')
      expect(result).toContain('仅供参考')
    })
  })

  describe('getEmergencyDisclaimer', () => {
    it('returns emergency disclaimer containing 紧急情况', () => {
      const result = disclaimer.getEmergencyDisclaimer()
      expect(result).toContain('紧急情况')
    })

    it('contains 不替代专业诊断', () => {
      const result = disclaimer.getEmergencyDisclaimer()
      expect(result).toContain('不替代专业诊断')
    })
  })

  describe('getFoodDisclaimer', () => {
    it('returns toxic disclaimer for toxic level', () => {
      const result = disclaimer.getFoodDisclaimer('toxic')
      expect(result).toContain('严重危害')
    })

    it('returns dangerous disclaimer for dangerous level', () => {
      const result = disclaimer.getFoodDisclaimer('dangerous')
      expect(result).toContain('风险')
    })

    it('returns caution disclaimer for caution level', () => {
      const result = disclaimer.getFoodDisclaimer('caution')
      expect(result).toContain('谨慎')
    })

    it('returns safe disclaimer for safe level', () => {
      const result = disclaimer.getFoodDisclaimer('safe')
      expect(result).toContain('通常安全')
    })

    it('returns caution disclaimer for unknown safety level', () => {
      const result = disclaimer.getFoodDisclaimer('unknown' as FoodSafetyLevel)
      expect(result).toContain('谨慎')
    })
  })

  describe('getFoodDisclaimerByHealthRisk', () => {
    it('returns toxic disclaimer for emergency risk', () => {
      const result = disclaimer.getFoodDisclaimerByHealthRisk('emergency')
      expect(result).toContain('严重危害')
    })

    it('returns dangerous disclaimer for high risk', () => {
      const result = disclaimer.getFoodDisclaimerByHealthRisk('high')
      expect(result).toContain('风险')
    })

    it('returns caution disclaimer for medium risk', () => {
      const result = disclaimer.getFoodDisclaimerByHealthRisk('medium')
      expect(result).toContain('谨慎')
    })

    it('returns safe disclaimer for low risk', () => {
      const result = disclaimer.getFoodDisclaimerByHealthRisk('low')
      expect(result).toContain('通常安全')
    })
  })

  describe('getSymptomDisclaimer', () => {
    it('returns red symptom disclaimer for red urgency', () => {
      const result = disclaimer.getSymptomDisclaimer('red')
      expect(result).toContain('严重症状')
    })

    it('returns orange symptom disclaimer for orange urgency', () => {
      const result = disclaimer.getSymptomDisclaimer('orange')
      expect(result).toContain('尽快就医')
    })

    it('returns yellow symptom disclaimer for yellow urgency', () => {
      const result = disclaimer.getSymptomDisclaimer('yellow')
      expect(result).toContain('持续观察')
    })

    it('returns general disclaimer for green urgency', () => {
      const result = disclaimer.getSymptomDisclaimer('green')
      expect(result).toContain('仅供参考')
    })

    it('returns general disclaimer for unknown urgency', () => {
      const result = disclaimer.getSymptomDisclaimer('unknown' as UrgencyLevel)
      expect(result).toContain('仅供参考')
    })
  })

  describe('getCheckinDisclaimer', () => {
    it('returns anomaly disclaimer when hasAnomaly is true', () => {
      const result = disclaimer.getCheckinDisclaimer(true)
      expect(result).toContain('异常')
    })

    it('returns normal disclaimer when hasAnomaly is false', () => {
      const result = disclaimer.getCheckinDisclaimer(false)
      expect(result).toContain('仅供参考')
    })
  })

  describe('mapFoodSafetyToHealthRisk', () => {
    it('maps toxic to emergency', () => {
      expect(mapFoodSafetyToHealthRisk('toxic')).toBe('emergency')
    })

    it('maps dangerous to high', () => {
      expect(mapFoodSafetyToHealthRisk('dangerous')).toBe('high')
    })

    it('maps caution to medium', () => {
      expect(mapFoodSafetyToHealthRisk('caution')).toBe('medium')
    })

    it('maps safe to low', () => {
      expect(mapFoodSafetyToHealthRisk('safe')).toBe('low')
    })
  })

  describe('medical disclaimer language consistency', () => {
    it('getEmergencyDisclaimer contains 不替代专业诊断', () => {
      expect(disclaimer.getEmergencyDisclaimer()).toContain('不替代专业诊断')
    })

    it('getSymptomDisclaimer red contains 不替代专业诊断', () => {
      expect(disclaimer.getSymptomDisclaimer('red')).toContain('不替代专业诊断')
    })

    it('getSymptomDisclaimer orange contains 不替代专业诊断', () => {
      expect(disclaimer.getSymptomDisclaimer('orange')).toContain('不替代专业诊断')
    })

    it('getSymptomDisclaimer yellow contains 不替代专业诊断', () => {
      expect(disclaimer.getSymptomDisclaimer('yellow')).toContain('不替代专业诊断')
    })

    it('getCheckinDisclaimer anomaly contains 不替代专业诊断', () => {
      expect(disclaimer.getCheckinDisclaimer(true)).toContain('不替代专业诊断')
    })

    it('getDisclaimer green symptom contains 不替代', () => {
      expect(disclaimer.getDisclaimer('green', 'symptom')).toContain('不替代')
    })
  })
})
