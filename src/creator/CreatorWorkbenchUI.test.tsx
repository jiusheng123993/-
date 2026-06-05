import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { CreatorWorkbenchUI } from './CreatorWorkbenchUI'
import { createCreatorService } from './creatorService'
import type { CreatorService } from './creatorService'

function renderUI(service: CreatorService, compact = false) {
  return render(<CreatorWorkbenchUI compact={compact} service={service} />)
}

function createService() {
  return createCreatorService(`test-${Math.random().toString(36).slice(2)}`)
}

describe('CreatorWorkbenchUI', () => {
  describe('compact mode', () => {
    it('renders compact mode with summary stats', () => {
      renderUI(createService(), true)

      expect(screen.getByText('内容创作工作台')).toBeInTheDocument()
      expect(screen.getByText('灵感数')).toBeInTheDocument()
      expect(screen.getByText('生产中')).toBeInTheDocument()
      expect(screen.getByText('待发布')).toBeInTheDocument()
      expect(screen.getByText('客户项目')).toBeInTheDocument()
      expect(screen.getByText('活跃内容进度')).toBeInTheDocument()
    })

    it('shows zero counts for empty state', () => {
      renderUI(createService(), true)

      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(4)
    })

    it('shows updated counts when data exists', () => {
      const service = createService()
      service.addIdea('测试灵感', '头脑风暴', ['AI'])
      service.addContentPiece('测试内容', 'B站', '2026-07-01')
      service.addPublishEvent('测试发布', '公众号', '2026-12-31')
      service.addClientProject('张三', '品牌设计', '2026-08-01', 50000)

      renderUI(service, true)

      const ones = screen.getAllByText('1')
      expect(ones.length).toBe(4)
    })
  })

  describe('full mode', () => {
    it('renders full mode with tabs', () => {
      renderUI(createService())

      expect(screen.getByText('灵感收集箱')).toBeInTheDocument()
      expect(screen.getByText('内容生产线')).toBeInTheDocument()
      expect(screen.getByText('发布日历')).toBeInTheDocument()
      expect(screen.getByText('客户交付')).toBeInTheDocument()
    })

    it('shows ideas tab by default', () => {
      renderUI(createService())

      expect(screen.getByPlaceholderText('灵感标题')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('来源')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('标签（逗号分隔）')).toBeInTheDocument()
    })

    it('switches to content tab when clicked', () => {
      renderUI(createService())

      fireEvent.click(screen.getByText('内容生产线'))

      expect(screen.getByPlaceholderText('内容标题')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('平台')).toBeInTheDocument()
    })

    it('switches to publish tab when clicked', () => {
      renderUI(createService())

      fireEvent.click(screen.getByText('发布日历'))

      expect(screen.getByPlaceholderText('发布标题')).toBeInTheDocument()
    })

    it('switches to clients tab when clicked', () => {
      renderUI(createService())

      fireEvent.click(screen.getByText('客户交付'))

      expect(screen.getByPlaceholderText('客户名称')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('项目描述')).toBeInTheDocument()
    })
  })

  describe('add idea functionality', () => {
    it('adds an idea via the form', () => {
      const service = createService()
      renderUI(service)

      fireEvent.change(screen.getByPlaceholderText('灵感标题'), {
        target: { value: 'AI写作助手' }
      })
      fireEvent.change(screen.getByPlaceholderText('来源'), {
        target: { value: '头脑风暴' }
      })
      fireEvent.change(screen.getByPlaceholderText('标签（逗号分隔）'), {
        target: { value: 'AI,写作' }
      })

      fireEvent.click(screen.getByText('添加'))

      expect(screen.getByText('AI写作助手')).toBeInTheDocument()
      expect(screen.getByText('AI')).toBeInTheDocument()
      expect(screen.getByText('写作')).toBeInTheDocument()
    })

    it('does not add empty idea', () => {
      const service = createService()
      renderUI(service)

      fireEvent.click(screen.getByText('添加'))

      expect(screen.getByText('暂无灵感，开始记录吧')).toBeInTheDocument()
    })

    it('clears form after adding idea', () => {
      const service = createService()
      renderUI(service)

      fireEvent.change(screen.getByPlaceholderText('灵感标题'), {
        target: { value: '测试灵感' }
      })
      fireEvent.click(screen.getByText('添加'))

      expect(screen.getByPlaceholderText('灵感标题')).toHaveValue('')
    })
  })

  describe('add content piece functionality', () => {
    it('adds a content piece via the form', () => {
      const service = createService()
      renderUI(service)

      fireEvent.click(screen.getByText('内容生产线'))

      fireEvent.change(screen.getByPlaceholderText('内容标题'), {
        target: { value: '视频教程' }
      })
      fireEvent.change(screen.getByPlaceholderText('平台'), {
        target: { value: 'B站' }
      })

      const addButtons = screen.getAllByText('添加')
      fireEvent.click(addButtons[addButtons.length - 1])

      expect(screen.getByText('视频教程')).toBeInTheDocument()
      expect(screen.getAllByText('大纲').length).toBeGreaterThanOrEqual(1)
    })

    it('shows progress bar for content piece', () => {
      const service = createService()
      renderUI(service)

      fireEvent.click(screen.getByText('内容生产线'))

      fireEvent.change(screen.getByPlaceholderText('内容标题'), {
        target: { value: '测试内容' }
      })
      const addButtons = screen.getAllByText('添加')
      fireEvent.click(addButtons[addButtons.length - 1])

      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('delete item functionality', () => {
    it('deletes an idea', () => {
      const service = createService()
      service.addIdea('待删除灵感', '测试', ['测试'])
      renderUI(service)

      expect(screen.getByText('待删除灵感')).toBeInTheDocument()

      const deleteButtons = screen.getAllByTitle('删除')
      fireEvent.click(deleteButtons[0])

      expect(screen.queryByText('待删除灵感')).not.toBeInTheDocument()
    })

    it('deletes a content piece', () => {
      const service = createService()
      service.addContentPiece('待删除内容', 'B站', '2026-07-01')
      renderUI(service)

      fireEvent.click(screen.getByText('内容生产线'))

      expect(screen.getByText('待删除内容')).toBeInTheDocument()

      const deleteButtons = screen.getAllByTitle('删除')
      fireEvent.click(deleteButtons[0])

      expect(screen.queryByText('待删除内容')).not.toBeInTheDocument()
    })

    it('deletes a publish event', () => {
      const service = createService()
      service.addPublishEvent('待删除发布', '公众号', '2026-07-15')
      renderUI(service)

      fireEvent.click(screen.getByText('发布日历'))

      expect(screen.getByText('待删除发布')).toBeInTheDocument()

      const deleteButtons = screen.getAllByTitle('删除')
      fireEvent.click(deleteButtons[0])

      expect(screen.queryByText('待删除发布')).not.toBeInTheDocument()
    })

    it('deletes a client project', () => {
      const service = createService()
      service.addClientProject('待删除客户', '测试项目', '2026-08-01', 10000)
      renderUI(service)

      fireEvent.click(screen.getByText('客户交付'))

      expect(screen.getByText('待删除客户')).toBeInTheDocument()

      const deleteButtons = screen.getAllByTitle('删除')
      fireEvent.click(deleteButtons[0])

      expect(screen.queryByText('待删除客户')).not.toBeInTheDocument()
    })
  })

  describe('status changes', () => {
    it('changes idea status to developing', () => {
      const service = createService()
      service.addIdea('状态测试', '测试', [])
      renderUI(service)

      const editBtn = screen.getByTitle('开始开发')
      fireEvent.click(editBtn)

      expect(screen.getByText('开发中')).toBeInTheDocument()
    })

    it('changes idea status to archived', () => {
      const service = createService()
      service.addIdea('归档测试', '测试', [])
      renderUI(service)

      const archiveBtn = screen.getByTitle('归档')
      fireEvent.click(archiveBtn)

      expect(screen.getByText('已归档')).toBeInTheDocument()
    })

    it('marks publish event as published', () => {
      const service = createService()
      service.addPublishEvent('发布测试', 'B站', '2026-07-15')
      renderUI(service)

      fireEvent.click(screen.getByText('发布日历'))

      const publishBtn = screen.getByTitle('标记为已发布')
      fireEvent.click(publishBtn)

      expect(screen.getByText('已发布')).toBeInTheDocument()
    })
  })

  describe('default service', () => {
    it('creates default service when none provided', () => {
      render(<CreatorWorkbenchUI />)

      expect(screen.getByText('灵感收集箱')).toBeInTheDocument()
    })

    it('creates default service in compact mode', () => {
      render(<CreatorWorkbenchUI compact />)

      expect(screen.getByText('内容创作工作台')).toBeInTheDocument()
    })
  })
})