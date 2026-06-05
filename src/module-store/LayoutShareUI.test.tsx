import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LayoutShareUI } from './LayoutShareUI'

const mockLayoutData = {
  exportedAt: '2024-06-04T10:00:00.000Z',
  activeModules: [
    { moduleId: 'today-tasks', position: { x: 0, y: 0 }, size: { columns: 2, rows: 1 } },
    { moduleId: 'focus-timer', position: { x: 1, y: 0 }, size: { columns: 1, rows: 1 } }
  ],
  modules: [
    { id: 'custom-1', title: '晨间复盘', description: '记录每日反思', category: 'custom', size: { columns: 2, rows: 1 } }
  ]
}

const mockLayoutJson = JSON.stringify(mockLayoutData, null, 2)

const renderLayoutShare = (props: Partial<Parameters<typeof LayoutShareUI>[0]> = {}) => {
  const onClose = vi.fn()
  const onImport = vi.fn()

  render(
    <LayoutShareUI
      exportedLayout={mockLayoutJson}
      onClose={onClose}
      onImport={onImport}
      {...props}
    />
  )

  return { onClose, onImport }
}

describe('LayoutShareUI', () => {
  it('displays layout metadata correctly', () => {
    renderLayoutShare()

    expect(screen.getByRole('heading', { name: /布局保存/ })).toBeInTheDocument()
    expect(screen.getByText(/导出时间/)).toBeInTheDocument()
    expect(screen.getByText(/活跃模块/)).toBeInTheDocument()
    expect(screen.getByText(/^自定义模块/)).toBeInTheDocument()
  })

  it('shows dropzone with correct text', () => {
    renderLayoutShare()

    expect(screen.getByText('拖拽 .json 文件到此处导入')).toBeInTheDocument()
  })

  it('displays the layout JSON in textarea', () => {
    renderLayoutShare()

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue(mockLayoutJson)
  })

  it('closes when clicking backdrop', async () => {
    const user = userEvent.setup()
    const { onClose } = renderLayoutShare()

    await user.click(screen.getByRole('presentation'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when clicking close button', async () => {
    const user = userEvent.setup()
    const { onClose } = renderLayoutShare()

    await user.click(screen.getByRole('button', { name: /关闭/ }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('imports layout when clicking import button', async () => {
    const user = userEvent.setup()
    const { onImport } = renderLayoutShare()

    await user.click(screen.getByRole('button', { name: '导入布局' }))

    expect(onImport).toHaveBeenCalledWith(mockLayoutJson)
  })

  it('updates draft when editing textarea', async () => {
    const user = userEvent.setup()
    renderLayoutShare()

    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.paste('{"activeModules": []}')

    expect(textarea).toHaveValue('{"activeModules": []}')
  })

  it('imports updated draft when clicking import after edit', async () => {
    const user = userEvent.setup()
    const { onImport } = renderLayoutShare()

    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.paste('{"activeModules": [{"moduleId": "new"}]}')

    await user.click(screen.getByRole('button', { name: '导入布局' }))

    expect(onImport).toHaveBeenCalledWith('{"activeModules": [{"moduleId": "new"}]}')
  })

  it('shows file input with json accept attribute', () => {
    renderLayoutShare()

    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toHaveAttribute('accept', '.json')
  })

  it('shows footer note about local storage', () => {
    renderLayoutShare()

    expect(screen.getByText(/当前布局会自动保存到本地/)).toBeInTheDocument()
  })

  it('handles invalid JSON gracefully', () => {
    renderLayoutShare({ exportedLayout: 'invalid-json' })

    expect(screen.getByText(/导出时间：未知/)).toBeInTheDocument()
    expect(screen.getByText(/活跃模块：0/)).toBeInTheDocument()
  })
})