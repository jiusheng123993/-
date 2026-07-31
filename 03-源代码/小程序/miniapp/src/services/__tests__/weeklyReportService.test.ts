/**
 * 周报服务测试
 */
import { describe, it, expect } from 'vitest'
import {
  generateWeeklyReport,
  generateFamilyWeeklySummary,
  getMoodEmoji,
  getMoodLabel,
  getOverallMood,
} from '../weeklyReportService'
import type { WeeklyReport, WeeklyReportData } from '../weeklyReportService'

function makeReportData(overrides: Partial<WeeklyReportData> = {}): WeeklyReportData {
  return {
    petName: '小咪',
    species: 'cat',
    breed: '英短',
    score: 85,
    scoreTrend: 'stable',
    checkinDays: 7,
    anomalyDays: 0,
    streak: 7,
    recentMoments: [],
    ...overrides,
  }
}

function makeReport(overrides: Partial<WeeklyReport> = {}): WeeklyReport {
  return {
    title: '小咪的周健康报告',
    summary: '小咪这周整体状态不错，健康分85分。有个别小波动但整体稳定。',
    highlights: ['小咪本周坚持了7天打卡，养成好习惯！'],
    concerns: [],
    suggestions: ['继续保持当前节奏，小咪的每一天都值得被记录。'],
    overallMood: 'good',
    ...overrides,
  }
}

