import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AIRecommendationUI } from './AIRecommendationUI'
import type { Module } from './types'

const recommendedModules: Module[] = [
  {
    id: 'today-actions',
    title: '今日行动',
    description: '整理今天最重要的行动',
    icon: '✅',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-session',
    title: '专注计时',
    description: '保持稳定的专注节奏',
    icon: '⏱️',
    category: 'learning',
    size: { columns: 1, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'health-check',
    title: '健康提醒',
    description: '提醒喝水和休息',
    icon: '🌿',
    category: 'health',
    size: { columns: 1, rows: 1 },
    isDefault: false,
    isCustom: false
  }
]

const renderRecommendation = (props: Partial<Parameters<typeof AIRecommendationUI>[0]> = {}) => {
  const onClose = vi.fn()
  const onApply = vi.fn()
  const onReRecommend = vi.fn()

  render(
    <AIRecommendationUI
      modules={recommendedModules}
      identityDescription="我是一名备考学生"
      onClose={onClose}
      onApply={onApply}
      onReRecommend={onReRecommend}
      {...props}
    />
  )

  return { onClose, onApply, onReRecommend }
}

describe('AIRecommendationUI', () => {
  it('applies the default selected recommendations and supports batch selection', async () => {
    const user = userEvent.setup()
    const { onApply } = renderRecommendation()

    await user.click(screen.getByRole('button', { name: '应用推荐布局 (3/3)' }))
    expect(onApply).toHaveBeenLastCalledWith(['today-actions', 'focus-session', 'health-check'])

    await user.click(screen.getByRole('button', { name: '取消全选' }))
    const applyButton = screen.getByRole('button', { name: '应用推荐布局 (0/3)' })
    expect(applyButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '全选' }))
    await user.click(screen.getByRole('button', { name: '应用推荐布局 (3/3)' }))
    expect(onApply).toHaveBeenLastCalledWith(['today-actions', 'focus-session', 'health-check'])
  })

  it('recommends again with the trimmed identity description and disables empty requests', async () => {
    const user = userEvent.setup()
    const { onReRecommend } = renderRecommendation()
    const descriptionInput = screen.getByPlaceholderText('请输入你的身份描述，例如：我是一名产品经理，需要管理多个项目...')

    await user.clear(descriptionInput)
    await user.type(descriptionInput, '  我需要兼顾复习和健康  ')
    await user.click(screen.getByRole('button', { name: '重新推荐' }))

    expect(onReRecommend).toHaveBeenCalledWith('我需要兼顾复习和健康')

    await user.clear(descriptionInput)
    expect(screen.getByRole('button', { name: '重新推荐' })).toBeDisabled()
  })

  it('minimizes, restores, and closes from the main dialog', async () => {
    const user = userEvent.setup()
    const { onClose } = renderRecommendation()

    await user.click(screen.getByRole('button', { name: '最小化' }))
    expect(screen.getByText('AI 推荐模块')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '还原窗口' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '还原窗口' }))
    expect(screen.getByRole('dialog', { name: 'AI 推荐模块' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '关闭 AI 推荐模块' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('expands the card stack on long press and toggles individual recommendations', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const { onApply } = renderRecommendation()
    const firstCardTitle = screen.getByRole('heading', { name: '今日行动' })
    const firstCard = firstCardTitle.closest('article')

    expect(firstCard).not.toBeNull()

    act(() => {
      firstCard!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      vi.advanceTimersByTime(500)
      firstCard!.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    const checkbox = screen.getByRole('checkbox', { name: '选择 今日行动' })
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    await user.click(screen.getByRole('button', { name: '应用推荐布局 (2/3)' }))

    expect(onApply).toHaveBeenCalledWith(['focus-session', 'health-check'])
  })

  it('opens module details, allows local edits, and returns to the recommendation stack', async () => {
    const user = userEvent.setup()
    renderRecommendation()

    await user.click(screen.getByRole('heading', { name: '专注计时' }))

    const detailDialog = screen.getByRole('dialog')
    expect(within(detailDialog).getByRole('heading', { name: '模块详情' })).toBeInTheDocument()

    const titleInput = within(detailDialog).getByPlaceholderText('请输入模块标题')
    await user.clear(titleInput)
    await user.type(titleInput, '深度专注')
    expect(titleInput).toHaveValue('深度专注')

    await user.selectOptions(within(detailDialog).getAllByRole('combobox')[0], 'health')
    expect(within(detailDialog).getByText(/关注健康，保持良好状态/)).toBeInTheDocument()

    await user.click(within(detailDialog).getByRole('button', { name: '保存' }))
    expect(screen.getByRole('dialog', { name: 'AI 推荐模块' })).toBeInTheDocument()
  })
})