/**
 * 哀伤陪伴组件测试
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import GriefCompanion from '../GriefCompanion'

vi.mock('@tarojs/components', () => ({
  View: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick}>{children}</div>
  ),
  Text: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
  Input: ({ value, onInput, placeholder, onConfirm }: any) => (
    <input
      value={value}
      onChange={e => onInput && onInput({ detail: { value: e.target.value } })}
      placeholder={placeholder}
      onKeyDown={e => e.key === 'Enter' && onConfirm && onConfirm()}
    />
  ),
  ScrollView: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}))

describe('GriefCompanion', () => {
  const defaultProps = {
    petId: 'pet1',
    petName: '咪咪',
    species: 'cat' as const,
    deceasedDate: '2026-01-01',
    onComplete: vi.fn(),
  }

  it('renders name step initially', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    expect(container.textContent).toContain('不需要坚强')
  })

  it('shows feeling options in name step', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    expect(container.textContent).toContain('空虚')
    expect(container.textContent).toContain('愤怒')
  })

  it('shows progress dots', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    const dots = container.querySelectorAll('.grief-companion__progress-dot')
    expect(dots).toHaveLength(4)
  })

  it('shows pet name in header', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    expect(container.textContent).toContain('纪念咪咪')
  })

  it('shows disclaimer with hotline', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    expect(container.textContent).toContain('400-161-9995')
  })

  it('advances to write step when feeling is selected', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    const options = container.querySelectorAll('.grief-companion__option')
    fireEvent.click(options[0])
    expect(container.textContent).toContain('想说说')
  })

  it('shows skip button in write step', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    const options = container.querySelectorAll('.grief-companion__option')
    fireEvent.click(options[0])
    expect(container.textContent).toContain('暂时不想')
  })

  it('skips to connect step', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    const options = container.querySelectorAll('.grief-companion__option')
    fireEvent.click(options[0])
    const skipBtn = container.querySelector('.grief-companion__skip-btn')
    fireEvent.click(skipBtn!)
    expect(container.textContent).toContain('2,847')
  })

  it('advances to close step from connect', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    const options = container.querySelectorAll('.grief-companion__option')
    fireEvent.click(options[0])
    const skipBtn = container.querySelector('.grief-companion__skip-btn')
    fireEvent.click(skipBtn!)
    const connectBtn = container.querySelector('.grief-companion__connect-btn')
    fireEvent.click(connectBtn!)
    expect(container.textContent).toContain('咪咪有你这样的家人')
  })

  it('calls onComplete when close button clicked in close step', () => {
    const onComplete = vi.fn()
    const { container } = render(<GriefCompanion {...defaultProps} onComplete={onComplete} />)
    const options = container.querySelectorAll('.grief-companion__option')
    fireEvent.click(options[0])
    const skipBtn = container.querySelector('.grief-companion__skip-btn')
    fireEvent.click(skipBtn!)
    const connectBtn = container.querySelector('.grief-companion__connect-btn')
    fireEvent.click(connectBtn!)
    const completeBtn = container.querySelector('.grief-companion__complete-btn')
    fireEvent.click(completeBtn!)
    expect(onComplete).toHaveBeenCalled()
  })
})
