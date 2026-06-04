import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DraggableCanvas } from './DraggableCanvas'
import type { CanvasItem, Module } from '../module-store/types'

const createModule = (id: string, title: string, size: string = 'medium'): Module => ({
  id,
  title,
  description: `模块描述 - ${title}`,
  icon: 'CheckCircle',
  category: 'productivity',
  size: size as any,
  isDefault: true,
  isCustom: false
})

const createCanvasItem = (moduleId: string, x: number, y: number, size: string = 'medium'): CanvasItem => ({
  moduleId,
  position: { x, y },
  size: size as any
})

const renderCanvas = (props: Partial<Parameters<typeof DraggableCanvas>[0]> = {}) => {
  const modules = [
    createModule('today-tasks', '今日任务', 'medium'),
    createModule('focus-timer', '专注计时', 'small'),
    createModule('weather', '天气', 'small')
  ]
  const items = [
    createCanvasItem('today-tasks', 0, 0, 'medium'),
    createCanvasItem('focus-timer', 1, 0, 'small'),
    createCanvasItem('weather', 2, 0, 'small')
  ]

  const onItemsChange = vi.fn()
  const onRemoveModule = vi.fn()

  render(
    <DraggableCanvas
      items={items}
      modules={modules}
      onItemsChange={onItemsChange}
      onRemoveModule={onRemoveModule}
      {...props}
    />
  )

  return { onItemsChange, onRemoveModule, modules, items }
}

describe('DraggableCanvas', () => {
  it('renders all canvas items', () => {
    renderCanvas()

    expect(screen.getByText('今日任务')).toBeInTheDocument()
    expect(screen.getByText('专注计时')).toBeInTheDocument()
    expect(screen.getByText('天气')).toBeInTheDocument()
  })

  it('renders with correct grid layout', () => {
    renderCanvas()

    const canvas = screen.getByText('今日任务').closest('.draggable-canvas')
    expect(canvas).toHaveStyle({ display: 'grid' })
    expect(canvas).toHaveStyle({ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' })
  })

  it('calls onRemoveModule when remove button is clicked', () => {
    const { onRemoveModule } = renderCanvas()

    const closeButton = screen.getByRole('button', { name: /关闭 今日任务/ })
    fireEvent.click(closeButton)

    expect(onRemoveModule).toHaveBeenCalledWith('today-tasks')
  })

  it('renders module descriptions', () => {
    renderCanvas()

    expect(screen.getByText('模块描述 - 今日任务')).toBeInTheDocument()
    expect(screen.getByText('模块描述 - 专注计时')).toBeInTheDocument()
  })

  it('handles empty items array', () => {
    renderCanvas({ items: [] })

    const canvas = document.querySelector('.draggable-canvas')
    expect(canvas).toBeEmptyDOMElement()
  })

  it('handles modules without matching items', () => {
    const modules = [
      createModule('today-tasks', '今日任务'),
      createModule('new-module', '新模块')
    ]
    const items = [
      createCanvasItem('today-tasks', 0, 0)
    ]

    renderCanvas({ modules, items })

    expect(screen.getByText('今日任务')).toBeInTheDocument()
    expect(screen.queryByText('新模块')).not.toBeInTheDocument()
  })

  it('renders with different module sizes', () => {
    const modules = [
      createModule('small-module', '小模块', 'small'),
      createModule('large-module', '大模块', 'large'),
      createModule('full-module', '通栏模块', 'full-width')
    ]
    const items = [
      createCanvasItem('small-module', 0, 0, 'small'),
      createCanvasItem('large-module', 0, 1, 'large'),
      createCanvasItem('full-module', 0, 3, 'full-width')
    ]

    renderCanvas({ modules, items })

    expect(screen.getByText('小模块')).toBeInTheDocument()
    expect(screen.getByText('大模块')).toBeInTheDocument()
    expect(screen.getByText('通栏模块')).toBeInTheDocument()
  })
})
