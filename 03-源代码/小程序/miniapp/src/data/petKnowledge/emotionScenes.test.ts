import { describe, it, expect } from 'vitest'
import { EMOTION_SCENES } from './emotionScenes'

describe('emotionScenes', () => {
  it('EMOTION_SCENES 数组不为空', () => {
    expect(EMOTION_SCENES.length).toBeGreaterThan(0)
  })

  it('每个场景都有必需的字段', () => {
    const requiredFields = ['id', 'name', 'category', 'triggerKeywords', 'triggerConditions', 'responses', 'followUpScenes']
    EMOTION_SCENES.forEach((scene) => {
      requiredFields.forEach((field) => {
        expect(scene).toHaveProperty(field)
      })
    })
  })

  it('responses 数组不为空', () => {
    EMOTION_SCENES.forEach((scene) => {
      expect(scene.responses.length).toBeGreaterThan(0)
    })
  })

  it('悲伤类场景 grief_just_passed 存在', () => {
    const scene = EMOTION_SCENES.find((s) => s.id === 'grief_just_passed')
    expect(scene).toBeDefined()
    expect(scene?.category).toBe('grief')
  })

  it('焦虑类场景 anxiety_pet_sick 存在', () => {
    const scene = EMOTION_SCENES.find((s) => s.id === 'anxiety_pet_sick')
    expect(scene).toBeDefined()
    expect(scene?.category).toBe('anxiety')
  })

  it('庆祝类场景 celebration_birthday 存在', () => {
    const scene = EMOTION_SCENES.find((s) => s.id === 'celebration_birthday')
    expect(scene).toBeDefined()
    expect(scene?.category).toBe('celebration')
  })

  it('日常关怀类场景 daily_morning 存在', () => {
    const scene = EMOTION_SCENES.find((s) => s.id === 'daily_morning')
    expect(scene).toBeDefined()
    expect(scene?.category).toBe('daily_care')
  })

  it('场景 ID 唯一性', () => {
    const ids = EMOTION_SCENES.map((scene) => scene.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('category 值在有效范围内', () => {
    const validCategories = ['grief', 'anxiety', 'celebration', 'daily_care', 'health_concern']
    EMOTION_SCENES.forEach((scene) => {
      expect(validCategories).toContain(scene.category)
    })
  })

  it('responses 中的 tone 值在有效范围内', () => {
    const validTones = ['gentle', 'encouraging', 'empathetic', 'celebratory', 'informative']
    EMOTION_SCENES.forEach((scene) => {
      scene.responses.forEach((response) => {
        expect(validTones).toContain(response.tone)
      })
    })
  })
})
