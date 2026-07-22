import { describe, it, expect, vi } from 'vitest'
import { trackEvent } from '../../services/analyticsService'
import { useAnalytics } from '../useAnalytics'

vi.mock('../../services/analyticsService', () => ({
  trackEvent: vi.fn(),
}))

describe('useAnalytics', () => {
  it('trackPageView calls trackEvent with page_view event and pageName property', () => {
    const { trackPageView } = useAnalytics()
    trackPageView('home', { petCount: 1 })
    expect(trackEvent).toHaveBeenCalledWith('page_view', { pageName: 'home', petCount: 1 })
  })

  it('trackEvent calls trackEvent directly', () => {
    const { trackEvent: track } = useAnalytics()
    track('click_button', { buttonId: 'test' })
    expect(trackEvent).toHaveBeenCalledWith('click_button', { buttonId: 'test' })
  })
})
