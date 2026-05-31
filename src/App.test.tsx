import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders the exam student persona dashboard', () => {
    render(<App />)

    expect(screen.getByText('GrowthOS')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '学生备考' })).toBeInTheDocument()
    expect(screen.getByText('考试冲刺计划')).toBeInTheDocument()
    expect(screen.getByText('错题闭环率')).toBeInTheDocument()
    expect(screen.getByText('20 天备考冲刺模板')).toBeInTheDocument()
    expect(screen.getAllByText(/薄弱科目/).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'AI 备考教练' })).toBeInTheDocument()
    expect(screen.getByText('微信小程序')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '小程序试验版' })).toBeInTheDocument()
    expect(screen.getByText('可独立使用的完整移动版应用')).toBeInTheDocument()
    expect(screen.getByText('微信小程序原生')).toBeInTheDocument()
    expect(screen.getByText('HarmonyOS')).toBeInTheDocument()
    expect(screen.getByText('设计定位')).toBeInTheDocument()
    expect(screen.getByText('极简高级、低噪音、长期耐看')).toBeInTheDocument()
  })

  it('switches to the cream dopamine theme from the theme center', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '轻多巴胺年轻感' }))

    const selectedTheme = screen.getByRole('button', { name: '轻多巴胺年轻感' })
    expect(screen.getByText('当前主题：轻多巴胺年轻感')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('cream-dopamine')
    expect(selectedTheme).toHaveStyle({
      background: 'rgba(255, 255, 255, 0.94)',
      color: '#ff7a90'
    })
  })

  it('offers multiple selectable dopamine color palettes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '多巴胺薄荷绿' }))

    expect(screen.getByText('当前主题：多巴胺薄荷绿')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dopamine-green')
    expect(screen.getByRole('button', { name: '多巴胺柠檬黄' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '多巴胺蜜桃粉' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '多巴胺组合色' })).toBeInTheDocument()
  })

  it('groups expanded theme choices by aesthetic families', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '极简' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '多巴胺' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '水墨' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '夜间' })).toBeInTheDocument()
    expect(screen.getByText('5 款')).toBeInTheDocument()
    expect(screen.getAllByText('3 款').length).toBeGreaterThan(0)
  })

  it('shows theme color swatches before selecting a palette', () => {
    render(<App />)

    const dopamineGreen = screen.getByRole('button', { name: '多巴胺薄荷绿' })
    const swatches = dopamineGreen.querySelectorAll('.theme-swatch')

    expect(swatches).toHaveLength(3)
    expect(swatches[0]).toHaveStyle({ background: '#28a774' })
    expect(swatches[1]).toHaveStyle({ background: '#f0b73c' })
    expect(swatches[2]).toHaveStyle({ background: '#ee7aa7' })
  })

  it('uses the active theme on the growth level card instead of a fixed dark block', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '水墨留白' }))

    const growthCard = screen.getByRole('heading', { name: 'Lv. 18' }).closest('section')
    expect(growthCard).toHaveClass('growth-card')
    expect(growthCard).not.toHaveClass('dark-card')
    expect(growthCard).toHaveStyle({ background: 'linear-gradient(135deg, #f7f3e8 0%, #ece5d3 100%)' })
  })

  it('keeps the manually selected theme when switching persona workflows', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '轻多巴胺年轻感' }))
    await user.click(screen.getByRole('button', { name: /职场办公/ }))

    expect(screen.getByText('当前主题：轻多巴胺年轻感')).toBeInTheDocument()
    expect(screen.getByText('手动主题')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('cream-dopamine')
    expect(screen.getByRole('heading', { name: '职场办公' })).toBeInTheDocument()
  })

  it('uses persona recommended themes until the user manually selects a theme', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /职场办公/ }))

    expect(screen.getByText('当前主题：商务蓝灰')).toBeInTheDocument()
    expect(screen.getByText('场景推荐')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('business-bluegray')
  })

  it('restores persona recommended theme mode from a manual theme', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /职场办公/ }))
    await user.click(screen.getByRole('button', { name: '轻多巴胺年轻感' }))
    await user.click(screen.getByRole('button', { name: '恢复场景推荐主题' }))

    expect(screen.getByText('当前主题：商务蓝灰')).toBeInTheDocument()
    expect(screen.getByText('场景推荐')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('business-bluegray')
  })

  it('switches persona content into office-specific workflows', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /职场办公/ }))

    expect(screen.getByRole('heading', { name: '职场办公' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '项目推进看板' })).toBeInTheDocument()
    expect(screen.getByText('逾期风险数')).toBeInTheDocument()
    expect(screen.getByText('本周项目推进模板')).toBeInTheDocument()
    expect(screen.getAllByText(/负责人/).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'AI 项目助理' })).toBeInTheDocument()
  })

  it('switches persona content into creator-specific workflows', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /内容创作/ }))

    expect(screen.getByRole('heading', { name: '内容创作' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '内容生产线' })).toBeInTheDocument()
    expect(screen.getByText('选题转化率')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'AI 选题策划' })).toBeInTheDocument()
  })
})
