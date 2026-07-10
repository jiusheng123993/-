import { act, render, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CanvasCard } from './CanvasCard'

const renderCanvasCard = (props: Partial<Parameters<typeof CanvasCard>[0]> = {}) => {
  const onDragStart = vi.fn()
  const onDragEnd = vi.fn()
  const onMove = vi.fn()
  const onRemove = vi.fn()
  const onResize = vi.fn()

  render(
    <div className="draggable-canvas">
      <CanvasCard
        title="今日行动"
        description="管理今日待办"
        size={{ columns: 2, rows: 1 }}
        position={{ x: 0, y: 0 }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onMove={onMove}
        onRemove={onRemove}
        onResize={onResize}
        {...props}
      >
        <button type="button">打开详情</button>
      </CanvasCard>
    </div>
  )

  return { onDragStart, onDragEnd, onMove, onRemove, onResize }
}

const dispatchPointerMove = (clientX: number, clientY: number, pointerType: 'mouse' | 'touch' = 'mouse') => {
  act(() => {
    window.dispatchEvent(new PointerEvent('pointermove', { clientX, clientY, pointerType }))
  })
}

const dispatchPointerUp = (pointerType: 'mouse' | 'touch' = 'mouse') => {
  act(() => {
    window.dispatchEvent(new PointerEvent('pointerup', { pointerType }))
  })
}

describe('CanvasCard', () => {
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
  const OriginalPointerEvent = window.PointerEvent

  beforeEach(() => {
    if (!window.PointerEvent) {
      window.PointerEvent = MouseEvent as typeof PointerEvent
    }
  })

  afterEach(() => {
    window.PointerEvent = OriginalPointerEvent
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    cleanup()
  })

  it('drags from a dedicated handle and keeps card content clickable', () => {
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (this instanceof HTMLElement && this.classList.contains('draggable-canvas')) {
        return {
          x: 0,
          y: 0,
          width: 1200,
          height: 800,
          top: 0,
          left: 0,
          right: 1200,
          bottom: 800,
          toJSON: () => ({})
        } as DOMRect
      }

      return originalGetBoundingClientRect.call(this)
    }

    const { onMove } = renderCanvasCard()

    const detailButton = screen.getByRole('button', { name: '打开详情' })
    act(() => {
      detailButton.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0, bubbles: true }))
    })
    dispatchPointerMove(360, 0)
    dispatchPointerUp()

    expect(onMove).not.toHaveBeenCalled()

    const dragHeading = document.querySelector('.card-heading') as HTMLElement
    act(() => {
      dragHeading.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, clientY: 0, bubbles: true }))
    })
    dispatchPointerMove(360, 0)
    dispatchPointerUp()

    expect(onMove).toHaveBeenCalledWith({ x: 1, y: 0 })
  })

  it('supports touch pointer drag via pointer events', () => {
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (this instanceof HTMLElement && this.classList.contains('draggable-canvas')) {
        return {
          x: 0, y: 0, width: 1200, height: 800,
          top: 0, left: 0, right: 1200, bottom: 800,
          toJSON: () => ({})
        } as DOMRect
      }
      return originalGetBoundingClientRect.call(this)
    }

    const { onMove } = renderCanvasCard()

    const dragHeading = document.querySelector('.card-heading') as HTMLElement
    act(() => {
      dragHeading.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, clientY: 0, bubbles: true, pointerType: 'touch' }))
    })
    dispatchPointerMove(360, 0, 'touch')
    dispatchPointerUp('touch')

    expect(onMove).toHaveBeenCalledWith({ x: 1, y: 0 })
  })
})