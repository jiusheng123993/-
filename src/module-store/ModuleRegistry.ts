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
  },
  {
    id: 'persona-plan',
    title: '考试冲刺计划',
    description: '按当前身份展示主行动计划和复盘节奏',
    icon: 'BookOpen',
    category: 'learning',
    size: 'large',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'growth-rpg',
    title: '成长等级',
    description: '展示经验、连续天数和成就进度',
    icon: 'Crown',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-overview',
    title: '桌面专注概览',
    description: '汇总本周进度、待办数量和计划分钟',
    icon: 'Clock',
    category: 'productivity',
    size: 'large',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'persona-brief',
    title: '用户痛点',
    description: '展示当前身份的目标用户、痛点和核心动线',
    icon: 'Brain',
    category: 'learning',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'key-metrics',
    title: '关键指标',
    description: '展示当前场景最重要的成长指标',
    icon: 'BarChart',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'today-actions',
    title: '今日行动',
    description: '展示今日待办、完成状态和行动入口',
    icon: 'CheckCircle',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-session',
    title: '任务专注',
    description: '为当前任务启动专注计时器',
    icon: 'Clock',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-history',
    title: '最近专注',
    description: '查看最近完成的专注记录',
    icon: 'Clock',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'memory-insights',
    title: '记忆洞察',
    description: '查看近期上下文和成长记忆',
    icon: 'Brain',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'ai-coach',
    title: 'AI 备考教练',
    description: '根据当前场景生成下一步行动建议',
    icon: 'Bot',
    category: 'learning',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'platform-matrix',
    title: '多端预留',
    description: '展示桌面、小程序和未来多端规划',
    icon: 'MonitorSmartphone',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'mini-program-preview',
    title: '小程序试验版',
    description: '预览小程序轻量执行端结构',
    icon: 'MonitorSmartphone',
    category: 'productivity',
    size: 'large',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'theme-center',
    title: '主题中心',
    description: '管理主题库、场景推荐和视觉风格',
    icon: 'Sparkles',
    category: 'life',
    size: 'large',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'cycle-today',
    title: '今日周期',
    description: '展示当前周期阶段和能量建议',
    icon: 'Heart',
    category: 'health',
    size: 'small',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'memory-profile',
    title: '记忆画像',
    description: '查看和管理个人记忆画像',
    icon: 'Brain',
    category: 'ai',
    size: 'large',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'badge-display',
    title: '成就徽章',
    description: '查看已解锁的成就徽章和进度',
    icon: 'Award',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'habit-tracker',
    title: '习惯追踪',
    description: '每日习惯打卡和进度追踪',
    icon: 'CheckSquare',
    category: 'health',
    size: 'medium',
    isDefault: true,
    isCustom: false
  }
]

export const getModuleById = (id: string): Module | undefined =>
  defaultModules.find(m => m.id === id)

export const getModulesByCategory = (category: string): Module[] =>
  defaultModules.filter(m => m.category === category)
