import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MoodJournalUI } from './MoodJournalUI'

function clearStorage() {
  window.localStorage.removeItem('xinghuanhai-moodjournal-state')
}

describe('MoodJournalUI', () => {
  beforeEach(() => {
    clearStorage()
  })

  it('renders the today section with empty state', () => {
    render(<MoodJournalUI />)
    expect(screen.getByText(/今天还没有记录心情/)).toBeTruthy()
    const addBtn = screen.getByRole('button', { name: /记录今日心情/ })
    expect(addBtn).toBeTruthy()
  })

  it('renders stats section with zero values initially', () => {
    render(<MoodJournalUI />)
    expect(screen.getByText(/平均情绪/)).toBeTruthy()
    expect(screen.getByText(/记录天数/)).toBeTruthy()
    expect(screen.getByText(/连续记录/)).toBeTruthy()
    expect(screen.getByText(/低情绪天数/)).toBeTruthy()
  })

  it('opens add form when clicking record button', () => {
    render(<MoodJournalUI />)
    fireEvent.click(screen.getByRole('button', { name: /记录今日心情/ }))
    expect(screen.getByText(/记录今日心情/)).toBeTruthy()
    expect(screen.getByText(/情绪评分/)).toBeTruthy()
    expect(screen.getByText(/心情笔记/)).toBeTruthy()
    expect(screen.getByText(/情绪标签/)).toBeTruthy()
  })

  it('renders score slider and emoji marks', () => {
    render(<MoodJournalUI />)
    fireEvent.click(screen.getByRole('button', { name: /记录今日心情/ }))
    const slider = document.querySelector('input[type="range"]')
    expect(slider).toBeTruthy()
    const marks = screen.getAllByRole('button')
    const emojiMarks = marks.filter((b) => b.title && ['非常低落', '很难过', '有点沮丧', '不太好', '一般般', '还行', '挺不错', '很开心', '超级棒', '完美'].includes(b.title))
    expect(emojiMarks.length).toBe(10)
  })

  it('renders mood tags in add form', () => {
    render(<MoodJournalUI />)
    fireEvent.click(screen.getByRole('button', { name: /记录今日心情/ }))
    expect(screen.getByText('焦虑')).toBeTruthy()
    expect(screen.getByText('开心')).toBeTruthy()
    expect(screen.getByText('考试')).toBeTruthy()
  })

  it('toggles tag selection', () => {
    render(<MoodJournalUI />)
    fireEvent.click(screen.getByRole('button', { name: /记录今日心情/ }))
    const anxietyBtn = screen.getByText('焦虑')
    fireEvent.click(anxietyBtn)
    expect(anxietyBtn.className).toContain('tagBtnActive')
    fireEvent.click(anxietyBtn)
    expect(anxietyBtn.className).not.toContain('tagBtnActive')
  })

  it('submits a mood entry', () => {
    render(<MoodJournalUI />)
    fireEvent.click(screen.getByRole('button', { name: /记录今日心情/ }))
    fireEvent.click(screen.getByRole('button', { name: /记录心情/ }))
    expect(screen.queryByText(/今天还没有记录心情/)).toBeFalsy()
  })

  it('cancels add form', () => {
    render(<MoodJournalUI />)
    fireEvent.click(screen.getByRole('button', { name: /记录今日心情/ }))
    fireEvent.click(screen.getByRole('button', { name: /取消/ }))
    expect(screen.getByText(/今天还没有记录心情/)).toBeTruthy()
  })

  it('renders trend chart canvas', () => {
    const { container } = render(<MoodJournalUI />)
    expect(screen.getByText(/近7天情绪趋势/)).toBeTruthy()
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('toggles history panel', () => {
    render(<MoodJournalUI />)
    const toggleBtn = screen.getByRole('button', { name: /历史记录/ })
    expect(toggleBtn).toBeTruthy()
    fireEvent.click(toggleBtn)
    expect(screen.getByRole('button', { name: /收起历史/ })).toBeTruthy()
    expect(screen.getByText(/还没有心情记录/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /收起历史/ }))
    expect(screen.getByRole('button', { name: /历史记录/ })).toBeTruthy()
  })

  it('shows alert banner when low streak >= 3', () => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().slice(0, 10)

    window.localStorage.setItem('xinghuanhai-moodjournal-state', JSON.stringify({
      entries: [
        { id: '1', date: today, score: 3, tags: [] },
        { id: '2', date: yesterday, score: 2, tags: [] },
        { id: '3', date: twoDaysAgo, score: 4, tags: [] },
      ],
    }))

    render(<MoodJournalUI />)
    expect(screen.getByText(/你已经连续/)).toBeTruthy()
    expect(screen.getByText(/天情绪较低/)).toBeTruthy()
  })

  it('shows today entry after submission', () => {
    render(<MoodJournalUI />)
    fireEvent.click(screen.getByRole('button', { name: /记录今日心情/ }))
    fireEvent.click(screen.getByRole('button', { name: /记录心情/ }))

    expect(screen.getByText(/修改/)).toBeTruthy()
    expect(screen.getByText(/删除/)).toBeTruthy()
  })
})
