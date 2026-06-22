import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ToastProvider } from './components/toast/Toast'

const renderApp = () => render(<ToastProvider><App /></ToastProvider>)

const getWorkbench = () => screen.findByRole('region', { name: '工作台画布' }, { timeout: 5000 })

const openThemeLibrary = async (user: ReturnType<typeof userEvent.setup>) => {
  const workbench = await getWorkbench()
  await user.click(within(workbench).getByRole('button', { name: '主题切换' }))
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
    window.localStorage.setItem('xinghuanhai-onboarding-completed', 'true')
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the app shell with workbench canvas', async () => {
    renderApp()

    expect(screen.getByRole('heading', { name: '星寰海' })).toBeInTheDocument()
    expect(await getWorkbench()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开侧边栏' })).toBeInTheDocument()
    expect(document.querySelector('.draggable-canvas')).toBeInTheDocument()
  })

  it('shows the 5 default modules on the workbench canvas', async () => {
    renderApp()

    const workbench = await getWorkbench()
    expect(within(workbench).getByText('习惯追踪')).toBeInTheDocument()
    expect(within(workbench).getByText('复盘日记')).toBeInTheDocument()
    expect(within(workbench).getByText('阅读清单')).toBeInTheDocument()
    expect(within(workbench).getAllByText('错题本').length).toBeGreaterThanOrEqual(1)
    expect(within(workbench).getAllByText('记忆卡').length).toBeGreaterThanOrEqual(1)
  })

  it('opens habit tracker as a workbench detail', async () => {
    const user = userEvent.setup()
    renderApp()

    const workbench = await getWorkbench()
    await user.dblClick(within(workbench).getByText('习惯追踪').closest('article')!)

    expect(screen.getByRole('dialog', { name: '习惯追踪 · 工作台详情' })).toBeInTheDocument()
  })

  it('opens journal as a workbench detail', async () => {
    const user = userEvent.setup()
    renderApp()

    const workbench = await getWorkbench()
    await user.dblClick(within(workbench).getByText('复盘日记').closest('article')!)

    expect(screen.getByRole('dialog', { name: '复盘日记 · 工作台详情' })).toBeInTheDocument()
  })

  it('opens error book as a workbench detail', async () => {
    const user = userEvent.setup()
    renderApp()

    const workbench = await getWorkbench()
    const errorBookHeading = within(workbench).getAllByText('错题本')[0]
    await user.dblClick(errorBookHeading.closest('article')!)

    expect(screen.getByRole('dialog', { name: '错题本 · 工作台详情' })).toBeInTheDocument()
  })

  it('opens reading list as a workbench detail', async () => {
    const user = userEvent.setup()
    renderApp()

    const workbench = await getWorkbench()
    await user.dblClick(within(workbench).getByText('阅读清单').closest('article')!)

    expect(screen.getByRole('dialog', { name: '阅读清单 · 工作台详情' })).toBeInTheDocument()
  })

  it('opens memory cards as a workbench detail', async () => {
    const user = userEvent.setup()
    renderApp()

    const workbench = await getWorkbench()
    const memoryCard = within(workbench).getAllByText('记忆卡')[0].closest('article')!
    await user.dblClick(memoryCard)

    expect(screen.getByRole('dialog', { name: '记忆卡 · 工作台详情' })).toBeInTheDocument()
  })

  it('opens a searchable theme library from the theme center button', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(screen.queryByRole('dialog', { name: '主题库' })).not.toBeInTheDocument()

    const dialog = await openThemeLibrary(user)

    expect(within(dialog).getByRole('searchbox', { name: '搜索主题' })).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: '挑一个今天的氛围' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tablist', { name: '主题分类' })).toBeInTheDocument()
    expect(dialog.querySelector('.theme-modal-grid')).toBeInTheDocument()
  })

  it('filters theme choices by search keyword', async () => {
    const user = userEvent.setup()
    renderApp()

    const dialog = await openThemeLibrary(user)
    await searchTheme(user, '薄荷')

    expect(within(dialog).getByRole('button', { name: '多巴胺薄荷绿' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: '极简高级感' })).not.toBeInTheDocument()
  })

  it('closes the theme popup with Escape and backdrop click', async () => {
    const user = userEvent.setup()
    renderApp()

    await openThemeLibrary(user)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }))
    })
    expect(screen.queryByRole('dialog', { name: '主题库' })).not.toBeInTheDocument()

    const dialog = await openThemeLibrary(user)
    await user.click(within(dialog).getByRole('button', { name: '关闭' }))
    expect(screen.queryByRole('dialog', { name: '主题库' })).not.toBeInTheDocument()
  })

  it('clears the previous theme search when reopening the popup', async () => {
    const user = userEvent.setup()
    renderApp()

    const dialog = await openThemeLibrary(user)
    await searchTheme(user, '薄荷')
    await user.click(within(dialog).getByRole('button', { name: '关闭' }))

    const reopenedDialog = await openThemeLibrary(user)
    expect(screen.getByRole('searchbox', { name: '搜索主题' })).toHaveValue('')
    expect(within(reopenedDialog).getByRole('button', { name: '极简高级感' })).toBeInTheDocument()
  })

  it('switches to a theme from the theme popup', async () => {
    const user = userEvent.setup()
    renderApp()

    await openThemeLibrary(user)
    await searchTheme(user, '年轻')
    await user.click(screen.getByRole('button', { name: '轻多巴胺年轻感' }))

    expect(screen.getAllByText('轻多巴胺年轻感').length).toBeGreaterThan(0)
    expect(document.documentElement.dataset.theme).toBe('cream-dopamine')
    expect(screen.queryByRole('dialog', { name: '主题库' })).not.toBeInTheDocument()
  })

  it('keeps the manually selected theme when switching persona workflows', async () => {
    const user = userEvent.setup()
    renderApp()

    await openThemeLibrary(user)
    await searchTheme(user, '年轻')
    await user.click(screen.getByRole('button', { name: '轻多巴胺年轻感' }))
    await switchPersona(user, '职场办公')

    expect(screen.getAllByText('轻多巴胺年轻感').length).toBeGreaterThan(0)
    expect(document.documentElement.dataset.theme).toBe('cream-dopamine')
  })

  it('uses persona recommended themes until the user manually selects a theme', async () => {
    const user = userEvent.setup()
    renderApp()

    await switchPersona(user, '职场办公')

    expect(screen.getAllByText('商务蓝灰').length).toBeGreaterThan(0)
    expect(document.documentElement.dataset.theme).toBe('business-bluegray')
  })

  it('restores persona recommended theme mode from a manual theme', async () => {
    const user = userEvent.setup()
    renderApp()

    await switchPersona(user, '职场办公')
    await openThemeLibrary(user)
    await searchTheme(user, '年轻')
    await user.click(screen.getByRole('button', { name: '轻多巴胺年轻感' }))
    const restoreButtons = screen.getAllByRole('button', { name: '恢复场景推荐主题' })
    await user.click(restoreButtons[0])

    expect(screen.getAllByText('商务蓝灰').length).toBeGreaterThan(0)
    expect(document.documentElement.dataset.theme).toBe('business-bluegray')
  })

  it('supports the full identity management flow from the app shell', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: '打开侧边栏' }))
    await user.click(screen.getByRole('button', { name: '身份切换' }))

    const identityDialog = await screen.findByRole('dialog', { name: '身份管理' }, { timeout: 3000 })
    expect(identityDialog).toBeInTheDocument()

    const createButton = screen.getByRole('button', { name: '创建新身份' })
    await user.click(createButton)
    expect(within(identityDialog).getByRole('heading', { name: '身份管理' })).toBeInTheDocument()

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

    await user.click(within(identityDialog).getByRole('button', { name: '删除 页面级验证身份已编辑' }))
    await user.click(within(identityDialog).getByRole('button', { name: '确认删除' }))

    expect(within(identityDialog).queryByText('页面级验证身份已编辑')).not.toBeInTheDocument()

    await user.click(within(identityDialog).getByRole('button', { name: '关闭' }))
    expect(screen.queryByRole('dialog', { name: '身份管理' })).not.toBeInTheDocument()
  })
})
