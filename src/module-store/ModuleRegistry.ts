import type { Module } from './types'

export const defaultModules: Module[] = [
  {
    id: 'habit-tracker',
    title: '习惯追踪',
    description: '每日习惯打卡和进度追踪',
    icon: 'CheckSquare',
    category: 'health',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'journal',
    title: '复盘日记',
    description: '每日复盘、心情记录和反思',
    icon: 'BookOpen',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'reading-list',
    title: '阅读清单',
    description: '书籍管理、阅读进度追踪、读书笔记',
    icon: 'BookOpen',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'error-book',
    title: '错题本',
    description: '记录错题，AI 智能分析错因与解法',
    icon: 'FileX',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  }
]

export const getModuleById = (id: string): Module | undefined =>
  defaultModules.find(m => m.id === id)

export const getModulesByCategory = (category: string): Module[] =>
  defaultModules.filter(m => m.category === category)
