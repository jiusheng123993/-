/**
 * 周报服务
 *
 * 生成宠物健康周报，汇总一周健康数据
 * 优先从后端 API 获取真实数据，模板生成作为降级兜底
 */
import { api } from './api'
import type { PetProfile } from './petService'
import type { PetMoment } from '../types/familyTypes'

interface WeeklyReportData {
  petName: string
  species: string
  breed?: string
  score: number
  scoreTrend: 'up' | 'down' | 'stable'
  checkinDays: number
  anomalyDays: number
  streak: number
  recentMoments: PetMoment[]
}

interface WeeklyReport {
  title: string
  summary: string
  highlights: string[]
  concerns: string[]
  suggestions: string[]
  overallMood: 'excellent' | 'good' | 'fair' | 'concerning'
}

const POSITIVE_ADJECTIVES = ['出色', '优秀', '很棒', '稳定', '良好', '不错']
const CONCERNING_ADJECTIVES = ['需要关注', '有些波动', '略有下滑', '需要注意']
const SPECIES_LABELS: Record<string, string> = { cat: '猫咪', dog: '狗狗' }

function getOverallMood(score: number, anomalyDays: number): WeeklyReport['overallMood'] {
  if (score >= 90 && anomalyDays === 0) return 'excellent'
  if (score >= 80 && anomalyDays <= 1) return 'good'
  if (score >= 65 && anomalyDays <= 3) return 'fair'
  return 'concerning'
}

function getMoodEmoji(mood: WeeklyReport['overallMood']): string {
  switch (mood) {
    case 'excellent': return '🌟'
    case 'good': return '😊'
    case 'fair': return '🤔'
    case 'concerning': return '💊'
  }
}

