import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBookUI } from './ErrorBookUI'

vi.mock('./errorBookService', () => ({
  getErrorItems: vi.fn(() => []),
  getSubjects: vi.fn(() => []),
  addErrorItem: vi.fn((item) => ({ ...item, id: 'test-id', createdAt: new Date().toISOString() })),
  deleteErrorItem: vi.fn(() => true),
  updateErrorItem: vi.fn(() => null)
}))

vi.mock('../agent/agentRuntime', () => ({
  sendAgentChatMessageStream: vi.fn()
}))

vi.mock('../hooks/useApiKeyStatus', () => ({
  useApiKeyStatus: vi.fn(() => ({ hasAnyKey: true }))
}))

describe('ErrorBookUI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no items', () => {
    render(<ErrorBookUI />)
    expect(screen.getByText('错题本')).toBeDefined()
    expect(screen.getByText('还没有错题记录')).toBeDefined()
  })

  it('shows add form when clicking add button', () => {
    render(<ErrorBookUI />)
    const addButton = screen.getByText('+ 添加错题')
    fireEvent.click(addButton)
    expect(screen.getByText('添加错题')).toBeDefined()
  })

  it('hides add form when clicking cancel', () => {
    render(<ErrorBookUI />)
    const addButton = screen.getByText('+ 添加错题')
    fireEvent.click(addButton)
    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)
    expect(screen.queryByText('添加错题')).toBeNull()
  })

  it('shows subject tabs', () => {
    render(<ErrorBookUI />)
    expect(screen.getByText('全部')).toBeDefined()
  })
})
