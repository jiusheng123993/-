/**
 * 宠物表情引擎
 * 定义 8 种宠物表情及其视觉配置，根据健康数据上下文计算最适合的表情
 */
import type { PetHealthEntry, HealthRiskLevel, PetExpression, ExpressionConfig, ExpressionContext, AnimationType } from '../../types/avatarTypes'

export type { PetExpression, ExpressionConfig, ExpressionContext }

/**
 * 宠物表情引擎
 *
 * 定义8种宠物表情及其对应的视觉配置（眼睛、嘴巴、配饰、动画），
 * 根据健康数据上下文（打卡、风险等级、里程碑等）计算最适合的表情。
 */

export const EXPRESSION_MAP: Record<PetExpression, ExpressionConfig> = {
  happy: {
    expression: 'happy',
    label: '开心',
    color: '#4CAF50',
    eyes: 'happy',
    mouth: 'smile',
    accessory: 'blush',
    animation: 'bounce' as AnimationType,
  },
  worried: {
    expression: 'worried',
    label: '担心',
    color: '#FF9800',
    eyes: 'half',
    mouth: 'frown',
    accessory: 'cold_bubble',
    animation: 'pulse' as AnimationType,
  },
  concerned: {
    expression: 'concerned',
    label: '关注',
    color: '#FF5722',
    eyes: 'round',
    mouth: 'worried',
    accessory: 'hospital',
    animation: 'shake' as AnimationType,
  },
  anxious: {
    expression: 'anxious',
    label: '紧急',
    color: '#F44336',
    eyes: 'wide',
    mouth: 'gasp',
    accessory: 'sweat',
    animation: 'flash' as AnimationType,
  },
  sleepy: {
    expression: 'sleepy',
    label: '瞌睡',
    color: '#9E9E9E',
    eyes: 'closed',
    mouth: 'zzz',
    accessory: 'drool',
    animation: 'float' as AnimationType,
  },
  proud: {
    expression: 'proud',
    label: '骄傲',
    color: '#FFD700',
    eyes: 'sparkle',
    mouth: 'big_smile',
    accessory: 'crown',
    animation: 'glow' as AnimationType,
  },
  excited: {
    expression: 'excited',
    label: '兴奋',
    color: '#FF69B4',
    eyes: 'star',
    mouth: 'open_smile',
    accessory: 'confetti',
    animation: 'jump' as AnimationType,
  },
  scared: {
    expression: 'scared',
    label: '惊恐',
    color: '#E91E63',
    eyes: 'shocked',
    mouth: 'gasp',
    accessory: 'warning',
    animation: 'tremble' as AnimationType,
  },
}

/** 根据上下文计算宠物当前表情 */
export function calculateExpression(ctx: ExpressionContext): ExpressionConfig {
  if (ctx.isDeceased) {
    return EXPRESSION_MAP.sleepy
  }

  if (ctx.isBirthday) {
    return EXPRESSION_MAP.excited
  }

  if (ctx.isVaccineComplete) {
    return EXPRESSION_MAP.proud
  }

  if (ctx.isRecovery) {
    return EXPRESSION_MAP.happy
  }

  if (ctx.streakDays >= 7) {
    return EXPRESSION_MAP.proud
  }

  if (!ctx.todayEntry) {
    return EXPRESSION_MAP.sleepy
  }

  if (ctx.riskLevel === 'emergency') {
    return EXPRESSION_MAP.anxious
  }

  if (ctx.riskLevel === 'high') {
    return EXPRESSION_MAP.concerned
  }

  if (ctx.anomalyCount >= 2) {
    return EXPRESSION_MAP.worried
  }

  if (ctx.anomalyCount === 1) {
    return EXPRESSION_MAP.worried
  }

  return EXPRESSION_MAP.happy
}

/** 根据食物安全结果获取对应表情 */
export function getExpressionForFoodResult(isSafe: boolean): ExpressionConfig {
  return isSafe ? EXPRESSION_MAP.happy : EXPRESSION_MAP.scared
}

/** 根据症状初筛风险等级获取对应表情 */
export function getExpressionForSymptomResult(riskLevel: HealthRiskLevel): ExpressionConfig {
  switch (riskLevel) {
    case 'emergency':
      return EXPRESSION_MAP.anxious
    case 'high':
      return EXPRESSION_MAP.concerned
    case 'medium':
      return EXPRESSION_MAP.worried
    default:
      return EXPRESSION_MAP.happy
  }
}

/** 根据疫苗是否逾期获取对应表情 */
export function getExpressionForVaccineDue(isOverdue: boolean): ExpressionConfig {
  return isOverdue ? EXPRESSION_MAP.worried : EXPRESSION_MAP.happy
}
