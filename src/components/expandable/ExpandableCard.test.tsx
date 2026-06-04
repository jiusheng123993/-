import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ExpandableCard } from './ExpandableCard'

const renderExpandableCard = (props: Partial<Parameters<typeof ExpandableCard>[0]> = {}) => {
  return render(
    <ExpandableCard
      expandedContent={<div data-testid="expanded-content">展开后的内容</div>}
      expandedTitle="卡片标题"
      {...props}
    >
      <div className="trigger-card">
        <h3>触发器卡片</h3>
        <p>点击展开</p>
      </div>
    </ExpandableCard>
  )
}

describe('ExpandableCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders trigger element', () => {
    renderExpandableCard()

    expect(screen.getByText('触发器卡片')).toBeInTheDocument()
    expect(screen.getByText('点击展开')).toBeInTheDocument()
  })

  it('applies expandable-trigger class to trigger', () => {
    renderExpandableCard()

    const trigger = screen.getByText('触发器卡片').closest('div')
    expect(trigger).toHaveClass('expandable-trigger')
  })

  it('opens expanded content when trigger is clicked', async () => {
    renderExpandableCard()

    const trigger = screen.getByText('触发器卡片')
    await fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(screen.getByTestId('expanded-content')).toBeInTheDocument()
  })

  it('closes expanded content when close button is clicked', async () => {
    renderExpandableCard()

    const trigger = screen.getByText('触发器卡片')
    await fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(600)
    })

    const closeButton = screen.getByRole('button', { name: '收起卡片' })
    await fireEvent.click(closeButton)

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(screen.queryByTestId('expanded-content')).not.toBeInTheDocument()
  })

  it('closes when clicking overlay', async () => {
    renderExpandableCard()

    const trigger = screen.getByText('触发器卡片')
    await fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(600)
    })

    const overlay = screen.getByRole('presentation')
    await fireEvent.click(overlay)

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(screen.queryByTestId('expanded-content')).not.toBeInTheDocument()
  })

  it('has aria-haspopup attribute on trigger', () => {
    renderExpandableCard()

    const trigger = screen.getByText('触发器卡片').closest('div')
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('renders with custom expandedTitle', () => {
    renderExpandableCard({ expandedTitle: '自定义标题' })

    const trigger = screen.getByText('触发器卡片')
    fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(screen.getByText('自定义标题')).toBeInTheDocument()
  })

  it('handles keyboard escape to close', async () => {
    renderExpandableCard()

    const trigger = screen.getByText('触发器卡片')
    await fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(600)
    })

    await fireEvent.keyDown(document, { key: 'Escape' })

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(screen.queryByTestId('expanded-content')).not.toBeInTheDocument()
  })

  it('applies cursor zoom-in style to trigger', () => {
    renderExpandableCard()

    const trigger = screen.getByText('触发器卡片').closest('div')
    expect(trigger).toHaveStyle({ cursor: 'zoom-in' })
  })

  it('renders expanded content in a dialog', async () => {
    renderExpandableCard()

    const trigger = screen.getByText('触发器卡片')
    await fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
