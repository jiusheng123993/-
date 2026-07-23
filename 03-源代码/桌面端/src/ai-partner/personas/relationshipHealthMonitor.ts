import type { SafetyIncidentLog } from './safetyIncidentLog'
import type { PersonaScheduleStorage } from './personaScheduleStore'
import type { PersonaScheduler } from './personaScheduler'

export type HealthDimension = 'interaction_frequency' | 'dialogue_depth' | 'dependency_level' | 'emotional_impact'

export interface HealthDimensionScore {
  dimension: HealthDimension
  score: number
  label: string
  detail: string
}

export interface HealthAssessment {
  overallScore: number
  dimensions: HealthDimensionScore[]
  level: 'healthy' | 'moderate' | 'warning' | 'critical'
  warnings: string[]
  recommendations: string[]
  assessedAt: string
}

export interface ConversationMetrics {
  userId: string
  dailyMinutes: number
  weeklyMinutes: number
  monthlyMinutes: number
  consecutiveDays: number
  averageSessionMinutes: number
  lateNightSessions: number
  emotionalKeywords: string[]
  dependencyKeywords: string[]
  crisisKeywords: string[]
}

export interface RelationshipHealthMonitor {
  assess(userId: string, metrics: ConversationMetrics): HealthAssessment
  checkCrisis(userId: string, content: string): CrisisCheckResult
  getRecommendations(assessment: HealthAssessment): string[]
  shouldSuggestPersonaSwitch(assessment: HealthAssessment): boolean
}

export interface CrisisCheckResult {
  isCrisis: boolean
  level: 'none' | 'concern' | 'crisis'
  keywords: string[]
  recommendedAction: string
}

const HEALTHY_THRESHOLD = 80
const MODERATE_THRESHOLD = 60
const WARNING_THRESHOLD = 40
const CRITICAL_THRESHOLD = 25

const DAILY_HEALTHY_MAX = 120
const DAILY_WARNING_MAX = 180
const WEEKLY_HEALTHY_MAX = 600
const MONTHLY_HEALTHY_MAX = 2400
const CONSECUTIVE_DAYS_HEALTHY = 14
const CONSECUTIVE_DAYS_WARNING = 30
const LATE_NIGHT_THRESHOLD = 5

const EMOTIONAL_KEYWORDS = [
  '孤独', '寂寞', '难过', '伤心', '焦虑', '害怕', '无助',
  '只有你', '离不开', '没有你', '需要你', '想你', '依赖'
]

const DEPENDENCY_KEYWORDS = [
  '只有你懂我', '离开你我会', '没有你我怎么办', '你是唯一',
  '我不能没有你', '你是我唯一的', '只和你说', '只相信你',
  '除了你没人', '只有你能'
]

const CRISIS_KEYWORDS = [
  '自杀', '自残', '不想活', '想死', '结束生命', '活不下去',
  '伤害自己', '割腕', '跳楼', '安眠药', '了结',
  '没有意义', '绝望', '崩溃', '撑不下去'
]

const CRISIS_RESPONSE = `我注意到你现在可能正在经历非常困难的时刻。请记住，你并不孤单。

如果你有伤害自己的想法，请立即联系以下资源：
- 全国心理援助热线：400-161-9995
- 北京心理危机研究与干预中心：010-82951332
- 生命热线：400-821-1215

你的感受很重要，专业的帮助可以让你感觉更好。我在这里陪着你，但请务必寻求专业支持。`

