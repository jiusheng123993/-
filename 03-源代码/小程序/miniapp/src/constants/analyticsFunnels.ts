/**
 * 分析漏斗配置
 * 定义用户行为路径的关键步骤，用于转化率和用户行为分析
 */
export const FUNNELS = {
  ONBOARDING: {
    name: 'onboarding',
    steps: ['app_open', 'pet_add', 'first_checkin'],
  },
  CONVERSION: {
    name: 'conversion',
    steps: ['paywall_show', 'subscription_view', 'membership_convert'],
  },
  ENGAGEMENT: {
    name: 'engagement',
    steps: ['app_open', 'feature_use', 'share_app'],
  },
} as const

export type FunnelName = keyof typeof FUNNELS
export type FunnelConfig = typeof FUNNELS[FunnelName]
