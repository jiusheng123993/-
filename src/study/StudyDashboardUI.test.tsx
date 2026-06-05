import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { StudyDashboardUI } from './StudyDashboardUI'
import { createStudyService } from './studyService'
import { createMemoryStudyStore, createInitialStudyState } from '../data/localStudyStore'
import type { StudyService } from './studyService'

function renderUI(service: StudyService, compact = false) {
  return render(<StudyDashboardUI compact={compact} service={service} />)
}

function createService() {
  return createStudyService(createMemoryStudyStore(createInitialStudyState()))
}

describe('StudyDashboardUI', () => {
  describe('compact mode', () => {
    it('renders compact mode with summary stats', () => {
      renderUI(createService(), true)

      expect(screen.getByText('学习概览')).toBeInTheDocument()
      expect(screen.getByText('总体进度')).toBeInTheDocument()
      expect(screen.getByText('目标')).toBeInTheDocument()
      expect(screen.getByText('任务')).toBeInTheDocument()
      expect(screen.getByText('待复习')).toBeInTheDocument()
      expect(screen.getByText('目标进度')).toBeInTheDocument()
    })

    it('shows goal count from initial state', () => {
      renderUI(createService(), true)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('shows task completion stats', () => {
      renderUI(createService(), true)

      expect(screen.getByText('1/3')).toBeInTheDocument()
    })

    it('shows top goals with progress', () => {
      renderUI(createService(), true)

      expect(screen.getByText('高数期末冲刺')).toBeInTheDocument()
      expect(screen.getByText('英语四级词汇计划')).toBeInTheDocument()
    })
  })

  describe('full mode', () => {
    it('renders full mode with all sections', () => {
      renderUI(createService())

      expect(screen.getByText('学习仪表盘')).toBeInTheDocument()
      expect(screen.getByText('学习任务')).toBeInTheDocument()
      expect(screen.getByText('学习笔记')).toBeInTheDocument()
      expect(screen.getByText('复习计划')).toBeInTheDocument()
    })

    it('shows stats at the top', () => {
      renderUI(createService())

      expect(screen.getByText('平均进度')).toBeInTheDocument()
      expect(screen.getByText('已完成任务')).toBeInTheDocument()
    })

    it('renders goals from initial state', () => {
      renderUI(createService())

      expect(screen.getAllByText('高数期末冲刺').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('英语四级词汇计划').length).toBeGreaterThanOrEqual(1)
    })

    it('renders tasks from initial state', () => {
      renderUI(createService())

      expect(screen.getAllByText('完成高数极限专题 20 题').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('背诵四级核心词 80 个').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('整理今天的错题复盘').length).toBeGreaterThanOrEqual(1)
    })

    it('renders notes from initial state', () => {
      renderUI(createService())

      expect(screen.getByText('导数应用易错点')).toBeInTheDocument()
      expect(screen.getByText('作文万能句复盘')).toBeInTheDocument()
    })

    it('renders review items from initial state', () => {
      renderUI(createService())

      expect(screen.getByText('洛必达法则适用条件')).toBeInTheDocument()
      expect(screen.getByText('近义词辨析 abandon / desert')).toBeInTheDocument()
    })

    it('renders review level badges with correct colors', () => {
      renderUI(createService())

      const hardBadges = screen.getAllByText('困难')
      const mediumBadges = screen.getAllByText('中等')
      expect(hardBadges.length).toBeGreaterThanOrEqual(1)
      expect(mediumBadges.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('add goal functionality', () => {
    it('adds a new goal when form is submitted', () => {
      renderUI(createService())

      const titleInput = screen.getByPlaceholderText('目标名称')
      const subjectInputs = screen.getAllByPlaceholderText('科目')
      const subjectInput = subjectInputs[0]
      const addButton = screen.getAllByText('添加')[0]

      fireEvent.change(titleInput, { target: { value: '新目标' } })
      fireEvent.change(subjectInput, { target: { value: '物理' } })
      fireEvent.click(addButton)

      const newGoalElements = screen.getAllByText('新目标')
      expect(newGoalElements.length).toBeGreaterThanOrEqual(1)
    })

    it('does not add goal when title is empty', () => {
      renderUI(createService())

      const addButton = screen.getAllByText('添加')[0]

      fireEvent.click(addButton)

      const goals = screen.getAllByText('高数期末冲刺')
      expect(goals.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('toggle task functionality', () => {
    it('toggles task status when checkbox is clicked', () => {
      renderUI(createService())

      const checkboxes = screen.getAllByRole('checkbox')
      const firstCheckbox = checkboxes[0]

      expect(firstCheckbox).not.toBeChecked()

      fireEvent.click(firstCheckbox)

      expect(firstCheckbox).toBeChecked()
    })
  })

  describe('remove item functionality', () => {
    it('removes a goal when delete button is clicked', () => {
      renderUI(createService())

      const deleteButtons = screen.getAllByLabelText('删除目标')
      fireEvent.click(deleteButtons[0])

      expect(screen.queryByText('高数期末冲刺')).not.toBeInTheDocument()
    })

    it('removes a note when delete button is clicked', () => {
      renderUI(createService())

      expect(screen.getByText('导数应用易错点')).toBeInTheDocument()

      const deleteButtons = screen.getAllByLabelText('删除笔记')
      fireEvent.click(deleteButtons[0])

      expect(screen.queryByText('导数应用易错点')).not.toBeInTheDocument()
    })

    it('removes a review item when delete button is clicked', () => {
      renderUI(createService())

      expect(screen.getByText('洛必达法则适用条件')).toBeInTheDocument()

      const deleteButtons = screen.getAllByLabelText('删除复习项')
      fireEvent.click(deleteButtons[0])

      expect(screen.queryByText('洛必达法则适用条件')).not.toBeInTheDocument()
    })

    it('removes a task when delete button is clicked', () => {
      renderUI(createService())

      const deleteButtons = screen.getAllByLabelText('删除任务')
      fireEvent.click(deleteButtons[0])

      expect(screen.queryByText('完成高数极限专题 20 题')).not.toBeInTheDocument()
    })
  })
})