function calculateInteractionFrequency(metrics: ConversationMetrics): HealthDimensionScore {
  const { dailyMinutes, weeklyMinutes, monthlyMinutes, consecutiveDays } = metrics

  let score = 100

  if (dailyMinutes > DAILY_WARNING_MAX) {
    score -= 50
  } else if (dailyMinutes > DAILY_HEALTHY_MAX) {
    score -= 35
  }

  if (weeklyMinutes > WEEKLY_HEALTHY_MAX) {
    score -= 30
  }

  if (monthlyMinutes > MONTHLY_HEALTHY_MAX) {
    score -= 25
  }

  if (consecutiveDays > CONSECUTIVE_DAYS_WARNING) {
    score -= 40
  } else if (consecutiveDays > CONSECUTIVE_DAYS_HEALTHY) {
    score -= 25
  }

  const clampedScore = Math.max(0, Math.min(100, score))

  let detail = `日均 ${dailyMinutes} 分钟`
  if (consecutiveDays > CONSECUTIVE_DAYS_WARNING) {
    detail += `，连续 ${consecutiveDays} 天使用（偏高）`
  } else if (consecutiveDays > CONSECUTIVE_DAYS_HEALTHY) {
    detail += `，连续 ${consecutiveDays} 天使用`
  }

  return {
    dimension: 'interaction_frequency',
    score: clampedScore,
    label: '互动频率',
    detail
  }
}

function calculateDialogueDepth(metrics: ConversationMetrics): HealthDimensionScore {
  const { averageSessionMinutes, emotionalKeywords, dependencyKeywords, dailyMinutes } = metrics

  let score = 100

  if (averageSessionMinutes > 60) {
    score -= 40
  } else if (averageSessionMinutes > 30) {
    score -= 25
  }

  const emotionalCount = emotionalKeywords.length
  if (emotionalCount > 10) {
    score -= 45
  } else if (emotionalCount > 5) {
    score -= 35
  } else if (emotionalCount > 2) {
    score -= 20
  }

  const dependencyCount = dependencyKeywords.length
  if (dependencyCount > 3) {
    score -= 50
  } else if (dependencyCount > 1) {
    score -= 40
  } else if (dependencyCount > 0) {
    score -= 25
  }

  if (dailyMinutes > DAILY_WARNING_MAX) {
    score -= 20
  } else if (dailyMinutes > DAILY_HEALTHY_MAX) {
    score -= 10
  }

  const clampedScore = Math.max(0, Math.min(100, score))

  let detail = `平均会话 ${averageSessionMinutes} 分钟`
  if (dependencyCount > 0) {
    detail += `，检测到 ${dependencyCount} 个依赖关键词`
  }
  if (emotionalCount > 0) {
    detail += `，${emotionalCount} 个情绪关键词`
  }

  return {
    dimension: 'dialogue_depth',
    score: clampedScore,
    label: '对话深度',
    detail
  }
}

function calculateDependencyLevel(metrics: ConversationMetrics): HealthDimensionScore {
  const { dependencyKeywords, consecutiveDays, dailyMinutes } = metrics

  let score = 100

  const dependencyCount = dependencyKeywords.length
  if (dependencyCount > 5) {
    score -= 60
  } else if (dependencyCount > 3) {
    score -= 50
  } else if (dependencyCount > 1) {
    score -= 40
  } else if (dependencyCount > 0) {
    score -= 25
  }

  if (consecutiveDays > CONSECUTIVE_DAYS_WARNING && dailyMinutes > DAILY_HEALTHY_MAX) {
    score -= 35
  } else if (consecutiveDays > CONSECUTIVE_DAYS_HEALTHY) {
    score -= 20
  }

  if (dailyMinutes > DAILY_WARNING_MAX) {
    score -= 30
  } else if (dailyMinutes > DAILY_HEALTHY_MAX) {
    score -= 15
  }

  const clampedScore = Math.max(0, Math.min(100, score))

  let detail = '依赖程度正常'
  if (dependencyCount > 3) {
    detail = `检测到 ${dependencyCount} 个依赖关键词，依赖程度偏高`
  } else if (dependencyCount > 0) {
    detail = `检测到 ${dependencyCount} 个依赖关键词`
  }

  return {
    dimension: 'dependency_level',
    score: clampedScore,
    label: '依赖程度',
    detail
  }
}

