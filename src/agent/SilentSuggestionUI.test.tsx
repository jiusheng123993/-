import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SilentSuggestionUI } from './SilentSuggestionUI'
import type { SilentSuggestion } from './SilentSuggestionUI'

function makeSuggestion(overrides: Partial<SilentSuggestion> = {}): SilentSuggestion {
  return {
    id: 'sug-1',
    message: '测试建议',
    priority: 'medium',
    dismissible: true,
    ...overrides,
  }
}

describe('SilentSuggestionUI', () => {
  describe('rendering', () => {
    it('renders nothing when suggestions is empty', () => {
      const { container } = render(<SilentSuggestionUI suggestions={[]} />)
      expect(container.innerHTML).toBe('')
    })

    it('renders a single suggestion', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion()]} />)
      expect(screen.getByText('测试建议')).toBeInTheDocument()
    })

    it('renders multiple suggestions sorted by priority', () => {
      const suggestions: SilentSuggestion[] = [
        makeSuggestion({ id: 'low', message: '低优先级', priority: 'low' }),
        makeSuggestion({ id: 'high', message: '高优先级', priority: 'high' }),
        makeSuggestion({ id: 'medium', message: '中优先级', priority: 'medium' }),
      ]
      render(<SilentSuggestionUI suggestions={suggestions} />)

      const messages = screen.getAllByText(/优先级/)
      expect(messages[0].textContent).toBe('高优先级')
      expect(messages[1].textContent).toBe('中优先级')
      expect(messages[2].textContent).toBe('低优先级')
    })

    it('limits visible suggestions to 3', () => {
      const suggestions: SilentSuggestion[] = Array.from({ length: 5 }, (_, i) =>
        makeSuggestion({ id: `sug-${i}`, message: `建议${i}` })
      )
      render(<SilentSuggestionUI suggestions={suggestions} />)

      const messages = screen.getAllByText(/建议/)
      expect(messages.length).toBeLessThanOrEqual(3)
    })

    it('renders action button when actionLabel is provided', () => {
      render(
        <SilentSuggestionUI
          suggestions={[makeSuggestion({ actionLabel: '立即行动' })]}
        />
      )
      expect(screen.getByText('立即行动')).toBeInTheDocument()
    })

    it('renders dismiss button when dismissible is true', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion({ dismissible: true })]} />)
      expect(screen.getByText('知道了')).toBeInTheDocument()
    })

    it('does not render dismiss button when dismissible is false', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion({ dismissible: false })]} />)
      expect(screen.queryByText('知道了')).toBeNull()
    })
  })

  describe('interactions', () => {
    it('calls onDismiss when dismiss button clicked', () => {
      const onDismiss = vi.fn()
      render(
        <SilentSuggestionUI
          suggestions={[makeSuggestion()]}
          onDismiss={onDismiss}
        />
      )

      fireEvent.click(screen.getByText('知道了'))
      expect(onDismiss).toHaveBeenCalledWith('sug-1')
    })

    it('calls onAction when action button clicked', () => {
      const onAction = vi.fn()
      render(
        <SilentSuggestionUI
          suggestions={[makeSuggestion({ actionLabel: '执行' })]}
          onAction={onAction}
        />
      )

      fireEvent.click(screen.getByText('执行'))
      expect(onAction).toHaveBeenCalledWith('sug-1')
    })

    it('calls suggestion.action when action button clicked', () => {
      const action = vi.fn()
      render(
        <SilentSuggestionUI
          suggestions={[makeSuggestion({ actionLabel: '执行', action })]}
        />
      )

      fireEvent.click(screen.getByText('执行'))
      expect(action).toHaveBeenCalled()
    })
  })

  describe('priority styles', () => {
    it('renders high priority suggestion', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion({ priority: 'high' })]} />)
      expect(screen.getByText('测试建议')).toBeInTheDocument()
    })

    it('renders medium priority suggestion', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion({ priority: 'medium' })]} />)
      expect(screen.getByText('测试建议')).toBeInTheDocument()
    })

    it('renders low priority suggestion', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion({ priority: 'low' })]} />)
      expect(screen.getByText('测试建议')).toBeInTheDocument()
    })
  })
})