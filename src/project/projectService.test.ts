import { describe, it, expect, beforeEach } from 'vitest'
import { createProjectService, projectCategories } from './projectService'
import type { ProjectService } from './projectService'

describe('projectService', () => {
  let service: ProjectService

  beforeEach(() => {
    localStorage.clear()
    service = createProjectService()
  })

  describe('categories', () => {
    it('has project categories', () => {
      expect(projectCategories.length).toBeGreaterThan(0)
      expect(projectCategories).toContain('工作')
      expect(projectCategories).toContain('个人')
    })
  })

  describe('projects', () => {
    it('adds a project', () => {
      const project = service.addProject('网站重构', '重构前端架构', '2026-06-30', 'high')
      expect(project.name).toBe('网站重构')
      expect(project.description).toBe('重构前端架构')
      expect(project.status).toBe('planning')
      expect(project.priority).toBe('high')
      expect(project.id).toBeTruthy()
    })

    it('updates a project', () => {
      const project = service.addProject('网站重构', '重构前端架构', '2026-06-30')
      service.updateProject(project.id, { status: 'active', progress: 50 })
      const state = service.getState()
      expect(state.projects[0].status).toBe('active')
      expect(state.projects[0].progress).toBe(50)
    })

    it('removes a project and its related data', () => {
      const project = service.addProject('网站重构', '重构前端架构', '2026-06-30')
      service.addMilestone(project.id, '完成设计', '2026-06-15')
      service.addTask(project.id, '设计首页', '设计新首页')
      service.removeProject(project.id)
      const state = service.getState()
      expect(state.projects).toHaveLength(0)
      expect(state.milestones).toHaveLength(0)
      expect(state.tasks).toHaveLength(0)
    })

    it('persists projects across service instances', () => {
      service.addProject('网站重构', '重构前端架构', '2026-06-30')
      const service2 = createProjectService()
      expect(service2.getState().projects).toHaveLength(1)
    })
  })

  describe('milestones', () => {
    it('adds a milestone to a project', () => {
      const project = service.addProject('网站重构', '重构前端架构', '2026-06-30')
      const milestone = service.addMilestone(project.id, '完成设计', '2026-06-15')
      expect(milestone.title).toBe('完成设计')
      expect(milestone.completed).toBe(false)
    })

    it('toggles milestone completion', () => {
      const project = service.addProject('网站重构', '重构前端架构', '2026-06-30')
      const milestone = service.addMilestone(project.id, '完成设计', '2026-06-15')
      service.toggleMilestone(milestone.id)
      expect(service.getState().milestones[0].completed).toBe(true)
      expect(service.getState().milestones[0].completedAt).toBeTruthy()

      service.toggleMilestone(milestone.id)
      expect(service.getState().milestones[0].completed).toBe(false)
    })

    it('removes a milestone', () => {
      const project = service.addProject('网站重构', '重构前端架构', '2026-06-30')
      const milestone = service.addMilestone(project.id, '完成设计', '2026-06-15')
      service.removeMilestone(milestone.id)
      expect(service.getState().milestones).toHaveLength(0)
    })
  })

  describe('tasks', () => {
    it('adds a task to a project', () => {
      const project = service.addProject('网站重构', '重构前端架构', '2026-06-30')
      const task = service.addTask(project.id, '设计首页', '设计新首页', 'high', '2026-06-20')
      expect(task.title).toBe('设计首页')
      expect(task.status).toBe('todo')
      expect(task.priority).toBe('high')
    })

    it('updates task status', () => {
      const project = service.addProject('网站重构', '重构前端架构', '2026-06-30')
      const task = service.addTask(project.id, '设计首页', '设计新首页')
      service.updateTaskStatus(task.id, 'in-progress')
      expect(service.getState().tasks[0].status).toBe('in-progress')

      service.updateTaskStatus(task.id, 'done')
      expect(service.getState().tasks[0].status).toBe('done')
    })

    it('removes a task', () => {
      const project = service.addProject('网站重构', '重构前端架构', '2026-06-30')
      const task = service.addTask(project.id, '设计首页', '设计新首页')
      service.removeTask(task.id)
      expect(service.getState().tasks).toHaveLength(0)
    })
  })

  describe('stats', () => {
    it('calculates project stats', () => {
      const project = service.addProject('网站重构', '重构前端架构', '2026-06-30')
      service.addTask(project.id, '任务1', '')
      service.addTask(project.id, '任务2', '')
      service.addTask(project.id, '任务3', '')
      service.addMilestone(project.id, '里程碑1', '2026-06-15')
      service.addMilestone(project.id, '里程碑2', '2026-06-20')

      const stats = service.getProjectStats(project.id)
      expect(stats.totalTasks).toBe(3)
      expect(stats.completedTasks).toBe(0)
      expect(stats.totalMilestones).toBe(2)
      expect(stats.completedMilestones).toBe(0)
      expect(stats.progress).toBe(0)

      service.updateTaskStatus(service.getState().tasks[0].id, 'done')
      const stats2 = service.getProjectStats(project.id)
      expect(stats2.progress).toBe(33)
    })
  })
})