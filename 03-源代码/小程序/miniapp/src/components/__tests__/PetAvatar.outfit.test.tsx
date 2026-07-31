/**
 * 宠物头像饰品穿搭测试
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tarojs/components', () => ({
  View: ({ children, className, style, onClick }: any) => (
    <div className={className} style={style} onClick={onClick}>{children}</div>
  ),
  Text: ({ children, className, style }: any) => (
    <span className={className} style={style}>{children}</span>
  ),
  Image: ({ src, className, style, mode }: any) => (
    <img src={src} className={className} style={style} data-mode={mode} />
  ),
}))

const mockExpression = {
  expression: 'happy' as const,
  label: '开心',
  color: '#4CAF50',
  eyes: 'happy',
  mouth: 'smile',
  accessory: 'blush',
  animation: 'bounce' as const
}

vi.mock('../../engines/petAvatar', () => ({
  calculateExpression: vi.fn(() => mockExpression),
  getPetFaceDataUri: vi.fn(() => 'data:image/svg+xml,facestub'),
  generateDiaryForToday: vi.fn(() => null),
}))

vi.mock('../../engines/petAvatar/outfitRenderer', () => ({
  resolveOutfitLayers: vi.fn(() => []),
}))

import PetAvatar from '../PetAvatar'
import { getPetFaceDataUri } from '../../engines/petAvatar'
import { resolveOutfitLayers } from '../../engines/petAvatar/outfitRenderer'
import type { ExpressionContext } from '../../types/avatarTypes'
import type { OutfitSlotMap } from '../../types/wardrobeTypes'

const defaultContext: ExpressionContext = {
  todayEntry: null, hasAnomaly: false, anomalyCount: 0,
  riskLevel: null, streakDays: 0, isBirthday: false,
  isVaccineComplete: false, isRecovery: false, isDeceased: false,
}

describe('PetAvatar with outfit', () => {
  it('renders without outfitSlots prop', () => {
    const { container } = render(
      <PetAvatar species='dog' petName='Buddy' expressionContext={defaultContext} />
    )
    expect(container.querySelector('.pet-avatar')).toBeDefined()
  })

  it('calls resolveOutfitLayers when outfitSlots provided', () => {
    const slots: OutfitSlotMap = { head: 'hat_bowler' }
    render(
      <PetAvatar species='dog' petName='Buddy' expressionContext={defaultContext} outfitSlots={slots} />
    )
    expect(resolveOutfitLayers).toHaveBeenCalledWith(slots, 'dog')
  })

  it('passes outfitLayers to getPetFaceDataUri', () => {
    vi.clearAllMocks()
    const slots: OutfitSlotMap = { head: 'hat_bowler' }
    render(
      <PetAvatar species='dog' petName='Buddy' expressionContext={defaultContext} outfitSlots={slots} />
    )
    expect(getPetFaceDataUri).toHaveBeenCalledWith(
      expect.objectContaining({ expression: 'happy' }),
      'dog',
      100,
      expect.any(Array)
    )
  })

  it('does not call resolveOutfitLayers when outfitSlots is undefined', () => {
    vi.clearAllMocks()
    render(
      <PetAvatar species='dog' petName='Buddy' expressionContext={defaultContext} />
    )
    expect(resolveOutfitLayers).not.toHaveBeenCalled()
  })
})
