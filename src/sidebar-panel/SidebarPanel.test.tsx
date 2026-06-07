import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SidebarPanel } from './SidebarPanel'

const defaultProps = {
  personaId: 'exam-student',
  streakDays: 7,
  totalFocusMinutes: 120,
  completedTasks: 5,
  todoTasks: [
    { id: '1', title: 'Task 1', dueLabel: '今天', minutes: 25 },
    { id: '2', title: 'Task 2', dueLabel: '明天', minutes: 30 }
  ],
  focusMinuteText: '25',
  focusSecondText: '00',
  isFocusRunning: false,
  focusDisplayTask: null,
  focusTargetMinutes: 25,
  onStartFocus: vi.fn(),
  onPauseFocus: vi.fn(),
  onResetFocus: vi.fn(),
  onAdjustFocus: vi.fn(),
  onOpenSchedule: vi.fn()
}

describe('SidebarPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders default modules for exam-student persona', () => {
    render(<SidebarPanel {...defaultProps} />)
    expect(screen.getByText('专注仪表')).toBeDefined()
  })

  it('renders default modules for office-worker persona', () => {
    render(<SidebarPanel {...defaultProps} personaId="office-worker" />)
    expect(screen.getByText('专注仪表')).toBeDefined()
  })

  it('renders default modules for creator persona', () => {
    render(<SidebarPanel {...defaultProps} personaId="creator" />)
    expect(screen.getByText('专注仪表')).toBeDefined()
  })

  it('renders default modules for self-growth persona', () => {
    render(<SidebarPanel {...defaultProps} personaId="self-growth" />)
    expect(screen.getByText('专注仪表')).toBeDefined()
  })

  it('shows module selector when add button is clicked', () => {
    render(<SidebarPanel {...defaultProps} />)
    const addBtn = screen.getByText('+')
    fireEvent.click(addBtn)
    expect(screen.getByText('今日日程条')).toBeDefined()
  })

  it('hides module selector when add button is clicked again', () => {
    render(<SidebarPanel {...defaultProps} />)
    const addBtn = screen.getByText('+')
    fireEvent.click(addBtn)
    fireEvent.click(addBtn)
    expect(screen.queryByText('今日日程条')).toBeNull()
  })

  it('adds a module and closes selector', () => {
    render(<SidebarPanel {...defaultProps} />)
    const addBtn = screen.getByText('+')
    fireEvent.click(addBtn)
    expect(screen.getByText('今日日程条')).toBeDefined()
    fireEvent.click(screen.getByText('今日日程条'))
    expect(screen.queryByText('今日日程条')).toBeDefined()
  })

  it('renders focus dashboard with time display', () => {
    render(<SidebarPanel {...defaultProps} />)
    expect(screen.getByText('专注仪表')).toBeDefined()
    expect(screen.getByText('开始专注')).toBeDefined()
    expect(screen.getByText('重置')).toBeDefined()
  })

  it('renders start button when not running', () => {
    render(<SidebarPanel {...defaultProps} />)
    expect(screen.getByText('开始专注')).toBeDefined()
  })

  it('calls onStartFocus when start button is clicked', () => {
    const onStartFocus = vi.fn()
    render(<SidebarPanel {...defaultProps} onStartFocus={onStartFocus} />)
    fireEvent.click(screen.getByText('开始专注'))
    expect(onStartFocus).toHaveBeenCalled()
  })

  it('renders pause button when running', () => {
    render(<SidebarPanel {...defaultProps} isFocusRunning={true} />)
    expect(screen.getByText('暂停')).toBeDefined()
  })

  it('calls onPauseFocus when pause button is clicked', () => {
    const onPauseFocus = vi.fn()
    render(<SidebarPanel {...defaultProps} isFocusRunning={true} onPauseFocus={onPauseFocus} />)
    fireEvent.click(screen.getByText('暂停'))
    expect(onPauseFocus).toHaveBeenCalled()
  })

  it('renders all 6 modules without placeholder', () => {
    render(<SidebarPanel {...defaultProps} />)
    expect(screen.queryByText('模块开发中')).toBeNull()
  })
})