function getMoodLabel(mood: WeeklyReport['overallMood']): string {
  switch (mood) {
    case 'excellent': return '状态出色'
    case 'good': return '状态良好'
    case 'fair': return '需要关注'
    case 'concerning': return '建议调整'
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getSummaryByMood(mood: WeeklyReport['overallMood'], name: string, score: number): string {
  const speciesWord = '毛孩子'
  switch (mood) {
    case 'excellent':
      return pickRandom([
        `${name}这周${speciesWord}状态特别棒！健康分${score}分，所有指标都保持在理想水平。`,
        `太棒了！${name}这周表现得非常出色，健康分${score}分，继续加油！`,
        `${name}这周活力满满，健康分${score}分，看得出你的用心照顾有了回报。`,
      ])
    case 'good':
      return pickRandom([
        `${name}这周整体状态不错，健康分${score}分。有个别小波动但整体稳定。`,
        `${name}这周表现良好，健康分${score}分，继续保持这个节奏就很好。`,
        `${name}这周健康分${score}分，基本稳定，没有什么大问题。`,
      ])
    case 'fair':
      return pickRandom([
        `${name}这周健康分${score}分，有些指标出现了波动，建议多加观察。`,
        `${name}这周状态有些起伏，健康分${score}分，可能需要注意几个方面。`,
        `${name}这周不算太理想，健康分${score}分，有几个地方需要调整。`,
      ])
    case 'concerning':
      return pickRandom([
        `${name}这周健康分只有${score}分，出现了多次异常，建议重点关注。`,
        `${name}这周状态不太好，健康分${score}分，有${speciesWord}需要你的特别关注。`,
        `${name}这周波动较大，健康分${score}分，建议认真看看下面的提醒。`,
      ])
  }
}

function getHighlights(data: WeeklyReportData, mood: WeeklyReport['overallMood']): string[] {
  const highlights: string[] = []
  const speciesWord = SPECIES_LABELS[data.species] || '宠物'

  if (data.checkinDays >= 6) {
    highlights.push(`${data.petName}本周坚持了${data.checkinDays}天打卡，养成好习惯！`)
  }

  if (data.streak >= 7) {
    highlights.push(`连续${data.streak}天健康打卡，毅力满分！`)
  } else if (data.streak >= 3) {
    highlights.push(`已连续打卡${data.streak}天，离7天小目标越来越近了。`)
  }

  if (mood === 'excellent' || mood === 'good') {
    if (data.score >= 85) {
      highlights.push(`健康分${data.score}分，在同品种${speciesWord}中表现优异。`)
    }
  }

  if (data.anomalyDays === 0) {
    highlights.push(`本周无任何异常指标，${speciesWord}非常健康。`)
  }

  const milestoneMoments = data.recentMoments.filter(m => m.type === 'milestone')
  if (milestoneMoments.length > 0) {
    highlights.push(`本周有${milestoneMoments.length}个值得纪念的时刻。`)
  }

  if (highlights.length === 0) {
    highlights.push(`${data.petName}这周按时打卡，我们在一起。`)
  }

  return highlights
}

function getConcerns(data: WeeklyReportData, mood: WeeklyReport['overallMood']): string[] {
  const concerns: string[] = []
  const speciesWord = SPECIES_LABELS[data.species] || '宠物'

  if (data.checkinDays < 3) {
    concerns.push(`本周仅打卡${data.checkinDays}天，建议增加打卡频率，以便及时发现健康变化。`)
  }

  if (data.anomalyDays >= 3) {
    concerns.push(`本周有${data.anomalyDays}天出现异常指标，建议回顾一下近期饮食和环境变化。`)
  } else if (data.anomalyDays >= 1) {
    concerns.push(`本周出现${data.anomalyDays}次异常指标，持续观察后续变化。`)
  }

  if (data.scoreTrend === 'down') {
    concerns.push(`健康分呈下降趋势，从近期数据看需要关注${speciesWord}的整体状态。`)
  }

  if (mood === 'concerning') {
    concerns.push(`多项指标不理想，建议近期带${speciesWord}做一次健康检查。`)
  }

  if (concerns.length === 0 && mood !== 'excellent') {
    concerns.push('整体状态尚可，但还有提升空间。')
  }

  return concerns
}

function getSuggestions(data: WeeklyReportData, mood: WeeklyReport['overallMood']): string[] {
  const suggestions: string[] = []
  const speciesWord = SPECIES_LABELS[data.species] || '宠物'

  if (data.checkinDays < 5) {
    suggestions.push('建议每天坚持打卡，3秒就能完成，帮助追踪健康变化。')
  }

  if (data.anomalyDays >= 2) {
    suggestions.push('出现多次异常时，建议记录异常发生的时间和环境，方便后续分析。')
  }

  if (data.score < 75) {
    suggestions.push('可以尝试调整饮食或增加运动量，看看下周能否改善。')
  }

  if (data.streak < 3) {
    suggestions.push('坚持连续打卡7天有特别成就哦，从今天开始吧！')
  }

  if (suggestions.length === 0) {
    suggestions.push(`继续保持当前节奏，${data.petName}的每一天都值得被记录。`)
    suggestions.push('下周可以尝试给毛孩子换换新玩具或新食谱，增加新鲜感。')
  }

  return suggestions
}

function getSummaryForAllPets(reports: WeeklyReport[], petCount: number): string {
  const excellentCount = reports.filter(r => r.overallMood === 'excellent').length
  const goodCount = reports.filter(r => r.overallMood === 'good').length
  const fairCount = reports.filter(r => r.overallMood === 'fair').length
  const concerningCount = reports.filter(r => r.overallMood === 'concerning').length

  if (petCount === 1) return reports[0]?.summary || ''

  if (concerningCount > 0) {
    return `本周家庭有${concerningCount}只毛孩子需要特别关注，其他成员状态稳定。`
  }

  if (excellentCount === petCount) {
    return `本周全家人状态都超级棒！${petCount}只毛孩子健康分都在优秀线以上。`
  }

  if (excellentCount + goodCount === petCount) {
    return `本周家庭整体状态良好，${petCount}只毛孩子都在健康轨道上。`
  }

  return `本周家庭健康状态总体平稳，${excellentCount}只出色、${goodCount}只良好、${fairCount}只需关注。`
}

export function generateWeeklyReport(data: WeeklyReportData): WeeklyReport {
  const mood = getOverallMood(data.score, data.anomalyDays)
  const summary = getSummaryByMood(mood, data.petName, data.score)
  const highlights = getHighlights(data, mood)
  const concerns = getConcerns(data, mood)
  const suggestions = getSuggestions(data, mood)

  return {
    title: `${data.petName}的周健康报告`,
    summary,
    highlights,
    concerns,
    suggestions,
    overallMood: mood,
  }
}

export function generateFamilyWeeklySummary(
  reports: WeeklyReport[],
  petCount: number,
): {
  summary: string
  overallMood: WeeklyReport['overallMood']
  highlights: string[]
  concerns: string[]
} {
  const summary = getSummaryForAllPets(reports, petCount)

  const moods = reports.map(r => r.overallMood)
  let overallMood: WeeklyReport['overallMood'] = 'good'
  if (moods.some(m => m === 'concerning')) overallMood = 'concerning'
  else if (moods.some(m => m === 'fair')) overallMood = 'fair'
  else if (moods.every(m => m === 'excellent')) overallMood = 'excellent'

  const highlights: string[] = []
  const concerns: string[] = []

  for (const report of reports) {
    if (report.overallMood === 'excellent') {
      highlights.push(...report.highlights.slice(0, 1))
    }
    if (report.overallMood === 'concerning') {
      concerns.push(...report.concerns.slice(0, 1))
    }
  }

  if (highlights.length === 0 && reports.length > 0) {
    highlights.push(reports[0].highlights[0] || '本周家庭健康记录已生成。')
  }

  return { summary, overallMood, highlights, concerns }
}

export { getMoodEmoji, getMoodLabel, getOverallMood }
export type { WeeklyReport, WeeklyReportData }

// ==================== 后端 API 调用 ====================

/** 后端返回的周报数据结构 */
export interface BackendWeeklyReport {
  id: string
  familyId: string
  weekStart: string
  weekEnd: string
  totalPets: number
  healthyPets: number
  overallMood: 'excellent' | 'good' | 'fair' | 'concerning'
  summary: string
  highlights: string[]
  concerns: string[]
  petReports: Array<{
    petId: string
    petName: string
    species: string
    breed: string | null
    checkinDays: number
    anomalyDays: number
    streak: number
    score: number
    scoreTrend: 'up' | 'down' | 'stable'
    mood: string
    summary: string
  }>
  aiInsight: string | null
  shareCardUrl: string | null
  createdAt: string
}

/** 获取最新周报 */
export async function getLatestWeeklyReport(familyId: string): Promise<BackendWeeklyReport | null> {
  try {
    const res = await api.get<{ success: boolean; data: BackendWeeklyReport }>(
      `/api/families/${familyId}/weekly-reports/latest`
    )
    return res.data
  } catch {
    return null
  }
}

/** 手动生成周报 */
export async function generateWeeklyReportRequest(familyId: string): Promise<BackendWeeklyReport | null> {
  try {
    const res = await api.post<{ success: boolean; data: BackendWeeklyReport }>(
      `/api/families/${familyId}/weekly-reports/generate`
    )
    return res.data
  } catch {
    return null
  }
}

/** 获取周报列表 */
export async function getWeeklyReportList(
  familyId: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<{ items: BackendWeeklyReport[]; total: number }> {
  try {
    const res = await api.get<{ success: boolean; data: { items: BackendWeeklyReport[]; total: number; page: number; pageSize: number } }>(
      `/api/families/${familyId}/weekly-reports`,
      { page: String(page), page_size: String(pageSize) }
    )
    return { items: res.data.items || [], total: res.data.total || 0 }
  } catch {
    return { items: [], total: 0 }
  }
}