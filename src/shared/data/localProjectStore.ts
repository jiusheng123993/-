import { createStorageService } from './storageFactory'

export interface ProjectItem {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface ProjectState {
  projects: ProjectItem[]
}

const STORAGE_KEY = 'xinghuanhai-project-state'

export function createInitialProjectState(): ProjectState {
  return {
    projects: [
      {
        id: 'proj-demo-1',
        name: '星寰海成长工作台',
        description: '个人全维度成长管理系统，集成学习、习惯、日记、阅读、财务、健康等模块',
        status: 'active',
        createdAt: '2026-05-01',
        updatedAt: '2026-06-13'
      },
      {
        id: 'proj-demo-2',
        name: '校园二手交易小程序',
        description: '基于微信小程序的校园二手物品交易平台，支持发布、搜索、聊天功能',
        status: 'active',
        createdAt: '2026-04-15',
        updatedAt: '2026-06-10'
      },
      {
        id: 'proj-demo-3',
        name: 'LeetCode 刷题记录',
        description: '系统刷题计划，目标完成 Hot 100 + 剑指 Offer，每周 10 题',
        status: 'active',
        createdAt: '2026-03-01',
        updatedAt: '2026-06-12'
      },
      {
        id: 'proj-demo-4',
        name: '个人博客重构',
        description: '从 Hexo 迁移到 Next.js + MDX，支持暗色模式和全文搜索',
        status: 'completed',
        createdAt: '2026-02-10',
        updatedAt: '2026-05-20'
      }
    ]
  }
}

export interface ProjectStore {
  load: () => ProjectState
  save: (state: ProjectState) => void
}

export function createProjectBrowserStore(storageKey = STORAGE_KEY): ProjectStore {
  const storage = createStorageService<ProjectState>(storageKey, createInitialProjectState())
  return { load: storage.load, save: storage.save }
}
