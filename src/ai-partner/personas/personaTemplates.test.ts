import { describe, expect, it } from 'vitest'
import { getPersonaTemplateById, personaTemplates } from './personaTemplates'

describe('personaTemplates', () => {
  it('provides concrete study and office templates with different structures', () => {
    const student = getPersonaTemplateById('exam-student')
    const office = getPersonaTemplateById('office-worker')

    expect(student.title).toBe('20 天备考冲刺模板')
    expect(student.sections.map((section) => section.title)).toEqual(['科目进度', '错题复盘', '复习队列', '今日冲刺'])
    expect(student.sections[0].items[0].meta).toContain('薄弱科目')

    expect(office.title).toBe('本周项目推进模板')
    expect(office.sections.map((section) => section.title)).toEqual(['项目看板', '会议行动项', '阻塞风险', '周报素材'])
    expect(office.sections[1].items[0].meta).toContain('负责人')
  })

  it('keeps every template tied to a persona and a different operating rhythm', () => {
    const rhythms = personaTemplates.map((template) => template.operatingRhythm)

    expect(new Set(personaTemplates.map((template) => template.personaId)).size).toBe(personaTemplates.length)
    expect(new Set(rhythms).size).toBe(personaTemplates.length)

    personaTemplates.forEach((template) => {
      expect(template.sections.length).toBe(4)
      expect(template.defaultAction).toBeTruthy()
      expect(template.reviewQuestion).toBeTruthy()
    })
  })

  it('falls back to the exam student template when a persona is missing', () => {
    expect(getPersonaTemplateById('unknown').personaId).toBe('exam-student')
  })
})
