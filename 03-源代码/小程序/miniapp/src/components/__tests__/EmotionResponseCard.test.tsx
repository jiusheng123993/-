import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import EmotionResponseCard from '../EmotionResponseCard'
import type { EmotionIntervention } from '../../engines/emotion'

vi.mock('@tarojs/components', () => ({
  View: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick}>{children}</div>
  ),
  Text: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
}))

const mockIntervention: EmotionIntervention = {
  id: 'intv_sick_anxiety_123_abc',
  type: 'sick_anxiety',
  userId: 'user1',
  message: '你最近很担心毛孩子的健康吧？',
  context: { petName: '咪咪', consecutiveAnomalyDays: 3 },
  petId: 'p1',
  createdAt: Date.now(),
  userResponded: false,
  requiresCrisisReferral: true,
}

describe('EmotionResponseCard', () => {
  it('renders inline message', () => {
    const { container } = render(
      <EmotionResponseCard
        intervention={mockIntervention}
        onAction={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    expect(container.querySelector('.emotion-inline')).toBeTruthy()
    expect(container.textContent).toContain('你最近很担心')
  })

  it('renders icon', () => {
    const { container } = render(
      <EmotionResponseCard
        intervention={mockIntervention}
        onAction={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    expect(container.querySelector('.emotion-inline__icon')).toBeTruthy()
  })

  it('renders action button with correct label', () => {
    const { container } = render(
      <EmotionResponseCard
        intervention={mockIntervention}
        onAction={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    expect(container.textContent).toContain('深呼吸')
  })

  it('calls onAction when action button clicked', () => {
    const onAction = vi.fn()
    const { container } = render(
      <EmotionResponseCard
        intervention={mockIntervention}
        onAction={onAction}
        onDismiss={vi.fn()}
      />,
    )
    const actionBtn = container.querySelector('.emotion-inline__action')
    fireEvent.click(actionBtn!)
    expect(onAction).toHaveBeenCalledWith(mockIntervention)
  })

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn()
    const { container } = render(
      <EmotionResponseCard
        intervention={mockIntervention}
        onAction={vi.fn()}
        onDismiss={onDismiss}
      />,
    )
    const dismissBtn = container.querySelector('.emotion-inline__dismiss')
    fireEvent.click(dismissBtn!)
    expect(onDismiss).toHaveBeenCalledWith(mockIntervention)
  })

  it('applies type-specific class', () => {
    const { container } = render(
      <EmotionResponseCard
        intervention={mockIntervention}
        onAction={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    expect(container.querySelector('.emotion-inline--sick_anxiety')).toBeTruthy()
  })

  it('renders new_owner_anxiety with correct icon and label', () => {
    const newOwnerIntv: EmotionIntervention = {
      ...mockIntervention,
      type: 'new_owner_anxiety',
      message: '第一次养猫都会紧张',
    }
    const { container } = render(
      <EmotionResponseCard
        intervention={newOwnerIntv}
        onAction={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    expect(container.querySelector('.emotion-inline--new_owner_anxiety')).toBeTruthy()
    expect(container.textContent).toContain('看看建议')
  })
})
