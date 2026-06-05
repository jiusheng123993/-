import { describe, it, expect, beforeEach } from 'vitest'
import { createCreatorService } from './creatorService'
import type { CreatorService } from './creatorService'

describe('CreatorService', () => {
  let service: CreatorService

  beforeEach(() => {
    localStorage.clear()
    service = createCreatorService()
  })

  describe('Ideas', () => {
    it('starts with no ideas', () => {
      expect(service.getIdeas()).toHaveLength(0)
    })

    it('adds an idea', () => {
      const idea = service.addIdea('AI 写作助手', '头脑风暴', ['AI', '写作'])
      expect(idea.id).toBeTruthy()
      expect(idea.title).toBe('AI 写作助手')
      expect(idea.source).toBe('头脑风暴')
      expect(idea.tags).toEqual(['AI', '写作'])
      expect(idea.status).toBe('new')
      expect(idea.createdAt).toBeTruthy()
    })

    it('persists ideas to localStorage', () => {
      service.addIdea('测试创意', '灵感', ['测试'])
      expect(service.getIdeas()).toHaveLength(1)
      const newService = createCreatorService()
      expect(newService.getIdeas()).toHaveLength(1)
    })

    it('updates idea status', () => {
      const idea = service.addIdea('测试创意', '灵感', ['测试'])
      service.updateIdeaStatus(idea.id, 'developing')
      const ideas = service.getIdeas()
      expect(ideas[0].status).toBe('developing')
    })

    it('does nothing when updating non-existent idea', () => {
      service.updateIdeaStatus('non-existent', 'archived')
      expect(service.getIdeas()).toHaveLength(0)
    })

    it('removes an idea', () => {
      const idea = service.addIdea('测试创意', '灵感', ['测试'])
      service.removeIdea(idea.id)
      expect(service.getIdeas()).toHaveLength(0)
    })

    it('does nothing when removing non-existent idea', () => {
      service.removeIdea('non-existent')
      expect(service.getIdeas()).toHaveLength(0)
    })

    it('supports multiple ideas', () => {
      service.addIdea('创意1', '来源1', ['标签1'])
      service.addIdea('创意2', '来源2', ['标签2'])
      service.addIdea('创意3', '来源3', ['标签3'])
      expect(service.getIdeas()).toHaveLength(3)
    })
  })

  describe('Content Pieces', () => {
    it('starts with no content pieces', () => {
      expect(service.getContentPieces()).toHaveLength(0)
    })

    it('adds a content piece', () => {
      const piece = service.addContentPiece('视频教程', 'B站', '2026-07-01')
      expect(piece.id).toBeTruthy()
      expect(piece.title).toBe('视频教程')
      expect(piece.platform).toBe('B站')
      expect(piece.deadline).toBe('2026-07-01')
      expect(piece.stage).toBe('outline')
      expect(piece.progress).toBe(0)
      expect(piece.ideaId).toBeUndefined()
    })

    it('adds a content piece with ideaId', () => {
      const idea = service.addIdea('创意来源', '头脑风暴', ['AI'])
      const piece = service.addContentPiece('视频教程', 'B站', '2026-07-01', idea.id)
      expect(piece.ideaId).toBe(idea.id)
    })

    it('persists content pieces to localStorage', () => {
      service.addContentPiece('测试内容', '公众号', '2026-07-01')
      const newService = createCreatorService()
      expect(newService.getContentPieces()).toHaveLength(1)
    })

    it('updates content progress', () => {
      const piece = service.addContentPiece('测试内容', '公众号', '2026-07-01')
      service.updateContentProgress(piece.id, 50)
      const pieces = service.getContentPieces()
      expect(pieces[0].progress).toBe(50)
    })

    it('clamps progress between 0 and 100', () => {
      const piece = service.addContentPiece('测试内容', '公众号', '2026-07-01')
      service.updateContentProgress(piece.id, 150)
      expect(service.getContentPieces()[0].progress).toBe(100)
      service.updateContentProgress(piece.id, -10)
      expect(service.getContentPieces()[0].progress).toBe(0)
    })

    it('does nothing when updating progress of non-existent piece', () => {
      service.updateContentProgress('non-existent', 50)
      expect(service.getContentPieces()).toHaveLength(0)
    })

    it('updates content stage', () => {
      const piece = service.addContentPiece('测试内容', '公众号', '2026-07-01')
      service.updateContentStage(piece.id, 'draft')
      expect(service.getContentPieces()[0].stage).toBe('draft')
    })

    it('does nothing when updating stage of non-existent piece', () => {
      service.updateContentStage('non-existent', 'review')
      expect(service.getContentPieces()).toHaveLength(0)
    })

    it('removes a content piece', () => {
      const piece = service.addContentPiece('测试内容', '公众号', '2026-07-01')
      service.removeContentPiece(piece.id)
      expect(service.getContentPieces()).toHaveLength(0)
    })

    it('supports multiple content pieces', () => {
      service.addContentPiece('内容1', 'B站', '2026-07-01')
      service.addContentPiece('内容2', '公众号', '2026-08-01')
      service.addContentPiece('内容3', '抖音', '2026-09-01')
      expect(service.getContentPieces()).toHaveLength(3)
    })
  })

  describe('Publish Events', () => {
    it('starts with no publish events', () => {
      expect(service.getPublishEvents()).toHaveLength(0)
    })

    it('adds a publish event', () => {
      const event = service.addPublishEvent('新视频发布', 'B站', '2026-07-15')
      expect(event.id).toBeTruthy()
      expect(event.title).toBe('新视频发布')
      expect(event.platform).toBe('B站')
      expect(event.scheduledDate).toBe('2026-07-15')
      expect(event.status).toBe('planned')
      expect(event.contentPieceId).toBeUndefined()
    })

    it('adds a publish event with contentPieceId', () => {
      const piece = service.addContentPiece('视频内容', 'B站', '2026-07-01')
      const event = service.addPublishEvent('新视频发布', 'B站', '2026-07-15', piece.id)
      expect(event.contentPieceId).toBe(piece.id)
    })

    it('persists publish events to localStorage', () => {
      service.addPublishEvent('测试发布', '公众号', '2026-07-15')
      const newService = createCreatorService()
      expect(newService.getPublishEvents()).toHaveLength(1)
    })

    it('marks event as published', () => {
      const event = service.addPublishEvent('测试发布', '公众号', '2026-07-15')
      service.markPublished(event.id)
      expect(service.getPublishEvents()[0].status).toBe('published')
    })

    it('does nothing when marking non-existent event', () => {
      service.markPublished('non-existent')
      expect(service.getPublishEvents()).toHaveLength(0)
    })

    it('removes a publish event', () => {
      const event = service.addPublishEvent('测试发布', '公众号', '2026-07-15')
      service.removePublishEvent(event.id)
      expect(service.getPublishEvents()).toHaveLength(0)
    })

    it('supports multiple publish events', () => {
      service.addPublishEvent('发布1', 'B站', '2026-07-01')
      service.addPublishEvent('发布2', '公众号', '2026-08-01')
      expect(service.getPublishEvents()).toHaveLength(2)
    })
  })

  describe('Client Projects', () => {
    it('starts with no client projects', () => {
      expect(service.getClientProjects()).toHaveLength(0)
    })

    it('adds a client project', () => {
      const project = service.addClientProject('张三', '品牌设计', '2026-08-01', 50000)
      expect(project.id).toBeTruthy()
      expect(project.clientName).toBe('张三')
      expect(project.description).toBe('品牌设计')
      expect(project.deadline).toBe('2026-08-01')
      expect(project.budget).toBe(50000)
      expect(project.paidAmount).toBe(0)
      expect(project.status).toBe('inquiry')
    })

    it('persists client projects to localStorage', () => {
      service.addClientProject('张三', '品牌设计', '2026-08-01', 50000)
      const newService = createCreatorService()
      expect(newService.getClientProjects()).toHaveLength(1)
    })

    it('updates client status', () => {
      const project = service.addClientProject('张三', '品牌设计', '2026-08-01', 50000)
      service.updateClientStatus(project.id, 'in-progress')
      expect(service.getClientProjects()[0].status).toBe('in-progress')
    })

    it('does nothing when updating non-existent client', () => {
      service.updateClientStatus('non-existent', 'delivered')
      expect(service.getClientProjects()).toHaveLength(0)
    })

    it('removes a client project', () => {
      const project = service.addClientProject('张三', '品牌设计', '2026-08-01', 50000)
      service.removeClientProject(project.id)
      expect(service.getClientProjects()).toHaveLength(0)
    })

    it('supports multiple client projects', () => {
      service.addClientProject('张三', '项目1', '2026-08-01', 50000)
      service.addClientProject('李四', '项目2', '2026-09-01', 30000)
      expect(service.getClientProjects()).toHaveLength(2)
    })
  })

  describe('Summary', () => {
    it('returns zero counts for empty state', () => {
      const summary = service.getSummary()
      expect(summary.ideaCount).toBe(0)
      expect(summary.activeContentCount).toBe(0)
      expect(summary.upcomingPublishCount).toBe(0)
      expect(summary.activeClientCount).toBe(0)
      expect(summary.totalBudget).toBe(0)
      expect(summary.totalPaid).toBe(0)
    })

    it('counts ideas correctly', () => {
      service.addIdea('创意1', '来源1', ['标签1'])
      service.addIdea('创意2', '来源2', ['标签2'])
      expect(service.getSummary().ideaCount).toBe(2)
    })

    it('counts active content pieces (not published)', () => {
      const piece = service.addContentPiece('内容1', 'B站', '2026-07-01')
      service.addContentPiece('内容2', '公众号', '2026-08-01')
      service.updateContentStage(piece.id, 'publish')
      expect(service.getSummary().activeContentCount).toBe(1)
    })

    it('counts upcoming publish events', () => {
      const farFuture = new Date()
      farFuture.setFullYear(farFuture.getFullYear() + 1)
      const futureDate = farFuture.toISOString().slice(0, 10)

      service.addPublishEvent('未来发布', 'B站', futureDate)
      service.addPublishEvent('过去发布', '公众号', '2020-01-01')
      expect(service.getSummary().upcomingPublishCount).toBe(1)
    })

    it('counts active client projects', () => {
      const project = service.addClientProject('张三', '项目1', '2026-08-01', 50000)
      service.addClientProject('李四', '项目2', '2026-09-01', 30000)
      service.updateClientStatus(project.id, 'delivered')
      expect(service.getSummary().activeClientCount).toBe(1)
    })

    it('calculates total budget and paid', () => {
      service.addClientProject('张三', '项目1', '2026-08-01', 50000)
      service.addClientProject('李四', '项目2', '2026-09-01', 30000)
      const summary = service.getSummary()
      expect(summary.totalBudget).toBe(80000)
      expect(summary.totalPaid).toBe(0)
    })
  })

  describe('Isolation', () => {
    it('isolates data by storeKey', () => {
      const serviceA = createCreatorService('workspace-a')
      const serviceB = createCreatorService('workspace-b')

      serviceA.addIdea('创意A', '来源A', ['标签A'])
      serviceB.addIdea('创意B', '来源B', ['标签B'])

      expect(serviceA.getIdeas()).toHaveLength(1)
      expect(serviceA.getIdeas()[0].title).toBe('创意A')
      expect(serviceB.getIdeas()).toHaveLength(1)
      expect(serviceB.getIdeas()[0].title).toBe('创意B')
    })
  })

  describe('Data integrity', () => {
    it('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem('creator-workbench-ideas', 'not-valid-json')
      const newService = createCreatorService()
      expect(newService.getIdeas()).toHaveLength(0)
    })

    it('handles non-array localStorage data gracefully', () => {
      localStorage.setItem('creator-workbench-ideas', JSON.stringify({ not: 'array' }))
      const newService = createCreatorService()
      expect(newService.getIdeas()).toHaveLength(0)
    })
  })
})