import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createInitialWorkspaceState } from './data/workspaceStore'

const openThemeLibrary = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /打开主题库/ }))
  return screen.getByRole('dialog', { name: '主题库' })
}

const switchPersona = async (user: ReturnType<typeof userEvent.setup>, personaName: string) => {
  await user.click(screen.getByRole('button', { name: /切换用户场景/ }))
  await user.click(screen.getByRole('option', { name: new RegExp(personaName) }))
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

  it('renders the exam student persona dashboard with the new workbench canvas', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '星寰海' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '星寰海画布工作台' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拖动 考试冲刺计划' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拖动 今日行动' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拖动 AI 备考教练' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拖动 小程序试验版' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拖动 主题中心' })).toBeInTheDocument()
  })

  it('uses the latest independent sidebar and the workbench canvas', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '星寰海' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开侧边栏' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '星寰海画布工作台' })).toBeInTheDocument()
    expect(document.querySelector('.draggable-canvas')).toBeInTheDocument()
    expect(document.querySelectorAll('aside.sidebar')).toHaveLength(1)
    expect(document.querySelector('.app-shell > aside.sidebar.panel')).not.toBeInTheDocument()
    expect(document.querySelector('.dashboard-grid')).not.toBeInTheDocument()
    expect(document.querySelector('.today-panel')).not.toBeInTheDocument()
  })

  it('moves legacy dashboard blocks into the draggable canvas workbench and lazy-loads details', async () => {
    const user = userEvent.setup()
    render(<App />)

    const workbench = screen.getByRole('region', { name: '星寰海画布工作台' })
    expect(workbench).toBeInTheDocument()
    expect(within(workbench).getByRole('button', { name: '拖动 考试冲刺计划' })).toBeInTheDocument()
    expect(within(workbench).getByRole('button', { name: '拖动 今日行动' })).toBeInTheDocument()
    expect(within(workbench).getByRole('button', { name: '拖动 主题中心' })).toBeInTheDocument()
    expect(document.querySelector('.dashboard-grid')).not.toBeInTheDocument()
    expect(document.querySelector('.today-panel')).not.toBeInTheDocument()
    expect(screen.queryByText('默认行动建议')).not.toBeInTheDocument()

    await user.click(within(workbench).getByRole('button', { name: '打开 考试冲刺计划详情' }))

    expect(screen.getByRole('dialog', { name: '考试冲刺计划 · 工作台详情' })).toBeInTheDocument()
    expect(screen.getByText('默认行动建议')).toBeInTheDocument()
  })

  it('opens today actions as a lazy workbench detail and completes a task', async () => {
    const user = userEvent.setup()
    render(<App />)

    const workbench = screen.getByRole('region', { name: '星寰海画布工作台' })
    expect(screen.queryByRole('dialog', { name: '今日行动 · 工作台详情' })).not.toBeInTheDocument()

    await user.click(within(workbench).getByRole('button', { name: '打开 今日行动详情' }))

    const dialog = screen.getByRole('dialog', { name: '今日行动 · 工作台详情' })
    expect(within(dialog).getByRole('heading', { name: '今日行动' })).toBeInTheDocument()
    expect(within(dialog).getByText('完成高数极限专题 20 题')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '完成 完成高数极限专题 20 题' }))

    expect(within(dialog).getByRole('button', { name: '已完成 完成高数极限专题 20 题' })).toBeDisabled()
    expect(screen.getByText('2 个已完成')).toBeInTheDocument()
  })

  it('opens focus session as a lazy workbench detail and controls the active timer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    render(<App />)

    const workbench = screen.getByRole('region', { name: '星寰海画布工作台' })
    expect(screen.queryByRole('dialog', { name: '任务专注 · 工作台详情' })).not.toBeInTheDocument()

    await user.click(within(workbench).getByRole('button', { name: '打开 任务专注详情' }))

    const dialog = screen.getByRole('dialog', { name: '任务专注 · 工作台详情' })
    expect(within(dialog).getByRole('heading', { name: '任务专注' })).toBeInTheDocument()
    expect(within(dialog).getByText('完成高数极限专题 20 题')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '减少详情专注时长' }))
    expect(within(dialog).getByText('55:00')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '绑定任务开始' }))
    expect(within(dialog).getByRole('button', { name: '暂停专注' })).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(within(dialog).getByText('54:59')).toBeInTheDocument()
  })

  it('opens memory insights as a lazy workbench detail with focus history and forget controls', async () => {
    const seededState = createInitialWorkspaceState()
    seededState.focusSessions = [
      {
        id: 'focus-seeded-1',
        taskId: 'task-1',
        taskTitle: '完成高数极限专题 20 题',
        workspaceType: 'study',
        minutes: 60,
        rewardPoints: 60,
        completedAt: new Date('2026-06-04T08:00:00.000Z').toISOString()
      }
    ]
    window.localStorage.setItem('growth-workbench-state', JSON.stringify(seededState))

    const user = userEvent.setup()
    render(<App />)

    const workbench = screen.getByRole('region', { name: '星寰海画布工作台' })
    expect(screen.queryByRole('dialog', { name: '记忆洞察 · 工作台详情' })).not.toBeInTheDocument()

    await user.click(within(workbench).getByRole('button', { name: '打开 记忆洞察详情' }))

    const dialog = screen.getByRole('dialog', { name: '记忆洞察 · 工作台详情' })
    expect(within(dialog).getByRole('heading', { name: '记忆洞察' })).toBeInTheDocument()
    expect(within(dialog).getByText(/完成 60 分钟专注：完成高数极限专题 20 题/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '忘记 完成高数极限专题 20 题' }))

    expect(within(dialog).getByText('暂无记忆记录，完成专注后会显示在这里。')).toBeInTheDocument()
  })

  it('opens growth RPG as a lazy workbench detail and claims the daily reward', async () => {
    const user = userEvent.setup()
    render(<App />)

    const workbench = screen.getByRole('region', { name: '星寰海画布工作台' })
    expect(screen.queryByRole('dialog', { name: '成长等级 · 工作台详情' })).not.toBeInTheDocument()

    await user.click(within(workbench).getByRole('button', { name: '打开 成长等级详情' }))

    const dialog = screen.getByRole('dialog', { name: '成长等级 · 工作台详情' })
    expect(within(dialog).getByRole('heading', { name: '成长等级' })).toBeInTheDocument()
    expect(within(dialog).getByText('1260 积分')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '领取今日成长奖励' }))

    expect(within(dialog).getByText('1280 积分')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '今日奖励已领取' })).toBeDisabled()
  })

  it('opens AI coach as a lazy workbench detail and generates a local action draft', async () => {
    const user = userEvent.setup()
    render(<App />)

    const workbench = screen.getByRole('region', { name: '星寰海画布工作台' })
    expect(screen.queryByRole('dialog', { name: 'AI 备考教练 · 工作台详情' })).not.toBeInTheDocument()

    await user.click(within(workbench).getByRole('button', { name: '打开 AI 备考教练详情' }))

    const dialog = screen.getByRole('dialog', { name: 'AI 备考教练 · 工作台详情' })
    expect(within(dialog).getByRole('heading', { name: 'AI 备考教练' })).toBeInTheDocument()
    expect(within(dialog).getByText('DeepSeek')).toBeInTheDocument()
    expect(within(dialog).getByText('生成今日行动计划')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '生成本地行动草稿' }))

    expect(within(dialog).getByText('本地草稿已生成')).toBeInTheDocument()
    expect(within(dialog).getByText(/今日先推进/)).toBeInTheDocument()
  })

  it('opens platform matrix as a lazy workbench detail and marks sync as ready', async () => {
    const user = userEvent.setup()
    render(<App />)

    const workbench = screen.getByRole('region', { name: '星寰海画布工作台' })
    expect(screen.queryByRole('dialog', { name: '多端预留 · 工作台详情' })).not.toBeInTheDocument()

    await user.click(within(workbench).getByRole('button', { name: '打开 多端预留详情' }))

    const dialog = screen.getByRole('dialog', { name: '多端预留 · 工作台详情' })
    expect(within(dialog).getByRole('heading', { name: '多端预留' })).toBeInTheDocument()
    expect(within(dialog).getByText('Desktop')).toBeInTheDocument()
    expect(within(dialog).getByText('local-only')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '标记同步接口已预留' }))

    expect(within(dialog).getByText('sync-ready')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '同步接口已预留' })).toBeDisabled()
  })

  it('opens mini program preview as a lazy workbench detail and switches preview pages', async () => {
    const user = userEvent.setup()
    render(<App />)

    const workbench = screen.getByRole('region', { name: '星寰海画布工作台' })
    expect(screen.queryByRole('dialog', { name: '小程序试验版 · 工作台详情' })).not.toBeInTheDocument()

    await user.click(within(workbench).getByRole('button', { name: '打开 小程序试验版详情' }))

    const dialog = screen.getByRole('dialog', { name: '小程序试验版 · 工作台详情' })
    expect(within(dialog).getByRole('heading', { name: '小程序试验版' })).toBeInTheDocument()
    expect(within(dialog).getByText('微信小程序原生')).toBeInTheDocument()
    expect(within(dialog).getByText('优先做 3 件事')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '切换到模块页' }))

    expect(within(dialog).getByText('移动首页工作台')).toBeInTheDocument()
    expect(within(dialog).getByText('隐私与同步预留')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '切换到首页预览' })).toBeInTheDocument()
  })

  it('opens a searchable theme library from a single theme center button', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByRole('dialog', { name: '主题库' })).not.toBeInTheDocument()

    const dialog = await openThemeLibrary(user)

    expect(within(dialog).getByRole('searchbox', { name: '搜索主题' })).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: '挑一个今天的氛围' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tablist', { name: '主题分类' })).toBeInTheDocument()
    expect(dialog.querySelector('.theme-modal-grid')).toBeInTheDocument()
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

    expect(screen.getAllByText('轻多巴胺年轻感').length).toBeGreaterThan(0)
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

    expect(screen.getAllByText('多巴胺薄荷绿').length).toBeGreaterThan(0)
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

    const growthCard = screen.getByText('Lv. 18').closest('section')
    expect(growthCard).toHaveClass('growth-card')
    expect(growthCard).not.toHaveClass('dark-card')
    expect(growthCard).toHaveStyle({ background: 'linear-gradient(135deg, #f7f3e8 0%, #ece5d3 100%)' })
  })

  it('shows a desktop focus overview based on the active persona tasks', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('2 个待办')).toBeInTheDocument()
    expect(screen.getByText('95 分钟')).toBeInTheDocument()
    expect(screen.getByText('1 个已完成')).toBeInTheDocument()
    expect(screen.getByText('60:00')).toBeInTheDocument()
    expect(screen.getAllByText('完成高数极限专题 20 题').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /切换用户场景/ }))
    await user.click(screen.getByRole('option', { name: /.*职场办公.*/ }))

    expect(screen.getByText('75 分钟')).toBeInTheDocument()
    expect(screen.getByText('45:00')).toBeInTheDocument()
    expect(screen.getAllByText('补齐项目首页结构说明').length).toBeGreaterThan(0)
  })

  it('lets the user switch focus brief visual style and persists it', async () => {
    const user = userEvent.setup()
    render(<App />)

    const trigger = screen.getByRole('button', { name: /切换专注概览样式/ })
    await user.click(trigger)

    const menu = await screen.findByRole('menu', { name: '专注概览样式' })
    expect(menu).toBeInTheDocument()

    const arcOption = within(menu).getByRole('menuitemradio', { name: /极简刻度环/ })
    const barOption = within(menu).getByRole('menuitemradio', { name: /水平进度条/ })
    const gaugeOption = within(menu).getByRole('menuitemradio', { name: /半圆仪表盘/ })

    expect(arcOption).toHaveAttribute('aria-checked', 'true')
    expect(barOption).toHaveAttribute('aria-checked', 'false')
    expect(gaugeOption).toHaveAttribute('aria-checked', 'false')

    await user.click(barOption)

    expect(screen.queryByRole('menu', { name: '专注概览样式' })).not.toBeInTheDocument()
    const focusCard = screen.getByText('2 个待办').closest('[data-style]')
    expect(focusCard).toHaveAttribute('data-style', 'stat-bar')

    const stored = window.localStorage.getItem('growth-workbench-state')
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!).preferences.focusBriefStyle).toBe('stat-bar')

    await user.click(screen.getByRole('button', { name: /切换专注概览样式/ }))
    await user.click(
      within(screen.getByRole('menu', { name: '专注概览样式' }))
        .getByRole('menuitemradio', { name: /半圆仪表盘/ })
    )
    expect(screen.getByText('2 个待办').closest('[data-style]')).toHaveAttribute(
      'data-style',
      'half-gauge'
    )
  })

  it('reflects the active theme aesthetic and material on the focus brief card', () => {
    render(<App />)

    const focusCard = screen.getByText('2 个待办').closest('[data-aesthetic]')
    expect(focusCard).toHaveAttribute('data-aesthetic')
    expect(focusCard).toHaveAttribute('data-material')
    expect(focusCard!.getAttribute('data-aesthetic')).not.toBe('')
    expect(focusCard!.getAttribute('data-material')).not.toBe('')
  })

  it('keeps the manually selected theme when switching persona workflows', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThemeLibrary(user)
    await searchTheme(user, '年轻')
    await user.click(screen.getByRole('button', { name: '轻多巴胺年轻感' }))
    await switchPersona(user, '职场办公')

    expect(screen.getAllByText('轻多巴胺年轻感').length).toBeGreaterThan(0)
    expect(document.documentElement.dataset.theme).toBe('cream-dopamine')
    expect(screen.getByRole('heading', { name: '职场办公' })).toBeInTheDocument()
  })

  it('uses persona recommended themes until the user manually selects a theme', async () => {
    const user = userEvent.setup()
    render(<App />)

    await switchPersona(user, '职场办公')

    expect(screen.getAllByText('商务蓝灰').length).toBeGreaterThan(0)
    expect(document.documentElement.dataset.theme).toBe('business-bluegray')
  })

  it('restores persona recommended theme mode from a manual theme', async () => {
    const user = userEvent.setup()
    render(<App />)

    await switchPersona(user, '职场办公')
    await openThemeLibrary(user)
    await searchTheme(user, '年轻')
    await user.click(screen.getByRole('button', { name: '轻多巴胺年轻感' }))
    await user.click(screen.getByRole('button', { name: '恢复场景推荐主题' }))

    expect(screen.getAllByText('商务蓝灰').length).toBeGreaterThan(0)
    expect(document.documentElement.dataset.theme).toBe('business-bluegray')
  })

  it('switches persona content into office-specific workflows', async () => {
    const user = userEvent.setup()
    render(<App />)

    await switchPersona(user, '职场办公')

    expect(screen.getByRole('heading', { name: '职场办公' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拖动 项目推进看板' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拖动 AI 项目助理' })).toBeInTheDocument()
  })

  it('switches persona content into creator-specific workflows', async () => {
    const user = userEvent.setup()
    render(<App />)

    await switchPersona(user, '内容创作')

    expect(screen.getByRole('heading', { name: '内容创作' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拖动 内容生产线' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拖动 AI 选题策划' })).toBeInTheDocument()
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
    expect(screen.getByText('24 个成就 · 1320 积分')).toBeInTheDocument()
    expect(within(timerCard).getByRole('button', { name: '绑定任务开始' })).toBeInTheDocument()

    const historyCard = screen.getByRole('region', { name: '最近专注会话' })
    expect(within(historyCard).getByText('完成高数极限专题 20 题')).toBeInTheDocument()
    expect(within(historyCard).getByText(/60 分钟 · 60 积分/)).toBeInTheDocument()

    const storedMemory = window.localStorage.getItem('growth-workbench-memory-state')
    expect(storedMemory).not.toBeNull()
    expect(JSON.parse(storedMemory!).events[0].content).toContain('完成 60 分钟专注：完成高数极限专题 20 题')

    const memoryPanel = await screen.findByRole('region', { name: '记忆洞察' })
    expect(within(memoryPanel).getByText('近期上下文')).toBeInTheDocument()
    expect(within(memoryPanel).getByText(/完成 60 分钟专注：完成高数极限专题 20 题/)).toBeInTheDocument()
    expect(within(memoryPanel).getByRole('button', { name: /忘记/ })).toBeInTheDocument()
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
    expect(within(timerCard).getByText(/今天 · 50 积分/)).toBeInTheDocument()

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

  it('supports the full identity management flow from the app shell', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '打开侧边栏' }))
    await user.click(screen.getByRole('button', { name: '设置' }))
    await user.click(screen.getByRole('button', { name: /创建身份/ }))

    const identityDialog = screen.getByRole('dialog', { name: '身份管理' })
    expect(within(identityDialog).getByRole('heading', { name: '身份管理' })).toBeInTheDocument()

    await user.click(within(identityDialog).getByRole('button', { name: '创建新身份' }))
    await user.type(within(identityDialog).getByLabelText('身份名称'), '页面级验证身份')
    await user.type(within(identityDialog).getByLabelText('描述（可选）'), '覆盖创建编辑删除流程')
    await user.click(within(identityDialog).getByRole('button', { name: '学生' }))
    await user.click(within(identityDialog).getByRole('button', { name: '创建' }))

    expect(within(identityDialog).getByRole('button', { name: /^页面级验证身份/ })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(identityDialog).getByRole('button', { name: '编辑 页面级验证身份' }))
    await user.clear(within(identityDialog).getByLabelText('身份名称'))
    await user.type(within(identityDialog).getByLabelText('身份名称'), '页面级验证身份已编辑')
    await user.click(within(identityDialog).getByRole('button', { name: '保存' }))

    expect(within(identityDialog).getByRole('button', { name: /^页面级验证身份已编辑/ })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(identityDialog).getByRole('button', { name: '删除 页面级验证身份已编辑' }))
    const deleteDialog = within(identityDialog).getByRole('alertdialog', { name: '删除身份' })
    await user.click(within(deleteDialog).getByRole('button', { name: '取消删除' }))

    expect(within(identityDialog).getByText('页面级验证身份已编辑')).toBeInTheDocument()
    expect(within(identityDialog).queryByRole('alertdialog', { name: '删除身份' })).not.toBeInTheDocument()

    await user.click(within(identityDialog).getByRole('button', { name: '删除 页面级验证身份已编辑' }))
    await user.click(within(identityDialog).getByRole('button', { name: '确认删除' }))

    expect(within(identityDialog).queryByText('页面级验证身份已编辑')).not.toBeInTheDocument()
    expect(within(identityDialog).getByText('已删除身份：页面级验证身份已编辑')).toBeInTheDocument()

    await user.click(within(identityDialog).getByRole('button', { name: '关闭身份管理' }))
    expect(screen.queryByRole('dialog', { name: '身份管理' })).not.toBeInTheDocument()
  })
})
