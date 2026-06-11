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
  },
  {
    id: 'memory-cards',
    title: '记忆卡',
    description: '间隔重复记忆卡，AI 自动提取知识点',
    icon: 'Layers',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'exam-tracker',
    title: '考试记录',
    description: '记录每次考试各科分数，AI 对比分析进退步',
    icon: 'BarChart3',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'study-planner',
    title: '学习计划',
    description: 'AI 驱动的备考规划，分阶段高效复习',
    icon: 'Calendar',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-timer',
    title: '专注计时',
    description: '番茄钟专注计时，科目分布统计，专注趋势追踪',
    icon: 'Timer',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'study-companion',
    title: '备考陪伴',
    description: 'AI 备考陪伴伙伴，情绪支持、呼吸放松、正念练习',
    icon: 'Heart',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'mood-journal',
    title: '情绪日记',
    description: '每日情绪记录，趋势追踪，低情绪预警关怀',
    icon: 'Smile',
    category: 'health',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  }
]

export const getModuleById = (id: string): Module | undefined =>
  defaultModules.find(m => m.id === id)

export const getModulesByCategory = (category: string): Module[] =>
  defaultModules.filter(m => m.category === category)