function calculateEmotionalImpact(metrics: ConversationMetrics): HealthDimensionScore {
  const { emotionalKeywords, crisisKeywords, lateNightSessions, dailyMinutes, consecutiveDays } = metrics

  let score = 100

  const crisisCount = crisisKeywords.length
  if (crisisCount > 0) {
    score -= 70
  }

  const emotionalCount = emotionalKeywords.length
  if (emotionalCount > 10) {
    score -= 50
  } else if (emotionalCount > 5) {
    score -= 40
  } else if (emotionalCount > 2) {
    score -= 25
  }

  if (lateNightSessions > LATE_NIGHT_THRESHOLD) {
    score -= 30
  }

  if (dailyMinutes > DAILY_WARNING_MAX) {
    score -= 20
  } else if (dailyMinutes > DAILY_HEALTHY_MAX) {
    score -= 10
  }

  if (consecutiveDays > CONSECUTIVE_DAYS_WARNING) {
    score -= 15
  } else if (consecutiveDays > CONSECUTIVE_DAYS_HEALTHY) {
    score -= 5
  }

  const clampedScore = Math.max(0, Math.min(100, score))

  let detail = '情绪状态正常'
  if (crisisCount > 0) {
    detail = `检测到 ${crisisCount} 个危机关键词，需要立即关注`
  } else if (emotionalCount > 5) {
    detail = `检测到 ${emotionalCount} 个情绪关键词，情绪波动较大`
  } else if (emotionalCount > 0) {
    detail = `检测到 ${emotionalCount} 个情绪关键词`
  }

  return {
    dimension: 'emotional_impact',
    score: clampedScore,
    label: '情绪影响',
    detail
  }
}

function determineHealthLevel(overallScore: number): HealthAssessment['level'] {
  if (overallScore >= HEALTHY_THRESHOLD) return 'healthy'
  if (overallScore >= MODERATE_THRESHOLD) return 'moderate'
  if (overallScore >= WARNING_THRESHOLD) return 'warning'
  return 'critical'
}

function generateWarnings(assessment: {
  overallScore: number
  dimensions: HealthDimensionScore[]
}): string[] {
  const warnings: string[] = []

  if (assessment.overallScore < CRITICAL_THRESHOLD) {
    warnings.push('关系健康度处于危险水平，建议立即切换 Persona 或暂停使用')
  } else if (assessment.overallScore < WARNING_THRESHOLD) {
    warnings.push('关系健康度偏低，建议减少使用时长并增加现实社交活动')
  }

  for (const dim of assessment.dimensions) {
    if (dim.score < 20) {
      switch (dim.dimension) {
        case 'interaction_frequency':
          warnings.push('互动频率过高，建议控制每日使用时长在 2 小时以内')
          break
        case 'dialogue_depth':
          warnings.push('对话深度异常，建议增加多样化话题')
          break
        case 'dependency_level':
          warnings.push('检测到情感依赖倾向，建议增加现实社交活动')
          break
        case 'emotional_impact':
          warnings.push('情绪影响较大，建议关注心理健康')
          break
      }
    }
  }

  return warnings
}

function generateRecommendations(assessment: {
  overallScore: number
  dimensions: HealthDimensionScore[]
}): string[] {
  const recommendations: string[] = []

  if (assessment.overallScore < WARNING_THRESHOLD) {
    recommendations.push('建议切换到低情感亲密的 Persona（如学习伙伴、效率教练）')
    recommendations.push('建议设置每日使用时长限制')
    recommendations.push('建议增加现实社交活动，如运动、聚会、户外活动')
  }

  if (assessment.overallScore < MODERATE_THRESHOLD) {
    recommendations.push('今天和我说了不少话，要不要去做点别的？')
    recommendations.push('建议在反思仪式中回顾与 Agent 的互动模式')
  }

  for (const dim of assessment.dimensions) {
    if (dim.dimension === 'dependency_level' && dim.score < 30) {
      recommendations.push('检测到情感依赖关键词，系统已自动限制情感类话术')
    }
    if (dim.dimension === 'emotional_impact' && dim.score < 20) {
      recommendations.push('建议联系心理咨询师或拨打心理援助热线')
    }
  }

  return recommendations
}

