import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ModuleStoreUI } from './ModuleStoreUI'
import type { Module, ModuleStoreState, ModuleItem } from './types'

const createModuleItem = (id: string, title: string, category: string = 'productivity', size: string = 'medium'): Module => ({
  id,
  title,
  description: `模块描述 - ${title}`,
  icon: 'CheckCircle',
  category: category as any,
  size: size as any,
  isDefault: true,
  isCustom: false
})

const createActiveModule = (moduleId: string, position: number = 0): ModuleItem => ({
  moduleId,
  position
})

const createMockState = (modules: Module[], activeModules: ModuleItem[] = []): ModuleStoreState => ({
  availableModules: modules,
  activeModules,
  isStoreOpen: true
})

const renderModuleStore = (props: Partial<Parameters<typeof ModuleStoreUI>[0]> = {}) => {
  const modules = [
    createModuleItem('today-tasks', '今日任务', 'productivity', 'medium'),
    createModuleItem('focus-timer', '专注计时', 'productivity', 'small'),
    createModuleItem('weather', '天气', 'life', 'small'),
    createModuleItem('custom-1', '晨间复盘', 'custom', 'medium')
  ]
  const activeItems = [
    createActiveModule('today-tasks', 0),
    createActiveModule('focus-timer', 1)
  ]
  const state = createMockState(modules, activeItems)

  const onClose = vi.fn()
  const onAddModule = vi.fn()
  const onRemoveModule = vi.fn()
  const onCreateCustomModule = vi.fn()

  render(
    <ModuleStoreUI
      state={state}
      onClose={onClose}
      onAddModule={onAddModule}
      onRemoveModule={onRemoveModule}
      onCreateCustomModule={onCreateCustomModule}
      {...props}
    />
  )

  return { onClose, onAddModule, onRemoveModule, onCreateCustomModule, state }
}

describe('ModuleStoreUI', () => {
  it('displays module store with correct header and module count', () => {
    renderModuleStore()

    expect(screen.getByRole('heading', { name: /模块商店/ })).toBeInTheDocument()
    expect(screen.getByText(/已激活 2\/4/)).toBeInTheDocument()
  })

  it('filters modules by category tabs', async () => {
    const user = userEvent.setup()
    renderModuleStore()

    await user.click(screen.getByRole('tab', { name: '效率' }))

    expect(screen.getByText('今日任务')).toBeInTheDocument()
    expect(screen.getByText('专注计时')).toBeInTheDocument()
    expect(screen.queryByText('天气')).not.toBeInTheDocument()
  })

  it('searches modules by title or description', async () => {
    const user = userEvent.setup()
    renderModuleStore()

    await user.type(screen.getByPlaceholderText('搜索模块名称或描述...'), '今日')

    expect(screen.getByText('今日任务')).toBeInTheDocument()
    expect(screen.queryByText('专注计时')).not.toBeInTheDocument()
  })

  it('adds module to canvas when clicking add button', async () => {
    const user = userEvent.setup()
    const { onAddModule } = renderModuleStore()

    const weatherArticle = screen.getByText('天气').closest('article')
    await user.click(within(weatherArticle!).getByRole('button', { name: '添加到画布' }))

    expect(onAddModule).toHaveBeenCalledWith('weather')
  })

  it('removes module from canvas when clicking remove button', async () => {
    const user = userEvent.setup()
    const { onRemoveModule } = renderModuleStore()

    const todayTasksArticle = screen.getByText('今日任务').closest('article')
    await user.click(within(todayTasksArticle!).getByRole('button', { name: '从画布移除' }))

    expect(onRemoveModule).toHaveBeenCalledWith('today-tasks')
  })

  it('expands module details on click', async () => {
    const user = userEvent.setup()
    renderModuleStore()

    await user.click(screen.getByText('天气'))

    const article = screen.getByText('天气').closest('article')
    expect(article).toHaveClass('expanded')
    expect(within(article!).getByText('小卡片')).toBeInTheDocument()
    expect(within(article!).getByText('生活')).toBeInTheDocument()
  })

  it('creates custom module with valid input', async () => {
    const user = userEvent.setup()
    const { onCreateCustomModule } = renderModuleStore()

    await user.type(screen.getByPlaceholderText('例如：晨间复盘'), '晚间复盘')
    await user.type(screen.getByPlaceholderText('这个模块要帮你记录什么？'), '记录每日反思')
    await user.selectOptions(screen.getByLabelText('自定义模块尺寸'), 'large')
    await user.click(screen.getByRole('button', { name: '创建并添加到商店' }))

    expect(onCreateCustomModule).toHaveBeenCalledTimes(1)
    const createdModule = onCreateCustomModule.mock.calls[0][0]
    expect(createdModule.title).toBe('晚间复盘')
    expect(createdModule.description).toBe('记录每日反思')
    expect(createdModule.size).toBe('large')
    expect(createdModule.category).toBe('custom')
    expect(createdModule.isCustom).toBe(true)
  })

  it('creates custom module with default title when title is empty', async () => {
    const user = userEvent.setup()
    const { onCreateCustomModule } = renderModuleStore()

    await user.type(screen.getByPlaceholderText('这个模块要帮你记录什么？'), '有描述没标题')
    await user.click(screen.getByRole('button', { name: '创建并添加到商店' }))

    expect(onCreateCustomModule).toHaveBeenCalledTimes(1)
    const createdModule = onCreateCustomModule.mock.calls[0][0]
    expect(createdModule.title).toBe('自定义模块')
    expect(createdModule.description).toBe('有描述没标题')
  })

  it('closes module store when clicking backdrop', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModuleStore()

    await user.click(screen.getByRole('presentation'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes module store when clicking close button', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModuleStore()

    await user.click(screen.getByRole('button', { name: '关闭模块商店' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows custom category tab when custom modules exist', () => {
    const customModule = createModuleItem('custom-test', '测试自定义', 'custom', 'medium')
    const state = createMockState([
      createModuleItem('today-tasks', '今日任务'),
      customModule
    ], [])

    render(
      <ModuleStoreUI
        state={state}
        onClose={() => {}}
        onAddModule={() => {}}
        onRemoveModule={() => {}}
        onCreateCustomModule={() => {}}
      />
    )

    expect(screen.getByRole('tab', { name: '自定义' })).toBeInTheDocument()
  })
})
