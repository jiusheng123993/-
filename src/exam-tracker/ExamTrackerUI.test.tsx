import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExamTrackerUI } from './ExamTrackerUI'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${Math.random().toString(36).slice(2, 10)}`
  }
})

describe('ExamTrackerUI', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders empty state', () => {
    render(<ExamTrackerUI />)
    expect(screen.getByText('考试记录')).toBeDefined()
    expect(screen.getByText('还没有考试记录')).toBeDefined()
    expect(screen.getByText('0 次考试')).toBeDefined()
  })

  it('opens add form when clicking add button', () => {
    render(<ExamTrackerUI />)
    fireEvent.click(screen.getByText('+ 添加考试记录'))
    expect(screen.getByText('添加考试记录')).toBeDefined()
    expect(screen.getByText('各科分数')).toBeDefined()
  })

  it('adds an exam record', () => {
    render(<ExamTrackerUI />)
    fireEvent.click(screen.getByText('+ 添加考试记录'))

    const nameInput = screen.getByPlaceholderText('考试名称（如：一模、期中考试）')
    fireEvent.change(nameInput, { target: { value: '一模' } })

    const scoreInputs = screen.getAllByPlaceholderText('分数')
    const totalInputs = screen.getAllByPlaceholderText('满分')
    fireEvent.change(scoreInputs[0], { target: { value: '120' } })
    fireEvent.change(totalInputs[0], { target: { value: '150' } })

    fireEvent.click(screen.getByText('保存'))

    expect(screen.getByText('一模')).toBeDefined()
    expect(screen.getByText('1 次考试')).toBeDefined()
  })

  it('cancels add form', () => {
    render(<ExamTrackerUI />)
    fireEvent.click(screen.getByText('+ 添加考试记录'))
    expect(screen.getByText('添加考试记录')).toBeDefined()
    fireEvent.click(screen.getByText('取消'))
    expect(screen.queryByText('添加考试记录')).toBeNull()
  })

  it('adds multiple score rows', () => {
    render(<ExamTrackerUI />)
    fireEvent.click(screen.getByText('+ 添加考试记录'))
    fireEvent.click(screen.getByText('+ 添加科目'))
    const scoreInputs = screen.getAllByPlaceholderText('分数')
    expect(scoreInputs.length).toBe(2)
  })

  it('removes a score row', () => {
    render(<ExamTrackerUI />)
    fireEvent.click(screen.getByText('+ 添加考试记录'))
    fireEvent.click(screen.getByText('+ 添加科目'))
    const removeButtons = screen.getAllByText('✕')
    fireEvent.click(removeButtons[0])
    const scoreInputs = screen.getAllByPlaceholderText('分数')
    expect(scoreInputs.length).toBe(1)
  })

  it('expands and shows detail when clicking record', () => {
    render(<ExamTrackerUI />)
    fireEvent.click(screen.getByText('+ 添加考试记录'))
    const nameInput = screen.getByPlaceholderText('考试名称（如：一模、期中考试）')
    fireEvent.change(nameInput, { target: { value: '期中考试' } })
    const scoreInputs = screen.getAllByPlaceholderText('分数')
    const totalInputs = screen.getAllByPlaceholderText('满分')
    fireEvent.change(scoreInputs[0], { target: { value: '135' } })
    fireEvent.change(totalInputs[0], { target: { value: '150' } })
    fireEvent.click(screen.getByText('保存'))

    fireEvent.click(screen.getByText('期中考试'))
    expect(screen.getByText('科目')).toBeDefined()
    expect(screen.getByText('得分率')).toBeDefined()
  })

  it('deletes a record', () => {
    render(<ExamTrackerUI />)
    fireEvent.click(screen.getByText('+ 添加考试记录'))
    const nameInput = screen.getByPlaceholderText('考试名称（如：一模、期中考试）')
    fireEvent.change(nameInput, { target: { value: '月考' } })
    const scoreInputs = screen.getAllByPlaceholderText('分数')
    fireEvent.change(scoreInputs[0], { target: { value: '100' } })
    fireEvent.click(screen.getByText('保存'))

    fireEvent.click(screen.getByText('月考'))
    fireEvent.click(screen.getByText('🗑️ 删除'))
    expect(screen.queryByText('月考')).toBeNull()
  })

  it('shows comparison when two records exist', () => {
    render(<ExamTrackerUI />)

    fireEvent.click(screen.getByText('+ 添加考试记录'))
    fireEvent.change(screen.getByPlaceholderText('考试名称（如：一模、期中考试）'), { target: { value: '一模' } })
    fireEvent.change(screen.getAllByPlaceholderText('分数')[0], { target: { value: '120' } })
    fireEvent.change(screen.getAllByPlaceholderText('满分')[0], { target: { value: '150' } })
    fireEvent.click(screen.getByText('保存'))

    fireEvent.click(screen.getByText('+ 添加考试记录'))
    fireEvent.change(screen.getByPlaceholderText('考试名称（如：一模、期中考试）'), { target: { value: '二模' } })
    fireEvent.change(screen.getAllByPlaceholderText('分数')[0], { target: { value: '130' } })
    fireEvent.change(screen.getAllByPlaceholderText('满分')[0], { target: { value: '150' } })
    fireEvent.click(screen.getByText('保存'))

    expect(screen.getByText('2 次考试')).toBeDefined()
    expect(screen.getByText(/📊 .+ vs .+/)).toBeDefined()
  })
})