import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

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

vi.mock('../../engines/petAvatar', () => ({
  getPetFaceDataUri: vi.fn(() => 'data:image/svg+xml;base64,facestub'),
  EXPRESSION_MAP: {
    excited: {
      expression: 'excited',
      label: '兴奋',
      eyes: 'star',
      mouth: 'open_smile',
      accessory: 'confetti',
      animation: 'jump',
      color: '#FF69B4'
    }
  },
}))

import AchievementCard, { ACHIEVEMENT_DEFS } from '../AchievementCard'
import type { AchievementConfig } from '../AchievementCard'
import { getPetFaceDataUri } from '../../engines/petAvatar'

const birthdayAchievement: AchievementConfig = {
  type: 'birthday',
  title: '生日快乐',
  subtitle: '又长大一岁了',
  icon: '🎂',
  color: '#FF69B4'
}

const vaccineAchievement: AchievementConfig = {
  type: 'vaccine_complete',
  title: '疫苗全勤',
  subtitle: '年度疫苗全部完成',
  icon: '💉',
  color: '#4CAF50'
}

describe('AchievementCard', () => {
  it('renders achievement title, subtitle, icon, petName', () => {
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='dog' />
    )
    expect(screen.getByText('生日快乐')).toBeDefined()
    expect(screen.getByText('又长大一岁了')).toBeDefined()
    expect(screen.getByText('🎂')).toBeDefined()
    expect(screen.getByText('旺财')).toBeDefined()
  })

  it('shows close button when onClose provided', () => {
    const onClose = vi.fn()
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='dog' onClose={onClose} />
    )
    expect(screen.getByText('✕')).toBeDefined()
  })

  it('does not show close button when onClose not provided', () => {
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='dog' />
    )
    expect(screen.queryByText('✕')).toBeNull()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='dog' onClose={onClose} />
    )
    fireEvent.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders face image with correct species', () => {
    vi.clearAllMocks()
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='cat' />
    )
    expect(getPetFaceDataUri).toHaveBeenCalledWith(
      expect.objectContaining({ expression: 'excited' }),
      'cat',
      80
    )
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('data:image/svg+xml;base64,facestub')
  })

  it('title has achievement color style', () => {
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='dog' />
    )
    const title = screen.getByText('生日快乐')
    expect(title.style.color).toBe('rgb(255, 105, 180)')
  })

  it('footer has achievement color background', () => {
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='dog' />
    )
    const footer = document.querySelector('.achievement-card__footer')
    expect(footer).toBeDefined()
    expect((footer as HTMLElement).style.backgroundColor).toBe('rgb(255, 105, 180)')
  })

  it('ACHIEVEMENT_DEFS has all 7 types', () => {
    const expectedTypes = ['birthday', 'vaccine_complete', 'streak_7', 'streak_30', 'streak_100', 'rainbow_bridge', 'holiday']
    expectedTypes.forEach(type => {
      expect(ACHIEVEMENT_DEFS[type]).toBeDefined()
    })
    expect(Object.keys(ACHIEVEMENT_DEFS)).toHaveLength(7)
  })

  it('ACHIEVEMENT_DEFS each have title, subtitle, icon, color', () => {
    Object.values(ACHIEVEMENT_DEFS).forEach(def => {
      expect(def.title).toBeDefined()
      expect(typeof def.title).toBe('string')
      expect(def.subtitle).toBeDefined()
      expect(typeof def.subtitle).toBe('string')
      expect(def.icon).toBeDefined()
      expect(typeof def.icon).toBe('string')
      expect(def.color).toBeDefined()
      expect(typeof def.color).toBe('string')
    })
  })

  it('renders different achievement types correctly', () => {
    const { unmount } = render(
      <AchievementCard achievement={vaccineAchievement} petName='咪咪' species='cat' />
    )
    expect(screen.getByText('疫苗全勤')).toBeDefined()
    expect(screen.getByText('年度疫苗全部完成')).toBeDefined()
    expect(screen.getByText('💉')).toBeDefined()
    expect(screen.getByText('咪咪')).toBeDefined()
    unmount()
  })

  it('renders card border with achievement color', () => {
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='dog' />
    )
    const card = document.querySelector('.achievement-card')
    expect(card).toBeDefined()
    expect((card as HTMLElement).style.borderColor).toBe('rgb(255, 105, 180)')
  })

  it('renders footer text', () => {
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='dog' />
    )
    expect(screen.getByText('成就纪念卡')).toBeDefined()
  })

  it('renders face image with 80px size style', () => {
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='dog' />
    )
    const img = screen.getByRole('img')
    expect(img.style.width).toBe('80px')
    expect(img.style.height).toBe('80px')
  })

  it('passes EXPRESSION_MAP.excited to getPetFaceDataUri', () => {
    vi.clearAllMocks()
    render(
      <AchievementCard achievement={birthdayAchievement} petName='旺财' species='dog' />
    )
    expect(getPetFaceDataUri).toHaveBeenCalledWith(
      expect.objectContaining({ expression: 'excited' }),
      'dog',
      80
    )
  })
})
