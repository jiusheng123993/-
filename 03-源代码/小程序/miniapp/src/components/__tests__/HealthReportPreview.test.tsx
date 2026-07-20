import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('@tarojs/components', () => ({
  View: ({ children, className, style, id }: any) => (
    <div className={className} style={style} id={id}>{children}</div>
  ),
  Text: ({ children, className, style }: any) => (
    <span className={className} style={style}>{children}</span>
  ),
  Image: ({ src, className, style }: any) => (
    <img src={src} className={className} style={style} />
  ),
}))

import HealthReportPreview from '../HealthReportPreview'
import { HealthReportData } from '../../types/reportTypes'

describe('HealthReportPreview', () => {
  const mockData: HealthReportData = {
    pet: {
      id: '1',
      name: '咪咪',
      species: 'cat',
      breed: '英短',
      birthDate: '2022-01-01',
      gender: 'female',
      neutered: true,
      weight: 4.5,
      allergies: ['海鲜'],
      medications: ['维生素'],
      chronicConditions: [],
    },
    entries: [
      {
        date: '2026-07-20',
        bowel: '正常',
        appetite: '正常',
        energy: '正常',
        exercise: '正常',
        weight: 4.5,
      },
    ],
    symptoms: [
      {
        date: '2026-07-18',
        symptoms: ['呕吐', '精神差'],
        urgencyLevel: 'yellow',
        aiAssessment: '建议观察，如持续则就医',
      },
    ],
    vaccines: [
      {
        name: '猫三联',
        dateGiven: '2026-01-15',
        dateDue: '2026-07-15',
        status: 'overdue',
      },
    ],
    generatedAt: '2026-07-20',
    period: '2026-06-20 至 2026-07-20',
  }

  it('should render report with all sections', () => {
    const { getByText } = render(<HealthReportPreview data={mockData} />)

    expect(getByText('宠物健康报告')).toBeDefined()
    expect(getByText('咪咪的健康档案')).toBeDefined()
    expect(getByText('宠物档案')).toBeDefined()
    expect(getByText('健康打卡记录（最近30天）')).toBeDefined()
    expect(getByText('症状记录')).toBeDefined()
    expect(getByText('疫苗记录')).toBeDefined()
  })

  it('should render pet info correctly', () => {
    const { getByText } = render(<HealthReportPreview data={mockData} />)

    expect(getByText('咪咪')).toBeDefined()
    expect(getByText('英短')).toBeDefined()
    expect(getByText('4.5 kg')).toBeDefined()
    expect(getByText('已绝育')).toBeDefined()
  })

  it('should render disclaimer', () => {
    const { getByText } = render(<HealthReportPreview data={mockData} />)

    expect(getByText(/本报告由星寰海AI宠物管家生成/)).toBeDefined()
    expect(getByText('星寰海 · 有记忆的AI宠物管家')).toBeDefined()
  })
})
