import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StudyPlannerUI } from './StudyPlannerUI'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

Object.defineProperty(window, 'crypto', {
  value: { randomUUID: () => `test-uuid-${Math.random().toString(36).slice(2, 10)}` }
})

describe('StudyPlannerUI', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('renders empty state', () => {
    render(<StudyPlannerUI />)
    expect(screen.getByText('学习计划')).toBeTruthy()
    expect(screen.getByText('还没有学习计划')).toBeTruthy()
    expect(screen.getByText('创建考试复习计划，AI 帮你分阶段规划')).toBeTruthy()
  })

  it('opens create plan form', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))
    expect(screen.getByText('创建学习计划')).toBeTruthy()
    expect(screen.getByPlaceholderText('考试名称（如：高考复习、期末冲刺）')).toBeTruthy()
  })

  it('creates a study plan', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))

    const nameInput = screen.getByPlaceholderText('考试名称（如：高考复习、期末冲刺）')
    fireEvent.change(nameInput, { target: { value: '高考复习' } })

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-07-01' } })

    fireEvent.click(screen.getByText('创建计划'))

    expect(screen.getByText('高考复习')).toBeTruthy()
    expect(screen.getByText('📅 2026-07-01')).toBeTruthy()
  })

  it('cancels create plan form', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))
    fireEvent.click(screen.getByText('取消'))
    expect(screen.queryByText('创建学习计划')).toBeNull()
  })

  it('adds target score rows', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))
    fireEvent.click(screen.getByText('+ 添加科目'))

    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(2)
  })

  it('opens plan detail on click', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))

    const nameInput = screen.getByPlaceholderText('考试名称（如：高考复习、期末冲刺）')
    fireEvent.change(nameInput, { target: { value: '期末冲刺' } })

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-06-30' } })

    fireEvent.click(screen.getByText('创建计划'))
    fireEvent.click(screen.getByText('期末冲刺'))

    expect(screen.getByText('期末冲刺')).toBeTruthy()
    expect(screen.getByText('← 返回列表')).toBeTruthy()
  })

  it('adds a phase to a plan', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))

    const nameInput = screen.getByPlaceholderText('考试名称（如：高考复习、期末冲刺）')
    fireEvent.change(nameInput, { target: { value: '高考复习' } })

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-07-01' } })

    fireEvent.click(screen.getByText('创建计划'))
    fireEvent.click(screen.getByText('高考复习'))

    fireEvent.click(screen.getByText('+ 添加阶段'))

    const phaseSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(phaseSelect, { target: { value: '基础巩固' } })

    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-06-10' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-06-20' } })

    fireEvent.click(screen.getByRole('button', { name: '添加阶段' }))

    expect(screen.getAllByText('基础巩固').length).toBeGreaterThan(0)
  })

  it('adds a task to a phase', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))

    const nameInput = screen.getByPlaceholderText('考试名称（如：高考复习、期末冲刺）')
    fireEvent.change(nameInput, { target: { value: '高考复习' } })

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-07-01' } })

    fireEvent.click(screen.getByText('创建计划'))
    fireEvent.click(screen.getByText('高考复习'))

    fireEvent.click(screen.getByText('+ 添加阶段'))

    const phaseSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(phaseSelect, { target: { value: '基础巩固' } })

    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-06-10' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-06-20' } })

    fireEvent.click(screen.getByRole('button', { name: '添加阶段' }))

    fireEvent.click(screen.getByText('+ 添加任务'))

    const taskInput = screen.getByPlaceholderText('任务标题')
    fireEvent.change(taskInput, { target: { value: '完成数学三角函数练习' } })

    fireEvent.click(screen.getByRole('button', { name: '添加任务' }))

    expect(screen.getAllByText('完成数学三角函数练习').length).toBeGreaterThan(0)
  })

  it('toggles task completion', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))

    const nameInput = screen.getByPlaceholderText('考试名称（如：高考复习、期末冲刺）')
    fireEvent.change(nameInput, { target: { value: '高考复习' } })

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-07-01' } })

    fireEvent.click(screen.getByText('创建计划'))
    fireEvent.click(screen.getByText('高考复习'))

    fireEvent.click(screen.getByText('+ 添加阶段'))

    const phaseSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(phaseSelect, { target: { value: '基础巩固' } })

    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-06-10' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-06-20' } })

    fireEvent.click(screen.getByRole('button', { name: '添加阶段' }))

    fireEvent.click(screen.getByText('+ 添加任务'))

    const taskInput = screen.getByPlaceholderText('任务标题')
    fireEvent.change(taskInput, { target: { value: '完成数学三角函数练习' } })

    fireEvent.click(screen.getByRole('button', { name: '添加任务' }))

    const checkButtons = screen.getAllByText('○')
    fireEvent.click(checkButtons[0])

    const checkMarks = screen.getAllByText('✓')
    expect(checkMarks.length).toBeGreaterThan(0)
  })

  it('deletes a plan', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))

    const nameInput = screen.getByPlaceholderText('考试名称（如：高考复习、期末冲刺）')
    fireEvent.change(nameInput, { target: { value: '高考复习' } })

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-07-01' } })

    fireEvent.click(screen.getByText('创建计划'))

    const deleteButtons = screen.getAllByTitle('删除计划')
    fireEvent.click(deleteButtons[0])

    expect(screen.getByText('还没有学习计划')).toBeTruthy()
  })

  it('shows AI locked message when not member', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))

    const nameInput = screen.getByPlaceholderText('考试名称（如：高考复习、期末冲刺）')
    fireEvent.change(nameInput, { target: { value: '高考复习' } })

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-07-01' } })

    fireEvent.click(screen.getByText('创建计划'))
    fireEvent.click(screen.getByText('高考复习'))

    expect(screen.getByText('🔒 AI 功能为会员专属，且需配置 API Key')).toBeTruthy()
  })

  it('navigates back to plan list', () => {
    render(<StudyPlannerUI />)
    fireEvent.click(screen.getByText('+ 创建计划'))

    const nameInput = screen.getByPlaceholderText('考试名称（如：高考复习、期末冲刺）')
    fireEvent.change(nameInput, { target: { value: '高考复习' } })

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-07-01' } })

    fireEvent.click(screen.getByText('创建计划'))
    fireEvent.click(screen.getByText('高考复习'))

    fireEvent.click(screen.getByText('← 返回列表'))

    expect(screen.getByText('+ 创建计划')).toBeTruthy()
  })
})
