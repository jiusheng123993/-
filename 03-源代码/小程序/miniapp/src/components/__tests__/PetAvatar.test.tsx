/**
 * 宠物头像组件测试
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

const mockDiary = { emoji: '😊', text: '今天很开心', tone: 'happy' as const }

vi.mock('../../engines/petAvatar', () => ({
  calculateExpression: vi.fn(() => mockExpression),
  getPetFaceDataUri: vi.fn(() => 'data:image/svg+xml;base64,facestub'),
  generateDiaryForToday: vi.fn(() => mockDiary),
  EXPRESSION_MAP: {
    excited: {
      expression: 'excited',
      label: '兴奋',
      eyes: 'star',
      mouth: 'open_smile',
      accessory: 'confetti',
      animation: 'jump' as const,
      color: '#FF69B4'
    }
  },
}))

import PetAvatar from '../PetAvatar'
import { calculateExpression, getPetFaceDataUri, generateDiaryForToday } from '../../engines/petAvatar'
import type { ExpressionContext } from '../../engines/petAvatar'

const defaultContext: ExpressionContext = {
  todayEntry: null,
  hasAnomaly: false,
  anomalyCount: 0,
  riskLevel: null,
  streakDays: 0,
  isBirthday: false,
  isVaccineComplete: false,
  isRecovery: false,
  isDeceased: false,
}

describe('PetAvatar', () => {
  it('renders with default props', () => {
    const { container } = render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} />
    )
    expect(container.querySelector('.pet-avatar')).toBeDefined()
  })

  it('renders Image with faceUri from getPetFaceDataUri', () => {
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} />
    )
    const img = screen.getByRole('img')
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('data:image/svg+xml;base64,facestub')
  })

  it('does not show label by default', () => {
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} />
    )
    expect(screen.queryByText('开心')).toBeNull()
  })

  it('shows label when showLabel=true with expression.label and color', () => {
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} showLabel />
    )
    const labelText = screen.getByText('开心')
    expect(labelText).toBeDefined()
    const labelContainer = labelText.closest('.pet-avatar__label')
    expect(labelContainer).toBeDefined()
    expect((labelContainer as HTMLElement).style.backgroundColor).toBe('rgb(76, 175, 80)')
  })

  it('does not show diary by default', () => {
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} />
    )
    expect(screen.queryByText(/今天很开心/)).toBeNull()
    expect(screen.queryByText('😊')).toBeNull()
  })

  it('shows diary when showDiary=true with emoji, text, author', () => {
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} showDiary />
    )
    expect(screen.getByText('😊')).toBeDefined()
    expect(screen.getByText(/今天很开心/)).toBeDefined()
    expect(screen.getByText(/旺财/)).toBeDefined()
  })

  it('uses customExpression when provided instead of calculateExpression', () => {
    vi.clearAllMocks()
    const customExpression = {
      expression: 'excited' as const,
      label: '兴奋',
      color: '#FF69B4',
      eyes: 'star',
      mouth: 'open_smile',
      accessory: 'confetti',
      animation: 'jump' as const
    }
    render(
      <PetAvatar
        species='dog'
        petName='旺财'
        expressionContext={defaultContext}
        customExpression={customExpression}
        showLabel
      />
    )
    expect(screen.getByText('兴奋')).toBeDefined()
    expect(calculateExpression).not.toHaveBeenCalled()
  })

  it('passes correct species and size to getPetFaceDataUri', () => {
    vi.clearAllMocks()
    render(
      <PetAvatar species='cat' petName='咪咪' expressionContext={defaultContext} size={150} />
    )
    expect(getPetFaceDataUri).toHaveBeenCalledWith(
      expect.objectContaining({ expression: 'happy' }),
      'cat',
      150,
      []
    )
  })

  it('applies className prop', () => {
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} className='custom-class' />
    )
    const avatar = document.querySelector('.pet-avatar.custom-class')
    expect(avatar).toBeDefined()
  })

  it('uses default size of 100 when size not provided', () => {
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} />
    )
    expect(getPetFaceDataUri).toHaveBeenCalledWith(
      expect.anything(),
      'dog',
      100,
      []
    )
  })

  it('calls calculateExpression with expressionContext', () => {
    vi.clearAllMocks()
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} />
    )
    expect(calculateExpression).toHaveBeenCalledWith(defaultContext)
  })

  it('calls generateDiaryForToday with expressionContext fields when showDiary=true', () => {
    vi.clearAllMocks()
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} showDiary />
    )
    expect(generateDiaryForToday).toHaveBeenCalledWith(
      defaultContext.todayEntry,
      defaultContext.streakDays,
      defaultContext.isBirthday,
      defaultContext.isRecovery
    )
  })

  it('does not call generateDiaryForToday when showDiary=false', () => {
    vi.clearAllMocks()
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} showDiary={false} />
    )
    expect(generateDiaryForToday).not.toHaveBeenCalled()
  })

  it('renders image with correct size style', () => {
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} size={200} />
    )
    const img = screen.getByRole('img')
    expect(img.style.width).toBe('200px')
    expect(img.style.height).toBe('200px')
  })

  it('renders diary author with petName', () => {
    render(
      <PetAvatar species='cat' petName='咪咪' expressionContext={defaultContext} showDiary />
    )
    expect(screen.getByText(/咪咪/)).toBeDefined()
  })

  it('applies animation class based on expression.animation', () => {
    render(
      <PetAvatar species='dog' petName='旺财' expressionContext={defaultContext} />
    )
    const img = screen.getByRole('img')
    expect(img.className).toContain('pet-avatar__image--bounce')
  })

  it('applies different animation class for customExpression', () => {
    const customExpression = {
      expression: 'excited' as const,
      label: '兴奋',
      color: '#FF69B4',
      eyes: 'star',
      mouth: 'open_smile',
      accessory: 'confetti',
      animation: 'jump' as const
    }
    render(
      <PetAvatar
        species='dog'
        petName='旺财'
        expressionContext={defaultContext}
        customExpression={customExpression}
      />
    )
    const img = screen.getByRole('img')
    expect(img.className).toContain('pet-avatar__image--jump')
    expect(img.className).not.toContain('pet-avatar__image--bounce')
  })
})
