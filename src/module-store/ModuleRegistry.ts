import type { Module } from './types'

export const defaultModules: Module[] = [
  {
    id: 'persona-plan',
    title: '场景计划',
    description: '当前场景的主模块，展示场景模板和行动建议',
    icon: 'Target',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'today-actions',
    title: '今日行动',
    description: '今日待办任务列表',
    icon: 'ListChecks',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-session',
    title: '专注计时',
    description: '番茄钟专注计时器，支持自定义时长',
    icon: 'Timer',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-overview',
    title: '专注概览',
    description: '桌面专注概览，展示进度和统计',
    icon: 'BarChart3',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'growth-rpg',
    title: '成长等级',
    description: 'RPG 风格成长系统，展示等级、成就和积分',
    icon: 'Trophy',
    category: 'health',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'key-metrics',
    title: '关键指标',
    description: '当前场景的关键指标展示',
    icon: 'Gauge',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-history',
    title: '专注历史',
    description: '最近专注会话记录',
    icon: 'History',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'memory-insights',
    title: '记忆洞察',
    description: '近期上下文和记忆事件',
    icon: 'Brain',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'ai-coach',
    title: 'AI 教练',
    description: 'AI 驱动的场景教练和建议',
    icon: 'Bot',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'platform-matrix',
    title: '多端矩阵',
    description: '多平台支持概览',
    icon: 'Monitor',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'theme-center',
    title: '主题中心',
    description: '主题切换、壁纸设置和视觉风格管理',
    icon: 'Palette',
    category: 'life',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'statistics',
    title: '数据统计',
    description: '任务、专注和连续天数统计',
    icon: 'PieChart',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'cycle-today',
    title: '今日周期',
    description: '查看今日周期阶段和能量建议',
    icon: 'Activity',
    category: 'health',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'memory-profile',
    title: '记忆画像',
    description: '个人记忆画像，MBTI 倾向和学习风格',
    icon: 'User',
    category: 'health',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
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
