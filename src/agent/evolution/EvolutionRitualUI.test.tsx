import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EvolutionRitualUI } from './EvolutionRitualUI'
import type { EvolutionEntry } from './evolutionRitualTypes'

function createMockEntry(overrides: Partial<EvolutionEntry> = {}): EvolutionEntry {
  return {
    id: 'evo-1',
    triggeredBy: 'cron',
    triggerDetail: '',
    proposedChanges: [
      {
        fieldPath: 'emotional.motivationLevel',
        oldValue: 'medium',
        newValue: 'high',
        reasoning: '基于最近的学习表现和专注时长，建议提升动力等级',
        evidenceEventIds: ['evt-1', 'evt-2', 'evt-3'],
        confidence: 0.85,
      },
      {
        fieldPath: 'rhythm.energyPeak',
        oldValue: 'morning',
        newValue: 'night_owl',
        reasoning: '最近多次凌晨活跃记录',
        evidenceEventIds: ['evt-4', 'evt-5'],
        confidence: 0.65,
      },
    ],
    userDecision: 'pending',
    finalChanges: [],
    reflectionNote: '这周你坚持得很好，继续保持！',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }
}

function renderRitual(props: Partial<React.ComponentProps<typeof EvolutionRitualUI>> = {}) {
  const onAccept = vi.fn()
  const onReject = vi.fn()
  const onModify = vi.fn()
  const result = render(
    <EvolutionRitualUI
      entry={createMockEntry()}
      onAccept={onAccept}
      onReject={onReject}
      onModify={onModify}
      {...props}
    />
  )
  return { ...result, onAccept, onReject, onModify }
}

describe('EvolutionRitualUI', () => {
  it('renders cron-triggered entry with correct title', () => {
    renderRitual({ entry: createMockEntry({ triggeredBy: 'cron' }) })

    expect(screen.getByText('这周我对你的理解又深了一点 🌱')).toBeInTheDocument()
  })

  it('renders event-triggered entry with event-specific title', () => {
    renderRitual({
      entry: createMockEntry({
        triggeredBy: 'event_threshold',
        triggerDetail: '我注意到你连续 3 天凌晨 2 点还在学习...',
      }),
    })

    expect(
      screen.getByText('我注意到你连续 3 天凌晨 2 点还在学习...')
    ).toBeInTheDocument()
  })

  it('renders all proposed changes with field paths', () => {
    renderRitual()

    expect(screen.getByText('情绪状态.动力等级')).toBeInTheDocument()
    expect(screen.getByText('生活节奏.精力高峰')).toBeInTheDocument()
  })

  it('shows confidence bar with correct color for high confidence', () => {
    renderRitual({
      entry: createMockEntry({
        proposedChanges: [
          {
            fieldPath: 'emotional.motivationLevel',
            oldValue: 'medium',
            newValue: 'high',
            reasoning: 'test',
            evidenceEventIds: ['evt-1'],
            confidence: 0.9,
          },
        ],
      }),
    })

    const fill = screen.getByTestId('confidence-fill-high').parentElement
    expect(fill).toBeInTheDocument()
  })

  it('shows confidence bar with correct color for medium confidence', () => {
    renderRitual({
      entry: createMockEntry({
        proposedChanges: [
          {
            fieldPath: 'emotional.motivationLevel',
            oldValue: 'medium',
            newValue: 'high',
            reasoning: 'test',
            evidenceEventIds: ['evt-1'],
            confidence: 0.7,
          },
        ],
      }),
    })

    const fill = screen.getByTestId('confidence-fill-medium').parentElement
    expect(fill).toBeInTheDocument()
  })

  it('shows evidence event count', () => {
    renderRitual()

    expect(screen.getByText('基于 3 条行为证据')).toBeInTheDocument()
    expect(screen.getByText('基于 2 条行为证据')).toBeInTheDocument()
  })

  it('calls onAccept when clicking accept button', () => {
    const { onAccept } = renderRitual()

    fireEvent.click(screen.getByText('✅ 接受'))

    expect(onAccept).toHaveBeenCalledWith('evo-1')
  })

  it('calls onReject when clicking reject button', () => {
    const { onReject } = renderRitual()

    fireEvent.click(screen.getByText('❌ 不对'))

    expect(onReject).toHaveBeenCalledWith('evo-1')
  })

  it('enters modify mode when clicking modify button', () => {
    renderRitual()

    fireEvent.click(screen.getByText('✏️ 改一下'))

    expect(screen.getByText('保存修改')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('calls onModify with modified changes when saving', () => {
    const { onModify } = renderRitual()

    fireEvent.click(screen.getByText('✏️ 改一下'))

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'burnout_risk' } })

    fireEvent.click(screen.getByText('保存修改'))

    expect(onModify).toHaveBeenCalledWith('evo-1', [
      expect.objectContaining({
        fieldPath: 'emotional.motivationLevel',
        oldValue: 'medium',
        newValue: 'burnout_risk',
      }),
      expect.objectContaining({
        fieldPath: 'rhythm.energyPeak',
        oldValue: 'morning',
        newValue: 'night_owl',
      }),
    ])
  })

  it('cancels modify mode without calling onModify', () => {
    const { onModify } = renderRitual()

    fireEvent.click(screen.getByText('✏️ 改一下'))

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'burnout_risk' } })

    fireEvent.click(screen.getByText('取消'))

    expect(onModify).not.toHaveBeenCalled()
    expect(screen.getByText('✅ 接受')).toBeInTheDocument()
  })

  it('shows footer with correct text', () => {
    renderRitual()

    expect(
      screen.getByText(/这些理解基于你最近 \d+ 天的行为和对话/)
    ).toBeInTheDocument()
  })

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn()
    renderRitual({ onClose })

    fireEvent.click(screen.getByLabelText('关闭'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not render close button when onClose is not provided', () => {
    renderRitual()

    expect(screen.queryByLabelText('关闭')).not.toBeInTheDocument()
  })

  it('renders reflection note when present', () => {
    renderRitual()

    expect(screen.getByText('这周你坚持得很好，继续保持！')).toBeInTheDocument()
  })

  it('does not render reflection note when empty', () => {
    renderRitual({ entry: createMockEntry({ reflectionNote: '' }) })

    const { container } = renderRitual({ entry: createMockEntry({ reflectionNote: '' }) })
    expect(container.querySelector('[class*="reflectionNote"]')).toBeNull()
  })

  it('renders onViewDetails link when provided', () => {
    const onViewDetails = vi.fn()
    renderRitual({ onViewDetails })

    fireEvent.click(screen.getByText('查看详细分析'))

    expect(onViewDetails).toHaveBeenCalledWith('evo-1')
  })

  it('does not render onViewDetails link when not provided', () => {
    renderRitual()

    expect(screen.queryByText('查看详细分析')).not.toBeInTheDocument()
  })

  it('renders old and new values with correct styling', () => {
    renderRitual()

    expect(screen.getByText('medium')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('morning')).toBeInTheDocument()
    expect(screen.getByText('night_owl')).toBeInTheDocument()
  })

  it('renders manual trigger title', () => {
    renderRitual({ entry: createMockEntry({ triggeredBy: 'manual' }) })

    expect(screen.getByText('让我们一起看看这些变化 🌱')).toBeInTheDocument()
  })
})