export function createRelationshipHealthMonitor(
  incidentLog: SafetyIncidentLog,
  scheduleStorage?: PersonaScheduleStorage,
  scheduler?: PersonaScheduler
): RelationshipHealthMonitor {
  return {
    assess(userId: string, metrics: ConversationMetrics): HealthAssessment {
      const dimensions: HealthDimensionScore[] = [
        calculateInteractionFrequency(metrics),
        calculateDialogueDepth(metrics),
        calculateDependencyLevel(metrics),
        calculateEmotionalImpact(metrics)
      ]

      const overallScore = Math.round(
        dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
      )

      const level = determineHealthLevel(overallScore)
      const warnings = generateWarnings({ overallScore, dimensions })
      const recommendations = generateRecommendations({ overallScore, dimensions })

      if (level === 'warning' || level === 'critical') {
        incidentLog.log({
          userId,
          category: 'system_block',
          severity: level === 'critical' ? 'high' : 'medium',
          description: `关系健康度评估: ${overallScore} 分 (${level})，${warnings.join('；')}`,
          context: {
            overallScore,
            level,
            dimensions: dimensions.map(d => ({
              dimension: d.dimension,
              score: d.score
            })),
            metrics: {
              dailyMinutes: metrics.dailyMinutes,
              consecutiveDays: metrics.consecutiveDays,
              dependencyKeywords: metrics.dependencyKeywords.length,
              crisisKeywords: metrics.crisisKeywords.length
            }
          }
        })
      }

      if (level === 'critical' && scheduler && scheduleStorage) {
        const schedule = scheduleStorage.get(userId)
        if (schedule?.activeCameo) {
          scheduler.endCameo(userId)
          incidentLog.log({
            userId,
            category: 'system_block',
            severity: 'high',
            description: '关系健康度危急，自动结束当前客串 Persona',
            context: { previousCameo: schedule.activeCameo.personaId }
          })
        }
      }

      return {
        overallScore,
        dimensions,
        level,
        warnings,
        recommendations,
        assessedAt: new Date().toISOString()
      }
    },

    checkCrisis(userId: string, content: string): CrisisCheckResult {
      const foundCrisisKeywords: string[] = []
      const foundConcernKeywords: string[] = []

      for (const keyword of CRISIS_KEYWORDS) {
        if (content.includes(keyword)) {
          foundCrisisKeywords.push(keyword)
        }
      }

      for (const keyword of DEPENDENCY_KEYWORDS) {
        if (content.includes(keyword)) {
          foundConcernKeywords.push(keyword)
        }
      }

      if (foundCrisisKeywords.length > 0) {
        incidentLog.log({
          userId,
          category: 'content_violation',
          severity: 'high',
          description: `检测到危机关键词: ${foundCrisisKeywords.join(', ')}`,
          context: {
            keywords: foundCrisisKeywords,
            contentSnippet: content.slice(0, 200)
          }
        })

        return {
          isCrisis: true,
          level: 'crisis',
          keywords: foundCrisisKeywords,
          recommendedAction: CRISIS_RESPONSE
        }
      }

      if (foundConcernKeywords.length > 0) {
        return {
          isCrisis: false,
          level: 'concern',
          keywords: foundConcernKeywords,
          recommendedAction: '检测到情感依赖话术，系统已记录并将在反思仪式中提醒'
        }
      }

      return {
        isCrisis: false,
        level: 'none',
        keywords: [],
        recommendedAction: ''
      }
    },

    getRecommendations(assessment: HealthAssessment): string[] {
      return assessment.recommendations
    },

    shouldSuggestPersonaSwitch(assessment: HealthAssessment): boolean {
      return assessment.overallScore < WARNING_THRESHOLD
    }
  }
}

export {
  EMOTIONAL_KEYWORDS,
  DEPENDENCY_KEYWORDS,
  CRISIS_KEYWORDS,
  CRISIS_RESPONSE,
  HEALTHY_THRESHOLD,
  MODERATE_THRESHOLD,
  WARNING_THRESHOLD,
  CRITICAL_THRESHOLD,
  DAILY_HEALTHY_MAX,
  DAILY_WARNING_MAX,
  WEEKLY_HEALTHY_MAX,
  MONTHLY_HEALTHY_MAX,
  CONSECUTIVE_DAYS_HEALTHY,
  CONSECUTIVE_DAYS_WARNING,
  LATE_NIGHT_THRESHOLD
}
