/**
 * 健康趋势服务测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockStorage: Record<string, string> = {}

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn((key: string) => {
    const raw = mockStorage[`xhh_${key}`]
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }),
  setStorage: vi.fn((key: string, value: unknown) => {
    mockStorage[`xhh_${key}`] = JSON.stringify(value)
  }),
  removeStorage: vi.fn((key: string) => {
    delete mockStorage[`xhh_${key}`]
  }),
}))

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockGetCheckinsByDateRange = vi.fn()

vi.mock('../checkinService', () => ({
  getCheckinsByDateRange: (...args: unknown[]) => mockGetCheckinsByDateRange(...args),
}))

import { api } from '../api'
import {
  getTrendData,
  getTrendSummary,
  getMonthlyReport,
  getWeightTrend,
  getAppetiteTrend,
  getStoolTrend,
  getAbnormalDays,
} from '../trendService'
import type { TrendDataPoint, TrendSummary, MonthlyReport } from '../trendService'
import type { PetHealthEntry } from '../checkinService'

const today = new Date().toISOString().split('T')[0]

function makeCheckinEntry(overrides: Partial<PetHealthEntry> = {}): PetHealthEntry {
  return {
    id: 'checkin_001',
    petId: 'pet-001',
    userId: 'user-001',
    poopLevel: 3,
    appetiteLevel: 3,
    spiritLevel: 3,
    exerciseLevel: 2,
    weight: 10,
    hasAnomaly: false,
    anomalyItems: [],
    riskLevel: 'low',
    aiFeedback: '✅ 您的宠物今天状态不错！',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

function makeTrendDataPoint(overrides: Partial<TrendDataPoint> = {}): TrendDataPoint {
  return {
    date: today,
    weight: 10,
    appetite: 'normal',
    energy: 'normal',
    stool: 'normal',
    vomiting: false,
    riskLevel: 'low',
    hasAbnormal: false,
    ...overrides,
  }
}

function makeTrendSummary(overrides: Partial<TrendSummary> = {}): TrendSummary {
  return {
    petId: 'pet-001',
    period: 'month',
    weightTrend: 'stable',
    weightChange: 0,
    weightChangePercent: 0,
    appetiteStats: { normal: 10, decreased: 0, increased: 0, none: 0 },
    stoolStats: { normal: 10, soft: 0, diarrhea: 0, constipation: 0, bloody: 0 },
    abnormalDays: 0,
    totalDays: 10,
    aiAnalysis: '体重保持稳定，这是健康的好迹象。食欲整体正常，饮食状况良好。排便情况整体正常。整体健康状况良好，继续保持！',
    ...overrides,
  }
}

function makeMonthlyReport(overrides: Partial<MonthlyReport> = {}): MonthlyReport {
  return {
    petId: 'pet-001',
    month: '2024-01',
    summary: makeTrendSummary(),
    highlights: ['体重保持稳定', '食欲整体良好', '排便情况正常'],
    concerns: [],
    recommendations: ['建议定期进行年度体检'],
    ...overrides,
  }
}

describe('trendService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
    mockGetCheckinsByDateRange.mockReset()
  })

  describe('getTrendData', () => {
    it('should return trend data from API', async () => {
      const mockData = [makeTrendDataPoint(), makeTrendDataPoint({ date: '2024-01-02' })]
      vi.mocked(api.get).mockResolvedValue(mockData)

      const result = await getTrendData('pet-001', '2024-01-01', '2024-01-31')

      expect(result).toHaveLength(2)
      expect(result[0].date).toBe(today)
      expect(api.get).toHaveBeenCalledWith(
        '/api/pets/pet-001/trends?startDate=2024-01-01&endDate=2024-01-31'
      )
    })

    it('should fallback to checkin data when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const mockCheckins = [
        makeCheckinEntry(),
        makeCheckinEntry({ id: 'checkin_002', createdAt: new Date('2024-01-02T00:00:00.000Z'), weight: 11 }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(mockCheckins)

      const result = await getTrendData('pet-001', '2024-01-01', '2024-01-31')

      expect(result).toHaveLength(2)
      expect(result[0].hasAbnormal).toBe(false)
      expect(result[0].weight).toBe(10)
      expect(mockGetCheckinsByDateRange).toHaveBeenCalledWith('pet-001', '', '2024-01-01', '2024-01-31')
    })

    it('should fallback to local storage when both API and checkin fail', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      mockGetCheckinsByDateRange.mockRejectedValue(new Error('Checkin error'))

      const localData = [makeTrendDataPoint({ date: '2024-01-01' })]
      mockStorage['xhh_trend_pet-001'] = JSON.stringify(localData)

      const result = await getTrendData('pet-001', '2024-01-01', '2024-01-31')

      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2024-01-01')
    })

    it('should return empty array when all sources fail with no local data', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      mockGetCheckinsByDateRange.mockRejectedValue(new Error('Checkin error'))

      const result = await getTrendData('pet-001', '2024-01-01', '2024-01-31')

      expect(result).toEqual([])
    })
  })

  describe('getTrendSummary', () => {
    it('should return trend summary from API', async () => {
      const mockSummary = makeTrendSummary()
      vi.mocked(api.get).mockResolvedValue(mockSummary)

      const result = await getTrendSummary('pet-001', 'month')

      expect(result.petId).toBe('pet-001')
      expect(result.period).toBe('month')
      expect(result.weightTrend).toBe('stable')
      expect(api.get).toHaveBeenCalledWith('/api/pets/pet-001/trends/summary?period=month')
    })

    it('should build local summary when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const mockCheckins = [
        makeCheckinEntry(),
        makeCheckinEntry({ id: 'checkin_002', createdAt: new Date('2024-01-02T00:00:00.000Z'), weight: 11 }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(mockCheckins)

      const result = await getTrendSummary('pet-001', 'month')

      expect(result.petId).toBe('pet-001')
      expect(result.period).toBe('month')
      expect(result.totalDays).toBe(2)
      expect(result.aiAnalysis).toBeTruthy()
    })

    it('should handle week period', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      mockGetCheckinsByDateRange.mockResolvedValue([])

      const result = await getTrendSummary('pet-001', 'week')

      expect(result.period).toBe('week')
      expect(result.totalDays).toBe(0)
    })

    it('should handle quarter period', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      mockGetCheckinsByDateRange.mockResolvedValue([])

      const result = await getTrendSummary('pet-001', 'quarter')

      expect(result.period).toBe('quarter')
      expect(result.totalDays).toBe(0)
    })
  })

  describe('getMonthlyReport', () => {
    it('should return monthly report from API', async () => {
      const mockReport = makeMonthlyReport()
      vi.mocked(api.get).mockResolvedValue(mockReport)

      const result = await getMonthlyReport('pet-001', '2024-01')

      expect(result.petId).toBe('pet-001')
      expect(result.month).toBe('2024-01')
      expect(result.highlights).toHaveLength(3)
      expect(api.get).toHaveBeenCalledWith('/api/pets/pet-001/trends/report?month=2024-01')
    })

    it('should build local report when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const mockCheckins = [
        makeCheckinEntry(),
        makeCheckinEntry({ id: 'checkin_002', createdAt: new Date('2024-01-15T00:00:00.000Z'), weight: 10.5 }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(mockCheckins)

      const result = await getMonthlyReport('pet-001', '2024-01')

      expect(result.petId).toBe('pet-001')
      expect(result.month).toBe('2024-01')
      expect(result.summary).toBeDefined()
      expect(result.highlights).toBeDefined()
      expect(result.concerns).toBeDefined()
      expect(result.recommendations).toBeDefined()
    })

    it('should handle month with 31 days', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      mockGetCheckinsByDateRange.mockResolvedValue([])

      const result = await getMonthlyReport('pet-001', '2024-01')

      expect(result.month).toBe('2024-01')
      expect(result.summary.totalDays).toBe(0)
    })

    it('should handle February', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      mockGetCheckinsByDateRange.mockResolvedValue([])

      const result = await getMonthlyReport('pet-001', '2024-02')

      expect(result.month).toBe('2024-02')
    })
  })

  describe('getWeightTrend', () => {
    it('should return only data points with weight', async () => {
      const mockData = [
        makeTrendDataPoint({ weight: 10 }),
        makeTrendDataPoint({ date: '2024-01-02', weight: undefined }),
        makeTrendDataPoint({ date: '2024-01-03', weight: 11 }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockData)

      const result = await getWeightTrend('pet-001', 3)

      expect(result).toHaveLength(2)
      expect(result[0].weight).toBe(10)
      expect(result[1].weight).toBe(11)
    })

    it('should return empty array when no weight data', async () => {
      const mockData = [makeTrendDataPoint({ weight: undefined })]
      vi.mocked(api.get).mockResolvedValue(mockData)

      const result = await getWeightTrend('pet-001', 3)

      expect(result).toEqual([])
    })

    it('should fallback to checkin data when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const mockCheckins = [
        makeCheckinEntry({ createdAt: new Date('2024-01-01T00:00:00.000Z'), weight: 10 }),
        makeCheckinEntry({ id: 'checkin_002', createdAt: new Date('2024-01-02T00:00:00.000Z'), weight: 11 }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(mockCheckins)

      const result = await getWeightTrend('pet-001', 3)

      expect(result).toHaveLength(2)
      expect(result[0].weight).toBe(10)
      expect(result[1].weight).toBe(11)
    })
  })

  describe('getAppetiteTrend', () => {
    it('should return only data points with appetite', async () => {
      const mockData = [
        makeTrendDataPoint({ appetite: 'normal' }),
        makeTrendDataPoint({ date: '2024-01-02', appetite: undefined }),
        makeTrendDataPoint({ date: '2024-01-03', appetite: 'decreased' }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockData)

      const result = await getAppetiteTrend('pet-001', 3)

      expect(result).toHaveLength(2)
      expect(result[0].appetite).toBe('normal')
      expect(result[1].appetite).toBe('decreased')
    })

    it('should return empty array when no appetite data', async () => {
      const mockData = [makeTrendDataPoint({ appetite: undefined })]
      vi.mocked(api.get).mockResolvedValue(mockData)

      const result = await getAppetiteTrend('pet-001', 3)

      expect(result).toEqual([])
    })

    it('should fallback to checkin data when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const mockCheckins = [
        makeCheckinEntry({ createdAt: new Date('2024-01-01T00:00:00.000Z'), appetiteLevel: 3 }),
        makeCheckinEntry({ id: 'checkin_002', createdAt: new Date('2024-01-02T00:00:00.000Z'), appetiteLevel: 2 }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(mockCheckins)

      const result = await getAppetiteTrend('pet-001', 3)

      expect(result).toHaveLength(2)
      expect(result[0].appetite).toBe('normal')
      expect(result[1].appetite).toBe('decreased')
    })
  })

  describe('getStoolTrend', () => {
    it('should return only data points with stool', async () => {
      const mockData = [
        makeTrendDataPoint({ stool: 'normal' }),
        makeTrendDataPoint({ date: '2024-01-02', stool: undefined }),
        makeTrendDataPoint({ date: '2024-01-03', stool: 'soft' }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockData)

      const result = await getStoolTrend('pet-001', 3)

      expect(result).toHaveLength(2)
      expect(result[0].stool).toBe('normal')
      expect(result[1].stool).toBe('soft')
    })

    it('should return empty array when no stool data', async () => {
      const mockData = [makeTrendDataPoint({ stool: undefined })]
      vi.mocked(api.get).mockResolvedValue(mockData)

      const result = await getStoolTrend('pet-001', 3)

      expect(result).toEqual([])
    })

    it('should fallback to checkin data when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const mockCheckins = [
        makeCheckinEntry({ createdAt: new Date('2024-01-01T00:00:00.000Z'), poopLevel: 3 }),
        makeCheckinEntry({ id: 'checkin_002', createdAt: new Date('2024-01-02T00:00:00.000Z'), poopLevel: 4 }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(mockCheckins)

      const result = await getStoolTrend('pet-001', 3)

      expect(result).toHaveLength(2)
      expect(result[0].stool).toBe('normal')
      expect(result[1].stool).toBe('soft')
    })
  })

  describe('getAbnormalDays', () => {
    it('should return only abnormal data points', async () => {
      const mockData = [
        makeTrendDataPoint({ hasAbnormal: false }),
        makeTrendDataPoint({ date: '2024-01-02', hasAbnormal: true, riskLevel: 'high' }),
        makeTrendDataPoint({ date: '2024-01-03', hasAbnormal: true, riskLevel: 'emergency' }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockData)

      const result = await getAbnormalDays('pet-001', '2024-01-01', '2024-01-31')

      expect(result).toHaveLength(2)
      expect(result[0].hasAbnormal).toBe(true)
      expect(result[1].hasAbnormal).toBe(true)
    })

    it('should return empty array when no abnormal days', async () => {
      const mockData = [
        makeTrendDataPoint({ hasAbnormal: false }),
        makeTrendDataPoint({ date: '2024-01-02', hasAbnormal: false }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockData)

      const result = await getAbnormalDays('pet-001', '2024-01-01', '2024-01-31')

      expect(result).toEqual([])
    })
  })

  describe('AI analysis rules', () => {
    it('should detect weight increase > 20% as concern', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const checkins = [
        makeCheckinEntry({ createdAt: new Date('2024-01-01T00:00:00.000Z'), weight: 10 }),
        makeCheckinEntry({ id: 'checkin_002', createdAt: new Date('2024-01-30T00:00:00.000Z'), weight: 13 }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(checkins)

      const result = await getTrendSummary('pet-001', 'month')

      expect(result.weightTrend).toBe('increasing')
      expect(result.weightChangePercent).toBe(30)
      expect(result.aiAnalysis).toContain('增幅较大')
    })

    it('should detect weight decrease > 20% as concern', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const checkins = [
        makeCheckinEntry({ createdAt: new Date('2024-01-01T00:00:00.000Z'), weight: 10 }),
        makeCheckinEntry({ id: 'checkin_002', createdAt: new Date('2024-01-30T00:00:00.000Z'), weight: 7 }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(checkins)

      const result = await getTrendSummary('pet-001', 'month')

      expect(result.weightTrend).toBe('decreasing')
      expect(result.weightChangePercent).toBe(-30)
      expect(result.aiAnalysis).toContain('降幅较大')
    })

    it('should detect bloody stool as emergency', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const checkins = [
        makeCheckinEntry({ createdAt: new Date('2024-01-01T00:00:00.000Z'), poopLevel: 1, riskLevel: 'emergency' }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(checkins)

      const result = await getTrendSummary('pet-001', 'month')

      expect(result.stoolStats['bloody']).toBe(1)
      expect(result.aiAnalysis).toContain('便血')
      expect(result.aiAnalysis).toContain('紧急信号')
    })

    it('should detect consecutive appetite loss', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const checkins = [
        makeCheckinEntry({ id: 'c1', createdAt: new Date('2024-01-01T00:00:00.000Z'), appetiteLevel: 1, riskLevel: 'high' }),
        makeCheckinEntry({ id: 'c2', createdAt: new Date('2024-01-02T00:00:00.000Z'), appetiteLevel: 1, riskLevel: 'high' }),
        makeCheckinEntry({ id: 'c3', createdAt: new Date('2024-01-03T00:00:00.000Z'), appetiteLevel: 1, riskLevel: 'high' }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(checkins)

      const result = await getTrendSummary('pet-001', 'month')

      expect(result.aiAnalysis).toContain('连续3天以上完全不吃东西')
    })

    it('should handle empty data gracefully', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      mockGetCheckinsByDateRange.mockResolvedValue([])

      const result = await getTrendSummary('pet-001', 'month')

      expect(result.totalDays).toBe(0)
      expect(result.aiAnalysis).toContain('暂无足够数据')
    })

    it('should handle single data point', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const checkins = [makeCheckinEntry()]
      mockGetCheckinsByDateRange.mockResolvedValue(checkins)

      const result = await getTrendSummary('pet-001', 'month')

      expect(result.totalDays).toBe(1)
      expect(result.weightTrend).toBe('stable')
      expect(result.weightChange).toBe(0)
    })

    it('should detect abnormal ratio > 30%', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const checkins = [
        makeCheckinEntry({ id: 'c1', createdAt: new Date('2024-01-01T00:00:00.000Z'), riskLevel: 'low' }),
        makeCheckinEntry({ id: 'c2', createdAt: new Date('2024-01-02T00:00:00.000Z'), riskLevel: 'low' }),
        makeCheckinEntry({ id: 'c3', createdAt: new Date('2024-01-03T00:00:00.000Z'), riskLevel: 'low' }),
        makeCheckinEntry({ id: 'c4', createdAt: new Date('2024-01-04T00:00:00.000Z'), appetiteLevel: 1, riskLevel: 'high' }),
        makeCheckinEntry({ id: 'c5', createdAt: new Date('2024-01-05T00:00:00.000Z'), poopLevel: 1, riskLevel: 'high' }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(checkins)

      const result = await getTrendSummary('pet-001', 'month')

      expect(result.abnormalDays).toBe(2)
      expect(result.aiAnalysis).toContain('异常天数占比较高')
    })
  })

  describe('monthly report generation', () => {
    it('should generate highlights for healthy pet', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const checkins = Array.from({ length: 10 }, (_, i) =>
        makeCheckinEntry({
          id: `c${i}`,
          createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`),
        })
      )
      mockGetCheckinsByDateRange.mockResolvedValue(checkins)

      const result = await getMonthlyReport('pet-001', '2024-01')

      expect(result.highlights).toContain('体重保持稳定')
      expect(result.highlights).toContain('食欲整体良好')
      expect(result.highlights).toContain('排便情况正常')
      expect(result.highlights).toContain('整体健康状况优秀')
    })

    it('should generate concerns for unhealthy pet', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const checkins = [
        makeCheckinEntry({ id: 'c1', createdAt: new Date('2024-01-01T00:00:00.000Z'), weight: 10 }),
        makeCheckinEntry({ id: 'c2', createdAt: new Date('2024-01-30T00:00:00.000Z'), weight: 13 }),
        makeCheckinEntry({ id: 'c3', createdAt: new Date('2024-01-15T00:00:00.000Z'), appetiteLevel: 1, riskLevel: 'high' }),
        makeCheckinEntry({ id: 'c4', createdAt: new Date('2024-01-20T00:00:00.000Z'), poopLevel: 1, riskLevel: 'emergency' }),
      ]
      mockGetCheckinsByDateRange.mockResolvedValue(checkins)

      const result = await getMonthlyReport('pet-001', '2024-01')

      expect(result.concerns.length).toBeGreaterThan(0)
      expect(result.concerns.some((c) => c.includes('便血'))).toBe(true)
      expect(result.recommendations.some((r) => r.includes('便血'))).toBe(true)
    })

    it('should recommend more data when data is sparse', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      const checkins = [makeCheckinEntry()]
      mockGetCheckinsByDateRange.mockResolvedValue(checkins)

      const result = await getMonthlyReport('pet-001', '2024-01')

      expect(result.recommendations.some((r) => r.includes('数据量较少'))).toBe(true)
    })
  })
})