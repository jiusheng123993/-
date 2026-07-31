/**
 * 数据埋点与统计分析 Hook
 * 提供页面浏览、自定义事件、漏斗步骤的追踪以及页面访问时长统计
 */
import { useEffect } from 'react'
import {
  trackEvent as trackEventService,
  trackFunnelStep as trackFunnelStepService,
  startPageTimer,
  endPageTimer,
} from '../services/analyticsService'

/**
 * 数据埋点与统计分析 Hook
 * 提供页面浏览、自定义事件、漏斗步骤的追踪能力
 */
export function useAnalytics() {
  const trackPageView = (pageName: string, properties?: Record<string, unknown>) => {
    trackEventService('page_view', { pageName, ...properties })
  }

  const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
    trackEventService(eventName, properties)
  }

  const trackFunnelStep = (funnelName: string, stepName: string, stepIndex: number) => {
    trackFunnelStepService(funnelName, stepName, stepIndex)
  }

  return { trackPageView, trackEvent, trackFunnelStep }
}

/**
 * 页面访问时长追踪 Hook
 * 自动记录页面进入和离开时间
 */
export function usePageView(pageName: string, properties?: Record<string, unknown>) {
  useEffect(() => {
    startPageTimer(pageName)
    return () => {
      endPageTimer(pageName)
    }
  }, [pageName])
}
