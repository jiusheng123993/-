import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const openThemeLibrary = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /打开主题库/ }))
  return screen.getByRole('dialog', { name: '主题库' })
}

const searchTheme = async (user: ReturnType<typeof userEvent.setup>, query: string) => {
  const searchInput = screen.getByRole('searchbox', { name: '搜索主题' })
  await user.clear(searchInput)
  await user.type(searchInput, query)
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('opens a searchable theme library from a single theme center button', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByRole('dialog', { name: '主题库' })).not.toBeInTheDocument()

    const dialog = await openThemeLibrary(user)

    expect(within(dialog).getByRole('searchbox', { name: '搜索主题' })).toBeInTheDocument()
    expect(within(dialog).getByText('上下滑动浏览全部主题，输入关键词可快速定位。')).toBeInTheDocument()
    expect(dialog.querySelector('.theme-modal-list')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '极简高级感' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '多巴胺薄荷绿' })).toBeInTheDocument()
  })

  it('filters theme choices by search keyword inside the popup', async () => {
    const user = userEvent.setup()
    render(<App />)

    const dialog = await openThemeLibrary(user)
    await searchTheme(user, '薄荷')

    expect(within(dialog).getByRole('button', { name: '多巴胺薄荷绿' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: '极简高级感' })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: '水墨雨青' })).not.toBeInTheDocument()
  })

  it('closes the theme popup with Escape and backdrop click', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThemeLibrary(user)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: '主题库' })).not.toBeInTheDocument()

    await openThemeLibrary(user)
    const backdrop = document.querySelector('.theme-modal-backdrop')
    expect(backdrop).toBeInTheDocument()
    await user.click(backdrop as Element)
    expect(screen.queryByRole('dialog', { name: '主题库' })).not.toBeInTheDocument()
  })

  it('clears the previous theme search when reopening the popup', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThemeLibrary(user)
    await searchTheme(user, '薄荷')
    await user.click(screen.getByRole('button', { name: '关闭主题库' }))

    const reopenedDialog = await openThemeLibrary(user)
    expect(screen.getByRole('searchbox', { name: '搜索主题' })).toHaveValue('')
    expect(within(reopenedDialog).getByRole('button', { name: '极简高级感' })).toBeInTheDocument()
  })

  it('switches to the cream dopamine theme from the theme popup', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThemeLibrary(user)
    await searchTheme(user, '年轻')
    await user.click(screen.getByRole('button', { name: '轻多巴胺年轻感' }))

    expect(screen.getByText('当前主题：轻多巴胺年轻感')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('cream-dopamine')
    expect(screen.queryByRole('dialog', { name: '主题库' })).not.toBeInTheDocument()
  })

  it('offers multiple selectable dopamine color palettes through popup search', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByRole('button', { name: '多巴胺薄荷绿' })).not.toBeInTheDocument()

    const dialog = await openThemeLibrary(user)
    await searchTheme(user, '多巴胺')
    await user.click(within(dialog).getByRole('button', { name: '多巴胺薄荷绿' }))

    expect(screen.getByText('当前主题：多巴胺薄荷绿')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dopamine-green')

    const reopenedDialog = await openThemeLibrary(user)
    await searchTheme(user, '多巴胺')
    expect(within(reopenedDialog).getByRole('button', { name: '多巴胺柠檬黄' })).toBeInTheDocument()
    expect(within(reopenedDialog).getByRole('button', { name: '多巴胺蜜桃粉' })).toBeInTheDocument()
    expect(within(reopenedDialog).getByRole('button', { name: '多巴胺组合色' })).toBeInTheDocument()
  })

  it('shows theme color swatches before selecting a palette', async () => {
    const user = userEvent.setup()
    render(<App />)

    const dialog = await openThemeLibrary(user)
    await searchTheme(user, '薄荷')

    const dopamineGreen = within(dialog).getByRole('button', { name: '多巴胺薄荷绿' })
    const swatches = dopamineGreen.querySelectorAll('.theme-swatch')

    expect(swatches).toHaveLength(3)
    expect(swatches[0]).toHaveStyle({ background: '#28a774' })
    expect(swatches[1]).toHaveStyle({ background: '#f0b73c' })
    expect(swatches[2]).toHaveStyle({ background: '#ee7aa7' })
  })

  it('uses the active theme on the growth level card instead of a fixed dark block', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThemeLibrary(user)
    await searchTheme(user, '水墨留白')
    await user.click(screen.getByRole('button', { name: '水墨留白' }))

    const growthCard = screen.getByRole('heading', { name: 'Lv. 18' }).closest('section')
    expect(growthCard).toHaveClass('growth-card')
    expect(growthCard).not.toHaveClass('dark-card')
    expect(growthCard).toHaveStyle({ background: 'linear-gradient(135deg, #f7f3e8 0%, #ece5d3 100%)' })
  })

  it('shows a desktop focus overview based on the active persona tasks', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('region', { name: '桌面专注概览' })).toBeInTheDocument()
    expect(screen.getAllByText('33%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2 个待办').length).toBeGreaterThan(0)
    expect(screen.getByText('95 分钟')).toBeInTheDocument()
    expect(screen.getAllByText('1 个已完成').length).toBeGreaterThan(0)
    expect(screen.getByText('60:00')).toBeInTheDocument()
    expect(screen.getAllByText('完成高数极限专题 20 题').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /职场办公/ }))

    expect(screen.getAllByText('0%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2 个待办').length).toBeGreaterThan(0)
    expect(screen.getByText('75 分钟')).toBeInTheDocument()
    expect(screen.getByText('45:00')).toBeInTheDocument()
    expect(screen.getAllByText('补齐项目首页结构说明').length).toBeGreaterThan(0)
  })

  it('keeps the manually selected theme when switching persona workflows', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThemeLibrary(user)
    await searchTheme(user, '年轻')
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
    await openThemeLibrary(user)
    await searchTheme(user, '年轻')
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

  it('binds the next persona task to the focus timer and counts down to completion', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    render(<App />)

    const timerCard = screen.getByRole('region', { name: '任务专注计时器' })
    expect(within(timerCard).getByText('60:00')).toBeInTheDocument()

    const startButton = within(timerCard).getByRole('button', { name: '绑定任务开始' })
    await user.click(startButton)

    expect(within(timerCard).getByRole('button', { name: '暂停专注' })).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(within(timerCard).getByText('59:58')).toBeInTheDocument()

    await user.click(within(timerCard).getByRole('button', { name: '暂停专注' }))
    expect(within(timerCard).getByRole('button', { name: '继续专注' })).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime((59 * 60 + 58) * 1000)
    })
    expect(within(timerCard).getByText('59:58')).toBeInTheDocument()

    await user.click(within(timerCard).getByRole('button', { name: '继续专注' }))
    await act(async () => {
      vi.advanceTimersByTime((59 * 60 + 58) * 1000)
    })
    await act(async () => {
      vi.advanceTimersByTime(50)
    })

    expect(within(timerCard).getByText('35:00')).toBeInTheDocument()
    expect(within(timerCard).getByText('背诵四级核心词 80 个')).toBeInTheDocument()
    expect(screen.getByText('Lv. 18')).toBeInTheDocument()
    expect(screen.getByText('24 个成就 · 1320 XP')).toBeInTheDocument()
    expect(within(timerCard).getByRole('button', { name: '绑定任务开始' })).toBeInTheDocument()

    const historyCard = screen.getByRole('region', { name: '最近专注会话' })
    expect(within(historyCard).getByText('完成高数极限专题 20 题')).toBeInTheDocument()
    expect(within(historyCard).getByText(/60 分钟 · 60 XP/)).toBeInTheDocument()
  })

  it('lets the user adjust focus duration before starting and shows stable countdown', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    render(<App />)

    const timerCard = screen.getByRole('region', { name: '任务专注计时器' })
    const decrease = within(timerCard).getByRole('button', { name: '减少专注时长' })
    const increase = within(timerCard).getByRole('button', { name: '增加专注时长' })
    const durationInput = within(timerCard).getByLabelText('专注时长（分钟）') as HTMLInputElement

    expect(durationInput.value).toBe('60')
    expect(within(timerCard).getByText('60:00')).toBeInTheDocument()

    await user.click(decrease)
    await user.click(decrease)
    expect(durationInput.value).toBe('50')
    expect(within(timerCard).getByText('50:00')).toBeInTheDocument()
    expect(within(timerCard).getByText(/今天 · 50 XP/)).toBeInTheDocument()

    await user.click(increase)
    expect(durationInput.value).toBe('55')
    expect(within(timerCard).getByText('55:00')).toBeInTheDocument()

    await user.click(within(timerCard).getByRole('button', { name: '绑定任务开始' }))

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(within(timerCard).getByText('54:59')).toBeInTheDocument()

    expect(decrease).toBeDisabled()
    expect(increase).toBeDisabled()
    expect(durationInput).toBeDisabled()

    await user.click(within(timerCard).getByRole('button', { name: '暂停专注' }))
    await user.click(within(timerCard).getByRole('button', { name: '重置' }))

    expect(within(timerCard).getByText('60:00')).toBeInTheDocument()

    await user.click(within(timerCard).getByRole('button', { name: '绑定任务开始' }))
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(within(timerCard).getByText('59:59')).toBeInTheDocument()
  })
})
