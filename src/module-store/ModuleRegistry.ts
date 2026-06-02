import type { Module } from './types'

export const defaultModules: Module[] = [
  {
    id: 'today-tasks',
    title: '今日任务',
    description: '查看和管理今日待办事项',
    icon: 'CheckCircle',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-timer',
    title: '专注计时',
    description: '番茄工作法专注计时',
    icon: 'Clock',
    category: 'productivity',
    size: 'small',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'calendar',
    title: '日历',
    description: '查看日程安排',
    icon: 'Calendar',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'notes',
    title: '笔记',
    description: '快速记录想法和笔记',
    icon: 'FileText',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'weather',
    title: '天气',
    description: '查看当地天气',
    icon: 'Cloud',
    category: 'life',
    size: 'small',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'statistics',
    title: '数据统计',
    description: '查看个人数据统计',
    icon: 'BarChart',
    category: 'productivity',
    size: 'large',
    isDefault: true,
    isCustom: false
  }
]

export const getModuleById = (id: string): Module | undefined =>
  defaultModules.find(m => m.id === id)

export const getModulesByCategory = (category: string): Module[] =>
  defaultModules.filter(m => m.category === category)
