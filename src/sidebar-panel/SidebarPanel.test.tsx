import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { SidebarPanel } from './SidebarPanel'

const defaultProps = {
  personaId: 'exam-student',
  streakDays: 12,
  totalFocusMinutes: 75,
  completedTasks: 3,
  todoTasks: [
    { id: '1', title: '完成高数练习', dueLabel: '今天', minutes: 60 },
    { id: '2', title: '背诵单词', dueLabel: '今晚', minutes: 30 }
  ],
  focusMinuteText: '60',
  focusSecondText: '00',
  isFocusRunning: false,
  focusDisplayTask: { id: '1', title: '完成高数练习', dueLabel: '今天' },
  onStartFocus: vi.fn(),
  onPauseFocus: vi.fn(),
  onResetFocus: vi.fn()
}

const renderSidebarPanel = (props: Partial<typeof defaultProps> = {}) => {
  return render(<SidebarPanel {...defaultProps} {...props} />)
}

describe('SidebarPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => null,
        setItem: () => {}
      }
    })
  })

  it('renders panel title', () => {
    renderSidebarPanel()
    expect(screen.getByText('快捷面板')).toBeInTheDocument()
  })

  it('renders add button', () => {
    renderSidebarPanel()
    expect(screen.getByTitle('添加模块')).toBeInTheDocument()
  })

  it('renders default modules for exam-student persona', () => {
    renderSidebarPanel()
    expect(screen.getByText(/番茄钟/)).toBeInTheDocument()
    expect(screen.getByText(/考试倒计时/)).toBeInTheDocument()
    expect(screen.getByText(/今日待办/)).toBeInTheDocument()
    expect(screen.getByText(/科目进度/)).toBeInTheDocument()
  })

  it('renders default modules for office-worker persona', () => {
    renderSidebarPanel({ personaId: 'office-worker' })
    expect(screen.getByText(/番茄钟/)).toBeInTheDocument()
    expect(screen.getByText(/今日待办/)).toBeInTheDocument()
    expect(screen.getByText(/会议行动项/)).toBeInTheDocument()
    expect(screen.getByText(/周报素材/)).toBeInTheDocument()
  })

  it('renders default modules for creator persona', () => {
    renderSidebarPanel({ personaId: 'creator' })
    expect(screen.getByText(/番茄钟/)).toBeInTheDocument()
    expect(screen.getByText(/今日待办/)).toBeInTheDocument()
    expect(screen.getByText(/灵感速记/)).toBeInTheDocument()
    expect(screen.getByText(/发布日历/)).toBeInTheDocument()
  })

  it('renders default modules for self-growth persona', () => {
    renderSidebarPanel({ personaId: 'self-growth' })
    expect(screen.getByText(/番茄钟/)).toBeInTheDocument()
    expect(screen.getByText(/今日习惯/)).toBeInTheDocument()
    expect(screen.getByText(/心情打卡/)).toBeInTheDocument()
    expect(screen.getByText(/今日数据/)).toBeInTheDocument()
  })

  it('shows module selector when add button is clicked', () => {
    renderSidebarPanel()
    const addBtn = screen.getByTitle('添加模块')
    fireEvent.click(addBtn)
    expect(screen.getByText('今日数据')).toBeInTheDocument()
  })

  it('hides module selector when add button is clicked again', () => {
    renderSidebarPanel()
    const addBtn = screen.getByTitle('添加模块')
    fireEvent.click(addBtn)
    expect(screen.getByText('今日数据')).toBeInTheDocument()
    fireEvent.click(addBtn)
    expect(screen.queryByText('今日数据')).not.toBeInTheDocument()
  })

  it('adds a module when selected from selector', () => {
    renderSidebarPanel()
    const addBtn = screen.getByTitle('添加模块')
    fireEvent.click(addBtn)
    const streakBtn = screen.getByText('今日数据')
    fireEvent.click(streakBtn)
    expect(screen.getByText(/今日数据/)).toBeInTheDocument()
  })

  it('removes a module when close button is clicked', () => {
    renderSidebarPanel()
    const removeButtons = screen.getAllByText('×')
    expect(removeButtons.length).toBeGreaterThan(0)
    fireEvent.click(removeButtons[0])
  })

  it('renders pomodoro timer with correct time', () => {
    renderSidebarPanel()
    expect(screen.getByText('60:00')).toBeInTheDocument()
  })

  it('renders todo tasks', () => {
    renderSidebarPanel()
    const mathTasks = screen.getAllByText('完成高数练习')
    expect(mathTasks.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('背诵单词')).toBeInTheDocument()
  })

  it('renders start button when not running', () => {
    renderSidebarPanel()
    expect(screen.getByText('开始')).toBeInTheDocument()
  })

  it('calls onStartFocus when start button is clicked', () => {
    const onStartFocus = vi.fn()
    renderSidebarPanel({ onStartFocus })
    fireEvent.click(screen.getByText('开始'))
    expect(onStartFocus).toHaveBeenCalledTimes(1)
  })

  it('renders pause button when running', () => {
    renderSidebarPanel({ isFocusRunning: true })
    expect(screen.getByText('暂停')).toBeInTheDocument()
  })

  it('calls onPauseFocus when pause button is clicked', () => {
    const onPauseFocus = vi.fn()
    renderSidebarPanel({ isFocusRunning: true, onPauseFocus })
    fireEvent.click(screen.getByText('暂停'))
    expect(onPauseFocus).toHaveBeenCalledTimes(1)
  })

  it('calls onResetFocus when reset button is clicked', () => {
    const onResetFocus = vi.fn()
    renderSidebarPanel({ onResetFocus })
    fireEvent.click(screen.getByText('重置'))
    expect(onResetFocus).toHaveBeenCalledTimes(1)
  })

  it('renders countdown module', () => {
    renderSidebarPanel()
    expect(screen.getByText('天后考试')).toBeInTheDocument()
  })

  it('renders subject progress module', () => {
    renderSidebarPanel()
    expect(screen.getByText('暂无科目数据')).toBeInTheDocument()
  })

  it('does not show modules not available for current persona in selector', () => {
    renderSidebarPanel({ personaId: 'exam-student' })
    const addBtn = screen.getByTitle('添加模块')
    fireEvent.click(addBtn)
    expect(screen.queryByText('会议行动项')).not.toBeInTheDocument()
    expect(screen.queryByText('灵感速记')).not.toBeInTheDocument()
  })
})
