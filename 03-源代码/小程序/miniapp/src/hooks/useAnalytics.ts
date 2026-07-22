import { useEffect } from 'react'
import {
  trackEvent as trackEventService,
  trackFunnelStep as trackFunnelStepService,
  startPageTimer,
  endPageTimer,
} from '../services/analyticsService'

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

export function usePageView(pageName: string, properties?: Record<string, unknown>) {
  useEffect(() => {
    startPageTimer(pageName)
    return () => {
      endPageTimer(pageName)
    }
  }, [pageName])
}
