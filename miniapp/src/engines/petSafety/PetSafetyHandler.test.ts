import { describe, it, expect, beforeEach } from 'vitest'
import { PetSafetyHandler } from './PetSafetyHandler'
import { ToxicFoodFilter } from './ToxicFoodFilter'
import { MedicalDisclaimer } from './MedicalDisclaimer'
import type { SafetyCheckInput, CheckinCheckData } from './PetSafetyHandler'

describe('PetSafetyHandler', () => {
  let handler: PetSafetyHandler

  beforeEach(() => {
    handler = new PetSafetyHandler()
  })

  describe('checkFood', () => {
    it('should block chocolate for dog with red urgency', () => {
      const result = handler.checkFood('巧克力', 'dog')
      expect(result.blocked).toBe(true)
      expect(result.urgencyLevel).toBe('red')
      expect(result.isSafe).toBe(false)
      expect(result.requiresVetVisit).toBe(true)
      expect(result.blockReason).toContain('有毒')
    })

    it('should block chocolate for cat with red urgency', () => {
      const result = handler.checkFood('巧克力', 'cat')
      expect(result.blocked).toBe(true)
      expect(result.urgencyLevel).toBe('red')
      expect(result.isSafe).toBe(false)
      expect(result.blockReason).toContain('有毒')
    })

    it('should block grape for dog with red urgency', () => {
      const result = handler.checkFood('葡萄', 'dog')
      expect(result.blocked).toBe(true)
      expect(result.urgencyLevel).toBe('red')
      expect(result.isSafe).toBe(false)
    })

    it('should block onion for dog with red urgency', () => {
      const result = handler.checkFood('洋葱', 'dog')
      expect(result.blocked).toBe(true)
      expect(result.urgencyLevel).toBe('red')
      expect(result.isSafe).toBe(false)
    })

    it('should block xylitol for dog with red urgency', () => {
      const result = handler.checkFood('木糖醇', 'dog')
      expect(result.blocked).toBe(true)
      expect(result.urgencyLevel).toBe('red')
      expect(result.isSafe).toBe(false)
    })

    it('should block lily for cat with red urgency', () => {
      const result = handler.checkFood('百合', 'cat')
      expect(result.blocked).toBe(true)
      expect(result.urgencyLevel).toBe('red')
      expect(result.isSafe).toBe(false)
    })

    it('should not block lily for dog with yellow urgency', () => {
      const result = handler.checkFood('百合', 'dog')
      expect(result.blocked).toBe(false)
      expect(result.urgencyLevel).toBe('yellow')
    })

    it('should not block avocado for cat with orange urgency', () => {
      const result = handler.checkFood('牛油果', 'cat')
      expect(result.blocked).toBe(false)
      expect(result.urgencyLevel).toBe('orange')
    })

    it('should not block avocado for dog with yellow urgency', () => {
      const result = handler.checkFood('牛油果', 'dog')
      expect(result.blocked).toBe(false)
      expect(result.urgencyLevel).toBe('yellow')
    })

    it('should not block milk with yellow urgency', () => {
      const result = handler.checkFood('牛奶', 'dog')
      expect(result.blocked).toBe(false)
      expect(result.urgencyLevel).toBe('yellow')
    })

    it('should mark chicken breast as safe with green urgency', () => {
      const result = handler.checkFood('鸡胸肉', 'dog')
      expect(result.blocked).toBe(false)
      expect(result.urgencyLevel).toBe('green')
      expect(result.isSafe).toBe(true)
    })

    it('should mark carrot as safe with green urgency', () => {
      const result = handler.checkFood('胡萝卜', 'dog')
      expect(result.blocked).toBe(false)
      expect(result.urgencyLevel).toBe('green')
      expect(result.isSafe).toBe(true)
    })

    it('should mark blueberry as safe with green urgency', () => {
      const result = handler.checkFood('蓝莓', 'dog')
      expect(result.blocked).toBe(false)
      expect(result.urgencyLevel).toBe('green')
      expect(result.isSafe).toBe(true)
    })

    it('should return yellow for unknown food with conservative strategy', () => {
      const result = handler.checkFood('未知奇怪食物', 'dog')
      expect(result.blocked).toBe(false)
      expect(result.urgencyLevel).toBe('yellow')
      expect(result.isSafe).toBe(false)
    })

    it('should handle empty string input gracefully', () => {
      const result = handler.checkFood('', 'dog')
      expect(result.urgencyLevel).toBeDefined()
      expect(result.disclaimer).toBeTruthy()
    })

    it('should include warnings for toxic food', () => {
      const result = handler.checkFood('巧克力', 'dog')
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes('可可碱') || w.includes('咖啡因'))).toBe(true)
    })

    it('should include emergency actions for red urgency food', () => {
      const result = handler.checkFood('巧克力', 'dog')
      expect(result.emergencyActions.length).toBeGreaterThan(0)
      expect(result.emergencyActions.some(a => a.includes('兽医'))).toBe(true)
    })

    it('should include disclaimer in result', () => {
      const result = handler.checkFood('巧克力', 'dog')
      expect(result.disclaimer).toBeTruthy()
      expect(result.disclaimer.length).toBeGreaterThan(0)
    })

    it('should match food by alias', () => {
      const result = handler.checkFood('朱古力', 'dog')
      expect(result.blocked).toBe(true)
      expect(result.urgencyLevel).toBe('red')
    })

    it('should handle species-specific safety for grape with cat', () => {
      const result = handler.checkFood('葡萄', 'cat')
      expect(result.urgencyLevel).toBe('orange')
    })
  })

  describe('checkSymptoms', () => {
    it('should return red for blood stool', () => {
      const result = handler.checkSymptoms(['血便'], 'dog')
      expect(result.urgencyLevel).toBe('red')
      expect(result.blocked).toBe(true)
      expect(result.requiresVetVisit).toBe(true)
    })

    it('should return red for convulsions', () => {
      const result = handler.checkSymptoms(['抽搐'], 'cat')
      expect(result.urgencyLevel).toBe('red')
      expect(result.blocked).toBe(true)
    })

    it('should return red for breathing difficulty', () => {
      const result = handler.checkSymptoms(['呼吸困难'], 'dog')
      expect(result.urgencyLevel).toBe('red')
      expect(result.blocked).toBe(true)
    })

    it('should return red for not eating plus lethargy combo', () => {
      const result = handler.checkSymptoms(['不吃', '萎靡'], 'dog')
      expect(result.urgencyLevel).toBe('red')
      expect(result.blocked).toBe(true)
    })

    it('should return red for vomiting plus diarrhea plus low spirit combo', () => {
      const result = handler.checkSymptoms(['呕吐', '腹泻', '精神差'], 'cat')
      expect(result.urgencyLevel).toBe('red')
      expect(result.blocked).toBe(true)
    })

    it('should return orange for persistent vomiting', () => {
      const result = handler.checkSymptoms(['持续呕吐'], 'dog')
      expect(result.urgencyLevel).toBe('orange')
      expect(result.blocked).toBe(false)
    })

    it('should return orange for diarrhea as it matches severe diarrhea keyword', () => {
      const result = handler.checkSymptoms(['腹泻'], 'dog')
      expect(result.urgencyLevel).toBe('orange')
      expect(result.blocked).toBe(false)
    })

    it('should return yellow for cough', () => {
      const result = handler.checkSymptoms(['咳嗽'], 'cat')
      expect(result.urgencyLevel).toBe('yellow')
      expect(result.blocked).toBe(false)
    })

    it('should return yellow for sneeze as it matches yellow keyword', () => {
      const result = handler.checkSymptoms(['打喷嚏'], 'dog')
      expect(result.urgencyLevel).toBe('yellow')
      expect(result.blocked).toBe(false)
    })

    it('should return orange for 3 or more symptoms', () => {
      const result = handler.checkSymptoms(['咳嗽', '打喷嚏', '皮肤问题'], 'dog')
      expect(result.urgencyLevel).toBe('orange')
    })

    it('should return green for empty symptom list', () => {
      const result = handler.checkSymptoms([], 'dog')
      expect(result.urgencyLevel).toBe('green')
      expect(result.isSafe).toBe(true)
    })

    it('should return red for not eating with 3+ days duration', () => {
      const result = handler.checkSymptoms(['不吃'], 'dog', '3天以上')
      expect(result.urgencyLevel).toBe('red')
      expect(result.blocked).toBe(true)
    })

    it('should include emergency actions for red urgency symptoms', () => {
      const result = handler.checkSymptoms(['血便'], 'dog')
      expect(result.emergencyActions.length).toBeGreaterThan(0)
      expect(result.emergencyActions.some(a => a.includes('兽医'))).toBe(true)
    })

    it('should include disclaimer in symptom result', () => {
      const result = handler.checkSymptoms(['咳嗽'], 'dog')
      expect(result.disclaimer).toBeTruthy()
      expect(result.disclaimer.length).toBeGreaterThan(0)
    })

    it('should return orange for 2 symptoms with 1-2 days duration', () => {
      const result = handler.checkSymptoms(['咳嗽', '打喷嚏'], 'dog', '1-2天')
      expect(result.urgencyLevel).toBe('orange')
    })
  })

  describe('checkCheckin', () => {
    it('should return red for poopLevel 1', () => {
      const data: CheckinCheckData = { poopLevel: 1, appetiteLevel: 3, spiritLevel: 3, hasAnomaly: false }
      const result = handler.checkCheckin(data, 'dog')
      expect(result.urgencyLevel).toBe('red')
      expect(result.blocked).toBe(true)
    })

    it('should return red for appetiteLevel 1 plus spiritLevel 1 combo', () => {
      const data: CheckinCheckData = { poopLevel: 3, appetiteLevel: 1, spiritLevel: 1, hasAnomaly: false }
      const result = handler.checkCheckin(data, 'cat')
      expect(result.urgencyLevel).toBe('red')
      expect(result.blocked).toBe(true)
    })

    it('should return red for all three levels at 2', () => {
      const data: CheckinCheckData = { poopLevel: 2, appetiteLevel: 2, spiritLevel: 2, hasAnomaly: false }
      const result = handler.checkCheckin(data, 'dog')
      expect(result.urgencyLevel).toBe('red')
      expect(result.blocked).toBe(true)
    })

    it('should return orange for appetiteLevel 2 plus spiritLevel 2', () => {
      const data: CheckinCheckData = { poopLevel: 3, appetiteLevel: 2, spiritLevel: 2, hasAnomaly: false }
      const result = handler.checkCheckin(data, 'dog')
      expect(result.urgencyLevel).toBe('orange')
      expect(result.blocked).toBe(false)
    })

    it('should return orange for poopLevel 2 plus appetiteLevel 2', () => {
      const data: CheckinCheckData = { poopLevel: 2, appetiteLevel: 2, spiritLevel: 3, hasAnomaly: false }
      const result = handler.checkCheckin(data, 'cat')
      expect(result.urgencyLevel).toBe('orange')
    })

    it('should return yellow for hasAnomaly true', () => {
      const data: CheckinCheckData = { poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, hasAnomaly: true, anomalyItems: ['皮肤红肿'] }
      const result = handler.checkCheckin(data, 'dog')
      expect(result.urgencyLevel).toBe('yellow')
      expect(result.blocked).toBe(false)
    })

    it('should return yellow for poopLevel 2 alone', () => {
      const data: CheckinCheckData = { poopLevel: 2, appetiteLevel: 3, spiritLevel: 3, hasAnomaly: false }
      const result = handler.checkCheckin(data, 'dog')
      expect(result.urgencyLevel).toBe('yellow')
    })

    it('should return green for all normal levels', () => {
      const data: CheckinCheckData = { poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, hasAnomaly: false }
      const result = handler.checkCheckin(data, 'dog')
      expect(result.urgencyLevel).toBe('green')
      expect(result.isSafe).toBe(true)
    })

    it('should return green for poopLevel 5 constipation as it is not in anomaly range', () => {
      const data: CheckinCheckData = { poopLevel: 5, appetiteLevel: 3, spiritLevel: 3, hasAnomaly: false }
      const result = handler.checkCheckin(data, 'dog')
      expect(result.urgencyLevel).toBe('green')
    })

    it('should return yellow for appetiteLevel 1 alone', () => {
      const data: CheckinCheckData = { poopLevel: 3, appetiteLevel: 1, spiritLevel: 3, hasAnomaly: false }
      const result = handler.checkCheckin(data, 'cat')
      expect(result.urgencyLevel).toBe('yellow')
    })

    it('should include anomaly items in warnings', () => {
      const data: CheckinCheckData = { poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, hasAnomaly: true, anomalyItems: ['皮肤红肿', '掉毛'] }
      const result = handler.checkCheckin(data, 'dog')
      expect(result.warnings.some(w => w.includes('皮肤红肿'))).toBe(true)
    })

    it('should include disclaimer in checkin result', () => {
      const data: CheckinCheckData = { poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, hasAnomaly: false }
      const result = handler.checkCheckin(data, 'dog')
      expect(result.disclaimer).toBeTruthy()
    })
  })

  describe('check unified entry', () => {
    it('should dispatch to checkFood when type is food', () => {
      const input: SafetyCheckInput = { type: 'food', data: { foodName: '巧克力' }, petSpecies: 'dog' }
      const result = handler.check(input)
      expect(result.blocked).toBe(true)
      expect(result.urgencyLevel).toBe('red')
    })

    it('should dispatch to checkSymptoms when type is symptom', () => {
      const input: SafetyCheckInput = { type: 'symptom', data: { symptoms: ['血便'] }, petSpecies: 'dog' }
      const result = handler.check(input)
      expect(result.blocked).toBe(true)
      expect(result.urgencyLevel).toBe('red')
    })

    it('should dispatch to checkCheckin when type is checkin', () => {
      const input: SafetyCheckInput = {
        type: 'checkin',
        data: { poopLevel: 1, appetiteLevel: 3, spiritLevel: 3, hasAnomaly: false },
        petSpecies: 'cat'
      }
      const result = handler.check(input)
      expect(result.blocked).toBe(true)
      expect(result.urgencyLevel).toBe('red')
    })

    it('should return yellow for unknown type', () => {
      const input: SafetyCheckInput = { type: 'food' as SafetyCheckInput['type'], data: {} as never, petSpecies: 'dog' }
      const result = handler.check({ ...input, type: 'unknown' as SafetyCheckInput['type'] })
      expect(result.urgencyLevel).toBe('yellow')
      expect(result.blocked).toBe(false)
    })

    it('should include disclaimer in all results', () => {
      const inputs: SafetyCheckInput[] = [
        { type: 'food', data: { foodName: '鸡胸肉' }, petSpecies: 'dog' },
        { type: 'symptom', data: { symptoms: ['咳嗽'] }, petSpecies: 'cat' },
        { type: 'checkin', data: { poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, hasAnomaly: false }, petSpecies: 'dog' },
      ]
      for (const input of inputs) {
        const result = handler.check(input)
        expect(result.disclaimer).toBeTruthy()
        expect(result.disclaimer.length).toBeGreaterThan(0)
      }
    })
  })

  describe('MedicalDisclaimer', () => {
    let disclaimer: MedicalDisclaimer

    beforeEach(() => {
      disclaimer = new MedicalDisclaimer()
    })

    it('should include 严重危害 in toxic food disclaimer', () => {
      const text = disclaimer.getFoodDisclaimer('toxic')
      expect(text).toContain('严重危害')
    })

    it('should include 立即 in red symptom disclaimer', () => {
      const text = disclaimer.getSymptomDisclaimer('red')
      expect(text).toContain('立即')
    })

    it('should include 异常 in checkin anomaly disclaimer', () => {
      const text = disclaimer.getCheckinDisclaimer(true)
      expect(text).toContain('异常')
    })

    it('should include 紧急 in emergency disclaimer', () => {
      const text = disclaimer.getEmergencyDisclaimer()
      expect(text).toContain('紧急')
    })

    it('should include 不替代专业兽医诊断 in symptom, checkin and emergency disclaimers', () => {
      const disclaimers = [
        disclaimer.getSymptomDisclaimer('red'),
        disclaimer.getSymptomDisclaimer('orange'),
        disclaimer.getSymptomDisclaimer('yellow'),
        disclaimer.getSymptomDisclaimer('green'),
        disclaimer.getCheckinDisclaimer(true),
        disclaimer.getCheckinDisclaimer(false),
        disclaimer.getEmergencyDisclaimer(),
      ]
      for (const d of disclaimers) {
        expect(d).toContain('不替代专业')
      }
    })

    it('should include 严重危害 in toxic food disclaimer without 不替代专业诊断', () => {
      const text = disclaimer.getFoodDisclaimer('toxic')
      expect(text).toContain('严重危害')
      expect(text).toContain('宠物急救')
    })

    it('should include 风险 in dangerous food disclaimer', () => {
      const text = disclaimer.getFoodDisclaimer('dangerous')
      expect(text).toContain('风险')
    })

    it('should include 谨慎 in caution food disclaimer', () => {
      const text = disclaimer.getFoodDisclaimer('caution')
      expect(text).toContain('谨慎')
    })

    it('should include 安全 in safe food disclaimer', () => {
      const text = disclaimer.getFoodDisclaimer('safe')
      expect(text).toContain('安全')
    })
  })

  describe('ToxicFoodFilter', () => {
    let filter: ToxicFoodFilter

    beforeEach(() => {
      filter = new ToxicFoodFilter([
        {
          id: 'chocolate',
          name: '巧克力',
          aliases: ['朱古力', '可可'],
          safetyLevel: 'toxic',
          speciesSafety: {},
          dangerousCompounds: ['可可碱'],
          symptoms: ['呕吐'],
          breedWarnings: [],
          description: '有毒',
        },
        {
          id: 'lily',
          name: '百合',
          aliases: ['百合花', 'lily'],
          safetyLevel: 'toxic',
          speciesSafety: { cat: 'toxic', dog: 'caution' },
          dangerousCompounds: ['百合毒素'],
          symptoms: ['肾衰竭'],
          breedWarnings: [],
          description: '对猫有毒',
        },
      ])
    })

    it('should find exact match for 巧克力', () => {
      const result = filter.filter('巧克力', 'dog')
      expect(result.found).toBe(true)
      expect(result.safetyLevel).toBe('toxic')
    })

    it('should find alias match for 朱古力', () => {
      const result = filter.filter('朱古力', 'dog')
      expect(result.found).toBe(true)
      expect(result.safetyLevel).toBe('toxic')
    })

    it('should fuzzy match 可可 to chocolate via alias', () => {
      const result = filter.filter('可可', 'dog')
      expect(result.found).toBe(true)
      expect(result.safetyLevel).toBe('toxic')
    })

    it('should return toxic for lily with cat and caution for dog', () => {
      const catResult = filter.filter('百合', 'cat')
      expect(catResult.found).toBe(true)
      expect(catResult.safetyLevel).toBe('toxic')

      const dogResult = filter.filter('百合', 'dog')
      expect(dogResult.found).toBe(true)
      expect(dogResult.safetyLevel).toBe('caution')
    })

    it('should return not found with caution for unknown food', () => {
      const result = filter.filter('未知食物', 'dog')
      expect(result.found).toBe(false)
      expect(result.safetyLevel).toBe('caution')
    })
  })
})
