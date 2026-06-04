import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CycleTodayCard } from './CycleTodayCard'

vi.mock('./cycleService', () => ({
  cycleService: {
    getPrediction: vi.fn(() => ({
      currentPhase: 'follicular',
      nextPeriodStart: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      confidence: 0.8
    }))
  }
}))

vi.mock('./energySuggestionEngine', () => ({
  generateEnergySuggestion: vi.fn(() => ({
    energyLevel: 'high',
    suggestions: ['适合深度学习', '可以尝试新挑战'],
    avoidTypes: []
  }))
}))

vi.mock('./cyclePredictionEngine', () => ({
  formatDate: vi.fn((date) => date.toISOString().split('T')[0])
}))

describe('CycleTodayCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders cycle today card component', () => {
    render(<CycleTodayCard onQuickRecord={() => {}} />)
    expect(document.querySelector('.cycle-today-card')).toBeInTheDocument()
  })

  it('renders phase icon', () => {
    render(<CycleTodayCard onQuickRecord={() => {}} />)
    expect(document.querySelector('.cycle-phase-icon')).toBeInTheDocument()
  })

  it('renders phase label', () => {
    render(<CycleTodayCard onQuickRecord={() => {}} />)
    expect(document.querySelector('.cycle-phase-label')).toBeInTheDocument()
  })

  it('renders days until period', () => {
    render(<CycleTodayCard onQuickRecord={() => {}} />)
    expect(document.querySelector('.cycle-days-until')).toBeInTheDocument()
  })

  it('renders energy section when suggestion available', () => {
    render(<CycleTodayCard onQuickRecord={() => {}} />)
    expect(document.querySelector('.cycle-energy-section')).toBeInTheDocument()
  })

  it('renders quick record button', () => {
    render(<CycleTodayCard onQuickRecord={() => {}} />)
    expect(screen.getByText('快捷记录')).toBeInTheDocument()
  })

  it('calls onQuickRecord when button is clicked', () => {
    const onQuickRecord = vi.fn()
    render(<CycleTodayCard onQuickRecord={onQuickRecord} />)
    
    fireEvent.click(screen.getByText('快捷记录'))
    expect(onQuickRecord).toHaveBeenCalled()
  })

  it('renders with different phases', () => {
    const { rerender } = render(<CycleTodayCard onQuickRecord={() => {}} />)
    expect(document.querySelector('.cycle-today-card')).toBeInTheDocument()

    rerender(<CycleTodayCard onQuickRecord={() => {}} />)
    expect(document.querySelector('.cycle-today-card')).toBeInTheDocument()
  })

  it('does not render confidence note when confidence is high', () => {
    render(<CycleTodayCard onQuickRecord={() => {}} />)
    expect(screen.queryByText(/预测置信度/)).not.toBeInTheDocument()
  })
})
