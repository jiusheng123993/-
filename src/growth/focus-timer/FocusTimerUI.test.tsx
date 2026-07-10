import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FocusTimerUI } from './FocusTimerUI'

function clearStorage() {
  window.localStorage.removeItem('xinghuanhai-focus-records')
}

describe('FocusTimerUI', () => {
  beforeEach(() => {
    clearStorage()
  })

  it('renders stats section with zero values initially', () => {
    render(<FocusTimerUI />)
    expect(screen.getByText(/今日专注/)).toBeTruthy()
    expect(screen.getByText(/本周专注/)).toBeTruthy()
    expect(screen.getByText(/本月专注/)).toBeTruthy()
    expect(screen.getByText(/完成次数/)).toBeTruthy()
  })

  it('renders trend chart canvas', () => {
    const { container } = render(<FocusTimerUI />)
    expect(screen.getByText(/专注趋势/)).toBeTruthy()
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('renders today records section', () => {
    render(<FocusTimerUI />)
    const btn = screen.getByRole('button', { name: /今日记录/ })
    expect(btn).toBeTruthy()
  })

  it('toggles history panel', () => {
    render(<FocusTimerUI />)
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

    render(<FocusTimerUI />)
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

    render(<FocusTimerUI />)
    fireEvent.click(screen.getByRole('button', { name: /今日记录/ }))
    const subjectElements = screen.getAllByText(/数学复习/)
    expect(subjectElements.length).toBeGreaterThanOrEqual(1)
    const durationElements = screen.getAllByText(/25分钟/)
    expect(durationElements.length).toBeGreaterThanOrEqual(1)
  })
})
