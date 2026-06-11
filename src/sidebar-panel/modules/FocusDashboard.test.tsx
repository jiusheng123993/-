import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FocusDashboard } from './FocusDashboard'

function clearStorage() {
  window.localStorage.removeItem('xinghuanhai-focus-records')
}

const defaultProps = {
  focusMinuteText: '00',
  focusSecondText: '00',
  isFocusRunning: false,
  focusDisplayTask: null,
  focusTargetMinutes: 25,
  totalFocusMinutes: 0,
  onStartFocus: () => {},
  onPauseFocus: () => {},
  onResetFocus: () => {},
  onAdjustFocus: () => {},
  onRemove: () => {},
}

describe('FocusDashboard', () => {
  beforeEach(() => {
    clearStorage()
  })

  it('renders dashboard title', () => {
    render(<FocusDashboard {...defaultProps} />)
    expect(screen.getByText(/专注仪表/)).toBeTruthy()
  })

  it('renders time display', () => {
    const { container } = render(<FocusDashboard {...defaultProps} />)
    const timeDisplay = container.querySelector('[class*="timeDisplay"]')
    expect(timeDisplay).toBeTruthy()
    expect(timeDisplay!.textContent).toContain('00')
  })

  it('renders start button when not running', () => {
    render(<FocusDashboard {...defaultProps} />)
    expect(screen.getByRole('button', { name: /开始专注/ })).toBeTruthy()
  })

  it('renders pause button when running', () => {
    render(<FocusDashboard {...defaultProps} isFocusRunning={true} />)
    expect(screen.getByRole('button', { name: /暂停/ })).toBeTruthy()
  })

  it('renders reset button', () => {
    render(<FocusDashboard {...defaultProps} />)
    expect(screen.getByRole('button', { name: /重置/ })).toBeTruthy()
  })

  it('renders remove button', () => {
    render(<FocusDashboard {...defaultProps} />)
    expect(screen.getByTitle('移除')).toBeTruthy()
  })

  it('renders duration adjustment buttons when not running', () => {
    render(<FocusDashboard {...defaultProps} />)
    expect(screen.getByRole('button', { name: '−5' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '+5' })).toBeTruthy()
    expect(screen.getByText(/25 分钟/)).toBeTruthy()
  })

  it('hides duration adjustment when running', () => {
    render(<FocusDashboard {...defaultProps} isFocusRunning={true} />)
    expect(screen.queryByRole('button', { name: '−5' })).toBeNull()
    expect(screen.queryByRole('button', { name: '+5' })).toBeNull()
  })

  it('shows running label when focus is active', () => {
    render(<FocusDashboard {...defaultProps} isFocusRunning={true} />)
    expect(screen.getByText(/专注中/)).toBeTruthy()
  })

  it('renders stats section with zero values initially', () => {
    render(<FocusDashboard {...defaultProps} />)
    expect(screen.getByText(/今日专注/)).toBeTruthy()
    expect(screen.getByText(/本周专注/)).toBeTruthy()
    expect(screen.getByText(/本月专注/)).toBeTruthy()
    expect(screen.getByText(/完成次数/)).toBeTruthy()
  })

  it('renders trend chart canvas', () => {
    const { container } = render(<FocusDashboard {...defaultProps} />)
    expect(screen.getByText(/专注趋势/)).toBeTruthy()
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('renders today records section', () => {
    render(<FocusDashboard {...defaultProps} />)
    const btn = screen.getByRole('button', { name: /今日记录/ })
    expect(btn).toBeTruthy()
  })

  it('toggles history panel', () => {
    render(<FocusDashboard {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /今日记录/ }))
    expect(screen.getByRole('button', { name: /收起记录/ })).toBeTruthy()
    expect(screen.getByText(/今天还没有专注记录/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /收起记录/ }))
    expect(screen.getByRole('button', { name: /今日记录/ })).toBeTruthy()
  })

  it('shows subject distribution when records exist', () => {
    const records = [
      {
        id: '1',
        taskId: 'task-1',
        taskTitle: '数学复习',
        durationMinutes: 25,
        completedAt: new Date().toISOString(),
        type: 'focus' as const,
        abandoned: false,
      },
      {
        id: '2',
        taskId: 'task-2',
        taskTitle: '英语阅读',
        durationMinutes: 30,
        completedAt: new Date().toISOString(),
        type: 'focus' as const,
        abandoned: false,
      },
    ]
    window.localStorage.setItem('xinghuanhai-focus-records', JSON.stringify(records))

    render(<FocusDashboard {...defaultProps} />)
    expect(screen.getByText(/科目分布/)).toBeTruthy()
    expect(screen.getByText(/数学复习/)).toBeTruthy()
    expect(screen.getByText(/英语阅读/)).toBeTruthy()
  })

  it('shows history records when toggled', () => {
    const records = [
      {
        id: '1',
        taskId: 'task-1',
        taskTitle: '数学复习',
        durationMinutes: 25,
        completedAt: new Date().toISOString(),
        type: 'focus' as const,
        abandoned: false,
      },
    ]
    window.localStorage.setItem('xinghuanhai-focus-records', JSON.stringify(records))

    render(<FocusDashboard {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /今日记录/ }))
    const subjectElements = screen.getAllByText(/数学复习/)
    expect(subjectElements.length).toBeGreaterThanOrEqual(1)
    const durationElements = screen.getAllByText(/25分钟/)
    expect(durationElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders task label when focusDisplayTask is set', () => {
    render(
      <FocusDashboard
        {...defaultProps}
        focusDisplayTask={{ id: 'task-1', title: '数学复习', dueLabel: '今天' }}
      />
    )
    expect(screen.getByText(/数学复习/)).toBeTruthy()
  })

  it('renders footer with total focus minutes', () => {
    render(<FocusDashboard {...defaultProps} totalFocusMinutes={120} />)
    expect(screen.getByText(/今日累计/)).toBeTruthy()
    expect(screen.getByText(/120 分钟/)).toBeTruthy()
  })

  it('calls onStartFocus when start button clicked', () => {
    let called = false
    render(<FocusDashboard {...defaultProps} onStartFocus={() => { called = true }} />)
    fireEvent.click(screen.getByRole('button', { name: /开始专注/ }))
    expect(called).toBe(true)
  })

  it('calls onPauseFocus when pause button clicked', () => {
    let called = false
    render(<FocusDashboard {...defaultProps} isFocusRunning={true} onPauseFocus={() => { called = true }} />)
    fireEvent.click(screen.getByRole('button', { name: /暂停/ }))
    expect(called).toBe(true)
  })

  it('calls onResetFocus when reset button clicked', () => {
    let called = false
    render(<FocusDashboard {...defaultProps} onResetFocus={() => { called = true }} />)
    fireEvent.click(screen.getByRole('button', { name: /重置/ }))
    expect(called).toBe(true)
  })

  it('calls onRemove when remove button clicked', () => {
    let called = false
    render(<FocusDashboard {...defaultProps} onRemove={() => { called = true }} />)
    fireEvent.click(screen.getByTitle('移除'))
    expect(called).toBe(true)
  })

  it('calls onAdjustFocus with correct delta', () => {
    let delta = 0
    render(<FocusDashboard {...defaultProps} onAdjustFocus={(d) => { delta = d }} />)
    fireEvent.click(screen.getByRole('button', { name: '−5' }))
    expect(delta).toBe(-5)
    fireEvent.click(screen.getByRole('button', { name: '+5' }))
    expect(delta).toBe(5)
  })

  it('disables -5 button when target is 5 or less', () => {
    render(<FocusDashboard {...defaultProps} focusTargetMinutes={5} />)
    const btn = screen.getByRole('button', { name: '−5' })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables +5 button when target is 180 or more', () => {
    render(<FocusDashboard {...defaultProps} focusTargetMinutes={180} />)
    const btn = screen.getByRole('button', { name: '+5' })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })
})