describe('weeklyReportService', () => {
  describe('getMoodEmoji', () => {
    it('returns 🌟 for excellent', () => {
      expect(getMoodEmoji('excellent')).toBe('🌟')
    })

    it('returns 😊 for good', () => {
      expect(getMoodEmoji('good')).toBe('😊')
    })

    it('returns 🤔 for fair', () => {
      expect(getMoodEmoji('fair')).toBe('🤔')
    })

    it('returns 💊 for concerning', () => {
      expect(getMoodEmoji('concerning')).toBe('💊')
    })
  })

  describe('getMoodLabel', () => {
    it('returns 状态出色 for excellent', () => {
      expect(getMoodLabel('excellent')).toBe('状态出色')
    })

    it('returns 状态良好 for good', () => {
      expect(getMoodLabel('good')).toBe('状态良好')
    })

    it('returns 需要关注 for fair', () => {
      expect(getMoodLabel('fair')).toBe('需要关注')
    })

    it('returns 建议调整 for concerning', () => {
      expect(getMoodLabel('concerning')).toBe('建议调整')
    })
  })

  describe('getOverallMood', () => {
    it('returns excellent when score >= 90 and anomalyDays === 0', () => {
      expect(getOverallMood(90, 0)).toBe('excellent')
      expect(getOverallMood(95, 0)).toBe('excellent')
    })

    it('returns good when score >= 80 and anomalyDays <= 1', () => {
      expect(getOverallMood(80, 0)).toBe('good')
      expect(getOverallMood(85, 1)).toBe('good')
    })

    it('returns fair when score >= 65 and anomalyDays <= 3', () => {
      expect(getOverallMood(65, 0)).toBe('fair')
      expect(getOverallMood(75, 3)).toBe('fair')
    })

    it('returns concerning when score < 65', () => {
      expect(getOverallMood(64, 0)).toBe('concerning')
      expect(getOverallMood(50, 0)).toBe('concerning')
    })

    it('returns concerning when anomalyDays > 3 even with good score', () => {
      expect(getOverallMood(90, 4)).toBe('concerning')
      expect(getOverallMood(85, 5)).toBe('concerning')
    })
  })

  describe('generateWeeklyReport', () => {
    it('returns report with correct title format', () => {
      const report = generateWeeklyReport(makeReportData({ petName: '小咪' }))
      expect(report.title).toBe('小咪的周健康报告')
    })

    it('returns correct overallMood based on score and anomalyDays', () => {
      const excellent = generateWeeklyReport(makeReportData({ score: 90, anomalyDays: 0 }))
      expect(excellent.overallMood).toBe('excellent')

      const good = generateWeeklyReport(makeReportData({ score: 85, anomalyDays: 0 }))
      expect(good.overallMood).toBe('good')

      const fair = generateWeeklyReport(makeReportData({ score: 70, anomalyDays: 2 }))
      expect(fair.overallMood).toBe('fair')

      const concerning = generateWeeklyReport(makeReportData({ score: 60, anomalyDays: 0 }))
      expect(concerning.overallMood).toBe('concerning')
    })

    it('includes highlights when checkinDays >= 6', () => {
      const report = generateWeeklyReport(makeReportData({ checkinDays: 6, streak: 0 }))
      expect(report.highlights.length).toBeGreaterThan(0)
      expect(report.highlights.some(h => h.includes('6天打卡'))).toBe(true)
    })

    it('includes streak highlight when streak >= 7', () => {
      const report = generateWeeklyReport(makeReportData({ streak: 7, checkinDays: 4 }))
      expect(report.highlights.some(h => h.includes('连续') && h.includes('7'))).toBe(true)
    })

    it('includes streak highlight when streak >= 3', () => {
      const report = generateWeeklyReport(makeReportData({ streak: 3, checkinDays: 4 }))
      expect(report.highlights.some(h => h.includes('连续') && h.includes('3'))).toBe(true)
    })

    it('includes concern when checkinDays < 3', () => {
      const report = generateWeeklyReport(makeReportData({ checkinDays: 2, score: 80, anomalyDays: 0 }))
      expect(report.concerns.some(c => c.includes('2天'))).toBe(true)
    })

    it('includes concern when anomalyDays >= 3', () => {
      const report = generateWeeklyReport(makeReportData({ anomalyDays: 3, score: 80 }))
      expect(report.concerns.some(c => c.includes('3天'))).toBe(true)
    })

    it('includes concern when anomalyDays >= 1', () => {
      const report = generateWeeklyReport(makeReportData({ anomalyDays: 1, score: 80, checkinDays: 5 }))
      expect(report.concerns.some(c => c.includes('1次'))).toBe(true)
    })

    it('includes concern when scoreTrend is down', () => {
      const report = generateWeeklyReport(makeReportData({ scoreTrend: 'down', score: 80, anomalyDays: 0, checkinDays: 5 }))
      expect(report.concerns.some(c => c.includes('下降'))).toBe(true)
    })

    it('includes suggestion when checkinDays < 5', () => {
      const report = generateWeeklyReport(makeReportData({ checkinDays: 4, score: 80, anomalyDays: 0, streak: 5 }))
      expect(report.suggestions.some(s => s.includes('打卡'))).toBe(true)
    })

    it('includes suggestion when anomalyDays >= 2', () => {
      const report = generateWeeklyReport(makeReportData({ anomalyDays: 2, checkinDays: 7, score: 85, streak: 7 }))
      expect(report.suggestions.some(s => s.includes('异常'))).toBe(true)
    })

    it('includes suggestion when score < 75', () => {
      const report = generateWeeklyReport(makeReportData({ score: 70, checkinDays: 7, anomalyDays: 0, streak: 7 }))
      expect(report.suggestions.some(s => s.includes('饮食'))).toBe(true)
    })

    it('includes suggestion when streak < 3', () => {
      const report = generateWeeklyReport(makeReportData({ streak: 2, checkinDays: 7, score: 85, anomalyDays: 0 }))
      expect(report.suggestions.some(s => s.includes('连续打卡'))).toBe(true)
    })

    it('has default suggestions when no issues', () => {
      const report = generateWeeklyReport(makeReportData({ checkinDays: 7, anomalyDays: 0, score: 85, streak: 7 }))
      expect(report.suggestions.length).toBeGreaterThanOrEqual(2)
      expect(report.suggestions.some(s => s.includes('保持'))).toBe(true)
    })

    it('has default highlights when no highlights detected', () => {
      const report = generateWeeklyReport(makeReportData({
        checkinDays: 4,
        streak: 0,
        anomalyDays: 1,
        score: 70,
      }))
      expect(report.highlights.length).toBeGreaterThan(0)
    })

    it('has default concern when mood is not excellent and no concerns', () => {
      const report = generateWeeklyReport(makeReportData({
        checkinDays: 5,
        anomalyDays: 0,
        score: 82,
        scoreTrend: 'stable',
        streak: 0,
      }))
      // mood is 'good', and no specific concerns triggered, so fallback concern should appear
      expect(report.concerns.length).toBeGreaterThan(0)
    })

    it('generates summary that contains pet name and score', () => {
      const report = generateWeeklyReport(makeReportData({ petName: '小咪', score: 85 }))
      expect(report.summary).toContain('小咪')
      expect(report.summary).toContain('85')
    })
  })

  describe('generateFamilyWeeklySummary', () => {
    it('returns overallMood excellent when all pets are excellent', () => {
      const reports = [
        makeReport({ overallMood: 'excellent', title: 'pet1', summary: 'pet1 summary' }),
        makeReport({ overallMood: 'excellent', title: 'pet2', summary: 'pet2 summary' }),
      ]
      const result = generateFamilyWeeklySummary(reports, 2)
      expect(result.overallMood).toBe('excellent')
    })

    it('returns overallMood concerning when any pet is concerning', () => {
      const reports = [
        makeReport({ overallMood: 'excellent', title: 'pet1', summary: 'pet1 summary' }),
        makeReport({ overallMood: 'concerning', title: 'pet2', summary: 'pet2 summary' }),
      ]
      const result = generateFamilyWeeklySummary(reports, 2)
      expect(result.overallMood).toBe('concerning')
    })

    it('returns overallMood fair when any pet is fair (and none concerning)', () => {
      const reports = [
        makeReport({ overallMood: 'good', title: 'pet1', summary: 'pet1 summary' }),
        makeReport({ overallMood: 'fair', title: 'pet2', summary: 'pet2 summary' }),
      ]
      const result = generateFamilyWeeklySummary(reports, 2)
      expect(result.overallMood).toBe('fair')
    })

    it('returns overallMood good when all are good', () => {
      const reports = [
        makeReport({ overallMood: 'good', title: 'pet1', summary: 'pet1 summary' }),
        makeReport({ overallMood: 'good', title: 'pet2', summary: 'pet2 summary' }),
      ]
      const result = generateFamilyWeeklySummary(reports, 2)
      expect(result.overallMood).toBe('good')
    })

    it('returns correct summary for 1 pet', () => {
      const reports = [
        makeReport({ summary: '小咪这周状态不错', overallMood: 'good' }),
      ]
      const result = generateFamilyWeeklySummary(reports, 1)
      expect(result.summary).toBe('小咪这周状态不错')
    })

    it('returns concerning summary when concerningCount > 0', () => {
      const reports = [
        makeReport({ overallMood: 'excellent', summary: 'summary1' }),
        makeReport({ overallMood: 'concerning', summary: 'summary2' }),
      ]
      const result = generateFamilyWeeklySummary(reports, 2)
      expect(result.summary).toContain('特别关注')
    })

    it('returns excellent summary when all are excellent', () => {
      const reports = [
        makeReport({ overallMood: 'excellent', summary: 'summary1' }),
        makeReport({ overallMood: 'excellent', summary: 'summary2' }),
      ]
      const result = generateFamilyWeeklySummary(reports, 2)
      expect(result.summary).toContain('超级棒')
    })

    it('returns good summary when all are excellent or good', () => {
      const reports = [
        makeReport({ overallMood: 'excellent', summary: 'summary1' }),
        makeReport({ overallMood: 'good', summary: 'summary2' }),
      ]
      const result = generateFamilyWeeklySummary(reports, 2)
      expect(result.summary).toContain('良好')
    })

    it('includes highlights from excellent pets', () => {
      const reports = [
        makeReport({
          overallMood: 'excellent',
          highlights: ['亮点A', '亮点B'],
        }),
        makeReport({
          overallMood: 'good',
          highlights: ['亮点C'],
        }),
      ]
      const result = generateFamilyWeeklySummary(reports, 2)
      expect(result.highlights.length).toBeGreaterThan(0)
      expect(result.highlights).toContain('亮点A')
    })

    it('includes concerns from concerning pets', () => {
      const reports = [
        makeReport({
          overallMood: 'concerning',
          concerns: ['问题X', '问题Y'],
        }),
        makeReport({
          overallMood: 'good',
          concerns: [],
        }),
      ]
      const result = generateFamilyWeeklySummary(reports, 2)
      expect(result.concerns.length).toBeGreaterThan(0)
      expect(result.concerns).toContain('问题X')
    })

    it('has fallback highlight when no highlights', () => {
      const reports = [
        makeReport({
          overallMood: 'good',
          highlights: ['唯一的亮点'],
          concerns: [],
        }),
      ]
      const result = generateFamilyWeeklySummary(reports, 1)
      // When no excellent pets, highlights should have fallback
      expect(result.highlights.length).toBeGreaterThan(0)
    })
  })
})