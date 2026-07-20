import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('@tarojs/components', () => ({
  View: ({ children, className, style, onClick }: any) => (
    <div className={className} style={style} onClick={onClick}>{children}</div>
  ),
  Text: ({ children, className, style }: any) => (
    <span className={className} style={style}>{children}</span>
  ),
}))

vi.mock('@tarojs/taro', () => ({
  default: { navigateTo: vi.fn() },
}))

vi.mock('../PaywallPopup.scss', () => ({}))

import PaywallPopup from '../PaywallPopup'
import Taro from '@tarojs/taro'

describe('PaywallPopup', () => {
  const defaultProps = {
    visible: true,
    featureName: '食物查询',
    remainingFree: 0,
    onUpgrade: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when visible=false', () => {
    const { container } = render(<PaywallPopup {...defaultProps} visible={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when visible=true', () => {
    const { container } = render(<PaywallPopup {...defaultProps} />)
    expect(container.querySelector('.paywall-popup')).toBeDefined()
  })

  it('shows featureName in title', () => {
    render(<PaywallPopup {...defaultProps} featureName="AI症状初筛" />)
    expect(screen.getByText(/AI症状初筛/)).toBeDefined()
  })

  it('shows remainingFree count', () => {
    render(<PaywallPopup {...defaultProps} remainingFree={3} />)
    expect(screen.getByText('3')).toBeDefined()
  })

  it('shows remainingFree as 0', () => {
    render(<PaywallPopup {...defaultProps} remainingFree={0} />)
    expect(screen.getByText('0')).toBeDefined()
  })

  it('overlay click calls onClose', () => {
    const onClose = vi.fn()
    const { container } = render(<PaywallPopup {...defaultProps} onClose={onClose} />)
    const overlay = container.querySelector('.paywall-popup__overlay')!
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    render(<PaywallPopup {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('暂不需要'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('upgrade button calls onClose then navigates to /pages/member/index', () => {
    const onClose = vi.fn()
    const { container } = render(<PaywallPopup {...defaultProps} onClose={onClose} />)
    const upgradeBtn = container.querySelector('.paywall-popup__btn--upgrade')!
    fireEvent.click(upgradeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(vi.mocked(Taro.navigateTo)).toHaveBeenCalledWith({ url: '/pages/member/index' })
  })

  it('shows benefits list items', () => {
    render(<PaywallPopup {...defaultProps} />)
    expect(screen.getByText('每日更多使用次数')).toBeDefined()
    expect(screen.getByText('AI 深度健康分析')).toBeDefined()
    expect(screen.getByText('专属健康报告')).toBeDefined()
  })

  it('shows benefits title', () => {
    render(<PaywallPopup {...defaultProps} />)
    expect(screen.getByText('升级会员享以下权益：')).toBeDefined()
  })

  it('re-render with visible=false hides popup', () => {
    const { container, rerender } = render(<PaywallPopup {...defaultProps} />)
    expect(container.querySelector('.paywall-popup')).toBeDefined()
    rerender(<PaywallPopup {...defaultProps} visible={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows info label for remaining free count', () => {
    render(<PaywallPopup {...defaultProps} />)
    expect(screen.getByText('今日剩余免费次数')).toBeDefined()
  })

  it('renders card structure with bar', () => {
    const { container } = render(<PaywallPopup {...defaultProps} />)
    expect(container.querySelector('.paywall-popup__card')).toBeDefined()
    expect(container.querySelector('.paywall-popup__bar')).toBeDefined()
  })
})
